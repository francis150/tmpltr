<?php
/**
 * SEO Meta Handler
 *
 * @package Tmpltr
 */

class TmpltrSeoMeta {

	public function __construct() {
		if (self::detect_seo_plugin()) {
			return;
		}

		add_filter('document_title_parts', [$this, 'filter_document_title']);
		add_action('wp_head', [$this, 'output_meta_description'], 1);
	}

	public static function substitute_fields($template, $field_values) {
		if (empty($template) || empty($field_values)) {
			return $template;
		}

		foreach ($field_values as $key => $value) {
			if ($key === 'page_title') {
				continue;
			}

			$identifier = strpos($key, '@') === 0 ? $key : '@' . $key;
			$template = str_replace($identifier, $value, $template);
		}

		return $template;
	}

	public static function apply_to_page($page_id, $meta_title, $meta_description) {
		if (empty($meta_title) && empty($meta_description)) {
			return;
		}

		$plugin = self::detect_seo_plugin();

		$meta_keys = self::get_meta_keys($plugin);

		if ($meta_title) {
			update_post_meta($page_id, $meta_keys['title'], sanitize_text_field($meta_title));
		}

		if ($meta_description) {
			update_post_meta($page_id, $meta_keys['description'], sanitize_text_field($meta_description));
		}
	}

	private static function detect_seo_plugin() {
		if (defined('WPSEO_VERSION')) {
			return 'yoast';
		}

		if (class_exists('RankMath')) {
			return 'rank_math';
		}

		if (defined('SEOPRESS_VERSION')) {
			return 'seopress';
		}

		return '';
	}

	private static function get_meta_keys($plugin) {
		$map = [
			'yoast' => [
				'title' => '_yoast_wpseo_title',
				'description' => '_yoast_wpseo_metadesc',
			],
			'rank_math' => [
				'title' => 'rank_math_title',
				'description' => 'rank_math_description',
			],
			'seopress' => [
				'title' => '_seopress_titles_title',
				'description' => '_seopress_titles_desc',
			],
		];

		return $map[$plugin] ?? [
			'title' => '_tmpltr_meta_title',
			'description' => '_tmpltr_meta_description',
		];
	}

	public function filter_document_title($title_parts) {
		if (!is_singular()) {
			return $title_parts;
		}

		$meta_title = get_post_meta(get_the_ID(), '_tmpltr_meta_title', true);

		if ($meta_title) {
			$title_parts['title'] = $meta_title;
		}

		return $title_parts;
	}

	public function output_meta_description() {
		if (!is_singular()) {
			return;
		}

		$meta_description = get_post_meta(get_the_ID(), '_tmpltr_meta_description', true);

		if ($meta_description) {
			echo '<meta name="description" content="' . esc_attr($meta_description) . '">' . "\n";
		}
	}
}
