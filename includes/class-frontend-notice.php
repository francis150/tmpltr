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
			 AND t.import_id LIKE 'ST%%'
			 LIMIT 1",
			get_the_ID()
		));

		if (!$generated || !$generated->template_page_id) {
			return;
		}

		$layout_page = get_post($generated->template_page_id);
		if (!$layout_page) {
			return;
		}

		$original_hash = get_post_meta($generated->template_page_id, '_tmpltr_original_content_hash', true);
		if ($original_hash && md5($layout_page->post_content) !== $original_hash) {
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
				top: 48px;
				right: 16px;
				width: 380px;
				z-index: 99999;
				background: #fffbeb;
				border: 1px solid #ff99006e;
				border-left: 4px solid #ff9b00;
				border-radius: 8px;
				box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				font-size: 13px;
				line-height: 1.4;
				color: #996800;
				opacity: 0;
				transform: translateX(100%);
				animation: tmpltr-notice-slide-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
			}
			.tmpltr-frontend-notice--dismissing {
				animation: tmpltr-notice-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
			}
			.tmpltr-frontend-notice__inner {
				position: relative;
				padding: 14px 16px;
				display: flex;
				flex-direction: column;
				gap: 12px;
			}
			.tmpltr-frontend-notice__header {
				display: flex;
				align-items: flex-start;
				gap: 10px;
			}
			.tmpltr-frontend-notice__icon {
				flex-shrink: 0;
				display: flex;
				align-items: center;
				margin-top: 1px;
			}
			.tmpltr-frontend-notice__icon svg {
				width: 20px;
				height: 20px;
				fill: #ff9b00;
			}
			.tmpltr-frontend-notice__text {
				flex: 1;
				font-weight: 400;
				padding-right: 16px;
				display: flex;
				flex-direction: column;
				row-gap: 8px;
				line-height: 1.6;
			}
			.tmpltr-frontend-notice__btn {
				display: block;
				padding: 8px 16px;
				background: #ff9b00;
				color: #fff;
				text-decoration: none;
				border-radius: 20px;
				font-size: 13px;
				font-weight: 600;
				text-align: center;
				transition: background-color 0.15s ease;
			}
			.tmpltr-frontend-notice__btn:hover {
				background-color: #e68a00;
				color: #fff;
			}
			.tmpltr-frontend-notice__close {
				position: absolute;
				top: 8px;
				right: 8px;
				width: 28px;
				height: 28px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: none;
				border: none;
				border-radius: 50%;
				cursor: pointer;
				font-size: 18px;
				line-height: 1;
				color: #c4870a;
				opacity: 0.7;
				padding: 0;
				transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
			}
			.tmpltr-frontend-notice__close:hover {
				background-color: rgba(0, 0, 0, 0.08);
				color: #8a5d00;
				opacity: 1;
			}
			@keyframes tmpltr-notice-slide-in {
				from { opacity: 0; transform: translateX(100%); }
				to { opacity: 1; transform: translateX(0); }
			}
			@keyframes tmpltr-notice-slide-out {
				from { opacity: 1; transform: translateX(0); }
				to { opacity: 0; transform: translateX(100%); }
			}
			@media screen and (max-width: 782px) {
				.tmpltr-frontend-notice {
					top: 62px;
					right: 12px;
					width: calc(100vw - 24px);
					max-width: 380px;
				}
			}
			@media screen and (max-width: 480px) {
				.tmpltr-frontend-notice {
					right: 8px;
					width: calc(100vw - 16px);
				}
				.tmpltr-frontend-notice__inner {
					padding: 12px 14px;
				}
			}
			@media (prefers-reduced-motion: reduce) {
				.tmpltr-frontend-notice {
					animation: none;
					opacity: 1;
					transform: translateX(0);
				}
				.tmpltr-frontend-notice--dismissing {
					animation: none;
					opacity: 0;
					transition: opacity 0.2s;
				}
			}
		</style>

		<div class="tmpltr-frontend-notice" data-ajax-url="<?php echo $ajax_url; ?>" data-nonce="<?php echo $nonce; ?>">
			<div class="tmpltr-frontend-notice__inner">
				<button class="tmpltr-frontend-notice__close" type="button" aria-label="Dismiss notice">&times;</button>
				<div class="tmpltr-frontend-notice__header">
					<span class="tmpltr-frontend-notice__icon">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
					</span>
					<span class="tmpltr-frontend-notice__text">
						<b>This page was generated from a starter layout.</b>Edit the layout page once with any page builder, and every page you generate will use your design.
					</span>
				</div>
				<a href="<?php echo esc_url($edit_url); ?>" class="tmpltr-frontend-notice__btn">Edit Layout Page</a>
			</div>
		</div>

		<script>
		(function() {
			'use strict';

			var notice = document.querySelector('.tmpltr-frontend-notice');
			if (!notice) return;

			notice.querySelector('.tmpltr-frontend-notice__close').addEventListener('click', function() {
				notice.classList.add('tmpltr-frontend-notice--dismissing');

				notice.addEventListener('animationend', function() {
					notice.remove();
				}, { once: true });

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
