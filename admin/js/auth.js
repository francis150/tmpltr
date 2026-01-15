(function() {
    'use strict';

    const SELECTORS = {
        AUTH_LOADING: '.tmpltr-auth-loading',
        PROTECTED_CONTENT: '.tmpltr-protected-content',
        LOGOUT_BTN: '.tmpltr-logout-btn'
    };

    const PROFILE_CACHE_KEY = 'tmpltr_profile';

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

    async function checkUserExists(email) {
        if (!supabaseClient) return null;

        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (error) return null;
            return !!data;
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

    async function signUp(email, password, name) {
        if (!supabaseClient) {
            return { error: { message: 'Auth not initialized' } };
        }

        return await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: name }
            }
        });
    }

    async function getProfile(forceRefresh = false) {
        const session = await getSession();
        if (!session) return null;

        if (!forceRefresh) {
            const cached = localStorage.getItem(PROFILE_CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed.id === session.user.id) {
                        return parsed;
                    }
                } catch (err) {
                    localStorage.removeItem(PROFILE_CACHE_KEY);
                }
            }
        }

        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('id, email, display_name, plan_type, subscription_credits, purchased_credits, status')
                .eq('id', session.user.id)
                .single();

            if (error) return null;

            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
            return data;
        } catch (err) {
            return null;
        }
    }

    async function signOut() {
        if (!supabaseClient) return;

        localStorage.removeItem(PROFILE_CACHE_KEY);

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
        getProfile,
        signIn,
        signUp,
        signOut,
        getClient: () => supabaseClient
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
