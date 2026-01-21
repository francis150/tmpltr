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
        PROMPT_ROW: '.prompt-row',
        TEMPLATE_PAGE_SELECT: '#template-page-select',
        TEMPLATE_STATUS_SELECT: '#template-status',
        PROMPT_TEXTAREA: '[id^="prompt-text-"]',
        FIELD_IDENTIFIER: '[id^="field-identifier-"]',
        AUTOCOMPLETE_DROPDOWN: '.prompt-autocomplete',
        HIGHLIGHT_WRAPPER: '.highlight-wrapper',
        BACKDROP: '.backdrop'
    };

    let fieldCounter = 0;
    let promptCounter = 0;
    let lastPageLoadTime = 0;
    let pageSelectorLoaded = false;
    const PAGE_LOAD_DEBOUNCE = 1000; // 1 second

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

        initAutocomplete();
        initTextareaHighlighting();
    }

    /**
     * Initializes the page selector functionality
     * Adds focus event listener to load fresh page list when dropdown opens
     */
    function initPageSelector() {
        const pageSelect = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);

        if (!pageSelect) {
            debugLog('Page selector not found. Page selector not initialized.');
            return;
        }

        // Load pages when user focuses on the dropdown
        pageSelect.addEventListener('focus', handlePageSelectorFocus);
        loadPageOptions();
        debugLog('Page selector initialized');
    }

    /**
     * Handles focus event on page selector
     * Implements debouncing to prevent rapid duplicate AJAX calls
     */
    function handlePageSelectorFocus(e) {
        const now = Date.now();

        // Debounce: skip if loaded within last second
        if (now - lastPageLoadTime < PAGE_LOAD_DEBOUNCE) {
            debugLog('Page selector focus - skipping (debounced)');
            return;
        }

        loadPageOptions();
        lastPageLoadTime = now;
    }

    /**
     * Loads WordPress pages via AJAX
     * Shows loading indicator and populates dropdown with fresh page list
     */
    function loadPageOptions() {
        const select = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);
        if (!select) return;

        const currentValue = select.value;
        const savedPageId = select.dataset.selectedPage;
        const valueToSelect = (currentValue && currentValue !== '0') ? currentValue : (savedPageId && savedPageId !== '0' ? savedPageId : currentValue);

        debugLog('Page loading - currentValue: ' + currentValue + ', savedPageId: ' + savedPageId + ', valueToSelect: ' + valueToSelect);

        // Show loading indicator on first load
        if (!pageSelectorLoaded) {
            select.innerHTML = '<option value="0">Loading pages...</option>';
        }

        // Fetch pages from server
        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'tmpltr_get_pages',
                nonce: tmpltrData.nonce
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                handlePageLoadError(data.data?.message || 'Unknown error');
                return;
            }

            populatePageOptions(data.data.pages, valueToSelect);
            pageSelectorLoaded = true;
            debugLog(`Loaded ${data.data.pages.length} pages`);
        })
        .catch(error => {
            handlePageLoadError('Network error: ' + error.message);
        });
    }

    /**
     * Populates the page selector dropdown with page options
     * Preserves current selection if it still exists in the new list
     *
     * @param {Array} pages - Array of page objects with id, title, and status
     * @param {string} currentValue - Currently selected page ID to preserve
     */
    function populatePageOptions(pages, currentValue) {
        const select = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);
        if (!select) return;

        // Clear existing options and add default
        select.innerHTML = '<option value="0">Select a page...</option>';

        // Handle empty state
        if (!pages || pages.length === 0) {
            select.innerHTML = '<option value="0">No pages found - create one first</option>';
            debugLog('No pages available');
            return;
        }

        // Add each page as an option
        pages.forEach(page => {
            const option = document.createElement('option');
            option.value = page.id;
            // Show status for draft/private pages
            option.textContent = page.title + (page.status !== 'publish' ? ` (${page.status})` : '');

            // Preserve current selection
            if (page.id == currentValue) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        debugLog(`Populated ${pages.length} page options`);
    }

    /**
     * Handles errors when loading pages
     * Preserves current selection and shows error message
     *
     * @param {string} errorMsg - Error message to log
     */
    function handlePageLoadError(errorMsg) {
        debugLog('Page loading failed: ' + errorMsg);

        const select = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);
        if (!select) return;

        const currentValue = select.value;
        const currentText = select.options[select.selectedIndex]?.text || '';

        // Show error message
        select.innerHTML = '<option value="0">Failed to load - try again</option>';

        // Preserve currently selected page if it exists
        if (currentValue && currentValue !== '0' && currentText) {
            const preservedOption = document.createElement('option');
            preservedOption.value = currentValue;
            preservedOption.textContent = currentText;
            preservedOption.selected = true;
            select.appendChild(preservedOption);
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
            validateFieldNames();
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

        setupTextareaHighlighting(promptCounter);

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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function buildIdentifierRegex(identifiers) {
        if (identifiers.length === 0) return null;
        const escapedIdentifiers = identifiers.map(id => escapeRegex(id));
        const pattern = escapedIdentifiers.join('|');
        return new RegExp(pattern, 'g');
    }

    function getCurrentFieldIdentifiers() {
        const identifierInputs = document.querySelectorAll(SELECTORS.FIELD_IDENTIFIER);
        const identifiers = Array.from(identifierInputs)
            .map(input => input.value.trim())
            .filter(value => value.startsWith('@') && value.length > 1);
        return identifiers;
    }

    function syncScroll(textarea, backdrop) {
        backdrop.scrollTop = textarea.scrollTop;
        backdrop.scrollLeft = textarea.scrollLeft;
    }

    function updateBackdrop(textarea) {
        const wrapper = textarea.closest(SELECTORS.HIGHLIGHT_WRAPPER);
        if (!wrapper) return;

        const backdrop = wrapper.querySelector(SELECTORS.BACKDROP);
        if (!backdrop) return;

        const computed = getComputedStyle(textarea);
        backdrop.style.font = computed.font;
        backdrop.style.fontSize = computed.fontSize;
        backdrop.style.fontFamily = computed.fontFamily;
        backdrop.style.lineHeight = computed.lineHeight;
        backdrop.style.padding = computed.padding;
        backdrop.style.border = '1px solid transparent';
        backdrop.style.letterSpacing = computed.letterSpacing;
        backdrop.style.wordSpacing = computed.wordSpacing;

        const text = textarea.value;
        const identifiers = getCurrentFieldIdentifiers();

        if (identifiers.length === 0) {
            backdrop.innerHTML = escapeHtml(text);
            syncScroll(textarea, backdrop);
            return;
        }

        const regex = buildIdentifierRegex(identifiers);
        const highlightedHtml = escapeHtml(text).replace(regex, (match) => {
            return `<mark class="identifier-highlight">${match}</mark>`;
        });

        backdrop.innerHTML = highlightedHtml;
        syncScroll(textarea, backdrop);
    }

    function setupTextareaHighlighting(promptNumber) {
        const textarea = document.getElementById(`prompt-text-${promptNumber}`);
        if (!textarea) return;

        updateBackdrop(textarea);

        textarea.addEventListener('scroll', function() {
            const wrapper = this.closest(SELECTORS.HIGHLIGHT_WRAPPER);
            if (!wrapper) return;
            const backdrop = wrapper.querySelector(SELECTORS.BACKDROP);
            if (backdrop) {
                syncScroll(this, backdrop);
            }
        });
    }

    function initTextareaHighlighting() {
        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);
        if (!promptRowsContainer) return;

        promptRowsContainer.addEventListener('input', function(e) {
            if (e.target.matches(SELECTORS.PROMPT_TEXTAREA)) {
                updateBackdrop(e.target);
            }
        });
    }

    function getCaretCoordinates(textarea, position) {
        const mirror = document.createElement('div');
        const computed = getComputedStyle(textarea);

        mirror.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: pre-wrap;
            word-wrap: break-word;
            font: ${computed.font};
            padding: ${computed.padding};
            border: ${computed.border};
            box-sizing: ${computed.boxSizing};
            width: ${textarea.clientWidth}px;
        `;

        const textBeforeCaret = textarea.value.substring(0, position);
        mirror.textContent = textBeforeCaret;

        const marker = document.createElement('span');
        marker.textContent = '|';
        mirror.appendChild(marker);

        document.body.appendChild(mirror);

        const coords = {
            top: marker.offsetTop,
            left: marker.offsetLeft,
            height: marker.offsetHeight
        };

        document.body.removeChild(mirror);
        return coords;
    }

    let currentAutocomplete = null;
    let currentSelectedIndex = -1;

    function hideAutocomplete() {
        if (currentAutocomplete) {
            const textarea = currentAutocomplete.textarea;
            if (textarea) {
                textarea.removeAttribute('aria-controls');
                textarea.removeAttribute('aria-activedescendant');
                textarea.setAttribute('aria-expanded', 'false');
            }

            if (currentAutocomplete.dropdown && currentAutocomplete.dropdown.parentNode) {
                currentAutocomplete.dropdown.remove();
            }

            currentAutocomplete = null;
            currentSelectedIndex = -1;
        }
    }

    function updateAriaAttributes(textarea, dropdown, selectedIndex) {
        if (selectedIndex >= 0) {
            const selectedItem = dropdown.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedItem) {
                textarea.setAttribute('aria-activedescendant', selectedItem.id);
            }
        } else {
            textarea.removeAttribute('aria-activedescendant');
        }
    }

    function navigateSuggestions(direction) {
        if (!currentAutocomplete || !currentAutocomplete.dropdown) return;

        const dropdown = currentAutocomplete.dropdown;
        const items = dropdown.querySelectorAll('.prompt-autocomplete__item');

        if (items.length === 0) return;

        items.forEach(item => item.classList.remove('prompt-autocomplete__item--selected'));

        if (direction === 'down') {
            currentSelectedIndex = (currentSelectedIndex + 1) % items.length;
        } else if (direction === 'up') {
            currentSelectedIndex = currentSelectedIndex <= 0 ? items.length - 1 : currentSelectedIndex - 1;
        }

        items[currentSelectedIndex].classList.add('prompt-autocomplete__item--selected');
        items[currentSelectedIndex].scrollIntoView({ block: 'nearest' });

        updateAriaAttributes(currentAutocomplete.textarea, dropdown, currentSelectedIndex);
    }

    function insertIdentifier(textarea, identifier) {
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);

        const atIndex = textBefore.lastIndexOf('@');
        if (atIndex === -1) return;

        const beforeAt = textBefore.substring(0, atIndex);
        const newValue = beforeAt + identifier + ' ' + textAfter;

        textarea.value = newValue;

        const newCursorPos = beforeAt.length + identifier.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        textarea.focus();

        updateBackdrop(textarea);

        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function showAutocomplete(textarea, searchTerm) {
        const identifiers = getCurrentFieldIdentifiers();

        let filtered = identifiers;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = identifiers.filter(id => id.toLowerCase().includes(search));
        }

        hideAutocomplete();

        if (filtered.length === 0) {
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'prompt-autocomplete';
        dropdown.setAttribute('role', 'listbox');
        dropdown.id = `autocomplete-${Date.now()}`;

        filtered.forEach((identifier, index) => {
            const item = document.createElement('div');
            item.className = 'prompt-autocomplete__item';
            if (index === 0) {
                item.classList.add('prompt-autocomplete__item--selected');
                currentSelectedIndex = 0;
            }
            item.setAttribute('role', 'option');
            item.id = `suggestion-${Date.now()}-${index}`;
            item.dataset.index = index;
            item.dataset.identifier = identifier;

            const code = document.createElement('code');
            code.textContent = identifier;
            item.appendChild(code);

            item.addEventListener('click', function() {
                insertIdentifier(textarea, this.dataset.identifier);
                hideAutocomplete();
            });

            dropdown.appendChild(item);
        });

        const promptGroup = textarea.closest('.prompt-group');
        promptGroup.style.position = 'relative';
        promptGroup.appendChild(dropdown);

        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const atIndex = textBefore.lastIndexOf('@');

        const coords = getCaretCoordinates(textarea, atIndex);
        const textareaRect = textarea.getBoundingClientRect();
        const promptGroupRect = promptGroup.getBoundingClientRect();

        const topPosition = (textareaRect.top - promptGroupRect.top) + coords.top + coords.height + 2;
        const leftPosition = (textareaRect.left - promptGroupRect.left) + coords.left;

        dropdown.style.top = topPosition + 'px';
        dropdown.style.left = leftPosition + 'px';

        textarea.setAttribute('aria-expanded', 'true');
        textarea.setAttribute('aria-controls', dropdown.id);

        if (currentSelectedIndex >= 0) {
            updateAriaAttributes(textarea, dropdown, currentSelectedIndex);
        }

        currentAutocomplete = { textarea, dropdown };
    }

    function handleAutocompleteInput(e) {
        const textarea = e.target;
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);

        const atIndex = textBefore.lastIndexOf('@');

        if (atIndex === -1) {
            hideAutocomplete();
            return;
        }

        const textAfterAt = textBefore.substring(atIndex + 1);

        if (/\s/.test(textAfterAt) && textAfterAt.length > 0) {
            const words = textAfterAt.split(/\s/);
            if (words.length > 1) {
                hideAutocomplete();
                return;
            }
        }

        const searchTerm = '@' + textAfterAt;
        showAutocomplete(textarea, searchTerm);
    }

    function handleAutocompleteKeydown(e) {
        if (!currentAutocomplete) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateSuggestions('down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateSuggestions('up');
        } else if (e.key === 'Enter' && currentAutocomplete) {
            e.preventDefault();
            const selectedItem = currentAutocomplete.dropdown.querySelector('.prompt-autocomplete__item--selected');
            if (selectedItem) {
                insertIdentifier(currentAutocomplete.textarea, selectedItem.dataset.identifier);
                hideAutocomplete();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideAutocomplete();
        }
    }

    function initAutocomplete() {
        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);
        if (!promptRowsContainer) return;

        promptRowsContainer.addEventListener('input', function(e) {
            if (e.target.matches(SELECTORS.PROMPT_TEXTAREA)) {
                handleAutocompleteInput(e);
            }
        });

        promptRowsContainer.addEventListener('keydown', function(e) {
            if (e.target.matches(SELECTORS.PROMPT_TEXTAREA)) {
                handleAutocompleteKeydown(e);
            }
        });

        document.addEventListener('click', function(e) {
            if (currentAutocomplete && !e.target.closest(SELECTORS.AUTOCOMPLETE_DROPDOWN) && !e.target.matches(SELECTORS.PROMPT_TEXTAREA)) {
                hideAutocomplete();
            }
        });
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
     * Collects all form data and sends via AJAX
     *
     * @param {Event} e - Form submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';

        debugLog('Form submitted - collecting template data...');

        if (!validateFormBeforeSubmit()) {
            return;
        }

        const formData = collectFormData();
        const templateId = getTemplateId();

        if (!templateId) {
            TmpltrToast.error({
                title: 'Template ID is missing',
                subtext: 'Cannot load template data'
            });
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
        }

        const requestBody = new URLSearchParams({
            action: 'tmpltr_save_template',
            nonce: tmpltrData.nonce,
            template_id: templateId,
            template_name: formData.template_name,
            template_status: formData.template_status,
            template_page_id: formData.template_page_id,
            fields: JSON.stringify(formData.fields),
            prompts: JSON.stringify(formData.prompts)
        });

        fetch(tmpltrData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                TmpltrToast.success({
                    title: 'Template saved successfully',
                    subtext: data.data.message || ''
                });
                debugLog('Template saved successfully');
            } else {
                TmpltrToast.error({
                    title: 'Failed to save template',
                    subtext: data.data?.message || 'Unknown error',
                    seconds: 7
                });
                debugLog('Save failed: ' + (data.data?.message || 'Unknown error'));
            }
        })
        .catch(error => {
            TmpltrToast.error({
                title: 'Network error',
                subtext: 'Failed to save template. Please check your connection.',
                seconds: 8
            });
            debugLog('Network error: ' + error.message);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
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
            template_name: '',
            template_status: 'draft',
            fields: [],
            prompts: [],
            template_page_id: 0
        };

        const fieldGroups = {};
        const promptGroups = {};

        for (const [name, value] of formData.entries()) {
            if (name === 'template_name') {
                data.template_name = value;
            }

            if (name === 'template_status') {
                data.template_status = value;
            }

            if (name.startsWith('field_')) {
                const match = name.match(/^field_(.+)-(\d+)$/);
                if (match) {
                    const [, fieldName, fieldNumber] = match;
                    const num = parseInt(fieldNumber, 10);

                    if (!fieldGroups[num]) {
                        fieldGroups[num] = {};
                    }

                    if (fieldName === 'id') {
                        fieldGroups[num].id = value ? parseInt(value, 10) : null;
                    } else if (fieldName === 'required') {
                        fieldGroups[num].required = value === 'on';
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
                        promptGroups[num] = {};
                    }

                    if (promptField === 'id') {
                        promptGroups[num].id = value ? parseInt(value, 10) : null;
                    } else {
                        promptGroups[num][promptField] = value;
                    }
                }
            }
        }

        data.fields = Object.values(fieldGroups);
        data.prompts = Object.values(promptGroups);

        // Extract template page ID from page selector
        const pageSelector = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);
        if (pageSelector) {
            data.template_page_id = parseInt(pageSelector.value, 10) || 0;
        }

        return data;
    }

    /**
     * Creates HTML for a new field row
     */
    function createFieldRow(fieldNumber, fieldData = null) {
        const fieldId = fieldData?.id || '';
        const fieldName = fieldData?.label || '';
        const fieldIdentifier = fieldData?.unique_identifier || '';
        const fieldRequired = fieldData?.is_required == 1;
        const fieldDefaultValue = fieldData?.default_value || '';

        return `
            <div class="field-row" data-field-number="${fieldNumber}">
                <input type="hidden" name="field_id-${fieldNumber}" value="${fieldId}">

                <div class="field-group">
                    <label for="field-name-${fieldNumber}">Field Name</label>
                    <input
                        type="text"
                        id="field-name-${fieldNumber}"
                        name="field_name-${fieldNumber}"
                        class="regular-text"
                        value="${fieldName}"
                    >
                </div>

                <div class="field-group">
                    <label for="field-identifier-${fieldNumber}">Identifier</label>
                    <input
                        type="text"
                        id="field-identifier-${fieldNumber}"
                        name="field_identifier-${fieldNumber}"
                        class="regular-text"
                        value="${fieldIdentifier}"
                        readonly
                    >
                </div>

                <div class="field-group">
                    <label for="field-required-${fieldNumber}">Required</label>
                    <input
                        type="checkbox"
                        id="field-required-${fieldNumber}"
                        name="field_required-${fieldNumber}"
                        ${fieldRequired ? 'checked' : ''}
                    >
                </div>

                <div class="field-group">
                    <label for="field-default-value-${fieldNumber}">Default Value</label>
                    <input
                        type="text"
                        id="field-default-value-${fieldNumber}"
                        name="field_default_value-${fieldNumber}"
                        class="regular-text"
                        value="${fieldDefaultValue}"
                    >
                </div>

                <button type="button" class="button button-link-delete remove-field-btn" aria-label="Remove field">
                    Remove
                </button>
            </div>
        `;
    }

    function createPromptRow(promptNumber, promptData = null) {
        const promptId = promptData?.id || '';
        const promptTitle = promptData?.title || '';
        const promptGuide = promptData?.guide || '';
        const promptText = promptData?.prompt_text || '';
        const promptPlaceholder = promptData?.placeholder || `{prompt_${promptNumber}}`;

        return `
            <div class="prompt-row" data-prompt-number="${promptNumber}">
                <input type="hidden" name="prompt_id-${promptNumber}" value="${promptId}">

                <div class="prompt-group">
                    <label for="prompt-title-${promptNumber}">Title</label>
                    <input
                        type="text"
                        id="prompt-title-${promptNumber}"
                        name="prompt_title-${promptNumber}"
                        value="${promptTitle}"
                        class="regular-text"
                        placeholder="e.g., Hero Section Headline"
                    >
                </div>

                <div class="prompt-group">
                    <label for="prompt-guide-${promptNumber}">Guide</label>
                    <textarea
                        id="prompt-guide-${promptNumber}"
                        name="prompt_guide-${promptNumber}"
                        rows="2"
                        class="large-text"
                        placeholder="e.g., &quot;Place this text in the main hero section headline.&quot;"
                    >${promptGuide}</textarea>
                </div>

                <div class="prompt-group">
                    <label for="prompt-text-${promptNumber}">Prompt</label>
                    <div class="highlight-wrapper">
                        <div class="backdrop" id="prompt-backdrop-${promptNumber}"></div>
                        <textarea
                            id="prompt-text-${promptNumber}"
                            name="prompt_text-${promptNumber}"
                            rows="4"
                            class="large-text"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded="false"
                        >${promptText}</textarea>
                    </div>
                </div>

                <div class="prompt-group prompt-group-with-copy">
                    <label for="prompt-placeholder-${promptNumber}">Placeholder</label>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input
                            type="text"
                            id="prompt-placeholder-${promptNumber}"
                            name="prompt_placeholder-${promptNumber}"
                            value="${promptPlaceholder}"
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
            validateFieldNames();
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

    function validateDuplicates(selector, errorMessage, options = {}) {
        const {
            caseSensitive = false,
            trimWhitespace = true,
            ignoreEmpty = true
        } = options;

        const inputs = document.querySelectorAll(selector);
        const valueMap = new Map();

        clearValidationErrors(selector);

        inputs.forEach(input => {
            let value = input.value;

            if (trimWhitespace) {
                value = value.trim();
            }

            if (ignoreEmpty && !value) {
                return;
            }

            const normalizedValue = caseSensitive ? value : value.toLowerCase();

            if (!valueMap.has(normalizedValue)) {
                valueMap.set(normalizedValue, []);
            }

            valueMap.get(normalizedValue).push(input);
        });

        valueMap.forEach((inputElements) => {
            if (inputElements.length > 1) {
                inputElements.forEach(input => showValidationError(input, errorMessage));
            }
        });
    }

    function showValidationError(input, message) {
        input.classList.add('validation-error');

        const existingError = input.parentElement.querySelector('.validation-error-message');
        if (existingError) {
            return;
        }

        const errorElement = document.createElement('span');
        errorElement.className = 'validation-error-message';
        errorElement.textContent = message;

        input.insertAdjacentElement('afterend', errorElement);
    }

    function clearValidationErrors(selector) {
        const scopedInputs = selector ? document.querySelectorAll(selector) : null;

        if (scopedInputs) {
            scopedInputs.forEach(input => {
                input.classList.remove('validation-error');
                const errorMsg = input.parentElement.querySelector('.validation-error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            });
        } else {
            const allErrors = document.querySelectorAll('.validation-error');
            allErrors.forEach(input => {
                input.classList.remove('validation-error');
            });

            const allMessages = document.querySelectorAll('.validation-error-message');
            allMessages.forEach(message => {
                message.remove();
            });
        }
    }

    function validateFieldNames() {
        validateDuplicates(
            '[id^="field-name-"]',
            'This field name is already in use',
            {
                caseSensitive: false,
                trimWhitespace: true,
                ignoreEmpty: true
            }
        );
    }

    function validateFormBeforeSubmit() {
        clearValidationErrors();

        let hasErrors = false;
        const fieldNameInputs = document.querySelectorAll('[id^="field-name-"]');
        const promptTextareas = document.querySelectorAll('[id^="prompt-text-"]');

        validateFieldNames();

        fieldNameInputs.forEach(input => {
            if (!input.value.trim()) {
                showValidationError(input, 'Field name is required');
                hasErrors = true;
            }
        });

        promptTextareas.forEach(textarea => {
            if (!textarea.value.trim()) {
                showValidationError(textarea, 'Prompt text is required');
                hasErrors = true;
            }
        });

        const promptTitleInputs = document.querySelectorAll('[id^="prompt-title-"]');
        promptTitleInputs.forEach(input => {
            if (!input.value.trim()) {
                showValidationError(input, 'Prompt title is required');
                hasErrors = true;
            }
        });

        const templateStatus = document.querySelector(SELECTORS.TEMPLATE_STATUS_SELECT);
        const templatePage = document.querySelector(SELECTORS.TEMPLATE_PAGE_SELECT);

        if (templateStatus && templatePage) {
            if (templateStatus.value === 'published' && templatePage.value === '0') {
                showValidationError(templatePage, 'Template Page is required when status is Published');
                hasErrors = true;
            }
        }

        const duplicateErrors = document.querySelectorAll('.validation-error');
        if (duplicateErrors.length > 0) {
            hasErrors = true;
        }

        if (hasErrors) {
            const firstError = document.querySelector('.validation-error');
            if (firstError) {
                firstError.focus();
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return !hasErrors;
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
        initPageSelector();
        loadExistingData();
    }

    function getTemplateId() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('id'), 10) || 0;
    }

    function loadExistingData() {
        const templateId = getTemplateId();

        if (!templateId) {
            debugLog('No template ID found, skipping data load');
            return;
        }

        debugLog('Loading existing template data for ID: ' + templateId);

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
            if (!data.success) {
                debugLog('Failed to load template data: ' + (data.data?.message || 'Unknown error'));
                return;
            }

            populateExistingFields(data.data.fields || []);
            populateExistingPrompts(data.data.prompts || []);
            debugLog(`Loaded ${data.data.fields.length} fields and ${data.data.prompts.length} prompts`);
        })
        .catch(error => {
            debugLog('Network error loading template data: ' + error.message);
        });
    }

    function populateExistingFields(fields) {
        const fieldRowsContainer = document.querySelector(SELECTORS.FIELD_ROWS_CONTAINER);
        if (!fieldRowsContainer || fields.length === 0) {
            return;
        }

        fields.forEach((field) => {
            fieldCounter++;
            const fieldRow = createFieldRow(fieldCounter, field);
            fieldRowsContainer.insertAdjacentHTML('beforeend', fieldRow);
            setupFieldNameListener(fieldCounter);
        });

        validateFieldNames();
    }

    function populateExistingPrompts(prompts) {
        const promptRowsContainer = document.querySelector(SELECTORS.PROMPT_ROWS_CONTAINER);
        if (!promptRowsContainer || prompts.length === 0) {
            return;
        }

        prompts.forEach((prompt) => {
            promptCounter++;
            const promptRow = createPromptRow(promptCounter, prompt);
            promptRowsContainer.insertAdjacentHTML('beforeend', promptRow);
            setupTextareaHighlighting(promptCounter);
        });
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
