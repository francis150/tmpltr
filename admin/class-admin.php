<?php
/**
 * @package Tmpltr
 */

class TmpltrAdmin {
    private $plugin_data;
    private $pages = [
        'tmpltr' => [
            'css' => 'templates-page.css',
            'js' => 'templates-page.js',
            'handle' => 'tmpltr-templates-page',
        ],
        'tmpltr-template' => [
            'css' => 'template-page.css',
            'js' => 'template-page.js',
            'handle' => 'tmpltr-template-page',
        ],
    ];

    public function __construct() {
        $this->plugin_data = get_plugin_data( plugin_dir_path( __FILE__ ) . '../tmpltr.php' );

        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

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

        add_submenu_page(
            'tmpltr',
            'Templates',
            'Templates',
            'manage_options',
            'tmpltr',
            [$this, 'render_templates_page']
        );

        add_submenu_page(
            'tmpltr',
            'Template',
            'Create Template',
            'manage_options',
            'tmpltr-template',
            [$this, 'render_template_page']
        );
    }

    public function render_templates_page() {
        require_once plugin_dir_path( __FILE__ ) . 'pages/templates.php';
    }

    public function render_template_page() {
        require_once plugin_dir_path( __FILE__ ) . 'pages/template.php';
    }

    public function enqueue_admin_assets($hook) {
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

        wp_enqueue_script(
            'tmpltr-admin-global',
            plugin_dir_url( __FILE__ ) . 'js/admin-global.js',
            [],
            $this->plugin_data['Version'],
            true
        );

        // PHP to JS data transfer
        wp_localize_script(
            'tmpltr-admin-global',
            'tmpltrData',
            [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('tmpltr_nonce'),
                'pluginUrl' => plugin_dir_url(__FILE__) . '../'
            ]
        );

        // Toast system (global utility)
        wp_enqueue_style(
            'tmpltr-toast',
            plugin_dir_url( __FILE__ ) . 'css/toast.css',
            [],
            $this->plugin_data['Version']
        );

        wp_enqueue_script(
            'tmpltr-toast',
            plugin_dir_url( __FILE__ ) . 'js/toast.js',
            ['tmpltr-admin-global'],
            $this->plugin_data['Version'],
            true
        );

        // Popup system (global utility)
        wp_enqueue_style(
            'tmpltr-popup',
            plugin_dir_url( __FILE__ ) . 'css/popup.css',
            [],
            $this->plugin_data['Version']
        );

        wp_enqueue_script(
            'tmpltr-popup',
            plugin_dir_url( __FILE__ ) . 'js/popup.js',
            ['tmpltr-admin-global', 'tmpltr-toast'],
            $this->plugin_data['Version'],
            true
        );

        wp_enqueue_style(
            $this->pages[$page_slug]['handle'],
            plugin_dir_url( __FILE__ ) . '../assets/admin/css/' . $this->pages[$page_slug]['css'],
            ['tmpltr-admin-global'],
            $this->plugin_data['Version']
        );

        wp_enqueue_script(
            $this->pages[$page_slug]['handle'],
            plugin_dir_url( __FILE__ ) . '../assets/admin/js/' . $this->pages[$page_slug]['js'],
            ['tmpltr-admin-global', 'tmpltr-toast', 'tmpltr-popup'],
            $this->plugin_data['Version'],
            true
        );
    }
}
