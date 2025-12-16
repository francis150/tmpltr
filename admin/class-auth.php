<?php
/**
 * Tmpltr Authentication Handler
 *
 * @package Tmpltr
 */

class TmpltrAuth {
    const SUPABASE_URL = 'https://eumeymzydwdpmfntndnv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bWV5bXp5ZHdkcG1mbnRuZG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjYwODEsImV4cCI6MjA4MDU0MjA4MX0.35JGrdK9m54lGtnAnmYLThm58qGmGyJVhWRKyUOEwwI';

    private $plugin_data;

    private $auth_pages = [
        'tmpltr-login' => [
            'css' => 'login-page.css',
            'js' => 'login-page.js',
            'handle' => 'tmpltr-login-page',
        ],
        'tmpltr-register' => [
            'css' => 'register-page.css',
            'js' => 'register-page.js',
            'handle' => 'tmpltr-register-page',
        ],
    ];

    private $protected_pages = ['tmpltr', 'tmpltr-template', 'tmpltr-pages'];

    public function __construct() {
        $this->plugin_data = get_plugin_data(TMPLTR_PLUGIN_DIR . 'tmpltr.php');

        add_action('admin_menu', [$this, 'add_auth_pages']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_auth_assets']);
    }

    public function add_auth_pages() {
        add_submenu_page(
            null,
            'Login - Tmpltr',
            'Login',
            'manage_options',
            'tmpltr-login',
            [$this, 'render_login_page']
        );

        add_submenu_page(
            null,
            'Register - Tmpltr',
            'Register',
            'manage_options',
            'tmpltr-register',
            [$this, 'render_register_page']
        );
    }

    public function render_login_page() {
        require_once TMPLTR_PLUGIN_DIR . 'admin/pages/login.php';
    }

    public function render_register_page() {
        require_once TMPLTR_PLUGIN_DIR . 'admin/pages/register.php';
    }

    public function enqueue_auth_assets($hook) {
        $page_slug = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';

        $all_tmpltr_pages = array_merge($this->protected_pages, array_keys($this->auth_pages));

        if (!in_array($page_slug, $all_tmpltr_pages)) {
            return;
        }

        wp_enqueue_script(
            'supabase-js',
            'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
            [],
            '2.0.0',
            true
        );

        if (isset($this->auth_pages[$page_slug])) {
            wp_enqueue_style(
                'tmpltr-admin-global',
                plugin_dir_url(__FILE__) . 'css/admin-styles.css',
                [],
                $this->plugin_data['Version']
            );

            wp_enqueue_style(
                'tmpltr-toast',
                plugin_dir_url(__FILE__) . 'css/toast.css',
                [],
                $this->plugin_data['Version']
            );

            wp_enqueue_script(
                'tmpltr-toast',
                plugin_dir_url(__FILE__) . 'js/toast.js',
                [],
                $this->plugin_data['Version'],
                true
            );
        }

        wp_enqueue_style(
            'tmpltr-auth',
            plugin_dir_url(__FILE__) . 'css/auth.css',
            ['tmpltr-admin-global'],
            $this->plugin_data['Version']
        );

        wp_enqueue_script(
            'tmpltr-auth',
            plugin_dir_url(__FILE__) . 'js/auth.js',
            ['supabase-js'],
            $this->plugin_data['Version'],
            true
        );

        wp_localize_script('tmpltr-auth', 'tmpltrAuth', [
            'supabaseUrl' => self::SUPABASE_URL,
            'supabaseKey' => self::SUPABASE_ANON_KEY,
            'loginUrl' => admin_url('admin.php?page=tmpltr-login'),
            'registerUrl' => admin_url('admin.php?page=tmpltr-register'),
            'dashboardUrl' => admin_url('admin.php?page=tmpltr'),
            'isAuthPage' => isset($this->auth_pages[$page_slug]),
            'isProtectedPage' => in_array($page_slug, $this->protected_pages),
        ]);

        if (isset($this->auth_pages[$page_slug])) {
            $page_config = $this->auth_pages[$page_slug];

            wp_enqueue_style(
                $page_config['handle'],
                plugin_dir_url(__FILE__) . '../assets/admin/css/' . $page_config['css'],
                ['tmpltr-auth'],
                $this->plugin_data['Version']
            );

            wp_enqueue_script(
                $page_config['handle'],
                plugin_dir_url(__FILE__) . '../assets/admin/js/' . $page_config['js'],
                ['tmpltr-auth'],
                $this->plugin_data['Version'],
                true
            );
        }
    }
}
