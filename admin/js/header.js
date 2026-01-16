(function() {
    'use strict';

    const SELECTORS = {
        TRIGGER: '#tmpltr-profile-trigger',
        DROPDOWN: '#tmpltr-profile-dropdown',
        TRIGGER_AVATAR: '#tmpltr-profile-avatar',
        TRIGGER_NAME: '#tmpltr-profile-name',
        DROPDOWN_AVATAR: '#tmpltr-dropdown-avatar',
        DROPDOWN_NAME: '#tmpltr-dropdown-name',
        DROPDOWN_EMAIL: '#tmpltr-dropdown-email',
        DROPDOWN_PLAN: '#tmpltr-dropdown-plan',
        DROPDOWN_PLAN_EXPIRY: '#tmpltr-dropdown-plan-expiry',
        CREDITS_COUNT: '#tmpltr-credits-count',
        CREDITS_TRIGGER: '#tmpltr-credits-trigger',
        CREDITS_DROPDOWN: '#tmpltr-credits-dropdown',
        SUBSCRIPTION_CREDITS: '#tmpltr-subscription-credits',
        PURCHASED_CREDITS: '#tmpltr-purchased-credits'
    };

    const CLASSES = {
        TRIGGER_OPEN: 'tmpltr-header__profile--open',
        DROPDOWN_OPEN: 'tmpltr-header__dropdown--open',
        PLAN_FREE: 'tmpltr-header__dropdown-plan-badge--free',
        PLAN_STARTER: 'tmpltr-header__dropdown-plan-badge--starter',
        PLAN_PRO: 'tmpltr-header__dropdown-plan-badge--pro',
        PLAN_AGENCY: 'tmpltr-header__dropdown-plan-badge--agency',
        CREDITS_DROPDOWN_OPEN: 'tmpltr-header__credits-dropdown--open',
        PLAN_EXPIRY_WARNING: 'tmpltr-header__dropdown-plan-expiry--warning',
        PLAN_EXPIRY_EXPIRED: 'tmpltr-header__dropdown-plan-expiry--expired'
    };

    const PROFILE_CACHE_KEY = 'tmpltr_profile';

    const elements = {};
    let isOpen = false;
    let isCreditsOpen = false;
    let profileSubscription = null;

    function cacheElements() {
        elements.trigger = document.querySelector(SELECTORS.TRIGGER);
        elements.dropdown = document.querySelector(SELECTORS.DROPDOWN);
        elements.triggerAvatar = document.querySelector(SELECTORS.TRIGGER_AVATAR);
        elements.triggerName = document.querySelector(SELECTORS.TRIGGER_NAME);
        elements.dropdownAvatar = document.querySelector(SELECTORS.DROPDOWN_AVATAR);
        elements.dropdownName = document.querySelector(SELECTORS.DROPDOWN_NAME);
        elements.dropdownEmail = document.querySelector(SELECTORS.DROPDOWN_EMAIL);
        elements.dropdownPlan = document.querySelector(SELECTORS.DROPDOWN_PLAN);
        elements.dropdownPlanExpiry = document.querySelector(SELECTORS.DROPDOWN_PLAN_EXPIRY);
        elements.creditsCount = document.querySelector(SELECTORS.CREDITS_COUNT);
        elements.creditsTrigger = document.querySelector(SELECTORS.CREDITS_TRIGGER);
        elements.creditsDropdown = document.querySelector(SELECTORS.CREDITS_DROPDOWN);
        elements.subscriptionCredits = document.querySelector(SELECTORS.SUBSCRIPTION_CREDITS);
        elements.purchasedCredits = document.querySelector(SELECTORS.PURCHASED_CREDITS);
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function formatExpiryDate(dateString) {
        if (!dateString) return null;

        const expiryDate = new Date(dateString);
        if (isNaN(expiryDate.getTime())) return null;

        const now = new Date();
        const gracePeriodEnd = new Date(expiryDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        const options = { month: 'short', day: 'numeric', year: 'numeric' };

        if (now < expiryDate) {
            return {
                text: 'Renews on ' + expiryDate.toLocaleDateString('en-US', options),
                status: 'active'
            };
        }

        if (now < gracePeriodEnd) {
            return {
                text: 'Expires on ' + gracePeriodEnd.toLocaleDateString('en-US', options),
                status: 'warning'
            };
        }

        return {
            text: 'Expired on ' + gracePeriodEnd.toLocaleDateString('en-US', options),
            status: 'expired'
        };
    }

    function populateUI(profile) {
        if (!profile) return;

        const initials = getInitials(profile.display_name);
        const displayName = profile.display_name || 'User';
        const email = profile.email || '';
        const planType = profile.plan_type || 'free';

        if (elements.triggerAvatar) {
            elements.triggerAvatar.textContent = initials;
        }

        if (elements.triggerName) {
            elements.triggerName.textContent = displayName;
        }

        if (elements.dropdownAvatar) {
            elements.dropdownAvatar.textContent = initials;
        }

        if (elements.dropdownName) {
            elements.dropdownName.textContent = displayName;
        }

        if (elements.dropdownEmail) {
            elements.dropdownEmail.textContent = email;
        }

        updatePlanBadge(planType);
        updatePlanExpiry(profile.plan_expires_at);
    }

    function updateCredits(subscription, purchased) {
        const total = subscription + purchased;
        if (elements.creditsCount) {
            elements.creditsCount.textContent = total;
        }
        if (elements.subscriptionCredits) {
            elements.subscriptionCredits.textContent = subscription;
        }
        if (elements.purchasedCredits) {
            elements.purchasedCredits.textContent = purchased;
        }
    }

    function updatePlanBadge(planType) {
        if (!elements.dropdownPlan) return;

        elements.dropdownPlan.textContent = planType;
        elements.dropdownPlan.classList.remove(
            CLASSES.PLAN_FREE,
            CLASSES.PLAN_STARTER,
            CLASSES.PLAN_PRO,
            CLASSES.PLAN_AGENCY
        );

        if (planType === 'starter') {
            elements.dropdownPlan.classList.add(CLASSES.PLAN_STARTER);
        } else if (planType === 'pro') {
            elements.dropdownPlan.classList.add(CLASSES.PLAN_PRO);
        } else if (planType === 'agency') {
            elements.dropdownPlan.classList.add(CLASSES.PLAN_AGENCY);
        } else {
            elements.dropdownPlan.classList.add(CLASSES.PLAN_FREE);
        }
    }

    function updatePlanExpiry(expiresAt) {
        if (!elements.dropdownPlanExpiry) return;

        const result = formatExpiryDate(expiresAt);

        elements.dropdownPlanExpiry.classList.remove(
            CLASSES.PLAN_EXPIRY_WARNING,
            CLASSES.PLAN_EXPIRY_EXPIRED
        );

        if (!result) {
            elements.dropdownPlanExpiry.textContent = '';
            return;
        }

        elements.dropdownPlanExpiry.textContent = result.text;

        if (result.status === 'warning') {
            elements.dropdownPlanExpiry.classList.add(CLASSES.PLAN_EXPIRY_WARNING);
        } else if (result.status === 'expired') {
            elements.dropdownPlanExpiry.classList.add(CLASSES.PLAN_EXPIRY_EXPIRED);
        }
    }

    function updateProfileCache(updates) {
        const cached = localStorage.getItem(PROFILE_CACHE_KEY);
        if (!cached) return;

        try {
            const profile = JSON.parse(cached);
            Object.assign(profile, updates);
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
        } catch (err) {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
    }

    function open() {
        if (!elements.trigger || !elements.dropdown) return;
        isOpen = true;
        elements.trigger.classList.add(CLASSES.TRIGGER_OPEN);
        elements.dropdown.classList.add(CLASSES.DROPDOWN_OPEN);
    }

    function close() {
        if (!elements.trigger || !elements.dropdown) return;
        isOpen = false;
        elements.trigger.classList.remove(CLASSES.TRIGGER_OPEN);
        elements.dropdown.classList.remove(CLASSES.DROPDOWN_OPEN);
    }

    function toggle() {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }

    function openCredits() {
        if (!elements.creditsDropdown) return;
        isCreditsOpen = true;
        elements.creditsDropdown.classList.add(CLASSES.CREDITS_DROPDOWN_OPEN);
    }

    function closeCredits() {
        if (!elements.creditsDropdown) return;
        isCreditsOpen = false;
        elements.creditsDropdown.classList.remove(CLASSES.CREDITS_DROPDOWN_OPEN);
    }

    function toggleCredits() {
        if (isCreditsOpen) {
            closeCredits();
        } else {
            openCredits();
        }
    }

    function handleClickOutside(e) {
        if (elements.trigger && elements.dropdown) {
            if (!elements.trigger.contains(e.target) && !elements.dropdown.contains(e.target)) {
                close();
            }
        }

        if (elements.creditsTrigger && elements.creditsDropdown) {
            if (!elements.creditsTrigger.contains(e.target) && !elements.creditsDropdown.contains(e.target)) {
                closeCredits();
            }
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            if (isOpen) close();
            if (isCreditsOpen) closeCredits();
        }
    }

    function bindEvents() {
        if (elements.trigger) {
            elements.trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                toggle();
            });
        }

        if (elements.creditsTrigger) {
            elements.creditsTrigger.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleCredits();
            });
        }

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeydown);
    }

    async function loadProfile() {
        if (typeof TmpltrAuth === 'undefined' || !TmpltrAuth.getProfile) {
            return;
        }

        const profile = await TmpltrAuth.getProfile();
        if (profile) {
            populateUI(profile);
        }
    }

    async function loadCredits() {
        if (typeof TmpltrAuth === 'undefined' || !TmpltrAuth.getClient || !TmpltrAuth.getSession) {
            return;
        }

        const client = TmpltrAuth.getClient();
        const session = await TmpltrAuth.getSession();

        if (!client || !session) return;

        const { data, error } = await client
            .from('profiles')
            .select('subscription_credits, purchased_credits')
            .eq('id', session.user.id)
            .single();

        if (!error && data) {
            updateCredits(data.subscription_credits ?? 0, data.purchased_credits ?? 0);
        }
    }

    async function subscribeToProfileChanges() {
        if (typeof TmpltrAuth === 'undefined' || !TmpltrAuth.getClient || !TmpltrAuth.getSession) {
            return;
        }

        const client = TmpltrAuth.getClient();
        const session = await TmpltrAuth.getSession();

        if (!client || !session) return;

        profileSubscription = client
            .channel('profile-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${session.user.id}`
                },
                (payload) => {
                    if (payload.new) {
                        const planType = payload.new.plan_type ?? 'free';
                        updateCredits(
                            payload.new.subscription_credits ?? 0,
                            payload.new.purchased_credits ?? 0
                        );
                        updatePlanBadge(planType);
                        updatePlanExpiry(payload.new.plan_expires_at);
                        updateProfileCache({
                            subscription_credits: payload.new.subscription_credits,
                            purchased_credits: payload.new.purchased_credits,
                            plan_type: payload.new.plan_type,
                            plan_expires_at: payload.new.plan_expires_at
                        });
                    }
                }
            )
            .subscribe();
    }

    function unsubscribeFromProfileChanges() {
        if (profileSubscription) {
            profileSubscription.unsubscribe();
            profileSubscription = null;
        }
    }

    async function init() {
        cacheElements();

        if (!elements.trigger) {
            return;
        }

        bindEvents();
        await loadProfile();
        await loadCredits();
        await subscribeToProfileChanges();
    }

    window.addEventListener('beforeunload', unsubscribeFromProfileChanges);

    window.TmpltrHeader = {
        open,
        close,
        toggle,
        openCredits,
        closeCredits,
        toggleCredits,
        refresh: loadProfile,
        refreshCredits: loadCredits,
        updateCredits,
        updatePlanBadge,
        updatePlanExpiry
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
