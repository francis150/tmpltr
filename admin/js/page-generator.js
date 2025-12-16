/**
 * Tmpltr Page Generator Module
 *
 * Global utility for generating pages via WebSocket connection to AI backend.
 * Handles prompt processing, progress tracking, and result persistence.
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const CONFIG = {
        engine: {
            provider: 'openai',
            model: 'gpt-4.1-mini'
        }
    };

    function getServerUrl() {
        return tmpltrData.generatorServerUrl || 'wss://tmpltr-server-58a18b126e87.herokuapp.com/';
    }

    const EVENTS = {
        REQUEST: 'prompt-processing-request',
        PROGRESS: 'prompt-processing-progress',
        SUCCESS: 'prompt-processing-success',
        ERROR: 'prompt-processing-error'
    };

    let socket = null;
    let activeJob = null;
    let progressToast = null;

    const GeneratorManager = {
        async generate(options) {
            const { templateId, templateName, prompts, fields, formData } = options;

            if (!prompts || prompts.length === 0) {
                TmpltrToast.error({
                    title: 'Generation Failed',
                    subtext: 'No prompts configured for this template'
                });
                return Promise.reject(new Error('No prompts configured'));
            }

            const session = await TmpltrAuth.getSession();
            if (!session) {
                TmpltrToast.error({
                    title: 'Authentication Required',
                    subtext: 'Please log in to generate pages'
                });
                return Promise.reject(new Error('Not authenticated'));
            }

            const jobId = Date.now();
            const pageTitle = formData.page_title || 'Untitled Page';

            activeJob = {
                id: jobId,
                templateId,
                templateName,
                pageTitle,
                prompts,
                formData,
                token: session.access_token
            };

            progressToast = TmpltrToast.progress({
                title: 'Generating Page',
                subtext: 'Connecting to server...',
                progress: 0,
                seconds: 0
            });

            return new Promise((resolve, reject) => {
                activeJob.resolve = resolve;
                activeJob.reject = reject;

                this.connect();
            });
        },

        connect() {
            if (!window.io) {
                this.handleError({ message: 'Socket.IO library not loaded' });
                return;
            }

            socket = io(getServerUrl(), {
                transports: ['websocket'],
                reconnection: false
            });

            socket.on('connect', () => this.onConnected());
            socket.on('disconnect', () => this.onDisconnected());
            socket.on('connect_error', (error) => this.handleError({ message: 'Connection failed: ' + error.message }));
            socket.on(EVENTS.PROGRESS, (data) => this.onProgress(data));
            socket.on(EVENTS.SUCCESS, (data) => this.onSuccess(data));
            socket.on(EVENTS.ERROR, (data) => this.onError(data));
        },

        disconnect() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        },

        onConnected() {
            if (!activeJob) return;

            if (progressToast) {
                progressToast.update(0.05, 'Generating Page', 'Processing prompts...');
            }

            const payload = this.buildPayload();
            socket.emit(EVENTS.REQUEST, payload);
        },

        onDisconnected() {
            socket = null;
        },

        onProgress(data) {
            if (!activeJob || data.job_id !== activeJob.id) return;

            const progress = Math.min(0.9, 0.1 + (data.progress * 0.8));

            if (progressToast) {
                progressToast.update(progress, 'Generating Page', data.message || 'Processing...');
            }
        },

        async onSuccess(data) {
            if (!activeJob || data.job_id !== activeJob.id) return;

            if (progressToast) {
                progressToast.update(0.95, 'Generating Page', 'Creating page...');
            }

            try {
                const saveResponse = await this.saveResults(data);

                if (progressToast) {
                    const editUrl = saveResponse.edit_url;
                    const subtext = editUrl
                        ? `<a href="${editUrl}" target="_blank">Edit page</a>`
                        : 'Page created successfully';

                    progressToast.complete('success', 'Page Created', subtext);
                }

                if (activeJob.resolve) {
                    activeJob.resolve({ ...data, saveResponse });
                }
            } catch (saveError) {
                if (progressToast) {
                    progressToast.complete('error', 'Save Failed', 'Generated content could not be saved');
                }

                if (activeJob.reject) {
                    activeJob.reject(saveError);
                }
            }

            this.cleanup();
        },

        onError(data) {
            if (!activeJob || data.job_id !== activeJob.id) return;

            const errorMessage = data.error?.message || 'An unknown error occurred';

            if (progressToast) {
                progressToast.complete('error', 'Generation Failed', errorMessage);
            }

            if (activeJob.reject) {
                activeJob.reject(new Error(errorMessage));
            }

            this.cleanup();
        },

        handleError(error) {
            const errorMessage = error.message || 'An unknown error occurred';

            if (progressToast) {
                progressToast.complete('error', 'Generation Failed', errorMessage);
            }

            if (activeJob && activeJob.reject) {
                activeJob.reject(new Error(errorMessage));
            }

            this.cleanup();
        },

        cleanup() {
            this.disconnect();
            activeJob = null;
            progressToast = null;
        },

        buildPayload() {
            if (!activeJob) return null;

            const processedPrompts = activeJob.prompts.map(prompt => {
                const substitutedText = this.substituteFieldValues(prompt.prompt_text, activeJob.formData);
                return {
                    id: prompt.id,
                    placeholder: prompt.placeholder,
                    text: substitutedText,
                    originalText: prompt.prompt_text,
                    settings: {
                        max_tokens: parseInt(prompt.max_tokens, 10) || 1000,
                        temperature: parseFloat(prompt.temperature) || 0.7
                    }
                };
            });

            activeJob.processedPrompts = processedPrompts;

            return {
                job_id: activeJob.id,
                engine: CONFIG.engine,
                token: activeJob.token,
                requesting_domain: tmpltrData.siteUrl,
                template: {
                    id: activeJob.templateId,
                    name: activeJob.templateName
                },
                page_title: activeJob.pageTitle,
                prompts: processedPrompts,
                metadata: {
                    user_id: tmpltrData.userId,
                    timestamp: new Date().toISOString(),
                    plugin_version: tmpltrData.pluginVersion
                }
            };
        },

        substituteFieldValues(promptText, formData) {
            if (!promptText || !formData) return promptText;

            let result = promptText;

            Object.keys(formData).forEach(key => {
                if (key === 'page_title') return;

                const identifier = key.startsWith('@') ? key : '@' + key;
                const pattern = new RegExp(this.escapeRegex(identifier), 'g');
                result = result.replace(pattern, formData[key] || '');
            });

            return result;
        },

        escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        async saveResults(data) {
            if (!activeJob) {
                throw new Error('No active job to save');
            }

            const resultsForSave = data.results.map(result => ({
                prompt_id: result.prompt_id,
                placeholder: result.placeholder,
                content: result.content,
                tokens_used: result.tokens_used,
                processing_time_ms: result.processing_time_ms,
                prompt_text_used: activeJob.processedPrompts.find(p => p.id === result.prompt_id)?.text || ''
            }));

            const response = await fetch(tmpltrData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'tmpltr_save_generation',
                    nonce: tmpltrData.nonce,
                    template_id: activeJob.templateId,
                    page_title: activeJob.pageTitle,
                    field_values: JSON.stringify(activeJob.formData),
                    results: JSON.stringify(resultsForSave),
                    summary: JSON.stringify(data.summary || {})
                })
            });

            const responseData = await response.json();

            if (!responseData.success) {
                throw new Error(responseData.data?.message || 'Failed to save generation results');
            }

            return responseData.data;
        }
    };

    window.TmpltrGenerator = {
        generate: (opts) => GeneratorManager.generate(opts)
    };
})();
