(function() {
    'use strict';

    const SELECTORS = {
        FORM: '#tmpltr-register-form',
        NAME: '#auth-name',
        EMAIL: '#auth-email',
        PASSWORD: '#auth-password',
        PASSWORD_CONFIRM: '#auth-password-confirm',
        SUBMIT_BTN: 'button[type="submit"]'
    };

    const MIN_PASSWORD_LENGTH = 6;

    function setLoading(isLoading) {
        const btn = document.querySelector(SELECTORS.SUBMIT_BTN);
        if (!btn) return;

        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Creating account...' : 'Create Account';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const name = document.querySelector(SELECTORS.NAME).value.trim();
        const email = document.querySelector(SELECTORS.EMAIL).value.trim();
        const password = document.querySelector(SELECTORS.PASSWORD).value;
        const passwordConfirm = document.querySelector(SELECTORS.PASSWORD_CONFIRM).value;

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

        setLoading(true);

        const { data, error } = await TmpltrAuth.signUp(email, password, name);

        if (error) {
            TmpltrToast.error({ title: 'Registration Failed', subtext: error.message });
            setLoading(false);
            return;
        }

        if (data.user && !data.session) {
            TmpltrToast.success({ title: 'Registration Successful', subtext: 'Please check your email to confirm your account.', seconds: 10 });
            setLoading(false);
            return;
        }

        TmpltrToast.success({ title: 'Registration Successful', subtext: 'Redirecting...' });
        window.location.href = tmpltrAuth.dashboardUrl;
    }

    function init() {
        const form = document.querySelector(SELECTORS.FORM);
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
