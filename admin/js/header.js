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
        DROPDOWN_PLAN: '#tmpltr-dropdown-plan'
    };

    const CLASSES = {
        TRIGGER_OPEN: 'tmpltr-header__profile--open',
        DROPDOWN_OPEN: 'tmpltr-header__dropdown--open',
        PLAN_FREE: 'tmpltr-header__dropdown-plan-badge--free',
        PLAN_PRO: 'tmpltr-header__dropdown-plan-badge--pro',
        PLAN_PREMIUM: 'tmpltr-header__dropdown-plan-badge--premium'
    };

    const elements = {};
    let isOpen = false;

    function cacheElements() {
        elements.trigger = document.querySelector(SELECTORS.TRIGGER);
        elements.dropdown = document.querySelector(SELECTORS.DROPDOWN);
        elements.triggerAvatar = document.querySelector(SELECTORS.TRIGGER_AVATAR);
        elements.triggerName = document.querySelector(SELECTORS.TRIGGER_NAME);
        elements.dropdownAvatar = document.querySelector(SELECTORS.DROPDOWN_AVATAR);
        elements.dropdownName = document.querySelector(SELECTORS.DROPDOWN_NAME);
        elements.dropdownEmail = document.querySelector(SELECTORS.DROPDOWN_EMAIL);
        elements.dropdownPlan = document.querySelector(SELECTORS.DROPDOWN_PLAN);
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

        if (elements.dropdownPlan) {
            elements.dropdownPlan.textContent = planType;
            elements.dropdownPlan.classList.remove(CLASSES.PLAN_FREE, CLASSES.PLAN_PRO, CLASSES.PLAN_PREMIUM);

            if (planType === 'pro') {
                elements.dropdownPlan.classList.add(CLASSES.PLAN_PRO);
            } else if (planType === 'premium') {
                elements.dropdownPlan.classList.add(CLASSES.PLAN_PREMIUM);
            } else {
                elements.dropdownPlan.classList.add(CLASSES.PLAN_FREE);
            }
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

    function handleClickOutside(e) {
        if (!elements.trigger || !elements.dropdown) return;
        if (!elements.trigger.contains(e.target) && !elements.dropdown.contains(e.target)) {
            close();
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && isOpen) {
            close();
        }
    }

    function bindEvents() {
        if (elements.trigger) {
            elements.trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                toggle();
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

    async function init() {
        cacheElements();

        if (!elements.trigger) {
            return;
        }

        bindEvents();
        await loadProfile();
    }

    window.TmpltrHeader = {
        open,
        close,
        toggle,
        refresh: loadProfile
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
