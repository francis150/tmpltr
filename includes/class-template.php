<?php
/**
 * Template CRUD Class
 *
 * @package Tmpltr
 */

class TmpltrTemplate {
    private $id = 0;
    private $data = [];
    private $table_name;

    /**
     * Constructor
     *
     * @param int $id Optional template ID to load
     */
    public function __construct($id = 0) {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'tmpltr_templates';

        if ($id) {
            $this->id = absint($id);
            $this->read();
        }
    }

    /**
     * Read template data from database
     *
     * @return bool True on success, false on failure
     */
    private function read() {
        global $wpdb;

        $data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $this->table_name WHERE id = %d AND deleted_at IS NULL",
            $this->id
        ), ARRAY_A);

        if (!$data) {
            return false;
        }

        $this->data = $data;
        return true;
    }

    /**
     * Create new template
     *
     * @return int|false Template ID on success, false on failure
     */
    private function create() {
        global $wpdb;

        $result = $wpdb->insert(
            $this->table_name,
            [
                'import_id' => $this->data['import_id'] ?? null,
                'name' => $this->data['name'] ?? 'Untitled Template',
                'description' => $this->data['description'] ?? null,
                'template_page_id' => $this->data['template_page_id'] ?? null,
                'status' => $this->data['status'] ?? 'draft',
                'created_by' => get_current_user_id(),
            ],
            ['%s', '%s', '%s', '%d', '%s', '%d']
        );

        if ($result === false) {
            if (TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to create template - ' . $wpdb->last_error);
            }
            return false;
        }

        $this->id = $wpdb->insert_id;

        if (!$this->id || $this->id <= 0) {
            if (TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to retrieve template ID after creation');
            }
            return false;
        }

        return $this->id;
    }

    /**
     * Update existing template
     *
     * @return bool True on success, false on failure
     */
    private function update() {
        global $wpdb;

        $result = $wpdb->update(
            $this->table_name,
            [
                'name' => $this->data['name'] ?? 'Untitled Template',
                'description' => $this->data['description'] ?? null,
                'template_page_id' => $this->data['template_page_id'] ?? null,
                'status' => $this->data['status'] ?? 'draft',
            ],
            ['id' => $this->id],
            ['%s', '%s', '%d', '%s'],
            ['%d']
        );

        if ($result === false) {
            if (TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to update template ' . $this->id . ' - ' . $wpdb->last_error);
            }
            return false;
        }

        return true;
    }

    /**
     * Save template (create or update)
     *
     * @return int|false Template ID on success, false on failure
     */
    public function save() {
        if ($this->id) {
            $result = $this->update();
            return $result ? $this->id : false;
        } else {
            return $this->create();
        }
    }

    /**
     * Delete template (soft delete)
     *
     * @return bool True on success, false on failure
     */
    public function delete() {
        global $wpdb;

        if (!$this->id) {
            return false;
        }

        $result = $wpdb->query($wpdb->prepare(
            "UPDATE $this->table_name SET deleted_at = %s, import_id = NULL WHERE id = %d",
            current_time('mysql'),
            $this->id
        ));

        if ($result === false) {
            if (TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to delete template ' . $this->id . ' - ' . $wpdb->last_error);
            }
            return false;
        }

        return true;
    }

    /**
     * Check if template exists
     *
     * @return bool
     */
    public function exists() {
        return !empty($this->id) && !empty($this->data);
    }

    /**
     * Duplicate template with all fields and prompts
     *
     * @return int|false New template ID on success, false on failure
     */
    public function duplicate() {
        if (!$this->exists()) {
            return false;
        }

        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            $new_template = new TmpltrTemplate();
            $new_template->set_name($this->get_name() . ' (Copy)');
            $new_template->set_description($this->get_description());
            $new_template->set_status('draft');

            if (!$new_template->save()) {
                throw new Exception('Failed to create duplicate template');
            }

            $new_id = $new_template->get_id();

            $fields = $this->get_fields();
            if (!empty($fields)) {
                $fields_to_save = array_map(function($field) {
                    return [
                        'identifier' => $field['unique_identifier'],
                        'name' => $field['label'],
                        'default_value' => $field['default_value'],
                        'required' => $field['is_required']
                    ];
                }, $fields);

                if (!$new_template->save_fields($fields_to_save)) {
                    throw new Exception('Failed to copy template fields');
                }
            }

            $prompts = $this->get_prompts();
            if (!empty($prompts)) {
                $prompts_to_save = array_map(function($prompt) {
                    return [
                        'title' => $prompt['title'],
                        'guide' => $prompt['guide'],
                        'placeholder' => $prompt['placeholder'],
                        'text' => $prompt['prompt_text']
                    ];
                }, $prompts);

                if (!$new_template->save_prompts($prompts_to_save)) {
                    throw new Exception('Failed to copy template prompts');
                }
            }

            $wpdb->query('COMMIT');
            return $new_id;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            if (TMPLTR_DEBUG_MODE) {
                error_log('Tmpltr: Failed to duplicate template - ' . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Get template ID
     *
     * @return int
     */
    public function get_id() {
        return $this->id;
    }

    /**
     * Get import ID
     *
     * @return string
     */
    public function get_import_id() {
        return $this->data['import_id'] ?? '';
    }

    /**
     * Set import ID
     *
     * @param string $import_id
     */
    public function set_import_id($import_id) {
        $this->data['import_id'] = sanitize_text_field($import_id);
    }

    /**
     * Find a template by its import ID
     *
     * @param string $import_id
     * @return TmpltrTemplate|null
     */
    public static function find_by_import_id($import_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'tmpltr_templates';

        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE import_id = %s AND deleted_at IS NULL LIMIT 1",
            sanitize_text_field($import_id)
        ));

        if (!$id) {
            return null;
        }

        return new self((int) $id);
    }

    /**
     * Get template name
     *
     * @return string
     */
    public function get_name() {
        return $this->data['name'] ?? '';
    }

    /**
     * Set template name
     *
     * @param string $name
     */
    public function set_name($name) {
        $this->data['name'] = sanitize_text_field($name);
    }

    /**
     * Get template description
     *
     * @return string
     */
    public function get_description() {
        return $this->data['description'] ?? '';
    }

    /**
     * Set template description
     *
     * @param string $description
     */
    public function set_description($description) {
        $this->data['description'] = wp_kses_post($description);
    }

    /**
     * Get template page ID
     *
     * @return int
     */
    public function get_template_page_id() {
        return absint($this->data['template_page_id'] ?? 0);
    }

    /**
     * Set template page ID
     *
     * @param int $page_id
     */
    public function set_template_page_id($page_id) {
        $this->data['template_page_id'] = absint($page_id);
    }

    /**
     * Get template status
     *
     * @return string
     */
    public function get_status() {
        return $this->data['status'] ?? 'draft';
    }

    /**
     * Set template status
     *
     * @param string $status
     */
    public function set_status($status) {
        $allowed_statuses = ['draft', 'published'];
        $this->data['status'] = in_array($status, $allowed_statuses) ? $status : 'draft';
    }

    /**
     * Get all fields for this template
     *
     * @return array
     */
    public function get_fields() {
        global $wpdb;

        if (!$this->id) {
            return [];
        }

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}tmpltr_template_fields WHERE template_id = %d ORDER BY field_order ASC",
                $this->id
            ),
            ARRAY_A
        );

        return $results ? $results : [];
    }

    /**
     * Get all prompts for this template
     *
     * @return array
     */
    public function get_prompts() {
        global $wpdb;

        if (!$this->id) {
            return [];
        }

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}tmpltr_template_prompts WHERE template_id = %d ORDER BY prompt_order ASC",
                $this->id
            ),
            ARRAY_A
        );

        return $results ? $results : [];
    }

    /**
     * Save fields for this template (smart upsert)
     *
     * @param array $fields_array Array of field data
     * @return bool True on success, false on failure
     */
    public function save_fields($fields_array) {
        global $wpdb;

        if (!$this->id) {
            return false;
        }

        $submitted_ids = [];

        foreach ($fields_array as $index => $field) {
            $field_data = [
                'template_id' => $this->id,
                'unique_identifier' => sanitize_text_field($field['identifier'] ?? ''),
                'label' => sanitize_text_field($field['name'] ?? ''),
                'default_value' => sanitize_text_field($field['default_value'] ?? ''),
                'is_required' => isset($field['required']) && $field['required'] ? 1 : 0,
                'field_order' => $index
            ];

            $field_id = isset($field['id']) ? absint($field['id']) : 0;

            if ($field_id > 0) {
                $result = $wpdb->update(
                    $wpdb->prefix . 'tmpltr_template_fields',
                    $field_data,
                    ['id' => $field_id],
                    ['%d', '%s', '%s', '%s', '%d', '%d'],
                    ['%d']
                );

                if ($result === false) {
                    if (TMPLTR_DEBUG_MODE) {
                        error_log('Tmpltr: Failed to update field ' . $field_id . ' - ' . $wpdb->last_error);
                    }
                    return false;
                }

                $submitted_ids[] = $field_id;
            } else {
                $result = $wpdb->insert(
                    $wpdb->prefix . 'tmpltr_template_fields',
                    $field_data,
                    ['%d', '%s', '%s', '%s', '%d', '%d']
                );

                if ($result === false) {
                    if (TMPLTR_DEBUG_MODE) {
                        error_log('Tmpltr: Failed to insert field - ' . $wpdb->last_error);
                    }
                    return false;
                }

                $submitted_ids[] = $wpdb->insert_id;
            }
        }

        if (!empty($submitted_ids)) {
            $ids_placeholder = implode(',', array_fill(0, count($submitted_ids), '%d'));
            $query = $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}tmpltr_template_fields WHERE template_id = %d AND id NOT IN ($ids_placeholder)",
                array_merge([$this->id], $submitted_ids)
            );
            $wpdb->query($query);
        } else {
            $wpdb->delete(
                $wpdb->prefix . 'tmpltr_template_fields',
                ['template_id' => $this->id],
                ['%d']
            );
        }

        return true;
    }

    /**
     * Save prompts for this template (smart upsert)
     *
     * @param array $prompts_array Array of prompt data
     * @return bool True on success, false on failure
     */
    public function save_prompts($prompts_array) {
        global $wpdb;

        if (!$this->id) {
            return false;
        }

        $submitted_ids = [];

        foreach ($prompts_array as $index => $prompt) {
            $prompt_data = [
                'template_id' => $this->id,
                'title' => sanitize_text_field($prompt['title'] ?? ''),
                'guide' => wp_kses_post($prompt['guide'] ?? ''),
                'placeholder' => sanitize_text_field($prompt['placeholder'] ?? ''),
                'prompt_text' => wp_kses_post($prompt['text'] ?? ''),
                'prompt_order' => $index
            ];

            $prompt_id = isset($prompt['id']) ? absint($prompt['id']) : 0;

            if ($prompt_id > 0) {
                $result = $wpdb->update(
                    $wpdb->prefix . 'tmpltr_template_prompts',
                    $prompt_data,
                    ['id' => $prompt_id],
                    ['%d', '%s', '%s', '%s', '%s', '%d'],
                    ['%d']
                );

                if ($result === false) {
                    if (TMPLTR_DEBUG_MODE) {
                        error_log('Tmpltr: Failed to update prompt ' . $prompt_id . ' - ' . $wpdb->last_error);
                    }
                    return false;
                }

                $submitted_ids[] = $prompt_id;
            } else {
                $result = $wpdb->insert(
                    $wpdb->prefix . 'tmpltr_template_prompts',
                    $prompt_data,
                    ['%d', '%s', '%s', '%s', '%s', '%d']
                );

                if ($result === false) {
                    if (TMPLTR_DEBUG_MODE) {
                        error_log('Tmpltr: Failed to insert prompt - ' . $wpdb->last_error);
                    }
                    return false;
                }

                $submitted_ids[] = $wpdb->insert_id;
            }
        }

        if (!empty($submitted_ids)) {
            $ids_placeholder = implode(',', array_fill(0, count($submitted_ids), '%d'));
            $query = $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}tmpltr_template_prompts WHERE template_id = %d AND id NOT IN ($ids_placeholder)",
                array_merge([$this->id], $submitted_ids)
            );
            $wpdb->query($query);
        } else {
            $wpdb->delete(
                $wpdb->prefix . 'tmpltr_template_prompts',
                ['template_id' => $this->id],
                ['%d']
            );
        }

        return true;
    }

    /**
     * Validate that a page ID exists in WordPress
     *
     * @param int $page_id Page ID to validate
     * @return bool True if page exists, false otherwise
     */
    public static function validate_template_page_id($page_id) {
        global $wpdb;

        if (empty($page_id) || $page_id <= 0) {
            return false;
        }

        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE ID = %d AND post_type = 'page' AND post_status != 'trash'",
                $page_id
            )
        );

        return !empty($exists);
    }

    /**
     * Get all templates
     *
     * @return array
     */
    public static function get_all() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'tmpltr_templates';

        $results = $wpdb->get_results(
            "SELECT * FROM $table_name WHERE deleted_at IS NULL ORDER BY created_at DESC",
            ARRAY_A
        );

        return $results ? $results : [];
    }
}
