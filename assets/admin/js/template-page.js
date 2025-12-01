/**
 * Tmpltr Template Page JavaScript
 *
 * @package Tmpltr
 */

(function() {
    'use strict';

    const SELECTORS = {
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
        const addFieldBtn = document.querySelector(SELECTORS.ADD_FIELD_BTN);
        const fieldRowsContainer = document.querySelector(SELECTORS.FIELD_ROWS_CONTAINER);

        if (!addFieldBtn || !fieldRowsContainer) {
            debugLog('Required elements not found. Field management not initialized.');
            return;
        }

        addFieldBtn.addEventListener('click', handleAddField);
        fieldRowsContainer.addEventListener('click', handleRemoveField);
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
     * Generates identifier from field name (e.g., "My Field" → "my_field")
     */
    function generateIdentifier(fieldName) {
        return fieldName
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }

    /**
     * Logs debug message if TMPLTR_DEBUG_MODE is enabled
     */
    function debugLog(message) {
        if (typeof TMPLTR_DEBUG_MODE !== 'undefined' && TMPLTR_DEBUG_MODE) {
            console.log('[Tmpltr Fields]', message);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFieldManagement);
    } else {
        initFieldManagement();
    }
})();
