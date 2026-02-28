/**
 * Tmpltr Popup System
 *
 * Global popup utility for confirmation and form popups.
 * Follows the same architectural patterns as the toast notification system.
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const CONFIRMATION_DEFAULTS = {
        title: '',
        subtext: '',
        level: 'low',
        confirmText: 'Confirm',
        onConfirm: null,
        cancelText: 'Cancel',
        onCancel: null,
        checkboxes: []
    };

    const FORM_DEFAULTS = {
        title: '',
        subtext: '',
        level: 'low',
        inputs: [],
        submitText: 'Submit',
        onSubmit: null,
        cancelText: 'Cancel',
        onCancel: null,
        checkboxes: []
    };

    const LEVELS = {
        low: {
            color: '#0073aa',
            icon: 'info',
            ariaRole: 'dialog',
            ariaLive: 'polite'
        },
        medium: {
            color: '#ff9b00',
            icon: 'warning',
            ariaRole: 'alertdialog',
            ariaLive: 'assertive'
        },
        high: {
            color: '#d63638',
            icon: 'dismiss',
            ariaRole: 'alertdialog',
            ariaLive: 'assertive'
        }
    };

    const state = {
        overlay: null,
        activePopup: null,
        activeCallback: null,
        popupCounter: 0
    };

    const PopupManager = {
        init() {
            if (state.overlay) return;

            state.overlay = document.createElement('div');
            state.overlay.className = 'tmpltr-popup-overlay';
            document.body.appendChild(state.overlay);

            this.setupOverlayClick();
            this.setupKeyboardNavigation();
        },

        setupOverlayClick() {
            state.overlay.addEventListener('click', (e) => {
                if (e.target === state.overlay) {
                    this.dismiss();
                }
            });
        },

        setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.activePopup) {
                    this.dismiss();
                }
            });
        },

        showConfirmation(options) {
            this.init();

            const opts = { ...CONFIRMATION_DEFAULTS, ...options };

            if (!LEVELS[opts.level]) {
                opts.level = 'low';
            }

            if (state.activePopup) {
                this.dismiss();
            }

            state.popupCounter++;
            const popupId = `tmpltr-popup-${state.popupCounter}`;
            const levelConfig = LEVELS[opts.level];

            const popupElement = this.createConfirmationPopup(popupId, opts, levelConfig);
            state.activePopup = popupElement;
            state.activeCallback = null;

            state.overlay.appendChild(popupElement);

            requestAnimationFrame(() => {
                state.overlay.classList.add('tmpltr-popup-overlay--visible');
                popupElement.classList.add('tmpltr-popup--visible');
            });

            this.setupFocusTrap(popupElement);

            const firstButton = popupElement.querySelector('button');
            if (firstButton) {
                setTimeout(() => firstButton.focus(), 100);
            }
        },

        showForm(options) {
            this.init();

            const opts = { ...FORM_DEFAULTS, ...options };

            if (!LEVELS[opts.level]) {
                opts.level = 'low';
            }

            if (state.activePopup) {
                this.dismiss();
            }

            state.popupCounter++;
            const popupId = `tmpltr-popup-${state.popupCounter}`;
            const levelConfig = LEVELS[opts.level];

            const popupElement = this.createFormPopup(popupId, opts, levelConfig);
            state.activePopup = popupElement;
            state.activeCallback = opts.onSubmit;

            state.overlay.appendChild(popupElement);

            requestAnimationFrame(() => {
                state.overlay.classList.add('tmpltr-popup-overlay--visible');
                popupElement.classList.add('tmpltr-popup--visible');
            });

            this.setupFocusTrap(popupElement);

            const firstInput = popupElement.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        },

        createConfirmationPopup(popupId, opts, levelConfig) {
            const popup = document.createElement('div');
            popup.className = `tmpltr-popup tmpltr-popup--${opts.level}`;
            popup.dataset.popupId = popupId;
            popup.setAttribute('role', levelConfig.ariaRole);
            popup.setAttribute('aria-live', levelConfig.ariaLive);
            popup.setAttribute('aria-modal', 'true');

            const header = document.createElement('div');
            header.className = 'tmpltr-popup__header';

            const headerContent = document.createElement('div');
            headerContent.className = 'tmpltr-popup__header-content';

            const icon = document.createElement('div');
            icon.className = 'tmpltr-popup__icon';
            icon.innerHTML = `<span class="dashicons dashicons-${levelConfig.icon}"></span>`;

            const title = document.createElement('h2');
            title.className = 'tmpltr-popup__title';
            title.textContent = opts.title;

            headerContent.appendChild(icon);
            headerContent.appendChild(title);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'tmpltr-popup__close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', 'Close popup');
            closeBtn.innerHTML = '<span class="dashicons dashicons-no-alt"></span>';
            closeBtn.addEventListener('click', () => {
                const checked = this.collectCheckboxData(popup);
                this.dismiss(() => {
                    if (opts.onCancel) opts.onCancel(checked);
                });
            });

            header.appendChild(headerContent);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'tmpltr-popup__body';

            if (opts.subtext) {
                const subtext = document.createElement('p');
                subtext.className = 'tmpltr-popup__subtext';
                subtext.innerHTML = opts.subtext;
                body.appendChild(subtext);
            }

            const checkboxGroup = this.createCheckboxes(opts);
            if (checkboxGroup) {
                body.appendChild(checkboxGroup);
            }

            const footer = document.createElement('div');
            footer.className = 'tmpltr-popup__footer';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'button tmpltr-popup__button tmpltr-popup__button--cancel';
            cancelBtn.type = 'button';
            cancelBtn.textContent = opts.cancelText;
            cancelBtn.addEventListener('click', () => {
                const checked = this.collectCheckboxData(popup);
                this.dismiss(() => {
                    if (opts.onCancel) opts.onCancel(checked);
                });
            });

            const confirmBtn = document.createElement('button');
            confirmBtn.className = `button button-primary tmpltr-popup__button tmpltr-popup__button--confirm tmpltr-popup__button--${opts.level}`;
            confirmBtn.type = 'button';
            confirmBtn.textContent = opts.confirmText;
            confirmBtn.addEventListener('click', () => {
                const checked = this.collectCheckboxData(popup);
                if (opts.onConfirm) {
                    opts.onConfirm(checked);
                }
                this.dismiss();
            });

            footer.appendChild(cancelBtn);
            footer.appendChild(confirmBtn);

            popup.appendChild(header);
            popup.appendChild(body);
            popup.appendChild(footer);

            return popup;
        },

        createFormPopup(popupId, opts, levelConfig) {
            const popup = document.createElement('div');
            popup.className = `tmpltr-popup tmpltr-popup--${opts.level} tmpltr-popup--form`;
            popup.dataset.popupId = popupId;
            popup.setAttribute('role', levelConfig.ariaRole);
            popup.setAttribute('aria-live', levelConfig.ariaLive);
            popup.setAttribute('aria-modal', 'true');

            const header = document.createElement('div');
            header.className = 'tmpltr-popup__header';

            const headerContent = document.createElement('div');
            headerContent.className = 'tmpltr-popup__header-content';

            const icon = document.createElement('div');
            icon.className = 'tmpltr-popup__icon';
            icon.innerHTML = `<span class="dashicons dashicons-${levelConfig.icon}"></span>`;

            const title = document.createElement('h2');
            title.className = 'tmpltr-popup__title';
            title.textContent = opts.title;

            headerContent.appendChild(icon);
            headerContent.appendChild(title);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'tmpltr-popup__close';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', 'Close popup');
            closeBtn.innerHTML = '<span class="dashicons dashicons-no-alt"></span>';
            closeBtn.addEventListener('click', () => {
                const checked = this.collectCheckboxData(popup);
                this.dismiss(() => {
                    if (opts.onCancel) opts.onCancel(checked);
                });
            });

            header.appendChild(headerContent);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'tmpltr-popup__body';

            if (opts.subtext) {
                const subtext = document.createElement('p');
                subtext.className = 'tmpltr-popup__subtext';
                subtext.innerHTML = opts.subtext;
                body.appendChild(subtext);
            }

            const form = document.createElement('form');
            form.className = 'tmpltr-popup__form';

            const formGrid = document.createElement('div');
            formGrid.className = 'tmpltr-popup__form-grid';

            opts.inputs.forEach(input => {
                const fieldWrapper = document.createElement('div');
                const widthClass = this.getWidthClass(input.width);
                fieldWrapper.className = `tmpltr-popup__field ${widthClass}`;

                let inputElement;

                if (input.type === 'textarea') {
                    inputElement = document.createElement('textarea');
                    inputElement.rows = 4;
                } else {
                    inputElement = document.createElement('input');
                    inputElement.type = input.type || 'text';
                }

                inputElement.name = input.name || '';
                inputElement.id = input.id || input.name || '';
                inputElement.placeholder = input.placeholder || '';
                inputElement.className = input.class || '';

                if (input.required) {
                    inputElement.required = true;
                }

                fieldWrapper.appendChild(inputElement);
                formGrid.appendChild(fieldWrapper);
            });

            form.appendChild(formGrid);
            body.appendChild(form);

            const checkboxGroup = this.createCheckboxes(opts);
            if (checkboxGroup) {
                body.appendChild(checkboxGroup);
            }

            const footer = document.createElement('div');
            footer.className = 'tmpltr-popup__footer';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'button tmpltr-popup__button tmpltr-popup__button--cancel';
            cancelBtn.type = 'button';
            cancelBtn.textContent = opts.cancelText;
            cancelBtn.addEventListener('click', () => {
                const checked = this.collectCheckboxData(popup);
                this.dismiss(() => {
                    if (opts.onCancel) opts.onCancel(checked);
                });
            });

            const submitBtn = document.createElement('button');
            submitBtn.className = `button button-primary tmpltr-popup__button tmpltr-popup__button--submit tmpltr-popup__button--${opts.level}`;
            submitBtn.type = 'button';
            submitBtn.textContent = opts.submitText;
            submitBtn.addEventListener('click', () => {
                if (this.validateForm(popup)) {
                    const formData = this.collectFormData(popup);
                    const checked = this.collectCheckboxData(popup);
                    if (opts.onSubmit) {
                        opts.onSubmit(formData, checked);
                    }
                    this.dismiss();
                }
            });

            footer.appendChild(cancelBtn);
            footer.appendChild(submitBtn);

            popup.appendChild(header);
            popup.appendChild(body);
            popup.appendChild(footer);

            return popup;
        },

        getWidthClass(width) {
            if (width === '33%') return 'tmpltr-popup__field--w-33';
            if (width === '50%') return 'tmpltr-popup__field--w-50';
            return 'tmpltr-popup__field--w-100';
        },

        createCheckboxes(opts) {
            if (!opts.checkboxes || opts.checkboxes.length === 0) return null;

            const container = document.createElement('div');
            container.className = 'tmpltr-popup__checkboxes';

            opts.checkboxes.forEach(checkbox => {
                const wrapper = document.createElement('label');
                wrapper.className = 'tmpltr-popup__checkbox';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.name = checkbox.name;
                input.className = 'tmpltr-popup__checkbox-input';

                const text = document.createElement('span');
                text.className = 'tmpltr-popup__checkbox-label';
                text.textContent = checkbox.label;

                wrapper.appendChild(input);
                wrapper.appendChild(text);
                container.appendChild(wrapper);
            });

            return container;
        },

        collectCheckboxData(popup) {
            const data = {};
            const checkboxes = popup.querySelectorAll('.tmpltr-popup__checkbox-input');

            checkboxes.forEach(checkbox => {
                data[checkbox.name] = checkbox.checked;
            });

            return data;
        },

        collectFormData(popup) {
            const form = popup.querySelector('form');
            const formData = new FormData(form);
            const data = {};

            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            return data;
        },

        validateForm(popup) {
            this.clearValidationErrors(popup);

            let hasErrors = false;
            const requiredInputs = popup.querySelectorAll('[required]');

            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    this.showValidationError(input, 'This field is required');
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                const firstError = popup.querySelector('.validation-error');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            return !hasErrors;
        },

        showValidationError(input, message) {
            input.classList.add('validation-error');

            const existingError = input.parentElement.querySelector('.validation-error-message');
            if (existingError) {
                return;
            }

            const errorElement = document.createElement('span');
            errorElement.className = 'validation-error-message';
            errorElement.textContent = message;

            input.insertAdjacentElement('afterend', errorElement);
        },

        clearValidationErrors(popup) {
            const allErrors = popup.querySelectorAll('.validation-error');
            allErrors.forEach(input => {
                input.classList.remove('validation-error');
            });

            const allMessages = popup.querySelectorAll('.validation-error-message');
            allMessages.forEach(message => {
                message.remove();
            });
        },

        setupFocusTrap(popup) {
            const focusableElements = popup.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            popup.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            });
        },

        dismiss(callback) {
            if (!state.activePopup) return;

            state.overlay.classList.add('tmpltr-popup-overlay--dismissing');
            state.activePopup.classList.add('tmpltr-popup--dismissing');

            setTimeout(() => {
                if (state.activePopup && state.activePopup.parentNode) {
                    state.activePopup.parentNode.removeChild(state.activePopup);
                }
                state.activePopup = null;
                state.activeCallback = null;

                state.overlay.classList.remove('tmpltr-popup-overlay--visible', 'tmpltr-popup-overlay--dismissing');

                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 300);
        }
    };

    window.TmpltrPopup = {
        confirmation: (opts) => PopupManager.showConfirmation(opts),

        form: (opts) => PopupManager.showForm(opts),

        dismiss: () => PopupManager.dismiss()
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PopupManager.init());
    } else {
        PopupManager.init();
    }

})();
