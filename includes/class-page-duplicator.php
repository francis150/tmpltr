<?php
/**
 * Page Duplicator Service
 *
 * Handles WordPress page duplication with full page builder compatibility.
 * Supports Elementor, Beaver Builder, Divi, Oxygen, WPBakery, Fusion Builder,
 * Bricks, Brizy, and other major builders.
 *
 * @package Tmpltr
 */

class TmpltrPageDuplicator {

	private static $excluded_meta = ['_edit_lock', '_edit_last', '_wp_old_slug'];

	private static $builder_meta_keys = [
		// Elementor
		'_elementor_data',
		'_elementor_page_settings',
		'_elementor_controls_usage',
		'_elementor_page_assets',
		'_elementor_edit_mode',
		'_elementor_template_type',
		'_elementor_version',
		// Beaver Builder
		'_fl_builder_data',
		'_fl_builder_draft',
		'_fl_builder_data_settings',
		'_fl_builder_draft_settings',
		'_fl_builder_enabled',
		// Divi Builder
		'_et_pb_use_builder',
		'_et_pb_page_layout',
		'_et_pb_side_nav',
		'_et_pb_post_hide_nav',
		'_et_pb_show_title',
		'_et_pb_old_content',
		'_et_builder_version',
		// Oxygen Builder
		'ct_builder_shortcodes',
		'_ct_builder_shortcodes',
		'ct_builder_json',
		'_ct_builder_json',
		'ct_other_template',
		'_ct_other_template',
		// WPBakery
		'_wpb_vc_js_status',
		'_wpb_shortcodes_custom_css',
		// Fusion Builder (Avada)
		'_fusion_builder_content',
		'fusion_builder_status',
		// Bricks Builder
		'_bricks_page_content_2',
		'_bricks_page_settings',
		// Brizy
		'brizy_post_uid',
		'brizy-post',
		// Generic
		'_wp_page_template',
		'_custom_css',
		'page_options',
	];

	public static function duplicate($source_page_id, $new_title, $template_id = 0, $prompt_result_ids = []) {
		$source_page_id = absint($source_page_id);
		if (!$source_page_id) {
			return new WP_Error('invalid_source', 'Invalid source page ID');
		}

		$source_page = get_post($source_page_id);
		if (!$source_page || $source_page->post_type !== 'page') {
			return new WP_Error('page_not_found', 'Source page not found');
		}

		$replacements = self::build_replacement_map($template_id, $prompt_result_ids);

		$new_page_id = self::create_page($source_page, $new_title, $replacements);
		if (is_wp_error($new_page_id)) {
			return $new_page_id;
		}

		self::copy_meta($source_page_id, $new_page_id, $replacements);
		self::copy_taxonomies($source_page_id, $new_page_id);
		self::clear_builder_caches($new_page_id);

		return $new_page_id;
	}

	private static function build_replacement_map($template_id, $prompt_result_ids) {
		if (empty($template_id) || empty($prompt_result_ids)) {
			return [];
		}

		global $wpdb;
		$replacements = [];

		$prompts = $wpdb->get_results($wpdb->prepare(
			"SELECT id, placeholder FROM {$wpdb->prefix}tmpltr_template_prompts WHERE template_id = %d",
			$template_id
		), ARRAY_A);

		foreach ($prompts as $prompt) {
			$prompt_id = absint($prompt['id']);
			if (isset($prompt_result_ids[$prompt_id])) {
				$replacements[$prompt['placeholder']] = '[tmpltr id="' . $prompt_result_ids[$prompt_id] . '"]';
			}
		}

		return $replacements;
	}

	private static function apply_replacements($content, $replacements) {
		if (empty($content) || empty($replacements)) {
			return $content;
		}

		foreach ($replacements as $placeholder => $shortcode) {
			$content = str_replace($placeholder, $shortcode, $content);
		}

		return $content;
	}

	private static function apply_replacements_recursive($data, $replacements) {
		if (empty($replacements)) {
			return $data;
		}

		if (is_string($data)) {
			return self::apply_replacements($data, $replacements);
		}

		if (is_array($data)) {
			foreach ($data as $key => $value) {
				$data[$key] = self::apply_replacements_recursive($value, $replacements);
			}
		}

		return $data;
	}

