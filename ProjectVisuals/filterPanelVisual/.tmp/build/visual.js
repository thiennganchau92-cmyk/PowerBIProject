/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { VisualFormattingSettingsModel } from "./settings";
import { buildBasicFilter, buildAdvancedFilter, buildRelativeDateFilter, buildTopNFilter } from "./filters";
export class Visual {
    target;
    host;
    formattingSettings;
    formattingSettingsService;
    // UI Elements
    panelContainer;
    activeChipsContainer;
    controlsContainer;
    footerContainer;
    // Data
    categoryData = [];
    numericData = [];
    dateData = [];
    measureData = [];
    // Original unfiltered data for cross-filtering
    originalCategoryData = [];
    originalNumericData = [];
    originalDateData = [];
    // Current dataView for cross-filtering computations
    currentDataView = null;
    selectedCategories = new Map();
    numericRanges = new Map();
    relativeDateConfigs = new Map();
    topNConfigs = new Map();
    activeFilters = new Map();
    pendingChanges = false;
    constructor(options) {
        console.log('Filter Panel Visual constructor', options);
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.initializeUI();
    }
    initializeUI() {
        // Create main panel container
        this.panelContainer = document.createElement("div");
        this.panelContainer.className = "filter-panel";
        // Create active chips section
        this.activeChipsContainer = document.createElement("div");
        this.activeChipsContainer.className = "active-chips-container";
        this.panelContainer.appendChild(this.activeChipsContainer);
        // Create controls section
        this.controlsContainer = document.createElement("div");
        this.controlsContainer.className = "controls-container";
        this.panelContainer.appendChild(this.controlsContainer);
        // Create footer section
        this.footerContainer = document.createElement("div");
        this.footerContainer.className = "footer-container";
        this.panelContainer.appendChild(this.footerContainer);
        this.target.appendChild(this.panelContainer);
    }
    update(options) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);
        console.log('Filter Panel Visual update', options);
        // Extract all data
        this.extractData(options);
        // Apply cross-filtering to compute filtered datasets
        this.applyFiltersCount();
        // Render UI
        this.renderActiveChips();
        this.renderControls();
        this.renderFooter();
        this.applyTheming();
    }
    extractData(options) {
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }
        const dataView = options.dataViews[0];
        this.currentDataView = dataView;
        // Clear existing data
        this.categoryData = [];
        this.numericData = [];
        this.dateData = [];
        this.measureData = [];
        // Also clear original data (will be repopulated)
        this.originalCategoryData = [];
        this.originalNumericData = [];
        this.originalDateData = [];
        console.log('Filter Panel: extractData called', {
            hasCategorical: !!dataView.categorical,
            categoriesCount: dataView.categorical?.categories?.length || 0,
            valuesCount: dataView.categorical?.values?.length || 0
        });
        // Extract category fields (Grouping role: categoryFields)
        if (dataView.categorical && dataView.categorical.categories) {
            dataView.categorical.categories.forEach((category, index) => {
                const source = category.source;
                const roles = source.roles;
                console.log(`Filter Panel: Category ${index}`, {
                    displayName: source.displayName,
                    queryName: source.queryName,
                    roles: roles,
                    isCategoryField: roles && roles['categoryFields'],
                    isDateField: roles && roles['dateFields']
                });
                if (roles && roles['categoryFields']) {
                    // Category field
                    const queryParts = source.queryName?.split('.') || [];
                    const catData = {
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Category",
                        values: category.values
                    };
                    this.categoryData.push(catData);
                    // Store original data
                    this.originalCategoryData.push({ ...catData, values: [...catData.values] });
                }
                else if (roles && roles['dateFields']) {
                    // Date field
                    const values = category.values;
                    const dates = values.filter(v => v !== null && v !== undefined);
                    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : new Date();
                    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : new Date();
                    const queryParts = source.queryName?.split('.') || [];
                    const dateDataItem = {
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Date",
                        minDate: minDate,
                        maxDate: maxDate
                    };
                    this.dateData.push(dateDataItem);
                    // Store original data
                    this.originalDateData.push({ ...dateDataItem });
                }
            });
        }
        // Extract measure fields (Measure role: numericFields and topByMeasure)
        if (dataView.categorical && dataView.categorical.values) {
            dataView.categorical.values.forEach(measure => {
                const source = measure.source;
                const roles = source.roles;
                if (roles && roles['numericFields']) {
                    // Numeric measure for range filtering
                    const values = measure.values;
                    const numericValues = values.filter(v => v !== null && v !== undefined && typeof v === 'number');
                    const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
                    const max = numericValues.length > 0 ? Math.max(...numericValues) : 100;
                    const queryParts = source.queryName?.split('.') || [];
                    const numData = {
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Numeric",
                        min: min,
                        max: max
                    };
                    this.numericData.push(numData);
                    // Store original data
                    this.originalNumericData.push({ ...numData });
                }
                else if (roles && roles['topByMeasure']) {
                    // Measure for Top N filtering
                    const queryParts = source.queryName?.split('.') || [];
                    this.measureData.push({
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Measure"
                    });
                }
            });
        }
        console.log('Filter Panel: Extracted data', {
            categoryCount: this.categoryData.length,
            numericCount: this.numericData.length,
            dateCount: this.dateData.length,
            measureCount: this.measureData.length,
            dateData: this.dateData
        });
    }
    /**
     * Apply cross-filtering: compute filtered datasets based on active filters
     * This allows filters to constrain each other
     */
    applyFiltersCount() {
        if (!this.formattingSettings?.panelSettingsCard?.enableCrossFiltering?.value) {
            // Cross-filtering disabled, use original data as-is
            this.categoryData = this.originalCategoryData.map(d => ({ ...d, values: [...d.values] }));
            this.numericData = this.originalNumericData.map(d => ({ ...d }));
            this.dateData = this.originalDateData.map(d => ({ ...d }));
            return;
        }
        // Get active filters
        const activeCategoryFilters = Array.from(this.selectedCategories.entries())
            .filter(([_, values]) => values.size > 0);
        const activeNumericFilters = Array.from(this.numericRanges.entries());
        const activeDateFilters = Array.from(this.relativeDateConfigs.entries());
        // If no filters are active, use original data
        if (activeCategoryFilters.length === 0 && activeNumericFilters.length === 0 && activeDateFilters.length === 0) {
            this.categoryData = this.originalCategoryData.map(d => ({ ...d, values: [...d.values] }));
            this.numericData = this.originalNumericData.map(d => ({ ...d }));
            this.dateData = this.originalDateData.map(d => ({ ...d }));
            return;
        }
        // For each field, compute filtered values based on OTHER filters
        this.computeFilteredCategoryData();
        this.computeFilteredNumericData();
        this.computeFilteredDateData();
    }
    computeFilteredCategoryData() {
        // For each category field, get unique values that exist after applying other filters
        this.categoryData = this.originalCategoryData.map(catData => {
            const fieldKey = `${catData.table}.${catData.column}`;
            // Get filters that are NOT this field
            const otherFilters = this.getFiltersExcept(fieldKey);
            if (otherFilters.length === 0) {
                // No other filters, use original data
                return { ...catData, values: [...catData.values] };
            }
            // Apply other filters to get constrained value list
            const filteredValues = this.getFilteredValues(catData, otherFilters);
            return {
                ...catData,
                values: filteredValues
            };
        });
    }
    computeFilteredNumericData() {
        // For each numeric field, recalculate min/max based on filtered data
        this.numericData = this.originalNumericData.map(numData => {
            const fieldKey = `${numData.table}.${numData.column}`;
            // Get filters that are NOT this field
            const otherFilters = this.getFiltersExcept(fieldKey);
            if (otherFilters.length === 0) {
                // No other filters, use original range
                return { ...numData };
            }
            // Recalculate min/max based on filtered data
            // Note: This is simplified - in real implementation, would need to query filtered data
            return { ...numData };
        });
    }
    computeFilteredDateData() {
        // For each date field, recalculate date range based on filtered data
        this.dateData = this.originalDateData.map(dateDataItem => {
            const fieldKey = `${dateDataItem.table}.${dateDataItem.column}`;
            // Get filters that are NOT this field
            const otherFilters = this.getFiltersExcept(fieldKey);
            if (otherFilters.length === 0) {
                // No other filters, use original range
                return { ...dateDataItem };
            }
            // Recalculate date range based on filtered data
            // Note: This is simplified - in real implementation, would need to query filtered data
            return { ...dateDataItem };
        });
    }
    getFiltersExcept(excludeFieldKey) {
        const filters = [];
        // Add category filters
        this.selectedCategories.forEach((values, key) => {
            if (key !== excludeFieldKey && values.size > 0) {
                filters.push({ type: 'category', key, values: Array.from(values) });
            }
        });
        // Add numeric filters
        this.numericRanges.forEach((range, key) => {
            if (key !== excludeFieldKey) {
                filters.push({ type: 'numeric', key, range });
            }
        });
        // Add date filters
        this.relativeDateConfigs.forEach((config, key) => {
            if (key !== excludeFieldKey) {
                filters.push({ type: 'date', key, config });
            }
        });
        return filters;
    }
    getFilteredValues(catData, otherFilters) {
        // Simplified implementation: return unique values
        // In a full implementation, this would query the dataView with filters applied
        // to get only values that exist in the filtered dataset
        // For now, return all original values
        // TODO: Implement actual filtering logic based on Power BI data model
        const uniqueValues = new Set(catData.values);
        return Array.from(uniqueValues);
    }
    renderActiveChips() {
        // Clear existing chips
        while (this.activeChipsContainer.firstChild) {
            this.activeChipsContainer.removeChild(this.activeChipsContainer.firstChild);
        }
        if (!this.formattingSettings.panelSettingsCard.showActiveChips.value) {
            this.activeChipsContainer.style.display = "none";
            return;
        }
        this.activeChipsContainer.style.display = "block";
        // Add header
        const header = document.createElement("div");
        header.className = "chips-header";
        header.textContent = "Active Filters";
        this.activeChipsContainer.appendChild(header);
        // Add chips container
        const chipsWrapper = document.createElement("div");
        chipsWrapper.className = "chips-wrapper";
        this.activeChipsContainer.appendChild(chipsWrapper);
        if (this.activeFilters.size === 0) {
            const emptyMsg = document.createElement("span");
            emptyMsg.className = "empty-message";
            emptyMsg.textContent = "No active filters";
            chipsWrapper.appendChild(emptyMsg);
            return;
        }
        // Render each active filter chip
        this.activeFilters.forEach((filter, id) => {
            const chip = this.createFilterChip(filter, id);
            chipsWrapper.appendChild(chip);
        });
    }
    createFilterChip(filter, id) {
        const chip = document.createElement("div");
        chip.className = "filter-chip";
        const label = document.createElement("span");
        label.className = "chip-label";
        label.textContent = `${filter.displayName}: ${filter.description}`;
        chip.appendChild(label);
        const removeBtn = document.createElement("span");
        removeBtn.className = "chip-remove";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove filter";
        removeBtn.addEventListener("click", () => this.removeFilter(id));
        chip.appendChild(removeBtn);
        return chip;
    }
    renderControls() {
        // Clear existing controls
        while (this.controlsContainer.firstChild) {
            this.controlsContainer.removeChild(this.controlsContainer.firstChild);
        }
        const hasData = this.categoryData.length > 0 || this.numericData.length > 0 ||
            this.dateData.length > 0 || this.measureData.length > 0;
        if (!hasData) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "empty-message";
            emptyMsg.textContent = "Add fields to begin filtering";
            this.controlsContainer.appendChild(emptyMsg);
            return;
        }
        // Render category controls
        this.categoryData.forEach(category => {
            this.renderCategoryControl(category);
        });
        // Render numeric controls
        this.numericData.forEach(numeric => {
            this.renderNumericControl(numeric);
        });
        // Render date controls
        this.dateData.forEach(date => {
            this.renderDateControl(date);
        });
        // Render Top N controls
        if (this.measureData.length > 0 && this.categoryData.length > 0) {
            this.renderTopNControl();
        }
    }
    renderCategoryControl(categoryData) {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";
        const fieldKey = `${categoryData.table}.${categoryData.column}`;
        // Initialize selection map if not exists
        if (!this.selectedCategories.has(fieldKey)) {
            this.selectedCategories.set(fieldKey, new Set());
        }
        // Header with count indicator
        const header = document.createElement("div");
        header.className = "control-header";
        // Show field name and count
        const headerText = document.createElement("span");
        headerText.textContent = categoryData.displayName;
        header.appendChild(headerText);
        // Add count indicator if cross-filtering is enabled
        if (this.formattingSettings?.panelSettingsCard?.enableCrossFiltering?.value) {
            const originalData = this.originalCategoryData.find(d => d.table === categoryData.table && d.column === categoryData.column);
            if (originalData) {
                const currentCount = new Set(categoryData.values).size;
                const originalCount = new Set(originalData.values).size;
                if (currentCount < originalCount) {
                    const countBadge = document.createElement("span");
                    countBadge.className = "count-badge filtered";
                    countBadge.textContent = `${currentCount} of ${originalCount}`;
                    countBadge.title = "Filtered by other filters";
                    header.appendChild(countBadge);
                }
                else {
                    const countBadge = document.createElement("span");
                    countBadge.className = "count-badge";
                    countBadge.textContent = `${currentCount}`;
                    header.appendChild(countBadge);
                }
            }
        }
        controlSection.appendChild(header);
        // Search box
        const searchBox = document.createElement("input");
        searchBox.type = "text";
        searchBox.className = "search-input";
        searchBox.placeholder = `Search ${categoryData.displayName}...`;
        controlSection.appendChild(searchBox);
        // Select All / Clear
        const actionsRow = document.createElement("div");
        actionsRow.className = "actions-row";
        const selectAllBtn = document.createElement("button");
        selectAllBtn.textContent = "Select All";
        selectAllBtn.className = "action-btn";
        selectAllBtn.addEventListener("click", () => this.selectAllCategories(categoryData, fieldKey));
        actionsRow.appendChild(selectAllBtn);
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.className = "action-btn";
        clearBtn.addEventListener("click", () => this.clearCategorySelection(categoryData, fieldKey));
        actionsRow.appendChild(clearBtn);
        controlSection.appendChild(actionsRow);
        // Values list
        const valuesList = document.createElement("div");
        valuesList.className = "values-list";
        valuesList.id = `category-values-list-${fieldKey}`;
        categoryData.values.forEach((value, index) => {
            const item = this.createCategoryItem(categoryData, value, index, fieldKey);
            valuesList.appendChild(item);
        });
        controlSection.appendChild(valuesList);
        this.controlsContainer.appendChild(controlSection);
        // Add search event listener
        searchBox.addEventListener("input", (e) => {
            this.filterCategoryList(fieldKey, e.target.value);
        });
    }
    createCategoryItem(categoryData, value, index, fieldKey) {
        const item = document.createElement("div");
        item.className = "category-item";
        item.dataset.value = String(value);
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `cat-${fieldKey}-${index}`;
        const selections = this.selectedCategories.get(fieldKey);
        checkbox.checked = selections ? selections.has(value) : false;
        checkbox.addEventListener("change", () => this.handleCategoryChange(categoryData, value, checkbox.checked, fieldKey));
        const label = document.createElement("label");
        label.htmlFor = `cat-${fieldKey}-${index}`;
        label.textContent = String(value);
        item.appendChild(checkbox);
        item.appendChild(label);
        return item;
    }
    filterCategoryList(fieldKey, searchText) {
        const list = document.getElementById(`category-values-list-${fieldKey}`);
        if (!list)
            return;
        const items = list.querySelectorAll(".category-item");
        const lowerSearch = searchText.toLowerCase();
        items.forEach((item) => {
            const value = item.dataset.value || "";
            if (value.toLowerCase().includes(lowerSearch)) {
                item.style.display = "flex";
            }
            else {
                item.style.display = "none";
            }
        });
    }
    handleCategoryChange(categoryData, value, checked, fieldKey) {
        let selections = this.selectedCategories.get(fieldKey);
        if (!selections) {
            selections = new Set();
            this.selectedCategories.set(fieldKey, selections);
        }
        if (checked) {
            selections.add(value);
        }
        else {
            selections.delete(value);
        }
        this.pendingChanges = true;
        const applyMode = this.formattingSettings.panelSettingsCard.applyMode.value.value;
        if (applyMode === "Instant") {
            this.applyCategoryFilter(categoryData, fieldKey);
        }
        else {
            this.renderFooter();
        }
    }
    selectAllCategories(categoryData, fieldKey) {
        let selections = this.selectedCategories.get(fieldKey);
        if (!selections) {
            selections = new Set();
            this.selectedCategories.set(fieldKey, selections);
        }
        categoryData.values.forEach(value => {
            selections.add(value);
        });
        this.renderControls();
        this.applyCategoryFilter(categoryData, fieldKey);
    }
    clearCategorySelection(categoryData, fieldKey) {
        this.selectedCategories.delete(fieldKey);
        this.removeFilter(fieldKey);
        this.renderControls();
    }
    renderFooter() {
        // Clear existing footer
        while (this.footerContainer.firstChild) {
            this.footerContainer.removeChild(this.footerContainer.firstChild);
        }
        const applyMode = this.formattingSettings.panelSettingsCard.applyMode.value.value;
        const showReset = this.formattingSettings.panelSettingsCard.showReset.value;
        // Show Reset All button
        if (showReset) {
            const resetBtn = document.createElement("button");
            resetBtn.className = "footer-btn reset-btn";
            resetBtn.textContent = "Reset All";
            resetBtn.addEventListener("click", () => this.resetAll());
            this.footerContainer.appendChild(resetBtn);
        }
        // Show Apply/Cancel buttons in Commit mode
        if (applyMode === "Commit") {
            const applyBtn = document.createElement("button");
            applyBtn.className = "footer-btn apply-btn";
            applyBtn.textContent = "Apply";
            applyBtn.disabled = !this.pendingChanges;
            applyBtn.addEventListener("click", () => this.applyFilters());
            this.footerContainer.appendChild(applyBtn);
        }
    }
    applyCategoryFilter(categoryData, fieldKey) {
        const selections = this.selectedCategories.get(fieldKey);
        const selectedValues = selections ? Array.from(selections) : [];
        if (selectedValues.length > 0) {
            const filter = buildBasicFilter(categoryData.table, categoryData.column, selectedValues, "In");
            if (filter) {
                this.host.applyJsonFilter(filter, "general", "filter", 0 /* FilterAction.merge */);
                this.activeFilters.set(fieldKey, {
                    id: fieldKey,
                    displayName: categoryData.displayName,
                    description: `${selectedValues.length} selected`,
                    filterType: 'category'
                });
            }
        }
        else {
            this.removeFilter(fieldKey);
        }
        this.pendingChanges = false;
        this.renderActiveChips();
        this.renderFooter();
    }
    applyFilters() {
        // Apply all pending filter changes
        this.categoryData.forEach(category => {
            const fieldKey = `${category.table}.${category.column}`;
            this.applyCategoryFilter(category, fieldKey);
        });
        this.pendingChanges = false;
        this.renderFooter();
    }
    removeFilter(id) {
        this.activeFilters.delete(id);
        // Clear selections based on filter type
        if (this.selectedCategories.has(id)) {
            this.selectedCategories.delete(id);
        }
        if (this.numericRanges.has(id)) {
            this.numericRanges.delete(id);
        }
        if (this.relativeDateConfigs.has(id)) {
            this.relativeDateConfigs.delete(id);
        }
        if (this.topNConfigs.has(id)) {
            this.topNConfigs.delete(id);
        }
        // Remove filter from host
        this.host.applyJsonFilter(null, "general", "filter", 1 /* FilterAction.remove */);
        this.renderActiveChips();
        this.renderControls();
    }
    resetAll() {
        this.selectedCategories.clear();
        this.numericRanges.clear();
        this.relativeDateConfigs.clear();
        this.topNConfigs.clear();
        this.activeFilters.clear();
        this.pendingChanges = false;
        // Remove all filters
        this.host.applyJsonFilter(null, "general", "filter", 1 /* FilterAction.remove */);
        // Re-render
        this.renderActiveChips();
        this.renderControls();
        this.renderFooter();
    }
    renderNumericControl(numericData) {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";
        const fieldKey = `${numericData.table}.${numericData.column}`;
        // Header
        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = numericData.displayName;
        controlSection.appendChild(header);
        // Min input
        const minRow = document.createElement("div");
        minRow.className = "form-row";
        const minLabel = document.createElement("label");
        minLabel.textContent = "Min:";
        const minInput = document.createElement("input");
        minInput.type = "number";
        minInput.value = String(numericData.min);
        minInput.step = "any";
        minRow.appendChild(minLabel);
        minRow.appendChild(minInput);
        controlSection.appendChild(minRow);
        // Max input
        const maxRow = document.createElement("div");
        maxRow.className = "form-row";
        const maxLabel = document.createElement("label");
        maxLabel.textContent = "Max:";
        const maxInput = document.createElement("input");
        maxInput.type = "number";
        maxInput.value = String(numericData.max);
        maxInput.step = "any";
        maxRow.appendChild(maxLabel);
        maxRow.appendChild(maxInput);
        controlSection.appendChild(maxRow);
        // Apply button in actions row
        const actionsRow = document.createElement("div");
        actionsRow.className = "actions-row";
        actionsRow.style.marginTop = "12px";
        const applyBtn = document.createElement("button");
        applyBtn.textContent = "Apply Range";
        applyBtn.className = "action-btn";
        applyBtn.addEventListener("click", () => {
            const min = parseFloat(minInput.value);
            const max = parseFloat(maxInput.value);
            if (!isNaN(min) && !isNaN(max) && min <= max) {
                this.applyNumericFilter(numericData, { min, max });
            }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);
        this.controlsContainer.appendChild(controlSection);
    }
    renderDateControl(dateData) {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";
        const fieldKey = `${dateData.table}.${dateData.column}`;
        // Header
        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = dateData.displayName;
        controlSection.appendChild(header);
        // Relative date options
        const relativeDateLabel = document.createElement("label");
        relativeDateLabel.textContent = "Relative Date:";
        controlSection.appendChild(relativeDateLabel);
        const relativeDateSelect = document.createElement("select");
        // Create options without innerHTML
        const options = [
            { value: "", text: "Select..." },
            { value: "InLast-7-Days", text: "Last 7 Days" },
            { value: "InLast-30-Days", text: "Last 30 Days" },
            { value: "InLast-3-Months", text: "Last 3 Months" },
            { value: "InLast-12-Months", text: "Last 12 Months" },
            { value: "InThis-Year", text: "This Year" }
        ];
        options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            relativeDateSelect.appendChild(option);
        });
        controlSection.appendChild(relativeDateSelect);
        // Apply button in actions row
        const actionsRow = document.createElement("div");
        actionsRow.className = "actions-row";
        actionsRow.style.marginTop = "12px";
        const applyBtn = document.createElement("button");
        applyBtn.textContent = "Apply Date Filter";
        applyBtn.className = "action-btn";
        applyBtn.addEventListener("click", () => {
            const selected = relativeDateSelect.value;
            if (selected) {
                const [operator, count, unit] = selected.split("-");
                this.applyDateFilter(dateData, {
                    operator: operator,
                    timeUnitsCount: parseInt(count),
                    timeUnit: unit,
                    includeToday: true
                });
            }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);
        this.controlsContainer.appendChild(controlSection);
    }
    renderTopNControl() {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";
        // Header
        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = "Top N Filter";
        controlSection.appendChild(header);
        // Category selection
        const categoryLabel = document.createElement("label");
        categoryLabel.textContent = "Category:";
        controlSection.appendChild(categoryLabel);
        const categorySelect = document.createElement("select");
        // Create default option
        const defaultCatOption = document.createElement("option");
        defaultCatOption.value = "";
        defaultCatOption.textContent = "Select category...";
        categorySelect.appendChild(defaultCatOption);
        this.categoryData.forEach(cat => {
            const option = document.createElement("option");
            option.value = `${cat.table}.${cat.column}`;
            option.textContent = cat.displayName;
            categorySelect.appendChild(option);
        });
        controlSection.appendChild(categorySelect);
        // Measure selection
        const measureLabel = document.createElement("label");
        measureLabel.textContent = "Order by Measure:";
        controlSection.appendChild(measureLabel);
        const measureSelect = document.createElement("select");
        // Create default option
        const defaultMeasureOption = document.createElement("option");
        defaultMeasureOption.value = "";
        defaultMeasureOption.textContent = "Select measure...";
        measureSelect.appendChild(defaultMeasureOption);
        this.measureData.forEach(measure => {
            const option = document.createElement("option");
            option.value = `${measure.table}.${measure.column}`;
            option.textContent = measure.displayName;
            measureSelect.appendChild(option);
        });
        controlSection.appendChild(measureSelect);
        // Count input
        const countRow = document.createElement("div");
        countRow.className = "form-row";
        const countLabel = document.createElement("label");
        countLabel.textContent = "Count:";
        const countInput = document.createElement("input");
        countInput.type = "number";
        countInput.value = "10";
        countInput.min = "1";
        countRow.appendChild(countLabel);
        countRow.appendChild(countInput);
        controlSection.appendChild(countRow);
        // Top/Bottom selection
        const directionLabel = document.createElement("label");
        directionLabel.textContent = "Direction:";
        controlSection.appendChild(directionLabel);
        const directionSelect = document.createElement("select");
        // Create options
        const topOption = document.createElement("option");
        topOption.value = "Top";
        topOption.textContent = "Top";
        directionSelect.appendChild(topOption);
        const bottomOption = document.createElement("option");
        bottomOption.value = "Bottom";
        bottomOption.textContent = "Bottom";
        directionSelect.appendChild(bottomOption);
        controlSection.appendChild(directionSelect);
        // Apply button in actions row
        const actionsRow = document.createElement("div");
        actionsRow.className = "actions-row";
        actionsRow.style.marginTop = "12px";
        const applyBtn = document.createElement("button");
        applyBtn.textContent = "Apply Top N Filter";
        applyBtn.className = "action-btn";
        applyBtn.addEventListener("click", () => {
            const categoryKey = categorySelect.value;
            const measureKey = measureSelect.value;
            const count = parseInt(countInput.value);
            const operator = directionSelect.value;
            if (categoryKey && measureKey && count > 0) {
                const [catTable, catColumn] = categoryKey.split(".");
                const [measureTable, measureColumn] = measureKey.split(".");
                this.applyTopNFilter({ table: catTable, column: catColumn, displayName: categorySelect.options[categorySelect.selectedIndex].text, values: [] }, {
                    operator,
                    itemCount: count,
                    orderByTable: measureTable,
                    orderByColumn: measureColumn
                });
            }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);
        this.controlsContainer.appendChild(controlSection);
    }
    applyNumericFilter(numericData, range) {
        const filter = buildAdvancedFilter(numericData.table, numericData.column, range, "And");
        if (filter) {
            this.host.applyJsonFilter(filter, "general", "filter", 0 /* FilterAction.merge */);
            const fieldKey = `${numericData.table}.${numericData.column}`;
            this.numericRanges.set(fieldKey, range);
            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: numericData.displayName,
                description: `${range.min} - ${range.max}`,
                filterType: 'numeric'
            });
            this.renderActiveChips();
        }
    }
    applyDateFilter(dateData, config) {
        const filter = buildRelativeDateFilter(dateData.table, dateData.column, config);
        if (filter) {
            this.host.applyJsonFilter(filter, "general", "filter", 0 /* FilterAction.merge */);
            const fieldKey = `${dateData.table}.${dateData.column}`;
            this.relativeDateConfigs.set(fieldKey, config);
            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: dateData.displayName,
                description: `${config.operator} ${config.timeUnitsCount} ${config.timeUnit}`,
                filterType: 'date'
            });
            this.renderActiveChips();
        }
    }
    applyTopNFilter(categoryData, config) {
        const filter = buildTopNFilter(categoryData.table, categoryData.column, config);
        if (filter) {
            this.host.applyJsonFilter(filter, "general", "filter", 0 /* FilterAction.merge */);
            const fieldKey = `${categoryData.table}.${categoryData.column}`;
            this.topNConfigs.set(fieldKey, config);
            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: categoryData.displayName,
                description: `${config.operator} ${config.itemCount}`,
                filterType: 'topn'
            });
            this.renderActiveChips();
        }
    }
    applyTheming() {
        const accentColor = this.formattingSettings.themingCard.accentColor.value.value;
        const borderRadius = this.formattingSettings.themingCard.borderRadius.value;
        this.panelContainer.style.setProperty("--accent-color", accentColor);
        this.panelContainer.style.setProperty("--border-radius", `${borderRadius}px`);
    }
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel() {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
//# sourceMappingURL=visual.js.map