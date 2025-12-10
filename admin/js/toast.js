/**
 * Tmpltr Toast Notification System
 *
 * Global toast notification utility for admin pages.
 * Provides multiple toast types with progress bar support.
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const DEFAULTS = {
        seconds: 5,
        type: 'message',
        title: '',
        subtext: '',
        progress: null,
        closable: true
    };

    const TYPES = {
        message: { color: '#0073aa', icon: 'info', ariaLive: 'polite', ariaRole: 'status' },
        success: { color: '#00a32a', icon: 'yes', ariaLive: 'polite', ariaRole: 'status' },
        error: { color: '#d63638', icon: 'warning', ariaLive: 'assertive', ariaRole: 'alert' },
        warning: { color: '#ff9b00', icon: 'flag', ariaLive: 'assertive', ariaRole: 'alert' },
        inprogress: { color: '#0073aa', icon: 'update', ariaLive: 'polite', ariaRole: 'status' }
    };

    const state = {
        container: null,
        toasts: new Map(),
        counter: 0,
        timers: new Map()
    };

    const ToastManager = {
        init() {
            if (state.container) return;

            state.container = document.createElement('div');
            state.container.className = 'tmpltr-toast-container';
            state.container.setAttribute('role', 'region');
            state.container.setAttribute('aria-label', 'Notifications');

            document.body.appendChild(state.container);

            this.setupKeyboardNavigation();
        },

        setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const focusedToast = document.activeElement.closest('.tmpltr-toast');
                    if (focusedToast) {
                        const toastId = focusedToast.dataset.toastId;
                        if (toastId) {
                            this.dismiss(toastId);
                        }
                    }
                }
            });
        },

        show(options) {
            this.init();

            const opts = { ...DEFAULTS, ...options };

            if (opts.type === 'inprogress' && opts.closable === undefined) {
                opts.closable = false;
            }

            if (!TYPES[opts.type]) {
                opts.type = 'message';
            }

            state.counter++;
            const toastId = `tmpltr-toast-${state.counter}`;
            const typeConfig = TYPES[opts.type];

            const toastElement = this.createToastElement(toastId, opts, typeConfig);
            state.toasts.set(toastId, toastElement);

            state.container.appendChild(toastElement);

            requestAnimationFrame(() => {
                toastElement.classList.add('tmpltr-toast--visible');
            });

            if (opts.seconds > 0) {
                const timer = setTimeout(() => {
                    this.dismiss(toastId);
                }, opts.seconds * 1000);
                state.timers.set(toastId, timer);
            }

            return toastId;
        },

        createToastElement(toastId, opts, typeConfig) {
            const toast = document.createElement('div');
            toast.className = `tmpltr-toast tmpltr-toast--${opts.type}`;
            toast.dataset.toastId = toastId;
            toast.setAttribute('role', typeConfig.ariaRole);
            toast.setAttribute('aria-live', typeConfig.ariaLive);
            toast.setAttribute('aria-atomic', 'true');

            const icon = document.createElement('div');
            icon.className = 'tmpltr-toast__icon';
            icon.innerHTML = `<span class="dashicons dashicons-${typeConfig.icon}"></span>`;

            const content = document.createElement('div');
            content.className = 'tmpltr-toast__content';

            const title = document.createElement('div');
            title.className = 'tmpltr-toast__title';
            title.textContent = opts.title;

            content.appendChild(title);

            if (opts.subtext) {
                const subtext = document.createElement('div');
                subtext.className = 'tmpltr-toast__subtext';
                subtext.textContent = opts.subtext;
                content.appendChild(subtext);
            }

            if (opts.progress !== null && opts.type === 'inprogress') {
                const progressBar = document.createElement('div');
                progressBar.className = 'tmpltr-toast__progress-bar';

                const progressFill = document.createElement('div');
                progressFill.className = 'tmpltr-toast__progress-fill';
                const percentage = Math.max(0, Math.min(1, opts.progress)) * 100;
                progressFill.style.width = percentage + '%';

                progressBar.appendChild(progressFill);
                content.appendChild(progressBar);
            }

            toast.appendChild(icon);
            toast.appendChild(content);

            if (opts.closable) {
                const dismissBtn = document.createElement('button');
                dismissBtn.className = 'tmpltr-toast__dismiss';
                dismissBtn.type = 'button';
                dismissBtn.setAttribute('aria-label', 'Dismiss notification');
                dismissBtn.innerHTML = '<span class="dashicons dashicons-no-alt"></span>';

                dismissBtn.addEventListener('click', () => {
                    this.dismiss(toastId);
                });

                dismissBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.dismiss(toastId);
                    }
                });

                toast.appendChild(dismissBtn);
            }

            return toast;
        },

        dismiss(id) {
            const toastElement = state.toasts.get(id);
            if (!toastElement) return;

            const timer = state.timers.get(id);
            if (timer) {
                clearTimeout(timer);
                state.timers.delete(id);
            }

            toastElement.classList.add('tmpltr-toast--dismissing');

            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
                state.toasts.delete(id);
            }, 300);
        },

        dismissAll() {
            state.toasts.forEach((_, id) => {
                this.dismiss(id);
            });
        },

        progress(options) {
            const opts = { ...DEFAULTS, ...options, type: 'inprogress' };

            // FORCE closable to false for progress toasts, override any user input
            opts.closable = false;

            if (opts.progress === null) {
                opts.progress = 0;
            }

            const id = this.show(opts);
            const toastElement = state.toasts.get(id);

            const self = this;

            return {
                update(newProgress, newTitle, newSubtext) {
                    if (!toastElement || !state.toasts.has(id)) return;

                    const progressFill = toastElement.querySelector('.tmpltr-toast__progress-fill');
                    if (progressFill) {
                        const percentage = Math.max(0, Math.min(1, newProgress)) * 100;
                        progressFill.style.width = percentage + '%';
                    }

                    if (newTitle !== undefined) {
                        const titleEl = toastElement.querySelector('.tmpltr-toast__title');
                        if (titleEl) titleEl.textContent = newTitle;
                    }

                    if (newSubtext !== undefined) {
                        let subtextEl = toastElement.querySelector('.tmpltr-toast__subtext');
                        if (newSubtext && !subtextEl) {
                            subtextEl = document.createElement('div');
                            subtextEl.className = 'tmpltr-toast__subtext';
                            const content = toastElement.querySelector('.tmpltr-toast__content');
                            const progressBar = content.querySelector('.tmpltr-toast__progress-bar');
                            if (progressBar) {
                                content.insertBefore(subtextEl, progressBar);
                            } else {
                                content.appendChild(subtextEl);
                            }
                        }
                        if (subtextEl) {
                            subtextEl.textContent = newSubtext;
                            subtextEl.style.display = newSubtext ? 'block' : 'none';
                        }
                    }

                    if (newProgress >= 1.0) {
                        setTimeout(() => {
                            this.complete('success');
                        }, 300);
                    }
                },

                complete(finalType = 'success', newTitle, newSubtext) {
                    if (!toastElement || !state.toasts.has(id)) return;

                    if (newTitle !== undefined) {
                        const titleEl = toastElement.querySelector('.tmpltr-toast__title');
                        if (titleEl) titleEl.textContent = newTitle;
                    }

                    if (newSubtext !== undefined) {
                        let subtextEl = toastElement.querySelector('.tmpltr-toast__subtext');
                        if (newSubtext && !subtextEl) {
                            subtextEl = document.createElement('div');
                            subtextEl.className = 'tmpltr-toast__subtext';
                            const content = toastElement.querySelector('.tmpltr-toast__content');
                            content.appendChild(subtextEl);
                        }
                        if (subtextEl) {
                            if (newSubtext && newSubtext.includes('<a ')) {
                                subtextEl.innerHTML = newSubtext;
                            } else {
                                subtextEl.textContent = newSubtext;
                            }
                            subtextEl.style.display = newSubtext ? 'block' : 'none';
                        }
                    }

                    toastElement.className = toastElement.className.replace(/tmpltr-toast--\w+/, `tmpltr-toast--${finalType}`);

                    const icon = toastElement.querySelector('.tmpltr-toast__icon .dashicons');
                    if (icon && TYPES[finalType]) {
                        icon.className = `dashicons dashicons-${TYPES[finalType].icon}`;
                    }

                    const progressBar = toastElement.querySelector('.tmpltr-toast__progress-bar');
                    if (progressBar) {
                        progressBar.remove();
                    }

                    const existingDismissBtn = toastElement.querySelector('.tmpltr-toast__dismiss');
                    if (!existingDismissBtn) {
                        const dismissBtn = document.createElement('button');
                        dismissBtn.className = 'tmpltr-toast__dismiss';
                        dismissBtn.type = 'button';
                        dismissBtn.setAttribute('aria-label', 'Dismiss notification');
                        dismissBtn.innerHTML = '<span class="dashicons dashicons-no-alt"></span>';

                        dismissBtn.addEventListener('click', () => {
                            self.dismiss(id);
                        });

                        dismissBtn.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                self.dismiss(id);
                            }
                        });

                        toastElement.appendChild(dismissBtn);
                    }

                    const timer = state.timers.get(id);
                    if (timer) {
                        clearTimeout(timer);
                    }

                    const autoDismissTimer = setTimeout(() => {
                        self.dismiss(id);
                    }, (opts.seconds || 5) * 1000);

                    state.timers.set(id, autoDismissTimer);
                }
            };
        }
    };

    window.TmpltrToast = {
        show: (opts) => ToastManager.show(opts),

        success: (opts) => ToastManager.show({ ...opts, type: 'success' }),

        error: (opts) => ToastManager.show({ ...opts, type: 'error' }),

        warning: (opts) => ToastManager.show({ ...opts, type: 'warning' }),

        message: (opts) => ToastManager.show({ ...opts, type: 'message' }),

        progress: (opts) => ToastManager.progress(opts),

        dismiss: (id) => ToastManager.dismiss(id),

        dismissAll: () => ToastManager.dismissAll()
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ToastManager.init());
    } else {
        ToastManager.init();
    }

})();
