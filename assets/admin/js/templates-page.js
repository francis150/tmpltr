/**
 * Tmpltr Templates Page JavaScript
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const SELECTORS = {
        tableBody: '.wp-list-table tbody',
        templateRow: 'tr[data-template-id]',
        deleteBtn: '.delete-template-btn',
        generateBtn: '.generate-template-btn'
    };

    function initTemplateList() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        tableBody.addEventListener('click', handleRowClick);
    }

    function handleRowClick(e) {
        const generateBtn = e.target.closest(SELECTORS.generateBtn);

        if (generateBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleGenerateClick(e);
            return;
        }

        const deleteBtn = e.target.closest(SELECTORS.deleteBtn);

        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(e);
            return;
        }

        const row = e.target.closest(SELECTORS.templateRow);
        if (!row) return;

        const templateId = row.dataset.templateId;
        if (!templateId) return;

        window.location.href = `admin.php?page=tmpltr-template&id=${templateId}`;
    }

    function handleDeleteClick(e) {
        const row = e.target.closest(SELECTORS.templateRow);
        if (!row) return;

        const templateId = row.dataset.templateId;
        const templateName = row.querySelector('td:first-child').textContent;

        TmpltrPopup.confirmation({
            title: 'Delete Template?',
            subtext: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
            level: 'high',
            confirmText: 'Delete',
            onConfirm: () => deleteTemplate(templateId, row),
            cancelText: 'Cancel'
        });
    }

    function handleGenerateClick(e) {
        const row = e.target.closest(SELECTORS.templateRow);
        if (!row) return;

        const templateId = row.dataset.templateId;
        const templateName = row.querySelector('td:first-child').textContent;
        const generateBtn = e.target.closest(SELECTORS.generateBtn);

        fetchTemplateFields(templateId, templateName, generateBtn);
    }

    function fetchTemplateFields(templateId, templateName, generateBtn) {
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Loading...';
        }

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
                showGeneratePopup(templateName, data.data.fields || []);
            } else {
                TmpltrToast.error({
                    title: 'Failed to load template',
                    subtext: data.data?.message || 'Could not load template fields',
                    seconds: 7
                });
            }

            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to load template fields. Please check your connection.',
                seconds: 8
            });

            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            }
        });
    }

    function showGeneratePopup(templateName, fields) {
        if (!fields || fields.length === 0) {
            TmpltrToast.warning({
                title: 'No fields available',
                subtext: 'This template has no fields to generate content from'
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
            onSubmit: (formData) => {
                console.log('Generate form submitted:', formData);

                TmpltrToast.success({
                    title: 'Form data logged',
                    subtext: 'Check the browser console to see the submitted data'
                });
            },
            cancelText: 'Cancel'
        });
    }

    function deleteTemplate(templateId, rowElement) {
        const deleteBtn = rowElement.querySelector(SELECTORS.deleteBtn);

        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Deleting...';
        }

        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'tmpltr_delete_template',
                nonce: tmpltrData.nonce,
                template_id: templateId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                rowElement.style.transition = 'opacity 0.3s';
                rowElement.style.opacity = '0';

                setTimeout(() => {
                    rowElement.remove();
                    checkEmptyState();

                    TmpltrToast.success({
                        title: 'Template deleted',
                        subtext: data.data.message || 'Template has been deleted successfully'
                    });
                }, 300);
            } else {
                TmpltrToast.error({
                    title: 'Failed to delete template',
                    subtext: data.data?.message || 'Unknown error occurred',
                    seconds: 7
                });

                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Delete';
                }
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to delete template. Please check your connection.',
                seconds: 8
            });

            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete';
            }
        });
    }

    function checkEmptyState() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        const remainingRows = tableBody.querySelectorAll(SELECTORS.templateRow);

        if (remainingRows.length === 0) {
            const table = document.querySelector('.wp-list-table');
            const emptyState = document.querySelector('.template-empty-state');

            if (table) {
                table.style.display = 'none';
            }

            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', initTemplateList);
})();
