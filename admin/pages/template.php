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
        <h2>Fields</h2>
        <div class="field-rows">

            <div class="field-row">
                <label for="field-name-1">Field Name</label>
                <input type="text" id="field-name-1" name="field_name-1">

                <label for="field-identifier-1">Identifier</label>
                <input type="text" id="field-identifier-1" name="field_identifier-1" readonly>
            </div>

        </div>
        
        <button type="button" class="button">Add Field</button>

        <hr>
        <h2>Prompts</h2>
        <hr>
        <h2>Template Page</h2>
    </form>
</div>
