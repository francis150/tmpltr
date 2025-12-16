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
        statsNumber: '.pages-stats__number'
    };

    function init() {
        const tableBody = document.querySelector(SELECTORS.tableBody);
        if (!tableBody) return;

        tableBody.addEventListener('click', handleTableClick);
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
