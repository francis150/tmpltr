/**
 * Tmpltr Template Page JavaScript
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const SELECTORS = {
        TEMPLATE_FORM: '.template-form',
        FIELD_ROWS_CONTAINER: '.field-rows',
        ADD_FIELD_BTN: '.add-field-btn',
        REMOVE_FIELD_BTN: '.remove-field-btn',
        FIELD_ROW: '.field-row',
        PROMPT_ROWS_CONTAINER: '.prompt-rows',
        ADD_PROMPT_BTN: '.add-prompt-btn',
        REMOVE_PROMPT_BTN: '.remove-prompt-btn',
        PROMPT_ROW: '.prompt-row'
    };

    let fieldCounter = 0;
    let promptCounter = 0;

    function initFieldManagement() {
        const templateForm = document.querySelector(SELECTORS.TEMPLATE_FORM);
        const addFieldBtn = document.querySelector(SELECTORS.ADD_FIELD_BTN);
        const fieldRowsContainer = document.querySelector(SELECTORS.FIELD_ROWS_CONTAINER);

        if (!addFieldBtn || !fieldRowsContainer) {
            debugLog('Required elements not found. Field management not initialized.');
            return;
        }

        addFieldBtn.addEventListener('click', handleAddField);
        fieldRowsContainer.addEventListener('click', handleRemoveField);
        document.addEventListener('keydown', handleKeyboardShortcuts);

        if (templateForm) {
            templateForm.addEventListener('submit', handleFormSubmit);
        }
    }

    function initPromptManagement() {
        const addPromptBtn = document.querySelector(SELECTORS.ADD_PROMPT_BTN);
        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);

        if (!addPromptBtn || !promptRowsContainer) {
            debugLog('Required elements not found. Prompt management not initialized.');
            return;
        }

        addPromptBtn.addEventListener('click', handleAddPrompt);
        promptRowsContainer.addEventListener('click', handleRemovePrompt);
        promptRowsContainer.addEventListener('click', handleCopyPlaceholder);
    }

    /**
     * Handles add field button click
     */
    function handleAddField(e) {
        e.preventDefault();

        const fieldRowsContainer = document.querySelector(SELECTORS.FIELD_ROWS_CONTAINER);
        if (!fieldRowsContainer) {
            return;
        }

        fieldCounter++;
        const newFieldRow = createFieldRow(fieldCounter);
        fieldRowsContainer.insertAdjacentHTML('beforeend', newFieldRow);

        setupFieldNameListener(fieldCounter);
        debugLog(`Field ${fieldCounter} added`);

        const fieldNameInput = document.getElementById(`field-name-${fieldCounter}`);
        if (fieldNameInput) {
            fieldNameInput.focus();
        }
    }

    /**
     * Handles remove field button click (event delegation)
     */
    function handleRemoveField(e) {
        if (!e.target.classList.contains('remove-field-btn')) {
            return;
        }

        e.preventDefault();
        const fieldRow = e.target.closest(SELECTORS.FIELD_ROW);

        if (fieldRow) {
            const fieldNumber = fieldRow.dataset.fieldNumber;
            fieldRow.remove();
            debugLog(`Field ${fieldNumber} removed`);
        }
    }

    function handleAddPrompt(e) {
        e.preventDefault();

        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);
        if (!promptRowsContainer) {
            return;
        }

        promptCounter++;
        const newPromptRow = createPromptRow(promptCounter);
        promptRowsContainer.insertAdjacentHTML('beforeend', newPromptRow);

        debugLog(`Prompt ${promptCounter} added`);

        const promptTextarea = document.getElementById(`prompt-text-${promptCounter}`);
        if (promptTextarea) {
            promptTextarea.focus();
        }
    }

    function handleRemovePrompt(e) {
        if (!e.target.classList.contains('remove-prompt-btn')) {
            return;
        }

        e.preventDefault();
        const promptRow = e.target.closest(SELECTORS.PROMPT_ROW);

        if (promptRow) {
            const promptNumber = promptRow.dataset.promptNumber;
            promptRow.remove();
            debugLog(`Prompt ${promptNumber} removed`);
        }
    }

    function handleCopyPlaceholder(e) {
        const copyBtn = e.target.closest('.copy-btn');
        if (!copyBtn) {
            return;
        }

        e.preventDefault();
        const targetId = copyBtn.dataset.copyTarget;
        const targetInput = document.getElementById(targetId);

        if (!targetInput) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(targetInput.value).then(() => {
                showCopyFeedback(copyBtn, targetInput.value);
            }).catch(err => {
                debugLog('Clipboard API failed: ' + err);
                fallbackCopy(targetInput, copyBtn);
            });
        } else {
            fallbackCopy(targetInput, copyBtn);
        }
    }

    function fallbackCopy(inputElement, copyBtn) {
        try {
            inputElement.select();
            inputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
            showCopyFeedback(copyBtn, inputElement.value);
        } catch (err) {
            debugLog('Failed to copy: ' + err);
        }
    }

    function showCopyFeedback(copyBtn, copiedValue) {
        const icon = copyBtn.querySelector('.dashicons');
        if (icon) {
            icon.classList.remove('dashicons-admin-page');
            icon.classList.add('dashicons-yes');
        }
        copyBtn.classList.add('copied');

        setTimeout(() => {
            if (icon) {
                icon.classList.remove('dashicons-yes');
                icon.classList.add('dashicons-admin-page');
            }
            copyBtn.classList.remove('copied');
        }, 2000);

        debugLog(`Copied: ${copiedValue}`);
    }

    function isInFieldsContext() {
        const focusedElement = document.activeElement;
        const fieldRowsContainer = document.querySelector(SELECTORS.FIELD_ROWS_CONTAINER);

        if (!fieldRowsContainer) {
            return false;
        }

        if (focusedElement.tagName === 'TEXTAREA') {
            return false;
        }

        const isNoFocus = focusedElement === document.body;
        const isFocusedInFieldsSection = fieldRowsContainer.contains(focusedElement);

        return isNoFocus || isFocusedInFieldsSection;
    }

    function isInPromptsContext() {
        const focusedElement = document.activeElement;
        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);

        if (!promptRowsContainer) {
            return false;
        }

        const isFocusedInPromptsSection = promptRowsContainer.contains(focusedElement);

        return isFocusedInPromptsSection;
    }

    function handleKeyboardShortcuts(e) {
        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'Enter') {
            if (isInFieldsContext()) {
                e.preventDefault();
                const addFieldBtn = document.querySelector(SELECTORS.ADD_FIELD_BTN);
                if (addFieldBtn) {
                    addFieldBtn.click();
                }
                return;
            }

            if (isInPromptsContext()) {
                e.preventDefault();
                const addPromptBtn = document.querySelector(SELECTORS.ADD_PROMPT_BTN);
                if (addPromptBtn) {
                    addPromptBtn.click();
                }
                return;
            }
        }
    }

    /**
     * Handles template form submission
     * Collects all form data and logs to console
     *
     * @param {Event} e - Form submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        debugLog('Form submitted - collecting template data...');

        // Collect all form data (works for fields, prompts, template page, etc.)
        const formData = collectFormData();

        // Display results in console
        console.group('=== Template Form Data ===');
        console.log('Form data collected:', formData);
        console.groupEnd();
    }

    /**
     * Collects all data from the template form
     * Works for all form sections: fields, prompts, template page, etc.
     *
     * @returns {Object} Form data organized by section
     */
    function collectFormData() {
        const form = document.querySelector(SELECTORS.TEMPLATE_FORM);

        if (!form) {
            debugLog('Warning: Template form not found');
            return {};
        }

        // Use native FormData API to get all form inputs
        const formData = new FormData(form);
        const data = {
            fields: [],
            prompts: []
        };

        const fieldGroups = {};
        const promptGroups = {};

        for (const [name, value] of formData.entries()) {
            if (name.startsWith('field_')) {
                const match = name.match(/^field_(.+)-(\d+)$/);
                if (match) {
                    const [, fieldName, fieldNumber] = match;
                    const num = parseInt(fieldNumber, 10);

                    if (!fieldGroups[num]) {
                        fieldGroups[num] = { fieldNumber: num };
                    }

                    if (fieldName === 'required') {
                        fieldGroups[num][fieldName] = value === 'on';
                    } else {
                        fieldGroups[num][fieldName] = value;
                    }
                }
            }

            if (name.startsWith('prompt_')) {
                const match = name.match(/^prompt_(.+)-(\d+)$/);
                if (match) {
                    const [, promptField, promptNumber] = match;
                    const num = parseInt(promptNumber, 10);

                    if (!promptGroups[num]) {
                        promptGroups[num] = { promptNumber: num };
                    }

                    promptGroups[num][promptField] = value;
                }
            }
        }

        data.fields = Object.values(fieldGroups);
        data.prompts = Object.values(promptGroups);

        return data;
    }

    /**
     * Creates HTML for a new field row
     */
    function createFieldRow(fieldNumber) {
        return `
            <div class="field-row" data-field-number="${fieldNumber}">
                <div class="field-group">
                    <label for="field-name-${fieldNumber}">Field Name</label>
                    <input
                        type="text"
                        id="field-name-${fieldNumber}"
                        name="field_name-${fieldNumber}"
                        class="regular-text"
                    >
                </div>

                <div class="field-group">
                    <label for="field-identifier-${fieldNumber}">Identifier</label>
                    <input
                        type="text"
                        id="field-identifier-${fieldNumber}"
                        name="field_identifier-${fieldNumber}"
                        class="regular-text"
                        readonly
                    >
                </div>

                <div class="field-group">
                    <label for="field-required-${fieldNumber}">Required</label>
                    <input
                        type="checkbox"
                        id="field-required-${fieldNumber}"
                        name="field_required-${fieldNumber}"
                    >
                </div>

                <div class="field-group">
                    <label for="field-default-value-${fieldNumber}">Default Value</label>
                    <input
                        type="text"
                        id="field-default-value-${fieldNumber}"
                        name="field_default_value-${fieldNumber}"
                        class="regular-text"
                    >
                </div>

                <button type="button" class="button button-link-delete remove-field-btn" aria-label="Remove field">
                    Remove
                </button>
            </div>
        `;
    }

    function createPromptRow(promptNumber) {
        return `
            <div class="prompt-row" data-prompt-number="${promptNumber}">
                <div class="prompt-group">
                    <label for="prompt-text-${promptNumber}">Prompt</label>
                    <textarea
                        id="prompt-text-${promptNumber}"
                        name="prompt_text-${promptNumber}"
                        rows="4"
                        class="large-text"
                    ></textarea>
                </div>

                <div class="prompt-group prompt-group-with-copy">
                    <label for="prompt-placeholder-${promptNumber}">Placeholder</label>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input
                            type="text"
                            id="prompt-placeholder-${promptNumber}"
                            name="prompt_placeholder-${promptNumber}"
                            value="{prompt_${promptNumber}}"
                            class="regular-text"
                            readonly
                        >
                        <button type="button" class="button button-small copy-btn" data-copy-target="prompt-placeholder-${promptNumber}" aria-label="Copy placeholder">
                            <span class="dashicons dashicons-admin-page"></span>
                        </button>
                    </div>
                </div>

                <button type="button" class="button button-link-delete remove-prompt-btn" aria-label="Remove prompt">
                    Remove
                </button>
            </div>
        `;
    }

    function setupFieldNameListener(fieldNumber) {
        const fieldNameInput = document.getElementById(`field-name-${fieldNumber}`);
        const fieldIdentifierInput = document.getElementById(`field-identifier-${fieldNumber}`);

        if (!fieldNameInput || !fieldIdentifierInput) {
            return;
        }

        fieldNameInput.addEventListener('input', function() {
            fieldIdentifierInput.value = generateIdentifier(this.value);
        });
    }

    /**
     * Generates identifier from field name (e.g., "My Field" → "@my_field")
     */
    function generateIdentifier(fieldName) {
        return '@' + fieldName
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }

    /**
     * Logs debug message if TMPLTR_DEBUG_MODE is enabled
     */
    function debugLog(message) {
        if (typeof TMPLTR_DEBUG_MODE !== 'undefined' && TMPLTR_DEBUG_MODE) {
            console.log('[Tmpltr Template]', message);
        }
    }

    function init() {
        initFieldManagement();
        initPromptManagement();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
