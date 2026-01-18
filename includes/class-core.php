<?php
/**
 * @package Tmpltr
 */

class TmpltrCore {
    public function __construct() {
        add_action('init', [$this, 'init_updater']);
        $this->init_shortcodes();
        $this->init_admin();

        add_action('admin_init', [$this, 'check_db_version']);
    }

    public function init_updater() {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-updater.php';
        new TmpltrUpdater(TMPLTR_PLUGIN_DIR . 'tmpltr.php');
    }

    private function init_shortcodes() {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-shortcode.php';
        new TmpltrShortcode();
    }

    private function init_admin() {
        if ( !is_admin() ) {
            return;
        }

        require_once TMPLTR_PLUGIN_DIR . 'admin/class-admin.php';
        new TmpltrAdmin();

        require_once TMPLTR_PLUGIN_DIR . 'admin/class-ajax.php';
        new TmpltrAjax();

        require_once TMPLTR_PLUGIN_DIR . 'admin/class-auth.php';
        new TmpltrAuth();
    }

    public function check_db_version() {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-database.php';
        $database = new TmpltrDatabase();
        $database->check_version();
    }
}