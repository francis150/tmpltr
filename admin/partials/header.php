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
                <span class="tmpltr-header__dropdown-plan-badge" id="tmpltr-dropdown-plan"></span>
            </div>

            <div class="tmpltr-header__dropdown-divider"></div>

            <div class="tmpltr-header__dropdown-actions">
                <a href="#" class="tmpltr-header__dropdown-action">Support</a>
                <button class="tmpltr-header__dropdown-action tmpltr-header__dropdown-action--logout tmpltr-logout-btn">Logout</button>
            </div>
        </div>
    </div>
</header>
