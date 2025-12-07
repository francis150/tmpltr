(function() {
    'use strict';

    const SELECTORS = {
        AUTH_LOADING: '.tmpltr-auth-loading',
        PROTECTED_CONTENT: '.tmpltr-protected-content',
        LOGOUT_BTN: '.tmpltr-logout-btn'
    };

    let supabaseClient = null;

    function initSupabase() {
        if (!window.supabase || !window.tmpltrAuth) {
            return false;
        }

        supabaseClient = window.supabase.createClient(
            tmpltrAuth.supabaseUrl,
            tmpltrAuth.supabaseKey
        );

        return true;
    }

    async function getSession() {
        if (!supabaseClient) return null;

        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) return null;
            return session;
        } catch (err) {
            return null;
        }
    }

    async function signIn(email, password) {
        if (!supabaseClient) {
            return { error: { message: 'Auth not initialized' } };
        }

        return await supabaseClient.auth.signInWithPassword({ email, password });
    }

    async function signUp(email, password) {
        if (!supabaseClient) {
            return { error: { message: 'Auth not initialized' } };
        }

        return await supabaseClient.auth.signUp({ email, password });
    }

    async function signOut() {
        if (!supabaseClient) return;

        try {
            await supabaseClient.auth.signOut();
        } catch (err) {
            // Continue with redirect even if signout fails
        }

        window.location.href = tmpltrAuth.loginUrl;
    }

    function showProtectedContent() {
        const loading = document.querySelector(SELECTORS.AUTH_LOADING);
        const content = document.querySelector(SELECTORS.PROTECTED_CONTENT);

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';
    }

    function initLogoutButtons() {
        document.querySelectorAll(SELECTORS.LOGOUT_BTN).forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                signOut();
            });
        });
    }

    async function handleProtectedPage() {
        const session = await getSession();

        if (!session) {
            window.location.href = tmpltrAuth.loginUrl;
            return;
        }

        showProtectedContent();
        initLogoutButtons();
    }

    async function handleAuthPage() {
        const session = await getSession();

        if (session) {
            window.location.href = tmpltrAuth.dashboardUrl;
            return;
        }
    }

    async function init() {
        if (!initSupabase()) {
            return;
        }

        if (tmpltrAuth.isAuthPage) {
            await handleAuthPage();
        } else if (tmpltrAuth.isProtectedPage) {
            await handleProtectedPage();
        }
    }

    window.TmpltrAuth = {
        getSession,
        signIn,
        signUp,
        signOut
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
