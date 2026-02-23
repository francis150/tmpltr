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
        duplicateBtn: '.template-options__item--duplicate',
        generateBtn: '.generate-template-btn',
        statusBadge: '.template-status-badge',
        optionsTrigger: '.template-options__trigger',
        optionsDropdown: '.template-options__dropdown',
        optionsContainer: '.template-options'
    };

    const CLASSES = {
        triggerOpen: 'template-options__trigger--open',
        dropdownOpen: 'template-options__dropdown--open'
    };

    let activeDropdown = null;

    function initTemplateList() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        tableBody.addEventListener('click', handleTableClick);
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);
    }

    function handleTableClick(e) {
        const generateBtn = e.target.closest(SELECTORS.generateBtn);
        if (generateBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleGenerateClick(e);
            return;
        }

        const optionsTrigger = e.target.closest(SELECTORS.optionsTrigger);
        if (optionsTrigger) {
            e.preventDefault();
            e.stopPropagation();
            handleOptionsToggle(optionsTrigger);
            return;
        }

        const deleteBtn = e.target.closest(SELECTORS.deleteBtn);
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            closeActiveDropdown();
            handleDeleteClick(e);
            return;
        }

        const duplicateBtn = e.target.closest(SELECTORS.duplicateBtn);
        if (duplicateBtn) {
            e.preventDefault();
            e.stopPropagation();
            closeActiveDropdown();
            handleDuplicateClick(e);
            return;
        }

        const row = e.target.closest(SELECTORS.templateRow);
        if (row && !e.target.closest('button, a, .template-options')) {
            handleRowClick(row);
        }
    }

    function handleRowClick(row) {
        const templateId = row.dataset.templateId;
        if (!templateId) return;

        window.location.href = tmpltrData.siteUrl + 'wp-admin/admin.php?page=tmpltr-pages&template_id=' + templateId;
    }

    function handleOptionsToggle(trigger) {
        const container = trigger.closest(SELECTORS.optionsContainer);
        const dropdown = container.querySelector(SELECTORS.optionsDropdown);

        if (activeDropdown && activeDropdown !== dropdown) {
            closeActiveDropdown();
        }

        const isOpen = dropdown.classList.contains(CLASSES.dropdownOpen);

        if (isOpen) {
            closeDropdown(trigger, dropdown);
        } else {
            openDropdown(trigger, dropdown);
        }
    }

    function openDropdown(trigger, dropdown) {
        trigger.classList.add(CLASSES.triggerOpen);
        trigger.setAttribute('aria-expanded', 'true');
        dropdown.classList.add(CLASSES.dropdownOpen);
        activeDropdown = dropdown;
    }

    function closeDropdown(trigger, dropdown) {
        trigger.classList.remove(CLASSES.triggerOpen);
        trigger.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove(CLASSES.dropdownOpen);
        activeDropdown = null;
    }

    function closeActiveDropdown() {
        if (!activeDropdown) return;

        const container = activeDropdown.closest(SELECTORS.optionsContainer);
        const trigger = container.querySelector(SELECTORS.optionsTrigger);
        closeDropdown(trigger, activeDropdown);
    }

    function handleDocumentClick(e) {
        if (!activeDropdown) return;

        const container = activeDropdown.closest(SELECTORS.optionsContainer);
        if (!container.contains(e.target)) {
            closeActiveDropdown();
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && activeDropdown) {
            closeActiveDropdown();
        }
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

    function handleDuplicateClick(e) {
        const row = e.target.closest(SELECTORS.templateRow);
        if (!row) return;

        const templateId = row.dataset.templateId;
        duplicateTemplate(templateId);
    }

    function handleGenerateClick(e) {
        const row = e.target.closest(SELECTORS.templateRow);
        if (!row) return;

        const statusBadge = row.querySelector(SELECTORS.statusBadge);
        if (statusBadge && statusBadge.classList.contains('status-draft')) {
            TmpltrToast.error({
                title: 'Cannot generate from draft',
                subtext: 'Please publish this template before generating pages'
            });
            return;
        }

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
                showGeneratePopup(templateId, templateName, data.data.fields || [], data.data.prompts || []);
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
            subtext: `Fill in the fields below to generate a new page. <strong>Credit cost: ${prompts.length}</strong>`,
            level: 'low',
            inputs: inputs,
            submitText: 'Generate Page',
            onSubmit: async (formData) => {
                try {
                    await TmpltrGenerator.generate({
                        templateId,
                        templateName,
                        prompts,
                        fields,
                        formData
                    });
                } catch (error) {
                    // Error already shown by generator via toast
                }
            },
            cancelText: 'Cancel'
        });
    }

    function deleteTemplate(templateId, rowElement) {
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
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to delete template. Please check your connection.',
                seconds: 8
            });
        });
    }

    function duplicateTemplate(templateId) {
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'tmpltr_duplicate_template',
                nonce: tmpltrData.nonce,
                template_id: templateId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addTemplateRow(data.data.template);
                TmpltrToast.success({
                    title: 'Template duplicated',
                    subtext: data.data.message
                });
            } else {
                TmpltrToast.error({
                    title: 'Failed to duplicate template',
                    subtext: data.data?.message || 'Unknown error occurred',
                    seconds: 7
                });
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to duplicate template. Please check your connection.',
                seconds: 8
            });
        });
    }

    function addTemplateRow(template) {
        const tbody = document.querySelector(SELECTORS.tableBody);
        if (!tbody) return;

        const editUrl = tmpltrData.siteUrl + 'wp-admin/admin.php?page=tmpltr-template&id=' + template.id;

        const newRow = document.createElement('tr');
        newRow.dataset.templateId = template.id;
        newRow.innerHTML = `
            <td>${escapeHtml(template.name)}</td>
            <td>
                <span class="template-status-badge status-${template.status}">
                    ${template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                </span>
            </td>
            <td>${template.created_at}</td>
            <td class="template-actions">
                <button class="button button-primary generate-template-btn" disabled>Generate</button>
                <div class="template-options">
                    <button type="button" class="template-options__trigger" aria-label="More options" aria-expanded="false">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                    <div class="template-options__dropdown">
                        <a href="${editUrl}" class="template-options__item">
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
        `;

        newRow.style.opacity = '0';
        tbody.insertBefore(newRow, tbody.firstChild);

        requestAnimationFrame(() => {
            newRow.style.transition = 'opacity 0.3s';
            newRow.style.opacity = '1';
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
