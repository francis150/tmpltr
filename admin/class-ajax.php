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
		add_action('wp_ajax_tmpltr_duplicate_template', [$this, 'duplicate_template']);

		// Generation handlers
		add_action('wp_ajax_tmpltr_save_generation', [$this, 'save_generation']);
		add_action('wp_ajax_tmpltr_delete_generated_page', [$this, 'delete_generated_page']);
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

	/**
	 * AJAX handler: Duplicate template
	 * Creates a copy of the template with all fields and prompts
	 *
	 * @return void Outputs JSON response
	 */
	public function duplicate_template() {
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

		$new_template_id = $template->duplicate();

		if (!$new_template_id) {
			wp_send_json_error([
				'message' => 'Failed to duplicate template'
			]);
			return;
		}

		$new_template = new TmpltrTemplate($new_template_id);

		wp_send_json_success([
			'message' => 'Template duplicated successfully',
			'template' => [
				'id' => $new_template->get_id(),
				'name' => $new_template->get_name(),
				'status' => $new_template->get_status(),
				'created_at' => wp_date('M j, Y g:i A')
			]
		]);
	}

	// ===== GENERATION HANDLERS =====

	/**
	 * AJAX handler: Save generation results
	 * Stores generated page data and prompt results
	 *
	 * @return void Outputs JSON response
	 */
	public function save_generation() {
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
		$page_title = isset($_POST['page_title']) ? sanitize_text_field($_POST['page_title']) : '';
		$field_values = isset($_POST['field_values']) ? json_decode(stripslashes($_POST['field_values']), true) : [];
		$results = isset($_POST['results']) ? json_decode(stripslashes($_POST['results']), true) : [];
		$summary = isset($_POST['summary']) ? json_decode(stripslashes($_POST['summary']), true) : [];

		if (empty($template_id)) {
			wp_send_json_error([
				'message' => 'Template ID is required'
			]);
			return;
		}

		if (empty($results) || !is_array($results)) {
			wp_send_json_error([
				'message' => 'Generation results are required'
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

		$template_page_id = $template->get_template_page_id();
		if (!$template_page_id) {
			wp_send_json_error([
				'message' => 'No template page configured for this template'
			]);
			return;
		}

		global $wpdb;
		$wpdb->query('START TRANSACTION');

		try {
			$insert_result = $wpdb->insert(
				$wpdb->prefix . 'tmpltr_generated_pages',
				[
					'template_id' => $template_id,
					'page_id' => 0,
					'field_values' => wp_json_encode($field_values),
					'generated_by' => get_current_user_id(),
					'generation_status' => 'completed'
				],
				['%d', '%d', '%s', '%d', '%s']
			);

			if ($insert_result === false) {
				throw new Exception('Failed to save generated page record');
			}

			$generated_page_id = $wpdb->insert_id;

			$prompt_result_ids = [];

			foreach ($results as $result) {
				$prompt_id = isset($result['prompt_id']) ? absint($result['prompt_id']) : 0;
				$prompt_text_used = isset($result['prompt_text_used']) ? wp_kses_post($result['prompt_text_used']) : '';
				$ai_response = isset($result['content']) ? wp_kses_post($result['content']) : '';
				$tokens_used = isset($result['tokens_used']) ? absint($result['tokens_used']) : 0;
				$processing_time = isset($result['processing_time_ms']) ? absint($result['processing_time_ms']) : 0;

				$result_insert = $wpdb->insert(
					$wpdb->prefix . 'tmpltr_prompt_results',
					[
						'generated_page_id' => $generated_page_id,
						'prompt_id' => $prompt_id,
						'prompt_text_used' => $prompt_text_used,
						'ai_response' => $ai_response,
						'tokens_used' => $tokens_used,
						'processing_time' => $processing_time
					],
					['%d', '%d', '%s', '%s', '%d', '%d']
				);

				if ($result_insert === false) {
					throw new Exception('Failed to save prompt result');
				}

				$prompt_result_ids[$prompt_id] = $wpdb->insert_id;
			}

			require_once TMPLTR_PLUGIN_DIR . 'includes/class-page-duplicator.php';
			$new_page_id = TmpltrPageDuplicator::duplicate($template_page_id, $page_title, $template_id, $prompt_result_ids);

			if (is_wp_error($new_page_id)) {
				throw new Exception($new_page_id->get_error_message());
			}

			$wpdb->update(
				$wpdb->prefix . 'tmpltr_generated_pages',
				['page_id' => $new_page_id],
				['id' => $generated_page_id],
				['%d'],
				['%d']
			);

			$wpdb->query('COMMIT');

			wp_send_json_success([
				'message' => 'Page created successfully',
				'generated_page_id' => $generated_page_id,
				'page_id' => $new_page_id,
				'page_title' => $page_title,
				'view_url' => get_permalink($new_page_id),
				'edit_url' => get_edit_post_link($new_page_id, 'raw'),
				'created_at' => wp_date('M j, Y g:i A'),
				'results_count' => count($results)
			]);

		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');

			if (TMPLTR_DEBUG_MODE) {
				error_log('Tmpltr: Failed to save generation - ' . $e->getMessage());
			}

			wp_send_json_error([
				'message' => 'Failed to save generation results. Please try again.'
			]);
		}
	}

	/**
	 * AJAX handler: Delete generated page
	 * Removes the generated page record and deletes the WordPress page
	 *
	 * @return void Outputs JSON response
	 */
	public function delete_generated_page() {
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

		$generated_page_id = isset($_POST['generated_page_id']) ? absint($_POST['generated_page_id']) : 0;

		if (empty($generated_page_id)) {
			wp_send_json_error([
				'message' => 'Generated page ID is required'
			]);
			return;
		}

		global $wpdb;

		$generated_page = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}tmpltr_generated_pages WHERE id = %d",
			$generated_page_id
		));

		if (!$generated_page) {
			wp_send_json_error([
				'message' => 'Generated page not found'
			]);
			return;
		}

		$wpdb->query('START TRANSACTION');

		try {
			$wpdb->delete(
				$wpdb->prefix . 'tmpltr_prompt_results',
				['generated_page_id' => $generated_page_id],
				['%d']
			);

			$wpdb->delete(
				$wpdb->prefix . 'tmpltr_generated_pages',
				['id' => $generated_page_id],
				['%d']
			);

			if ($generated_page->page_id) {
				$delete_result = wp_delete_post($generated_page->page_id, true);

				if (!$delete_result) {
					throw new Exception('Failed to delete WordPress page');
				}
			}

			$wpdb->query('COMMIT');

			wp_send_json_success([
				'message' => 'Page deleted successfully'
			]);

		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');

			if (TMPLTR_DEBUG_MODE) {
				error_log('Tmpltr: Failed to delete generated page - ' . $e->getMessage());
			}

			wp_send_json_error([
				'message' => 'Failed to delete page. Please try again.'
			]);
		}
	}
}
