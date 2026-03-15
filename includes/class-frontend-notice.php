<?php
/**
 * Frontend Notice Bar
 *
 * Displays a dismissible admin-only notice on tmpltr-generated pages,
 * prompting users to customize the layout with any page builder.
 *
 * @package Tmpltr
 */

class TmpltrFrontendNotice {

	public function __construct() {
		add_action('wp_footer', [$this, 'render_notice']);
	}

	public function render_notice() {
		if (!is_singular()) {
			return;
		}

		if (!is_user_logged_in() || !current_user_can('manage_options')) {
			return;
		}

		if (get_user_meta(get_current_user_id(), 'tmpltr_dismiss_page_notice', true)) {
			return;
		}

		global $wpdb;
		$generated = $wpdb->get_row($wpdb->prepare(
			"SELECT gp.template_id, t.template_page_id
			 FROM {$wpdb->prefix}tmpltr_generated_pages gp
			 JOIN {$wpdb->prefix}tmpltr_templates t ON t.id = gp.template_id
			 WHERE gp.page_id = %d
			 LIMIT 1",
			get_the_ID()
		));

		if (!$generated || !$generated->template_page_id) {
			return;
		}

		$edit_url = get_edit_post_link($generated->template_page_id, 'raw');
		if (!$edit_url) {
			return;
		}

		$this->render_html($edit_url);
	}

	private function render_html($edit_url) {
		$ajax_url = esc_url(admin_url('admin-ajax.php'));
		$nonce = wp_create_nonce('tmpltr_nonce');
		?>
		<style>
			.tmpltr-frontend-notice {
				position: fixed;
				top: 32px;
				left: 0;
				width: 100%;
				z-index: 99999;
				background: #f0f6fc;
				border-bottom: 1px solid #c3d9ed;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				font-size: 13px;
				line-height: 1.4;
				color: #1d2327;
			}
			.tmpltr-frontend-notice__inner {
				max-width: 960px;
				margin: 0 auto;
				padding: 10px 16px;
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.tmpltr-frontend-notice__icon {
				flex-shrink: 0;
				display: flex;
				align-items: center;
			}
			.tmpltr-frontend-notice__icon svg {
				width: 20px;
				height: 20px;
				fill: #2271b1;
			}
			.tmpltr-frontend-notice__text {
				flex: 1;
			}
			.tmpltr-frontend-notice__btn {
				flex-shrink: 0;
				display: inline-block;
				padding: 6px 16px;
				background: #2271b1;
				color: #fff;
				text-decoration: none;
				border-radius: 4px;
				font-size: 12px;
				font-weight: 600;
				white-space: nowrap;
				transition: background 0.15s ease;
			}
			.tmpltr-frontend-notice__btn:hover {
				background: #135e96;
				color: #fff;
			}
			.tmpltr-frontend-notice__close {
				flex-shrink: 0;
				background: none;
				border: none;
				cursor: pointer;
				font-size: 20px;
				line-height: 1;
				color: #646970;
				padding: 4px 8px;
			}
			.tmpltr-frontend-notice__close:hover {
				color: #1d2327;
			}
			body.tmpltr-has-notice {
				padding-top: 46px;
			}
			@media screen and (max-width: 782px) {
				.tmpltr-frontend-notice {
					top: 46px;
				}
			}
		</style>

		<div class="tmpltr-frontend-notice" data-ajax-url="<?php echo $ajax_url; ?>" data-nonce="<?php echo $nonce; ?>">
			<div class="tmpltr-frontend-notice__inner">
				<span class="tmpltr-frontend-notice__icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
				</span>
				<span class="tmpltr-frontend-notice__text">
					This starter layout is meant to be customized. Edit it once, and every page you generate will use your design.
				</span>
				<a href="<?php echo esc_url($edit_url); ?>" class="tmpltr-frontend-notice__btn">Edit Layout Page</a>
				<button class="tmpltr-frontend-notice__close" type="button" aria-label="Dismiss notice">&times;</button>
			</div>
		</div>

		<script>
		(function() {
			'use strict';

			document.body.classList.add('tmpltr-has-notice');

			var notice = document.querySelector('.tmpltr-frontend-notice');
			if (!notice) return;

			notice.querySelector('.tmpltr-frontend-notice__close').addEventListener('click', function() {
				notice.remove();
				document.body.classList.remove('tmpltr-has-notice');

				fetch(notice.dataset.ajaxUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						action: 'tmpltr_dismiss_page_notice',
						nonce: notice.dataset.nonce
					})
				});
			});
		})();
		</script>
		<?php
	}
}
