<?php
/**
 * Generated Pages List Page
 *
 * @package Tmpltr
 */

require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

$template_id = isset($_GET['template_id']) ? absint($_GET['template_id']) : 0;

if (empty($template_id)) {
    wp_redirect(admin_url('admin.php?page=tmpltr'));
    exit;
}

$template = new TmpltrTemplate($template_id);

if (!$template->exists()) {
    wp_redirect(admin_url('admin.php?page=tmpltr'));
    exit;
}

global $wpdb;

$generated_pages = $wpdb->get_results($wpdb->prepare(
    "SELECT gp.id, gp.page_id, gp.created_at, p.post_title
     FROM {$wpdb->prefix}tmpltr_generated_pages gp
     LEFT JOIN {$wpdb->posts} p ON gp.page_id = p.ID
     WHERE gp.template_id = %d
     ORDER BY gp.created_at DESC",
    $template_id
));

$total_pages = count($generated_pages);
?>

<div class="tmpltr-admin-page">
    <div class="tmpltr-auth-loading">Verifying authentication...</div>

    <div class="tmpltr-protected-content">
        <?php require_once TMPLTR_PLUGIN_DIR . 'admin/partials/header.php'; ?>

        <div class="tmpltr-page-header">
            <div class="tmpltr-page-header__left">
                <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr')); ?>" class="tmpltr-back-btn" title="Back to Templates">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </a>
                <h1><?php echo esc_html($template->get_name()); ?></h1>
            </div>
            <div class="tmpltr-page-header__right"></div>
        </div>

        <div class="pages-stats">
            <div class="pages-stats__card">
                <span class="pages-stats__number"><?php echo esc_html($total_pages); ?></span>
                <span class="pages-stats__label">Total Pages Generated</span>
            </div>
        </div>

        <div class="pages-section">
            <h2>Generated Pages</h2>

            <?php if (empty($generated_pages)) : ?>
                <div class="pages-empty-state">
                    <p>No pages have been generated from this template yet.</p>
                </div>
            <?php else : ?>
                <table class="wp-list-table widefat striped">
                    <thead>
                        <tr>
                            <th>Page Title</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($generated_pages as $page) : ?>
                            <tr data-generated-page-id="<?php echo esc_attr($page->id); ?>">
                                <td><?php echo esc_html($page->post_title ?: '(Untitled)'); ?></td>
                                <td><?php echo esc_html(wp_date('M j, Y g:i A', strtotime($page->created_at))); ?></td>
                                <td class="pages-actions">
                                    <?php if ($page->page_id) : ?>
                                        <a href="<?php echo esc_url(get_permalink($page->page_id)); ?>" class="button button-secondary" target="_blank">View</a>
                                    <?php endif; ?>
                                    <button type="button" class="button button-secondary pages-delete-btn">Delete</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
</div>
