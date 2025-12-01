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
        FIELD_ROW: '.field-row'
    };

    let fieldCounter = 0;

    /**
     * Initializes field management functionality
     */
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

    function handleKeyboardShortcuts(e) {
        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'Enter') {
            if (!isInFieldsContext()) {
                return;
            }

            e.preventDefault();
            const addFieldBtn = document.querySelector(SELECTORS.ADD_FIELD_BTN);
            if (addFieldBtn) {
                addFieldBtn.click();
            }
            return;
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
            // Future sections will go here:
            // prompts: [],
            // templatePage: {}
        };

        // Group field inputs by field number
        const fieldGroups = {};

        for (const [name, value] of formData.entries()) {
            // Parse field inputs (e.g., "field_name-1", "field_required-2")
            if (name.startsWith('field_')) {
                const match = name.match(/^field_(.+)-(\d+)$/);
                if (match) {
                    const [, fieldName, fieldNumber] = match;
                    const num = parseInt(fieldNumber, 10);

                    if (!fieldGroups[num]) {
                        fieldGroups[num] = { fieldNumber: num };
                    }

                    // Handle checkbox values (convert to boolean)
                    if (fieldName === 'required') {
                        fieldGroups[num][fieldName] = value === 'on';
                    } else {
                        fieldGroups[num][fieldName] = value;
                    }
                }
            }

            // Future: Handle prompt inputs
            // if (name.startsWith('prompt_')) { ... }

            // Future: Handle template page inputs
            // if (name.startsWith('template_')) { ... }
        }

        // Convert field groups object to array
        data.fields = Object.values(fieldGroups);

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

    /**
     * Sets up real-time identifier generation for a field
     */
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFieldManagement);
    } else {
        initFieldManagement();
    }
})();
