<?php
/**
 * @package Tmpltr
 */

class TmpltrAdmin {
    private $plugin_data;
    private $pages = [
        'tmpltr' => [
            'css' => 'templates-page.css',
            'handle' => 'tmpltr-templates-page',
        ],
    ];

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
        $page_slug = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';

        // Only load on Tmpltr pages
        if (!isset($this->pages[$page_slug])) {
            return;
        }

        wp_enqueue_style(
            'tmpltr-admin-global',
            plugin_dir_url( __FILE__ ) . 'css/admin-styles.css',
            [],
            $this->plugin_data['Version']
        );

        // Page-specific CSS
        wp_enqueue_style(
            $this->pages[$page_slug]['handle'],
            plugin_dir_url( __FILE__ ) . '../assets/admin/css/' . $this->pages[$page_slug]['css'],
            ['tmpltr-admin-global'],
            $this->plugin_data['Version']
        );
    }
}
