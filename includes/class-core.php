<?php
/**
 * @package Tmpltr
 */

class TmpltrCore {
    public function __construct() {
        add_action('admin_init', [$this, 'check_db_version']);
    }

    public function check_db_version() {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-database.php';
        $database = new TmpltrDatabase();
        $database->check_version();
    }
}