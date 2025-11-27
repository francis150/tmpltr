<?php

/**
 * 
 * @package Tmpltr
 * 
 * Plugin Name: Tmpltr
 * Description: Create reusable page templates with AI-powered content generation. Design once, generate unlimited unique pages by filling in custom fields that dynamically populate AI prompts.
 * Version: 1.0.0
 * Requires at least: 5.2
 * Tested up to: 6.7
 * Requires PHP: 7.2
 * Author: Michael Angelo
 * Author URI: 
 * Text Domain: tmpltr
 */

defined( 'ABSPATH' ) or die( 'Why are you geh?' );

define('TMPLTR_DEBUG_MODE', true);

// Initialize the plugin
require_once plugin_dir_path( __FILE__ ) . 'includes/class-core.php';
new TmpltrCore();

// Initialize admin functionality
if ( is_admin() ) {
    require_once plugin_dir_path( __FILE__ ) . 'admin/class-admin.php';
    new TmpltrAdmin();
}