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

    const jobs = new Map();

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

            const toast = TmpltrToast.progress({
                title: 'Generating Page',
                subtext: 'Fetching site data...',
                progress: 0,
                seconds: 0
            });

            const job = {
                id: jobId,
                templateId,
                templateName,
                pageTitle,
                prompts,
                formData,
                token: session.access_token,
                socket: null,
                toast
            };

            jobs.set(jobId, job);

            job.menus = await this.fetchMenus();

            if (job.toast) {
                job.toast.update(0.02, 'Generating Page', 'Connecting to server...');
            }

            return new Promise((resolve, reject) => {
                job.resolve = resolve;
                job.reject = reject;

                this.connect(jobId);
            });
        },

        connect(jobId) {
            const job = jobs.get(jobId);
            if (!job) return;

            if (!window.io) {
                this.handleError(jobId, { message: 'Socket.IO library not loaded' });
                return;
            }

            const sock = io(getServerUrl(), {
                transports: ['websocket'],
                reconnection: false
            });

            job.socket = sock;

            sock.on('connect', () => this.onConnected(jobId));
            sock.on('disconnect', () => this.onDisconnected(jobId));
            sock.on('connect_error', (error) => this.handleError(jobId, { message: 'Connection failed: ' + error.message }));
            sock.on(EVENTS.PROGRESS, (data) => this.onProgress(jobId, data));
            sock.on(EVENTS.SUCCESS, (data) => this.onSuccess(jobId, data));
            sock.on(EVENTS.ERROR, (data) => this.onError(jobId, data));
        },

        disconnect(jobId) {
            const job = jobs.get(jobId);
            if (job && job.socket) {
                job.socket.disconnect();
                job.socket = null;
            }
        },

        onConnected(jobId) {
            const job = jobs.get(jobId);
            if (!job) return;

            if (job.toast) {
                job.toast.update(0.05, 'Generating Page', 'Processing prompts...');
            }

            const payload = this.buildPayload(jobId);
            job.socket.emit(EVENTS.REQUEST, payload);
        },

        onDisconnected(jobId) {
            const job = jobs.get(jobId);
            if (job) {
                job.socket = null;
            }
        },

        onProgress(jobId, data) {
            const job = jobs.get(jobId);
            if (!job) return;

            const progress = Math.min(0.9, 0.1 + (data.progress * 0.8));

            if (job.toast) {
                job.toast.update(progress, 'Generating Page', data.message || 'Processing...');
            }
        },

        async onSuccess(jobId, data) {
            const job = jobs.get(jobId);
            if (!job) return;

            if (job.toast) {
                job.toast.update(0.95, 'Generating Page', 'Creating page...');
            }

            try {
                const saveResponse = await this.saveResults(jobId, data);

                if (job.toast) {
                    const viewUrl = saveResponse.view_url;
                    const editUrl = saveResponse.edit_url;

                    let subtext = 'Page created successfully';
                    if (viewUrl && editUrl) {
                        subtext = `<a href="${viewUrl}" target="_blank">View</a> your new page or <a href="${editUrl}" target="_blank">edit</a> it`;
                    } else if (viewUrl) {
                        subtext = `<a href="${viewUrl}" target="_blank">View</a> your new page`;
                    } else if (editUrl) {
                        subtext = `<a href="${editUrl}" target="_blank">Edit</a> your new page`;
                    }

                    job.toast.complete('success', 'Page Created', subtext);
                }

                if (job.resolve) {
                    job.resolve({ ...data, saveResponse });
                }
            } catch (saveError) {
                if (job.toast) {
                    job.toast.complete('error', 'Save Failed', 'Generated content could not be saved');
                }

                if (job.reject) {
                    job.reject(saveError);
                }
            }

            this.cleanup(jobId);
        },

        onError(jobId, data) {
            const job = jobs.get(jobId);
            if (!job) return;

            const errorMessage = data.error?.message || 'An unknown error occurred';

            if (job.toast) {
                job.toast.complete('error', 'Generation Failed', errorMessage);
            }

            if (job.reject) {
                job.reject(new Error(errorMessage));
            }

            this.cleanup(jobId);
        },

        handleError(jobId, error) {
            const job = jobs.get(jobId);
            const errorMessage = error.message || 'An unknown error occurred';

            if (job && job.toast) {
                job.toast.complete('error', 'Generation Failed', errorMessage);
            }

            if (job && job.reject) {
                job.reject(new Error(errorMessage));
            }

            this.cleanup(jobId);
        },

        cleanup(jobId) {
            this.disconnect(jobId);
            jobs.delete(jobId);
        },

        buildPayload(jobId) {
            const job = jobs.get(jobId);
            if (!job) return null;

            const processedPrompts = job.prompts.map(prompt => {
                const substitutedText = this.substituteFieldValues(prompt.prompt_text, job.formData);
                return {
                    id: prompt.id,
                    placeholder: prompt.placeholder,
                    text: substitutedText,
                    originalText: prompt.prompt_text
                };
            });

            job.processedPrompts = processedPrompts;

            const payload = {
                job_id: job.id,
                engine: CONFIG.engine,
                token: job.token,
                template: {
                    id: job.templateId,
                    name: job.templateName
                },
                page_title: job.pageTitle,
                prompts: processedPrompts,
                metadata: {
                    user_id: tmpltrData.userId,
                    timestamp: new Date().toISOString(),
                    plugin_version: tmpltrData.pluginVersion,
                    requesting_domain: tmpltrData.siteUrl
                }
            };

            if (job.menus && job.menus.length > 0) {
                payload.menus = job.menus;
            }

            return payload;
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

        async saveResults(jobId, data) {
            const job = jobs.get(jobId);
            if (!job) {
                throw new Error('No active job to save');
            }

            const resultsForSave = data.results.map(result => ({
                prompt_id: result.prompt_id,
                placeholder: result.placeholder,
                content: result.content,
                tokens_used: result.tokens_used,
                processing_time_ms: result.processing_time_ms,
                prompt_text_used: job.processedPrompts.find(p => p.id === result.prompt_id)?.text || ''
            }));

            const response = await fetch(tmpltrData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'tmpltr_save_generation',
                    nonce: tmpltrData.nonce,
                    template_id: job.templateId,
                    page_title: job.pageTitle,
                    field_values: JSON.stringify(job.formData),
                    results: JSON.stringify(resultsForSave),
                    summary: JSON.stringify(data.summary || {})
                })
            });

            const responseData = await response.json();

            if (!responseData.success) {
                throw new Error(responseData.data?.message || 'Failed to save generation results');
            }

            return responseData.data;
        },

        async fetchMenus() {
            try {
                const response = await fetch(tmpltrData.ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'tmpltr_get_menus',
                        nonce: tmpltrData.nonce
                    })
                });

                const data = await response.json();
                return data.success ? data.data.menus : null;
            } catch {
                return null;
            }
        }
    };

    window.TmpltrGenerator = {
        generate: (opts) => GeneratorManager.generate(opts)
    };
})();
