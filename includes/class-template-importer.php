<?php
/**
 * Template Importer Class
 *
 * @package Tmpltr
 */

class TmpltrTemplateImporter {

    /**
     * Import a template from a JSON file
     *
     * @param string $file_path Absolute path to a Tmpltr JSON file
     * @return int|WP_Error New template ID on success, WP_Error on failure
     */
    public static function import_from_file($file_path) {
        if (!file_exists($file_path)) {
            return new WP_Error('file_not_found', 'Template file not found');
        }

        $json = file_get_contents($file_path);
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return new WP_Error('invalid_json', 'Template file contains invalid JSON');
        }

        if (empty($data['template']['name']) || !isset($data['template']['fields']) || !isset($data['template']['prompts'])) {
            return new WP_Error('invalid_structure', 'Template file is missing required fields');
        }

        $template_data = $data['template'];
        $page_data     = $data['page'] ?? null;
        $import_id     = isset($template_data['id']) ? sanitize_text_field($template_data['id']) : '';

        if ($import_id !== '') {
            require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';
            $existing = TmpltrTemplate::find_by_import_id($import_id);

            if ($existing !== null) {
                return new WP_Error(
                    'already_imported',
                    'This template has already been imported. You can find it in your template list.'
                );
            }
        }

        global $wpdb;

        if ($import_id !== '') {
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}tmpltr_templates SET import_id = NULL WHERE import_id = %s AND deleted_at IS NOT NULL",
                $import_id
            ));
        }
        $wpdb->query('START TRANSACTION');

        try {
            $page_id = 0;

            if (!empty($page_data['title'])) {
                $page_id = wp_insert_post([
                    'post_title'   => sanitize_text_field($page_data['title']),
                    'post_content' => wp_kses_post($page_data['content'] ?? ''),
                    'post_status'  => sanitize_text_field($page_data['status'] ?? 'draft'),
                    'post_type'    => 'page',
                ], true);

                if (is_wp_error($page_id)) {
                    throw new Exception($page_id->get_error_message());
                }
            }

            require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

            $template = new TmpltrTemplate();
            $template->set_name($template_data['name']);
            $template->set_status(sanitize_text_field($template_data['status'] ?? 'draft'));

            if ($import_id !== '') {
                $template->set_import_id($import_id);
            }

            if ($page_id > 0) {
                $template->set_template_page_id($page_id);
            }

            $template_id = $template->save();

            if (!$template_id) {
                throw new Exception('Failed to create template record');
            }

            $fields = array_map(function($field) {
                return [
                    'identifier'    => $field['identifier'] ?? '',
                    'name'          => $field['name'] ?? '',
                    'default_value' => $field['default_value'] ?? '',
                    'required'      => !empty($field['required']),
                ];
            }, $template_data['fields']);

            if (!$template->save_fields($fields)) {
                throw new Exception('Failed to save template fields');
            }

            $prompts = array_map(function($prompt) {
                return [
                    'title'       => $prompt['title'] ?? '',
                    'placeholder' => $prompt['placeholder'] ?? '',
                    'guide'       => $prompt['guide'] ?? '',
                    'text'        => $prompt['text'] ?? '',
                ];
            }, $template_data['prompts']);

            if (!$template->save_prompts($prompts)) {
                throw new Exception('Failed to save template prompts');
            }

            $wpdb->query('COMMIT');

            return $template_id;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');

            if (defined('TMPLTR_DEBUG_MODE') && TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to import template - ' . $e->getMessage());
            }

            return new WP_Error('import_failed', $e->getMessage());
        }
    }
}
