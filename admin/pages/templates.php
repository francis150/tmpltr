<?php
/**
 * Templates List Page
 *
 * @package Tmpltr
 */

require_once TMPLTR_PLUGIN_DIR . 'includes/class-template.php';

$templates = TmpltrTemplate::get_all();
?>

<div class="tmpltr-admin-page">
    <h1>Tmpltr</h1>
    <a href="<?php echo esc_url(admin_url('admin.php?page=tmpltr-template')); ?>" class="button button-primary button-hero">Create Template</a>

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
                    <tr data-template-id="<?php echo esc_attr($template['id']); ?>">
                        <td><?php echo esc_html($template['name']); ?></td>
                        <td>
                            <span class="template-status-badge status-<?php echo esc_attr($template['status']); ?>">
                                <?php echo esc_html(ucfirst($template['status'])); ?>
                            </span>
                        </td>
                        <td><?php echo esc_html(wp_date('M j, Y g:i A', strtotime($template['created_at']))); ?></td>
                        <td>
                            <button class="button button-primary generate-template-btn">Generate</button>
                            <button class="button delete-template-btn">Delete</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
