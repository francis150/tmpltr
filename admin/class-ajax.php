<?php
/**
 * @package Tmpltr
 */

class TmpltrAjax {

	public function __construct() {
		// Register AJAX handlers
		add_action('wp_ajax_tmpltr_get_pages', [$this, 'get_pages']);
	}

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
}
