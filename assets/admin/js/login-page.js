(function() {
    'use strict';

    const SELECTORS = {
        FORM: '#tmpltr-login-form',
        EMAIL: '#auth-email',
        PASSWORD: '#auth-password',
        SUBMIT_BTN: 'button[type="submit"]'
    };

    function setLoading(isLoading) {
        const btn = document.querySelector(SELECTORS.SUBMIT_BTN);
        if (!btn) return;

        btn.disabled = isLoading;
        btn.textContent = isLoading ? 'Signing in...' : 'Sign In';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const email = document.querySelector(SELECTORS.EMAIL).value.trim();
        const password = document.querySelector(SELECTORS.PASSWORD).value;

        if (!email || !password) {
            TmpltrToast.error({ title: 'Validation Error', subtext: 'Please enter email and password.' });
            return;
        }

        setLoading(true);

        const { data, error } = await TmpltrAuth.signIn(email, password);

        if (error) {
            TmpltrToast.error({ title: 'Login Failed', subtext: error.message });
            setLoading(false);
            return;
        }

        TmpltrToast.success({ title: 'Login Successful', subtext: 'Redirecting...' });
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
