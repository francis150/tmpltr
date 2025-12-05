<?php
/**
 * @package Tmpltr
 */

class TmpltrAjax {

	public function __construct() {
		// Page handlers
		add_action('wp_ajax_tmpltr_get_pages', [$this, 'get_pages']);

		// Template handlers
		add_action('wp_ajax_tmpltr_get_template_data', [$this, 'get_template_data']);
		add_action('wp_ajax_tmpltr_save_template', [$this, 'save_template']);
		add_action('wp_ajax_tmpltr_delete_template', [$this, 'delete_template']);
	}

	// ===== PAGE HANDLERS =====

	/**
	 * AJAX handler: Get all WordPress pages
	 * Returns pages with publish, draft, and private status
	 *
	 * @return void Outputs JSON response
	 */
	public function get_pages() {
		// Verify nonce for security
		if (!check_ajax_referer('tmpltr_nonce', 'nonce', false)) {
			wp_send_json_error([
				'message' => 'Security check failed'
			]);
			return;
		}

		// Check if user has permission to manage options
		if (!current_user_can('manage_options')) {
			wp_send_json_error([
				'message' => 'Insufficient permissions'
			]);
			return;
		}

		// Query all pages (publish, draft, private)
		$pages = get_posts([
			'post_type' => 'page',
			'post_status' => ['publish', 'draft', 'private'],
			'numberposts' => -1,
			'orderby' => 'title',
			'order' => 'ASC'
		]);

		// Check for errors
		if (is_wp_error($pages)) {
			if (TMPLTR_DEBUG_MODE) {
				error_log('Tmpltr: Failed to load pages - ' . $pages->get_error_message());
			}

			wp_send_json_error([
				'message' => 'Failed to load pages from database'
			]);
			return;
		}

		// Build response array with id, title, and status
		$pages_data = [];
		foreach ($pages as $page) {
			$pages_data[] = [
				'id' => $page->ID,
				'title' => $page->post_title,
				'status' => $page->post_status
			];
		}

		// Send success response
		wp_send_json_success([
			'pages' => $pages_data,
			'count' => count($pages_data)
		]);
	}

	// ===== TEMPLATE HANDLERS =====

	/**
	 * AJAX handler: Get template data (fields and prompts)
	 * Returns fields and prompts for a specific template
	 *
	 * @return void Outputs JSON response
	 */
	public function get_template_data() {
		if (!check_ajax_referer('tmpltr_nonce', 'nonce', false)) {
			wp_send_json_error([
				'message' => 'Security check failed'
			]);
			return;
		}

		if (!current_user_can('manage_options')) {
			wp_send_json_error([
				'message' => 'Insufficient permissions'
			]);
			return;
		}

		$template_id = isset($_POST['template_id']) ? absint($_POST['template_id']) : 0;

		if (empty($template_id)) {
			wp_send_json_error([
				'message' => 'Template ID is required'
			]);
			return;
		}

		require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';
		$template = new TmpltrTemplate($template_id);

		if (!$template->exists()) {
			wp_send_json_error([
				'message' => 'Template not found'
			]);
			return;
		}

		wp_send_json_success([
			'fields' => $template->get_fields(),
			'prompts' => $template->get_prompts()
		]);
	}

	/**
	 * AJAX handler: Save template with all data
	 * Saves template metadata, fields, and prompts in a transaction
	 *
	 * @return void Outputs JSON response
	 */
	public function save_template() {
		if (!check_ajax_referer('tmpltr_nonce', 'nonce', false)) {
			wp_send_json_error([
				'message' => 'Security check failed'
			]);
			return;
		}

		if (!current_user_can('manage_options')) {
			wp_send_json_error([
				'message' => 'Insufficient permissions'
			]);
			return;
		}

		$template_id = isset($_POST['template_id']) ? absint($_POST['template_id']) : 0;
		$template_name = isset($_POST['template_name']) ? sanitize_text_field($_POST['template_name']) : '';
		$template_status = isset($_POST['template_status']) ? sanitize_text_field($_POST['template_status']) : 'draft';
		$template_page_id = isset($_POST['template_page_id']) ? absint($_POST['template_page_id']) : 0;
		$fields_data = isset($_POST['fields']) ? json_decode(stripslashes($_POST['fields']), true) : [];
		$prompts_data = isset($_POST['prompts']) ? json_decode(stripslashes($_POST['prompts']), true) : [];

		if (empty($template_name)) {
			wp_send_json_error([
				'message' => 'Template name is required'
			]);
			return;
		}

		if (!in_array($template_status, ['draft', 'published'])) {
			wp_send_json_error([
				'message' => 'Invalid template status'
			]);
			return;
		}

		require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

		if ($template_page_id > 0 && !TmpltrTemplate::validate_template_page_id($template_page_id)) {
			wp_send_json_error([
				'message' => 'Selected page does not exist'
			]);
			return;
		}

		if (empty($template_id)) {
			wp_send_json_error([
				'message' => 'Template ID is required'
			]);
			return;
		}

		$template = new TmpltrTemplate($template_id);

		if (!$template->exists()) {
			wp_send_json_error([
				'message' => 'Template not found'
			]);
			return;
		}

		global $wpdb;
		$wpdb->query('START TRANSACTION');

		try {
			$template->set_name($template_name);
			$template->set_status($template_status);
			$template->set_template_page_id($template_page_id);

			if (!$template->save()) {
				throw new Exception('Failed to save template metadata');
			}

			if (!$template->save_fields($fields_data)) {
				throw new Exception('Failed to save template fields');
			}

			if (!$template->save_prompts($prompts_data)) {
				throw new Exception('Failed to save template prompts');
			}

			$wpdb->query('COMMIT');

			wp_send_json_success([
				'message' => 'Template saved successfully',
				'template_id' => $template_id
			]);

		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');

			if (TMPLTR_DEBUG_MODE) {
				error_log('Tmpltr: Failed to save template - ' . $e->getMessage());
			}

			wp_send_json_error([
				'message' => 'Failed to save template. Please try again.'
			]);
		}
	}

	/**
	 * AJAX handler: Delete template
	 * Soft deletes a template by setting deleted_at timestamp
	 *
	 * @return void Outputs JSON response
	 */
	public function delete_template() {
		if (!check_ajax_referer('tmpltr_nonce', 'nonce', false)) {
			wp_send_json_error([
				'message' => 'Security check failed'
			]);
			return;
		}

		if (!current_user_can('manage_options')) {
			wp_send_json_error([
				'message' => 'Insufficient permissions'
			]);
			return;
		}

		$template_id = isset($_POST['template_id']) ? absint($_POST['template_id']) : 0;

		if (empty($template_id)) {
			wp_send_json_error([
				'message' => 'Template ID is required'
			]);
			return;
		}

		require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';
		$template = new TmpltrTemplate($template_id);

		if (!$template->exists()) {
			wp_send_json_error([
				'message' => 'Template not found'
			]);
			return;
		}

		if (!$template->delete()) {
			if (TMPLTR_DEBUG_MODE) {
				error_log('Tmpltr: Failed to delete template ' . $template_id);
			}

			wp_send_json_error([
				'message' => 'Failed to delete template'
			]);
			return;
		}

		wp_send_json_success([
			'message' => 'Template deleted successfully'
		]);
	}
}
