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
        deleteBtn: '.delete-template-btn'
    };

    function initTemplateList() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        tableBody.addEventListener('click', handleRowClick);
    }

    function handleRowClick(e) {
        const deleteBtn = e.target.closest(SELECTORS.deleteBtn);

        if (deleteBtn) {
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

        console.log('Delete button clicked for template:', {
            id: templateId,
            name: templateName
        });
    }

    document.addEventListener('DOMContentLoaded', initTemplateList);
})();
