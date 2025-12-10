<?php
/**
 * Shortcode Handler
 *
 * @package Tmpltr
 */

class TmpltrShortcode {

	public function __construct() {
		add_shortcode('tmpltr', [$this, 'prompt_result']);
	}

	public function prompt_result($atts) {
		$atts = shortcode_atts(['id' => 0], $atts, 'tmpltr');
		$result_id = absint($atts['id']);

		if (!$result_id) {
			return '';
		}

		global $wpdb;
		$ai_response = $wpdb->get_var($wpdb->prepare(
			"SELECT ai_response FROM {$wpdb->prefix}tmpltr_prompt_results WHERE id = %d",
			$result_id
		));

		return $ai_response ? wp_kses_post($ai_response) : '';
	}
}
