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

$wizard_completed = get_option('tmpltr_wizard_completed', false);
$onboarding_dismissed = get_option('tmpltr_onboarding_dismissed', false);
$show_onboarding = $wizard_completed && !$onboarding_dismissed;

if ($show_onboarding) {
    $starter_template_obj = TmpltrTemplate::find_by_import_id('ST-001');

    global $wpdb;
    $generated_count = (int) $wpdb->get_var(
        "SELECT COUNT(*) FROM {$wpdb->prefix}tmpltr_generated_pages gp
         INNER JOIN {$wpdb->prefix}tmpltr_templates t ON gp.template_id = t.id
         INNER JOIN {$wpdb->posts} p ON gp.page_id = p.ID
         WHERE gp.generation_status = 'completed'
         AND t.deleted_at IS NULL
         AND p.post_status IN ('publish', 'draft', 'private')"
    );

    $layout_customized = false;
    $starter_page_id = 0;
    if ($starter_template_obj) {
        $starter_page_id = $starter_template_obj->get_template_page_id();
        if ($starter_page_id) {
            $page = get_post($starter_page_id);
            if ($page) {
                $original_hash = get_post_meta($starter_page_id, '_tmpltr_original_content_hash', true);

                if (!$original_hash) {
                    $original_hash = md5($page->post_content);
                    update_post_meta($starter_page_id, '_tmpltr_original_content_hash', $original_hash);
                }

                $layout_customized = md5($page->post_content) !== $original_hash;
            }
        }
    }

    $onboarding_items = [
        'import_starter'   => ['done' => $starter_template_obj !== null, 'wizard' => true],
        'first_page'       => ['done' => $generated_count >= 1,          'wizard' => true],
        'customize_layout' => ['done' => $layout_customized,             'wizard' => false],
        'generate_more'    => ['done' => $generated_count >= 4,          'wizard' => false],
    ];

    $completed_count = count(array_filter($onboarding_items, fn($item) => $item['done']));
    $total_count = count($onboarding_items);
    $progress = round(($completed_count / $total_count) * 100);
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

        <?php if ($show_onboarding) : ?>
        <div class="template-onboarding" data-progress="<?php echo esc_attr($progress); ?>">
            <div class="template-onboarding__header">
                <div class="template-onboarding__header-left">
                    <h2 class="template-onboarding__title">Getting Started</h2>
                    <span class="template-onboarding__count"><?php echo $completed_count; ?>/<?php echo $total_count; ?> completed</span>
                </div>
                <button type="button" class="template-onboarding__dismiss" aria-label="Dismiss checklist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div class="template-onboarding__progress">
                <div class="template-onboarding__progress-fill" style="width: <?php echo esc_attr($progress); ?>%"></div>
            </div>

            <ul class="template-onboarding__list">
                <li class="template-onboarding__item<?php echo $onboarding_items['import_starter']['done'] ? ' template-onboarding__item--done' : ''; ?>" data-action="import-starter">
                    <span class="template-onboarding__check">
                        <?php if ($onboarding_items['import_starter']['done']) : ?>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <?php else : ?>
                            <span class="template-onboarding__circle"></span>
                        <?php endif; ?>
                    </span>
                    <span class="template-onboarding__label">
                        Import Starter Template
                        <?php if ($onboarding_items['import_starter']['done'] && $onboarding_items['import_starter']['wizard']) : ?>
                            <span class="template-onboarding__badge">Checked from Setup Wizard</span>
                        <?php endif; ?>
                    </span>
                </li>

                <li class="template-onboarding__item<?php echo $onboarding_items['first_page']['done'] ? ' template-onboarding__item--done' : ''; ?>" data-action="first-page">
                    <span class="template-onboarding__check">
                        <?php if ($onboarding_items['first_page']['done']) : ?>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <?php else : ?>
                            <span class="template-onboarding__circle"></span>
                        <?php endif; ?>
                    </span>
                    <span class="template-onboarding__label">
                        Generate your first Page
                        <?php if ($onboarding_items['first_page']['done'] && $onboarding_items['first_page']['wizard']) : ?>
                            <span class="template-onboarding__badge">Checked from Setup Wizard</span>
                        <?php endif; ?>
                    </span>
                </li>

                <li class="template-onboarding__item<?php echo $onboarding_items['customize_layout']['done'] ? ' template-onboarding__item--done' : ''; ?>" data-action="customize-layout"<?php if ($starter_page_id) : ?> data-page-id="<?php echo esc_attr($starter_page_id); ?>"<?php endif; ?>>
                    <span class="template-onboarding__check">
                        <?php if ($onboarding_items['customize_layout']['done']) : ?>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <?php else : ?>
                            <span class="template-onboarding__circle"></span>
                        <?php endif; ?>
                    </span>
                    <span class="template-onboarding__label">Customize Template Layout Page</span>
                </li>

                <li class="template-onboarding__item<?php echo $onboarding_items['generate_more']['done'] ? ' template-onboarding__item--done' : ''; ?>" data-action="generate-more">
                    <span class="template-onboarding__check">
                        <?php if ($onboarding_items['generate_more']['done']) : ?>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <?php else : ?>
                            <span class="template-onboarding__circle"></span>
                        <?php endif; ?>
                    </span>
                    <span class="template-onboarding__label">Generate 3 more pages</span>
                </li>
            </ul>
        </div>
        <?php endif; ?>

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
