<?php
/**
 * @package Tmpltr
 */

class TmpltrActivator {
    private static $plugin_data;

    private static function get_plugin_data() {
        if (self::$plugin_data === null) {
            self::$plugin_data = get_plugin_data( TMPLTR_PLUGIN_DIR . 'tmpltr.php' );
        }
        return self::$plugin_data;
    }

    public static function activate() {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-database.php';
        $database = new TmpltrDatabase();
        $database->create_tables();

        $plugin_data = self::get_plugin_data();
        add_option('tmpltr_db_version', $plugin_data['Version']);
    }

    public static function deactivate() {
        // Optional: cleanup (but don't delete data on deactivate)
    }
}
