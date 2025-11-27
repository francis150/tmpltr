<?php
/**
 * @package Tmpltr
 */

class TmpltrAdmin {
    private $plugin_data;

    public function __construct() {
        $this->plugin_data = get_plugin_data( plugin_dir_path( __FILE__ ) . '../tmpltr.php' );

        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_styles']);

    }

    public function add_admin_menu() {
        add_menu_page(
            'Tmpltr',
            'Tmpltr',
            'manage_options',
            'tmpltr',
            [$this, 'render_templates_page'],
            'dashicons-admin-page',
            20
        );
    }

    public function render_templates_page() {
        require_once plugin_dir_path( __FILE__ ) . 'pages/templates.php';
    }

    public function enqueue_admin_styles($hook) {
        if ('toplevel_page_tmpltr' !== $hook) {
            return;
        }
        wp_enqueue_style(
            'tmpltr-admin-styles',
            plugin_dir_url( __FILE__ ) . 'css/admin-styles.css',
            array(),
            $this->plugin_data['Version']
        );
    }
}
