<?php
/**
 * Global Admin Header
 *
 * @package Tmpltr
 */

?>
<header class="tmpltr-header">
    <div class="tmpltr-header__left">
        <img src="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . '../assets/admin/images/primary_logo_dark.svg'); ?>" alt="Tmpltr" class="tmpltr-header__logo">
        <nav class="tmpltr-header__nav">
            <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr')); ?>" class="tmpltr-header__nav-link">Templates</a>
            <a href="#" class="tmpltr-header__nav-link">Community</a>
        </nav>
    </div>
    <div class="tmpltr-header__right">
        <div class="tmpltr-header__credits">
            <div class="tmpltr-header__credits-display" id="tmpltr-credits-trigger">
                <span class="tmpltr-header__credits-count" id="tmpltr-credits-count">0</span>
                <span class="tmpltr-header__credits-label">credits</span>
            </div>
            <div class="tmpltr-header__credits-dropdown" id="tmpltr-credits-dropdown">
                <div class="tmpltr-header__credits-dropdown-row">
                    <span class="tmpltr-header__credits-dropdown-label">Subscription</span>
                    <span class="tmpltr-header__credits-dropdown-value" id="tmpltr-subscription-credits">0</span>
                </div>
                <div class="tmpltr-header__credits-dropdown-row">
                    <span class="tmpltr-header__credits-dropdown-label">Purchased</span>
                    <span class="tmpltr-header__credits-dropdown-value" id="tmpltr-purchased-credits">0</span>
                </div>
            </div>
            <a href="<?php echo esc_url(TmpltrConstants::WEBSITE_URL); ?>" class="tmpltr-header__credits-add" target="_blank" rel="noopener noreferrer">
                <svg class="tmpltr-header__credits-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Credits
            </a>
        </div>
        <div class="tmpltr-header__profile" id="tmpltr-profile-trigger">
            <div class="tmpltr-header__profile-avatar" id="tmpltr-profile-avatar"></div>
            <span class="tmpltr-header__profile-name" id="tmpltr-profile-name"></span>
            <svg class="tmpltr-header__profile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>

        <div class="tmpltr-header__dropdown" id="tmpltr-profile-dropdown">
            <div class="tmpltr-header__dropdown-header">
                <div class="tmpltr-header__dropdown-avatar" id="tmpltr-dropdown-avatar"></div>
                <div class="tmpltr-header__dropdown-user">
                    <span class="tmpltr-header__dropdown-name" id="tmpltr-dropdown-name"></span>
                    <span class="tmpltr-header__dropdown-email" id="tmpltr-dropdown-email"></span>
                </div>
            </div>

            <div class="tmpltr-header__dropdown-plan">
                <span class="tmpltr-header__dropdown-plan-label">Plan</span>
                <div class="tmpltr-header__dropdown-plan-info">
                    <span class="tmpltr-header__dropdown-plan-badge" id="tmpltr-dropdown-plan"></span>
                    <span class="tmpltr-header__dropdown-plan-expiry" id="tmpltr-dropdown-plan-expiry"></span>
                </div>
            </div>

            <div class="tmpltr-header__dropdown-divider"></div>

            <div class="tmpltr-header__dropdown-actions">
                <a href="#" class="tmpltr-header__dropdown-action">Support</a>
                <a href="#" class="tmpltr-header__dropdown-action">Credits Usage</a>
                <button class="tmpltr-header__dropdown-action tmpltr-header__dropdown-action--logout tmpltr-logout-btn">Logout</button>
            </div>
        </div>
    </div>
</header>
