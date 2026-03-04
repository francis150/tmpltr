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

            if (!empty($template_data['version'])) {
                $template->set_import_version($template_data['version']);
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

    /**
     * Map an import ID to its source JSON file path
     *
     * @param string $import_id
     * @return string|null File path or null if unknown
     */
    private static function get_source_file($import_id) {
        $map = [
            'ST-001' => TMPLTR_PLUGIN_DIR . 'includes/starter-templates/location-page-starter.json',
        ];

        return $map[$import_id] ?? null;
    }

    /**
     * Check if an update is available for an imported template
     *
     * @param string $import_id
     * @return array|null Update info array or null if up-to-date
     */
    public static function get_available_update($import_id) {
        $file_path = self::get_source_file($import_id);
        if (!$file_path || !file_exists($file_path)) {
            return null;
        }

        $json = file_get_contents($file_path);
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE || empty($data['template']['version'])) {
            return null;
        }

        require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';
        $template = TmpltrTemplate::find_by_import_id($import_id);

        if (!$template) {
            return null;
        }

        $installed_version = $template->get_import_version();
        $available_version = $data['template']['version'];

        if (version_compare($available_version, $installed_version, '>')) {
            return [
                'new_version' => $available_version,
                'template_id' => $template->get_id(),
                'file_path'   => $file_path,
            ];
        }

        return null;
    }

    /**
     * Update an imported template's prompts and fields from its source JSON
     *
     * @param int  $template_id
     * @param bool $update_layout_page Whether to also update the linked WordPress page content
     * @return true|WP_Error True on success, WP_Error on failure
     */
    public static function update_imported_template($template_id, $update_layout_page = false) {
        require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

        $template = new TmpltrTemplate(absint($template_id));

        if (!$template->exists()) {
            return new WP_Error('not_found', 'Template not found');
        }

        $import_id = $template->get_import_id();
        if (empty($import_id)) {
            return new WP_Error('not_imported', 'This template was not imported and cannot be updated');
        }

        $file_path = self::get_source_file($import_id);
        if (!$file_path || !file_exists($file_path)) {
            return new WP_Error('source_not_found', 'Source template file not found');
        }

        $json = file_get_contents($file_path);
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return new WP_Error('invalid_json', 'Source template file contains invalid JSON');
        }

        if (!isset($data['template']['fields']) || !isset($data['template']['prompts'])) {
            return new WP_Error('invalid_structure', 'Source template file is missing required fields');
        }

        $template_data = $data['template'];

        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            $fields = array_map(function($field) {
                return [
                    'identifier'    => $field['identifier'] ?? '',
                    'name'          => $field['name'] ?? '',
                    'default_value' => $field['default_value'] ?? '',
                    'required'      => !empty($field['required']),
                ];
            }, $template_data['fields']);

            if (!$template->save_fields($fields)) {
                throw new Exception('Failed to update template fields');
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
                throw new Exception('Failed to update template prompts');
            }

            if (!empty($template_data['version'])) {
                $template->set_import_version($template_data['version']);
                $template->save();
            }

            if ($update_layout_page) {
                $page_data = $data['page'] ?? null;

                if (!empty($page_data['content'])) {
                    $page_id = $template->get_template_page_id();

                    if ($page_id > 0 && get_post($page_id)) {
                        $update_result = wp_update_post([
                            'ID'           => $page_id,
                            'post_content' => wp_kses_post($page_data['content']),
                        ], true);

                        if (is_wp_error($update_result)) {
                            throw new Exception('Failed to update layout page: ' . $update_result->get_error_message());
                        }
                    }
                }
            }

            $wpdb->query('COMMIT');

            return true;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');

            if (defined('TMPLTR_DEBUG_MODE') && TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to update imported template - ' . $e->getMessage());
            }

            return new WP_Error('update_failed', $e->getMessage());
        }
    }
}
