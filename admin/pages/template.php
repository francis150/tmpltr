<?php
/**
 * Template Create/Edit Page
 *
 * @package Tmpltr
 */

require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

$template_id = null;
$template = null;

// Check if ID parameter exists (Edit mode)
if (isset($_GET['id']) && !empty($_GET['id'])) {
    $template_id = absint($_GET['id']);
    $template = new TmpltrTemplate($template_id);

    // Verify the template exists
    if (!$template->exists()) {
        wp_die(
            __('Template not found.', 'tmpltr'),
            404
        );
    }

} else { // Create mode - Insert new draft template

    $template = new TmpltrTemplate();
    $template->set_name('Untitled Template');
    $template->set_status('draft');

    $template_id = $template->save();

    // Check if creation was successful
    if ($template_id === false) {
        wp_die(
            __('Failed to create template. Please try again.', 'tmpltr') .
            (TMPLTR_DEBUG_MODE ? '<br>Database error occurred. Check error logs.' : ''),
            500
        );
    }

    // Redirect to same page with new ID to prevent duplicate inserts on refresh
    wp_redirect(admin_url('admin.php?page=tmpltr-template&id=' . $template_id));
    exit;
}
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
                <h1><?= $template->get_name(); ?></h1>
            </div>
            <div class="tmpltr-page-header__right">
                <div class="tmpltr-page-header__credit-cost">
                    <span class="tmpltr-page-header__credit-cost-label">Credit Cost:</span>
                    <span class="tmpltr-page-header__credit-cost-value" id="tmpltr-credit-cost-value">0</span>
                </div>
            </div>
        </div>

        <form action="#" class="template-form">
        <h2>Template Information</h2>
        <div class="template-metadata-row">
            <div class="template-metadata-field">
                <label for="template-name">Template Name:</label>
                <input
                    type="text"
                    id="template-name"
                    name="template_name"
                    value="<?php echo esc_attr($template->get_name()); ?>"
                    class="regular-text"
                >
            </div>

            <div class="template-metadata-field">
                <label for="template-status">Status:</label>
                <select
                    id="template-status"
                    name="template_status"
                    class="regular-text"
                >
                    <option value="draft" <?php selected($template->get_status(), 'draft'); ?>>Draft</option>
                    <option value="published" <?php selected($template->get_status(), 'published'); ?>>Published</option>
                </select>
            </div>
        </div>

        <hr>
        <h2>Fields</h2>
        <div class="field-rows"></div>

        <button type="button" class="button add-field-btn">Add Field</button>

        <hr>
        <h2>Prompts</h2>
        <div class="prompt-rows"></div>

        <button type="button" class="button add-prompt-btn">Add Prompt</button>

        <hr>
        <h2>SEO Meta</h2>
        <p class="seo-meta-description">Use @field placeholders for dynamic values. These are substituted directly — no AI credits used.</p>
        <div class="seo-meta-fields">
            <div class="seo-meta-field">
                <label for="meta-title-template">Meta Title</label>
                <div class="highlight-wrapper highlight-wrapper--single-line">
                    <div class="backdrop" id="meta-title-backdrop"></div>
                    <input type="text" id="meta-title-template" name="meta_title_template"
                           value="<?php echo esc_attr($template->get_meta_title_template()); ?>"
                           class="regular-text" placeholder="e.g., Best @target_keyword in @city, @state">
                </div>
                <span class="seo-meta-char-count" id="meta-title-char-count">0 / 60</span>
            </div>
            <div class="seo-meta-field">
                <label for="meta-desc-template">Meta Description</label>
                <div class="highlight-wrapper">
                    <div class="backdrop" id="meta-desc-backdrop"></div>
                    <textarea id="meta-desc-template" name="meta_description_template"
                              rows="2" class="large-text"
                              placeholder="e.g., Looking for @target_keyword in @city? ..."
                    ><?php echo esc_textarea($template->get_meta_description_template()); ?></textarea>
                </div>
                <span class="seo-meta-char-count" id="meta-desc-char-count">0 / 160</span>
            </div>
        </div>

        <hr>
        <h2>Layout Page</h2>
        <p>
            <label for="template-page-select">Select Page:</label><br>
            <select name="template_page_id" id="template-page-select" class="regular-text" data-selected-page="<?php echo esc_attr($template->get_template_page_id()); ?>">
                <option value="0">Select a page...</option>
            </select>
        </p>

        <p id="template-page-links">
            <a id="template-page-view-link" href="#" target="_blank">View Page</a>
            &nbsp;|&nbsp;
            <a id="template-page-edit-link" href="#" target="_blank">Edit Page</a>
        </p>

        <button type="submit" class="button button-primary">Save Template</button>
    </form>
    </div>
</div>
