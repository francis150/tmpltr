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
                'name' => $this->data['name'] ?? 'Untitled Template',
                'description' => $this->data['description'] ?? null,
                'template_page_id' => $this->data['template_page_id'] ?? null,
                'status' => $this->data['status'] ?? 'draft',
                'created_by' => get_current_user_id(),
            ],
            ['%s', '%s', '%d', '%s', '%d']
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

        $result = $wpdb->update(
            $this->table_name,
            ['deleted_at' => current_time('mysql')],
            ['id' => $this->id],
            ['%s'],
            ['%d']
        );

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
     * Get template ID
     *
     * @return int
     */
    public function get_id() {
        return $this->id;
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
