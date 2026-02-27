<?php
/**
 * Templates List Page
 *
 * @package Tmpltr
 */

require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';
require_once TMPLTR_PLUGIN_DIR . 'includes/class-template-importer.php';

$templates = TmpltrTemplate::get_all();

$import_updates = [];
foreach ($templates as $template) {
    if (!empty($template['import_id'])) {
        $update = TmpltrTemplateImporter::get_available_update($template['import_id']);
        if ($update) {
            $import_updates[$template['id']] = $update;
        }
    }
}
?>

<div class="tmpltr-admin-page">
    <div class="tmpltr-auth-loading">Verifying authentication...</div>

    <div class="tmpltr-protected-content">
        <?php require_once TMPLTR_PLUGIN_DIR . 'admin/partials/header.php'; ?>

        <div class="tmpltr-page-header">
            <div class="tmpltr-page-header__left">
                <h1>Templates</h1>
            </div>
            <div class="tmpltr-page-header__right">
                <?php // Starter template banner — remove this block when no longer needed ?>
                <?php $starter_imported = TmpltrTemplate::find_by_import_id('ST-001') !== null; ?>
                <?php if (!$starter_imported) : ?>
                <div class="template-starter-notice">
                    <p>Don't know where to start? Try importing our SEO-Focused Location Page (Starter Template)✨</p>
                    <button type="button" class="template-starter-notice__btn import-starter-btn">Import</button>
                </div>
                <?php endif; ?>
                <?php // Starter template banner END — remove this block when no longer needed ?>
                <span class="community-templates-btn">
                    <a href="#" class="button button-secondary button-hero community-templates-btn__trigger" aria-disabled="true" tabindex="-1">✨ Community Templates</a>
                    <span class="community-templates-btn__badge">Coming Soon</span>
                </span>
                <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr-template')); ?>" class="button button-primary button-hero">Create Template</a>
            </div>
        </div>

    <?php if (empty($templates)) : ?>
        <div class="template-empty-state">
            <p>No templates found. Create your first template to get started.</p>
        </div>
    <?php else : ?>
        <table class="wp-list-table widefat striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($templates as $template) : ?>
                    <tr data-template-id="<?php echo esc_attr($template['id']); ?>"<?php if (!empty($template['import_id'])) : ?> data-import-id="<?php echo esc_attr($template['import_id']); ?>"<?php endif; ?>>
                        <td><?php echo esc_html($template['name']); ?></td>
                        <td>
                            <span class="template-status-badge status-<?php echo esc_attr($template['status']); ?>">
                                <?php echo esc_html(ucfirst($template['status'])); ?>
                            </span>
                        </td>
                        <td><?php echo esc_html(wp_date('M j, Y g:i A', strtotime($template['created_at']))); ?></td>
                        <td class="template-actions">
                            <?php if (isset($import_updates[$template['id']])) : ?>
                                <button class="update-import-btn"
                                        data-template-id="<?php echo esc_attr($template['id']); ?>"
                                        data-version="<?php echo esc_attr($import_updates[$template['id']]['new_version']); ?>">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="1 4 1 10 7 10"></polyline>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                    </svg>
                                    <span>Update to v<?php echo esc_html($import_updates[$template['id']]['new_version']); ?></span>
                                </button>
                            <?php endif; ?>
                            <button class="button button-primary generate-template-btn"<?php echo $template['status'] === 'draft' ? ' disabled' : ''; ?>>Generate</button>
                            <div class="template-options">
                                <button type="button" class="template-options__trigger" aria-label="More options" aria-expanded="false">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                </button>
                                <div class="template-options__dropdown">
                                    <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr-template&id=' . $template['id'])); ?>" class="template-options__item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Edit
                                    </a>
                                    <button type="button" class="template-options__item template-options__item--delete delete-template-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        Delete
                                    </button>
                                    <button type="button" class="template-options__item template-options__item--duplicate">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        Duplicate
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
    </div>
</div>
