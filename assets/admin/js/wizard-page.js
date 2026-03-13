/**
 * Tmpltr Setup Wizard JavaScript
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const SELECTORS = {
        WIZARD: '.tmpltr-wizard',
        CARD: '.tmpltr-wizard__card',
        STEP: '.tmpltr-wizard__step',
        PROGRESS_FILL: '.tmpltr-wizard__progress-fill',
        SKIP_BTN: '.tmpltr-wizard__skip-btn',
        START_BTN: '.tmpltr-wizard__start-btn',
        AUTH_TAB: '.tmpltr-wizard__auth-tab',
        AUTH_PANEL: '.tmpltr-wizard__auth-panel',
        REGISTER_FORM: '#tmpltr-wizard-register-form',
        REGISTER_NAME: '#wizard-register-name',
        REGISTER_EMAIL: '#wizard-register-email',
        REGISTER_PASSWORD: '#wizard-register-password',
        REGISTER_PASSWORD_CONFIRM: '#wizard-register-password-confirm',
        REGISTER_SUBMIT: '#tmpltr-wizard-register-form button[type="submit"]',
        CONFIRMATION: '.tmpltr-wizard__confirmation',
        CONFIRMED_BTN: '.tmpltr-wizard__confirmed-btn',
        RESEND_BTN: '.tmpltr-wizard__resend-btn',
        LOGIN_FORM: '#tmpltr-wizard-login-form',
        LOGIN_EMAIL: '#wizard-login-email',
        LOGIN_PASSWORD: '#wizard-login-password',
        LOGIN_SUBMIT: '#tmpltr-wizard-login-form button[type="submit"]',
        SETUP_LOADING: '.tmpltr-wizard__setup-loading',
        SETUP_ERROR: '.tmpltr-wizard__setup-error',
        SETUP_ERROR_MSG: '.tmpltr-wizard__setup-error-message',
        SETUP_RETRY: '.tmpltr-wizard__setup-retry',
        SETUP_SKIP: '.tmpltr-wizard__setup-skip',
        GENERATE_FORM: '#tmpltr-wizard-generate-form',
        GENERATE_FIELDS: '.tmpltr-wizard__generate-fields',
        GENERATE_BTN: '.tmpltr-wizard__generate-btn',
        CREDIT_COST: '.tmpltr-wizard__credit-cost',
        VIEW_BTN: '.tmpltr-wizard__view-btn',
        EDIT_BTN: '.tmpltr-wizard__edit-btn',
        DASHBOARD_BTN: '.tmpltr-wizard__dashboard-btn',
    };

    const CLASSES = {
        stepActive: 'tmpltr-wizard__step--active',
        tabActive: 'tmpltr-wizard__auth-tab--active',
        panelActive: 'tmpltr-wizard__auth-panel--active',
        cardWide: 'tmpltr-wizard__card--wide',
    };

    const MIN_PASSWORD_LENGTH = 6;

    const STEP_PROGRESS = {
        1: 0,
        2: 25,
        3: 50,
        4: 75,
        5: 100,
    };

    const state = {
        currentStep: 1,
        templateId: null,
        templateName: null,
        fields: null,
        prompts: null,
        generationResult: null,
        pendingEmail: null,
        pendingPassword: null,
    };

    function bindEvents() {
        document.querySelector(SELECTORS.SKIP_BTN).addEventListener('click', handleSkip);
        document.querySelector(SELECTORS.START_BTN).addEventListener('click', () => goToStep(2));

        document.querySelectorAll(SELECTORS.AUTH_TAB).forEach(tab => {
            tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
        });

        document.querySelector(SELECTORS.REGISTER_FORM).addEventListener('submit', handleRegisterSubmit);
        document.querySelector(SELECTORS.LOGIN_FORM).addEventListener('submit', handleLoginSubmit);
        document.querySelector(SELECTORS.CONFIRMED_BTN).addEventListener('click', handleConfirmedClick);
        document.querySelector(SELECTORS.RESEND_BTN).addEventListener('click', handleResendClick);

        document.querySelector(SELECTORS.SETUP_RETRY).addEventListener('click', handleSetup);
        document.querySelector(SELECTORS.SETUP_SKIP).addEventListener('click', handleSkip);

        document.querySelector(SELECTORS.GENERATE_FORM).addEventListener('submit', handleGenerate);
        document.querySelector(SELECTORS.DASHBOARD_BTN).addEventListener('click', handleComplete);
    }

    function goToStep(step) {
        state.currentStep = step;

        document.querySelectorAll(SELECTORS.STEP).forEach(el => {
            el.classList.remove(CLASSES.stepActive);
        });

        const stepEl = document.querySelector(`${SELECTORS.STEP}[data-step="${step}"]`);
        if (stepEl) {
            stepEl.classList.add(CLASSES.stepActive);
        }

        const fill = document.querySelector(SELECTORS.PROGRESS_FILL);
        if (fill) {
            fill.style.width = STEP_PROGRESS[step] + '%';
        }

        const card = document.querySelector(SELECTORS.CARD);
        if (step === 2) {
            card.classList.add(CLASSES.cardWide);
        } else {
            card.classList.remove(CLASSES.cardWide);
        }

        const firstInput = stepEl.querySelector('input:not([type="hidden"]), button.button-primary');
        if (firstInput) {
            firstInput.focus();
        }

        if (step === 3) {
            handleSetup();
        }
    }

    function switchAuthTab(tab) {
        document.querySelectorAll(SELECTORS.AUTH_TAB).forEach(el => {
            el.classList.remove(CLASSES.tabActive);
        });
        document.querySelector(`${SELECTORS.AUTH_TAB}[data-tab="${tab}"]`).classList.add(CLASSES.tabActive);

        document.querySelectorAll(SELECTORS.AUTH_PANEL).forEach(el => {
            el.classList.remove(CLASSES.panelActive);
        });
        document.querySelector(`${SELECTORS.AUTH_PANEL}[data-panel="${tab}"]`).classList.add(CLASSES.panelActive);
    }

    function setLoading(btn, isLoading, loadingText, defaultText) {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? loadingText : defaultText;
    }

    function handleSkip() {
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tmpltr_dismiss_wizard',
                nonce: tmpltrData.nonce
            })
        })
        .then(() => {
            window.location.href = tmpltrAuth.dashboardUrl;
        })
        .catch(() => {
            window.location.href = tmpltrAuth.dashboardUrl;
        });
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();

        const name = document.querySelector(SELECTORS.REGISTER_NAME).value.trim();
        const email = document.querySelector(SELECTORS.REGISTER_EMAIL).value.trim();
        const password = document.querySelector(SELECTORS.REGISTER_PASSWORD).value;
        const passwordConfirm = document.querySelector(SELECTORS.REGISTER_PASSWORD_CONFIRM).value;
        const btn = document.querySelector(SELECTORS.REGISTER_SUBMIT);

        if (!name || !email || !password || !passwordConfirm) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Please fill in all fields.' });
            return;
        }

        if (password !== passwordConfirm) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Passwords do not match.' });
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.' });
            return;
        }

        setLoading(btn, true, 'Creating account...', 'Create Account');

        const { data, error } = await TmpltrAuth.signUp(email, password, name);

        if (error) {
            TmpltrToast.error({ title: 'Registration Failed', subtext: error.message });
            setLoading(btn, false, 'Creating account...', 'Create Account');
            return;
        }

        state.pendingEmail = email;
        state.pendingPassword = password;

        if (data.user && data.session) {
            TmpltrToast.success({ title: 'Account Created', subtext: 'Setting up your workspace...' });
            goToStep(3);
            return;
        }

        document.querySelector(SELECTORS.REGISTER_FORM).style.display = 'none';
        document.querySelector(SELECTORS.CONFIRMATION).style.display = 'block';
    }

    async function handleConfirmedClick() {
        const btn = document.querySelector(SELECTORS.CONFIRMED_BTN);

        if (!state.pendingEmail || !state.pendingPassword) {
            switchAuthTab('login');
            return;
        }

        setLoading(btn, true, 'Signing in...', "I've Confirmed My Email");

        const { data, error } = await TmpltrAuth.signIn(state.pendingEmail, state.pendingPassword);

        if (error) {
            if (error.message === 'Email not confirmed') {
                TmpltrToast.warning({ title: 'Not Confirmed Yet', subtext: 'Please check your email and click the confirmation link first.' });
            } else {
                TmpltrToast.error({ title: 'Sign In Failed', subtext: error.message });
            }
            setLoading(btn, false, 'Signing in...', "I've Confirmed My Email");
            return;
        }

        TmpltrToast.success({ title: 'Welcome!', subtext: 'Setting up your workspace...' });
        goToStep(3);
    }

    async function handleResendClick() {
        const btn = document.querySelector(SELECTORS.RESEND_BTN);

        if (!state.pendingEmail || !state.pendingPassword) {
            TmpltrToast.error({ title: 'Error', subtext: 'Please register again.' });
            return;
        }

        setLoading(btn, true, 'Sending...', 'Resend Email');

        const { error } = await TmpltrAuth.signUp(state.pendingEmail, state.pendingPassword, '');

        if (error) {
            TmpltrToast.error({ title: 'Resend Failed', subtext: error.message });
        } else {
            TmpltrToast.success({ title: 'Email Sent', subtext: 'Please check your inbox for the confirmation link.' });
        }

        setLoading(btn, false, 'Sending...', 'Resend Email');
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();

        const email = document.querySelector(SELECTORS.LOGIN_EMAIL).value.trim();
        const password = document.querySelector(SELECTORS.LOGIN_PASSWORD).value;
        const btn = document.querySelector(SELECTORS.LOGIN_SUBMIT);

        if (!email || !password) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Please enter email and password.' });
            return;
        }

        setLoading(btn, true, 'Signing in...', 'Sign In');

        const { data, error } = await TmpltrAuth.signIn(email, password);

        if (error) {
            let errorMessage = error.message;
            if (error.message === 'Invalid login credentials') {
                errorMessage = 'Invalid email or password.';
            }
            TmpltrToast.error({ title: 'Login Failed', subtext: errorMessage });
            setLoading(btn, false, 'Signing in...', 'Sign In');
            return;
        }

        TmpltrToast.success({ title: 'Welcome back!', subtext: 'Setting up your workspace...' });
        goToStep(3);
    }

    function handleSetup() {
        const loading = document.querySelector(SELECTORS.SETUP_LOADING);
        const error = document.querySelector(SELECTORS.SETUP_ERROR);

        loading.style.display = 'block';
        error.style.display = 'none';

        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tmpltr_import_starter_template',
                nonce: tmpltrData.nonce
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.templateId = data.data.template_id;
                state.templateName = data.data.template.name;
                fetchTemplateData(state.templateId);
                return;
            }

            if (data.data?.error_code === 'already_imported') {
                checkStarterTemplate().then(result => {
                    if (result && result.exists) {
                        state.templateId = result.template_id;
                        fetchTemplateData(state.templateId);
                    } else {
                        showSetupError('Could not find the imported template.');
                    }
                });
                return;
            }

            showSetupError(data.data?.message || 'Failed to import starter template.');
        })
        .catch(() => {
            showSetupError('Network error. Please check your connection.');
        });
    }

    function showSetupError(message) {
        document.querySelector(SELECTORS.SETUP_LOADING).style.display = 'none';
        document.querySelector(SELECTORS.SETUP_ERROR).style.display = 'block';
        document.querySelector(SELECTORS.SETUP_ERROR_MSG).textContent = message;
    }

    function checkStarterTemplate() {
        return fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tmpltr_check_starter_template',
                nonce: tmpltrData.nonce
            })
        })
        .then(response => response.json())
        .then(data => data.success ? data.data : null)
        .catch(() => null);
    }

    function fetchTemplateData(templateId) {
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tmpltr_get_template_data',
                nonce: tmpltrData.nonce,
                template_id: templateId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.fields = data.data.fields || [];
                state.prompts = data.data.prompts || [];

                if (!state.templateName) {
                    state.templateName = 'Starter Template';
                }

                buildGenerateForm(state.fields, state.prompts);
                goToStep(4);
            } else {
                showSetupError(data.data?.message || 'Failed to load template data.');
            }
        })
        .catch(() => {
            showSetupError('Network error loading template data.');
        });
    }

    function buildGenerateForm(fields, prompts) {
        const container = document.querySelector(SELECTORS.GENERATE_FIELDS);
        container.innerHTML = '';

        const titleGroup = document.createElement('div');
        titleGroup.className = 'tmpltr-wizard__form-group';
        titleGroup.innerHTML = '<label for="wizard-page-title">Page Title</label>' +
            '<input type="text" id="wizard-page-title" name="page_title" class="regular-text" required>';
        container.appendChild(titleGroup);

        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'tmpltr-wizard__form-group';
            group.innerHTML = '<label for="wizard-field-' + field.unique_identifier + '">' + escapeHtml(field.label) + '</label>' +
                '<input type="text" id="wizard-field-' + field.unique_identifier + '" name="' + escapeHtml(field.unique_identifier) + '" class="regular-text"' +
                (field.default_value ? ' value="' + escapeHtml(field.default_value) + '"' : '') +
                (field.is_required == 1 ? ' required' : '') + '>';
            container.appendChild(group);
        });

        const costEl = document.querySelector(SELECTORS.CREDIT_COST);
        costEl.innerHTML = 'Credit cost: <strong>' + prompts.length + '</strong>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function handleGenerate(e) {
        e.preventDefault();

        const btn = document.querySelector(SELECTORS.GENERATE_BTN);
        const form = document.querySelector(SELECTORS.GENERATE_FORM);

        const formData = {};
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            formData[input.name] = input.value.trim();
        });

        if (!formData.page_title) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Please enter a page title.' });
            return;
        }

        for (const field of state.fields) {
            if (field.is_required == 1 && !formData[field.unique_identifier]) {
                TmpltrToast.error({ title: 'Validation Error', subtext: field.label + ' is required.' });
                return;
            }
        }

        setLoading(btn, true, 'Generating...', 'Generate Page');

        try {
            const result = await TmpltrGenerator.generate({
                templateId: state.templateId,
                templateName: state.templateName,
                prompts: state.prompts,
                fields: state.fields,
                formData: formData
            });

            state.generationResult = result.saveResponse;
            showSuccess(result.saveResponse);
        } catch (error) {
            setLoading(btn, false, 'Generating...', 'Generate Page');
        }
    }

    function showSuccess(saveResponse) {
        if (saveResponse.view_url) {
            document.querySelector(SELECTORS.VIEW_BTN).href = saveResponse.view_url;
        }
        if (saveResponse.edit_url) {
            document.querySelector(SELECTORS.EDIT_BTN).href = saveResponse.edit_url;
        }

        goToStep(5);
    }

    function handleComplete() {
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tmpltr_complete_wizard',
                nonce: tmpltrData.nonce
            })
        })
        .then(() => {
            window.location.href = tmpltrAuth.dashboardUrl;
        })
        .catch(() => {
            window.location.href = tmpltrAuth.dashboardUrl;
        });
    }

    async function init() {
        bindEvents();

        const session = await TmpltrAuth.getSession();

        if (session) {
            const result = await checkStarterTemplate();

            if (result && result.exists) {
                state.templateId = result.template_id;
                fetchTemplateData(result.template_id);
                return;
            }

            goToStep(3);
            return;
        }

        goToStep(1);
    }

    window.TmpltrWizard = {
        goToStep,
        getCurrentStep: () => state.currentStep,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
