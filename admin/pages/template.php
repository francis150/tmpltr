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
    <h1>template.php</h1>
    <span>ID: <?php echo esc_html($template_id); ?></span>
    <hr>

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
        <h2>Template Page</h2>
        <p>
            <label for="template-page-select">Select Page:</label><br>
            <select name="template_page_id" id="template-page-select" class="regular-text">
                <option value="0">Select a page...</option>
            </select>
        </p>

        <button type="submit" class="button button-primary">Save Template</button>
    </form>
</div>
