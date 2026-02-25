<?php

/**
 * 
 * @package Tmpltr
 * 
 * Plugin Name: Tmpltr
 * Description: Create reusable page templates with AI-powered content generation. Design once, generate unlimited unique pages by filling in custom fields that dynamically populate AI prompts.
 * Version: 1.0.6
 * Requires at least: 5.2
 * Tested up to: 6.7
 * Requires PHP: 7.2
 * Author: Michael Angelo
 * Author URI: 
 * Text Domain: tmpltr
 */

defined( 'ABSPATH' ) or die( 'Why are you geh??' );

define('TMPLTR_PLUGIN_DIR', plugin_dir_path( __FILE__ ));
define('TMPLTR_DEBUG_MODE', true);

// Load constants
require_once TMPLTR_PLUGIN_DIR . 'includes/class-constants.php';

// Load activator
require_once TMPLTR_PLUGIN_DIR . 'includes/class-activator.php';
register_activation_hook(__FILE__, ['TmpltrActivator', 'activate']);
register_deactivation_hook(__FILE__, ['TmpltrActivator', 'deactivate']);

// Initialize the plugin
require_once TMPLTR_PLUGIN_DIR . 'includes/class-core.php';
new TmpltrCore();