	private static function create_page($source_page, $new_title, $replacements = []) {
		$post_content = $source_page->post_content;
		$post_content = self::apply_replacements($post_content, $replacements);

		$new_page_data = [
			'post_title'     => sanitize_text_field($new_title),
			'post_content'   => $post_content,
			'post_excerpt'   => $source_page->post_excerpt,
			'post_status'    => 'publish',
			'post_type'      => 'page',
			'post_author'    => get_current_user_id(),
			'post_parent'    => $source_page->post_parent,
			'menu_order'     => $source_page->menu_order,
			'comment_status' => $source_page->comment_status,
			'ping_status'    => $source_page->ping_status,
		];

		return wp_insert_post($new_page_data, true);
	}

	private static function copy_meta($source_page_id, $new_page_id, $replacements = []) {
		$all_meta = get_post_meta($source_page_id);

		if (!$all_meta || !is_array($all_meta)) {
			return;
		}

		foreach ($all_meta as $meta_key => $meta_values) {
			if (in_array($meta_key, self::$excluded_meta, true)) {
				continue;
			}

			foreach ($meta_values as $meta_value) {
				$value = maybe_unserialize($meta_value);

				if (in_array($meta_key, self::$builder_meta_keys, true)) {
					if (is_array($value) || is_object($value)) {
						$value = self::apply_replacements_recursive($value, $replacements);
						add_post_meta($new_page_id, $meta_key, wp_slash($value));
					} else {
						$processed_value = self::process_builder_string_meta($meta_value, $replacements);
						add_post_meta($new_page_id, $meta_key, wp_slash($processed_value));
					}
				} else {
					add_post_meta($new_page_id, $meta_key, $value);
				}
			}
		}
	}

	private static function process_builder_string_meta($meta_value, $replacements) {
		if (empty($replacements)) {
			return $meta_value;
		}

		$decoded = json_decode($meta_value, true);
		if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
			$decoded = self::apply_replacements_recursive($decoded, $replacements);
			return wp_json_encode($decoded);
		}

		return self::apply_replacements($meta_value, $replacements);
	}

	private static function copy_taxonomies($source_page_id, $new_page_id) {
		$taxonomies = get_object_taxonomies('page');

		foreach ($taxonomies as $taxonomy) {
			$terms = wp_get_object_terms($source_page_id, $taxonomy, ['fields' => 'ids']);
			if (!is_wp_error($terms) && !empty($terms)) {
				wp_set_object_terms($new_page_id, $terms, $taxonomy);
			}
		}
	}

	private static function clear_builder_caches($page_id) {
		// Elementor
		if (defined('ELEMENTOR_VERSION')) {
			delete_post_meta($page_id, '_elementor_css');
			if (class_exists('\Elementor\Plugin')) {
				\Elementor\Plugin::$instance->files_manager->clear_cache();
			}
		}

		// Beaver Builder
		if (class_exists('FLBuilderModel')) {
			FLBuilderModel::delete_all_asset_cache($page_id);
		}

		// Oxygen Builder
		if (defined('CT_VERSION') || class_exists('CT_Component')) {
			delete_post_meta($page_id, 'oxygen_vsb_css_cache');
			delete_post_meta($page_id, '_oxygen_vsb_css_cache');
			delete_post_meta($page_id, 'ct_builder_cache');
			delete_post_meta($page_id, '_ct_builder_cache');

			if (function_exists('oxygen_vsb_cache_page_css')) {
				oxygen_vsb_cache_page_css($page_id, true);
			}
		}

		// Divi
		if (defined('ET_CORE_VERSION') || function_exists('et_core_is_builder_used_on_current_request')) {
			if (class_exists('ET_Core_PageResource')) {
				ET_Core_PageResource::remove_static_resources($page_id, 'all');
			}
		}

		// Bricks
		if (defined('BRICKS_VERSION')) {
			delete_post_meta($page_id, '_bricks_page_content_2_css');
		}

		// WP Object Cache
		if (function_exists('wp_cache_delete')) {
			wp_cache_delete($page_id, 'post_meta');
			wp_cache_delete("post_meta_{$page_id}", 'post_meta');
		}

		clean_post_cache($page_id);
	}
}
