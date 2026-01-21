<?php
/**
 * @package Tmpltr
 */

class TmpltrDatabase {
    private $plugin_data;

    public function __construct() {
        $this->plugin_data = get_plugin_data( plugin_dir_path( __FILE__ ) . '../tmpltr.php' );
    }

    public function create_tables() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        // Table 1: Templates
        $sql_templates = "CREATE TABLE {$wpdb->prefix}tmpltr_templates (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          name varchar(255) NOT NULL,
          description longtext,
          template_page_id bigint(20),
          status varchar(20) DEFAULT 'draft',
          deleted_at datetime DEFAULT NULL,
          created_by bigint(20),
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          KEY status (status),
          KEY created_by (created_by),
          KEY deleted_at (deleted_at)
        ) $charset_collate;";

        // Table 2: Template Fields
        $sql_fields = "CREATE TABLE {$wpdb->prefix}tmpltr_template_fields (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          template_id bigint(20) NOT NULL,
          unique_identifier varchar(100) NOT NULL,
          label varchar(255) NOT NULL,
          default_value text,
          is_required tinyint(1) DEFAULT 0,
          field_order int(11) DEFAULT 0,
          validation_rules longtext,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          KEY template_id (template_id),
          KEY field_order (field_order)
        ) $charset_collate;";

        // Table 3: Template Prompts
        $sql_prompts = "CREATE TABLE {$wpdb->prefix}tmpltr_template_prompts (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          template_id bigint(20) NOT NULL,
          title varchar(255) NOT NULL,
          guide longtext,
          placeholder varchar(100) NOT NULL,
          prompt_text longtext NOT NULL,
          prompt_order int(11) DEFAULT 0,
          max_tokens int(11) DEFAULT 1000,
          temperature decimal(3,2) DEFAULT 0.70,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          KEY template_id (template_id),
          KEY placeholder (placeholder),
          KEY prompt_order (prompt_order)
        ) $charset_collate;";

        // Table 4: Generated Pages
        $sql_pages = "CREATE TABLE {$wpdb->prefix}tmpltr_generated_pages (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          template_id bigint(20) NOT NULL,
          page_id bigint(20) NOT NULL,
          field_values longtext,
          generated_by bigint(20),
          generation_status varchar(20) DEFAULT 'pending',
          error_log longtext,
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          KEY template_id (template_id),
          KEY page_id (page_id),
          KEY generation_status (generation_status),
          KEY generated_by (generated_by)
        ) $charset_collate;";

        // Table 5: Prompt Results
        $sql_results = "CREATE TABLE {$wpdb->prefix}tmpltr_prompt_results (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          generated_page_id bigint(20) NOT NULL,
          prompt_id bigint(20) NOT NULL,
          prompt_text_used longtext,
          ai_response longtext,
          tokens_used int(11),
          processing_time int(11),
          created_at datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY  (id),
          KEY generated_page_id (generated_page_id),
          KEY prompt_id (prompt_id)
        ) $charset_collate;";

        dbDelta($sql_templates);
        dbDelta($sql_fields);
        dbDelta($sql_prompts);
        dbDelta($sql_pages);
        dbDelta($sql_results);
    }

    public function check_version() {
        $installed_version = get_option('tmpltr_db_version');
        $current_version = $this->plugin_data['Version'];

        if (version_compare($installed_version, $current_version, '<')) {
            $this->create_tables();
            update_option('tmpltr_db_version', $current_version);
        }
    }
}
