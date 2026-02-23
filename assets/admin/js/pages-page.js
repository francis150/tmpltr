/**
 * Tmpltr Pages Page JavaScript
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const SELECTORS = {
        tableBody: '.wp-list-table tbody',
        pageRow: 'tr[data-generated-page-id]',
        deleteBtn: '.pages-delete-btn',
        statsNumber: '.pages-stats__number',
        generateBtn: '.generate-template-btn'
    };

    function init() {
        document.addEventListener('click', handleTableClick);

        const generateBtn = document.querySelector(SELECTORS.generateBtn);
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateClick);
        }
    }

    function handleTableClick(e) {
        const deleteBtn = e.target.closest(SELECTORS.deleteBtn);
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(e);
        }
    }

    function handleDeleteClick(e) {
        const row = e.target.closest(SELECTORS.pageRow);
        if (!row) return;

        const generatedPageId = row.dataset.generatedPageId;
        const pageTitle = row.querySelector('td:first-child').textContent;

        TmpltrPopup.confirmation({
            title: 'Delete Page?',
            subtext: `Are you sure you want to delete "${pageTitle}"? This will permanently delete the page and cannot be undone.`,
            level: 'high',
            confirmText: 'Delete',
            onConfirm: () => deleteGeneratedPage(generatedPageId, row),
            cancelText: 'Cancel'
        });
    }

    function deleteGeneratedPage(generatedPageId, rowElement) {
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'tmpltr_delete_generated_page',
                nonce: tmpltrData.nonce,
                generated_page_id: generatedPageId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                rowElement.style.transition = 'opacity 0.3s';
                rowElement.style.opacity = '0';

                setTimeout(() => {
                    rowElement.remove();
                    updateStats();
                    checkEmptyState();

                    TmpltrToast.success({
                        title: 'Page deleted',
                        subtext: data.data.message || 'Page has been deleted successfully'
                    });
                }, 300);
            } else {
                TmpltrToast.error({
                    title: 'Failed to delete page',
                    subtext: data.data?.message || 'Unknown error occurred',
                    seconds: 7
                });
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to delete page. Please check your connection.',
                seconds: 8
            });
        });
    }

    function updateStats() {
        const statsNumber = document.querySelector(SELECTORS.statsNumber);
        if (!statsNumber) return;

        const remainingRows = document.querySelectorAll(SELECTORS.pageRow);
        statsNumber.textContent = remainingRows.length;
    }

    function handleGenerateClick(e) {
        const generateBtn = e.target.closest(SELECTORS.generateBtn);
        if (!generateBtn || generateBtn.disabled) return;

        const templateId = generateBtn.dataset.templateId;
        const templateName = generateBtn.dataset.templateName;

        fetchTemplateFields(templateId, templateName, generateBtn);
    }

    function fetchTemplateFields(templateId, templateName, generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Loading...';

        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'tmpltr_get_template_data',
                nonce: tmpltrData.nonce,
                template_id: templateId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showGeneratePopup(templateId, templateName, data.data.fields || [], data.data.prompts || []);
            } else {
                TmpltrToast.error({
                    title: 'Failed to load template',
                    subtext: data.data?.message || 'Could not load template fields',
                    seconds: 7
                });
            }
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to load template fields. Please check your connection.',
                seconds: 8
            });
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
        });
    }

    function showGeneratePopup(templateId, templateName, fields, prompts) {
        if (!prompts || prompts.length === 0) {
            TmpltrToast.warning({
                title: 'No prompts configured',
                subtext: 'This template has no prompts to generate content from'
            });
            return;
        }

        const inputs = [
            {
                name: 'page_title',
                type: 'text',
                placeholder: 'Page Title',
                required: true,
                width: '100%',
                value: ''
            },
            ...fields.map(field => ({
                name: field.unique_identifier,
                type: 'text',
                placeholder: field.label,
                required: field.is_required == 1,
                width: '100%',
                value: field.default_value || ''
            }))
        ];

        TmpltrPopup.form({
            title: `Generate from ${templateName}`,
            subtext: 'Fill in the fields below to generate a new page',
            level: 'low',
            inputs: inputs,
            submitText: 'Generate Page',
            onSubmit: async (formData) => {
                const result = await TmpltrGenerator.generate({
                    templateId,
                    templateName,
                    prompts,
                    fields,
                    formData
                });

                if (result?.saveResponse) {
                    addPageRow(result.saveResponse);
                }
            },
            cancelText: 'Cancel'
        });
    }

    function addPageRow(page) {
        let tbody = document.querySelector(SELECTORS.tableBody);

        if (!tbody) {
            const section = document.querySelector('.pages-section');
            if (!section) return;

            const table = document.createElement('table');
            table.className = 'wp-list-table widefat striped';

            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Page Title</th><th>Created</th><th>Actions</th></tr>';

            tbody = document.createElement('tbody');

            table.appendChild(thead);
            table.appendChild(tbody);
            section.appendChild(table);
        }

        hideEmptyState();

        const newRow = document.createElement('tr');
        newRow.dataset.generatedPageId = page.generated_page_id;
        newRow.innerHTML = `
            <td>${escapeHtml(page.page_title || '(Untitled)')}</td>
            <td>${escapeHtml(page.created_at)}</td>
            <td class="pages-actions">
                ${page.view_url ? `<a href="${page.view_url}" class="button button-secondary" target="_blank">View</a>` : ''}
                <button type="button" class="button button-secondary pages-delete-btn">Delete</button>
            </td>
        `;

        newRow.style.opacity = '0';
        tbody.insertBefore(newRow, tbody.firstChild);

        requestAnimationFrame(() => {
            newRow.style.transition = 'opacity 0.3s';
            newRow.style.opacity = '1';
        });

        updateStats();
    }

    function hideEmptyState() {
        const emptyState = document.querySelector('.pages-empty-state');
        const table = document.querySelector('.wp-list-table');

        if (emptyState) {
            emptyState.style.display = 'none';
        }
        if (table) {
            table.style.display = '';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function checkEmptyState() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        const remainingRows = tableBody.querySelectorAll(SELECTORS.pageRow);

        if (remainingRows.length === 0) {
            const table = document.querySelector('.wp-list-table');
            const section = document.querySelector('.pages-section');

            if (table) {
                table.style.display = 'none';
            }

            if (section && !section.querySelector('.pages-empty-state')) {
                const emptyState = document.createElement('div');
                emptyState.className = 'pages-empty-state';
                emptyState.innerHTML = '<p>No pages have been generated from this template yet.</p>';
                section.appendChild(emptyState);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
