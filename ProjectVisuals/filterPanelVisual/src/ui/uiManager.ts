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

import powerbi from "powerbi-visuals-api";
import { VisualFormattingSettingsModel } from "../settings";
import { Visual } from "../visual";
import { CategoryData, NumericData, DateData, ActiveFilter } from "../data/dataManager";
import { NumericRange, RelativeDateConfig, TopNConfig } from "../filters";
import { FilterManager } from "../filters/filterManager";
import { CrossFilterManager } from "../cross-filter/crossFilterManager";

export class UIManager {
    private visual: Visual;
    private filterManager: FilterManager;
    private crossFilterManager: CrossFilterManager;
    private target: HTMLElement;
    private panelContainer: HTMLElement;
    private toggleText: HTMLElement;
    private contentWrapper: HTMLElement;
    private activeChipsContainer: HTMLElement;
    private controlsContainer: HTMLElement;
    private footerContainer: HTMLElement;

    constructor(visual: Visual, filterManager: FilterManager, crossFilterManager: CrossFilterManager, target: HTMLElement) {
        this.visual = visual;
        this.filterManager = filterManager;
        this.crossFilterManager = crossFilterManager;
        this.target = target;
        this.toggleText = document.createElement("span"); // placeholder
        this.contentWrapper = document.createElement("div"); // placeholder
    }

    public initialize(): void {
    this.target.style.position = 'relative';

    this.panelContainer = document.createElement("div");
    this.panelContainer.className = "filter-panel";

    const toggleButton = document.createElement("button");
    toggleButton.className = "filter-toggle-btn";
    toggleButton.title = "Toggle Filter Panel";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#595959");
    svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("viewBox", "0 0 24 24");

    const lines = [
    { x1: "4", y1: "21", x2: "4", y2: "14" },
    { x1: "4", y1: "10", x2: "4", y2: "3" },
    { x1: "12", y1: "21", x2: "12", y2: "12" },
    { x1: "12", y1: "8", x2: "12", y2: "3" },
    { x1: "20", y1: "21", x2: "20", y2: "16" },
    { x1: "20", y1: "12", x2: "20", y2: "3" },
        { x1: "1", y1: "14", x2: "7", y2: "14" },
            { x1: "9", y1: "8", x2: "15", y2: "8" },
        { x1: "17", y1: "16", x2: "23", y2: "16" }
    ];

    lines.forEach(l => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", l.x1);
    line.setAttribute("y1", l.y1);
        line.setAttribute("x2", l.x2);
            line.setAttribute("y2", l.y2);
        svg.appendChild(line);
    });

    this.toggleText = document.createElement("span");
    this.toggleText.textContent = "Show Filters";
    this.toggleText.className = "toggle-text";

    toggleButton.appendChild(svg);
    toggleButton.appendChild(this.toggleText);

    toggleButton.addEventListener("click", () => this.togglePanel());
    this.panelContainer.appendChild(toggleButton);

    this.contentWrapper = document.createElement("div");
    this.contentWrapper.className = "filter-content";

    this.activeChipsContainer = document.createElement("div");
    this.activeChipsContainer.className = "active-chips-container";
    this.contentWrapper.appendChild(this.activeChipsContainer);

    this.controlsContainer = document.createElement("div");
    this.controlsContainer.className = "controls-container";
    this.contentWrapper.appendChild(this.controlsContainer);

    this.footerContainer = document.createElement("div");
    this.footerContainer.className = "footer-container";
    this.contentWrapper.appendChild(this.footerContainer);

    this.panelContainer.appendChild(this.contentWrapper);

    this.target.appendChild(this.panelContainer);

    this.updateToggleText();
}

    public togglePanel(): void {
    this.contentWrapper.classList.toggle("hidden");
        this.updateToggleText();
    }

    private updateToggleText(): void {
        this.toggleText.textContent = this.contentWrapper.classList.contains("hidden") ? "show filter" : "hide filter";
    }

    public applyInitialPanelState(formattingSettings: VisualFormattingSettingsModel): void {
    const initialState = formattingSettings.panelSettingsCard.initialState.value.value;
    if (initialState === "Hidden") {
    this.contentWrapper.classList.add("hidden");
        this.updateToggleText();
        }
    }

    public render(formattingSettings: VisualFormattingSettingsModel, data: {
        categoryData: CategoryData[],
        numericData: NumericData[],
        dateData: DateData[],
        measureData: any[],
        originalCategoryData: CategoryData[],
        activeFilters: Map<string, ActiveFilter>,
        pendingChanges: boolean
    }, layout: string): void {
        this.renderActiveChips(formattingSettings, data.activeFilters);
        this.renderControls(data.categoryData, data.numericData, data.dateData, data.measureData, data.originalCategoryData, formattingSettings, layout);
        this.renderFooter(formattingSettings, data.pendingChanges);
        this.applyTheming(formattingSettings);

        if (layout === 'Horizontal') {
            this.panelContainer.classList.add('horizontal');
            this.panelContainer.classList.remove('vertical');
        } else {
            this.panelContainer.classList.add('vertical');
            this.panelContainer.classList.remove('horizontal');
        }
    }

    private renderActiveChips(formattingSettings: VisualFormattingSettingsModel, activeFilters: Map<string, ActiveFilter>): void {
        while (this.activeChipsContainer.firstChild) {
            this.activeChipsContainer.removeChild(this.activeChipsContainer.firstChild);
        }

        if (!formattingSettings.panelSettingsCard.showActiveChips.value) {
            this.activeChipsContainer.style.display = "none";
            return;
        }

        this.activeChipsContainer.style.display = "block";

        const header = document.createElement("div");
        header.className = "chips-header";
        header.textContent = "Active Filters";
        this.activeChipsContainer.appendChild(header);

        const chipsWrapper = document.createElement("div");
        chipsWrapper.className = "chips-wrapper";
        this.activeChipsContainer.appendChild(chipsWrapper);

        if (activeFilters.size === 0) {
            const emptyMsg = document.createElement("span");
            emptyMsg.className = "empty-message";
            emptyMsg.textContent = "No active filters";
            chipsWrapper.appendChild(emptyMsg);
            return;
        }

        activeFilters.forEach((filter, id) => {
            const chip = this.createFilterChip(filter, id);
            chipsWrapper.appendChild(chip);
        });
    }

    private createFilterChip(filter: ActiveFilter, id: string): HTMLElement {
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
        removeBtn.addEventListener("click", () => this.filterManager.removeFilter(id));
        chip.appendChild(removeBtn);

        return chip;
    }

    private renderControls(categoryData: CategoryData[], numericData: NumericData[], dateData: DateData[], measureData: any[], originalCategoryData: CategoryData[], formattingSettings: VisualFormattingSettingsModel, panelLayout: string): void {
    while (this.controlsContainer.firstChild) {
    this.controlsContainer.removeChild(this.controlsContainer.firstChild);
    }

    const hasData = categoryData.length > 0 || numericData.length > 0 || dateData.length > 0 || measureData.length > 0;

    if (!hasData) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "empty-message";
    emptyMsg.textContent = "Add fields to begin filtering";
    this.controlsContainer.appendChild(emptyMsg);
    return;
    }

    const filterLayout = formattingSettings.panelSettingsCard.filterLayout.value.value as string;

    // Apply filter layout classes
        this.controlsContainer.classList.remove('filter-layout-vertical', 'filter-layout-horizontal');
    if (filterLayout === 'Horizontal') {
    this.controlsContainer.classList.add('filter-layout-horizontal');
    } else {
            this.controlsContainer.classList.add('filter-layout-vertical');
    }

    categoryData.forEach(category => {
            this.renderCategoryControl(category, originalCategoryData, formattingSettings);
    });

    numericData.forEach(numeric => {
            this.renderNumericControl(numeric);
        });

        dateData.forEach(date => {
            this.renderDateControl(date);
        });

        if (measureData.length > 0 && categoryData.length > 0) {
            this.renderTopNControl(categoryData, measureData);
        }
    }

    private renderCategoryControl(categoryData: CategoryData, originalCategoryData: CategoryData[], formattingSettings: VisualFormattingSettingsModel): void {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";

        const fieldKey = `${categoryData.table}.${categoryData.column}`;

        const header = document.createElement("div");
        header.className = "control-header";
        
        const headerText = document.createElement("span");
        headerText.textContent = categoryData.displayName;
        header.appendChild(headerText);
        
        if (formattingSettings?.panelSettingsCard?.enableCrossFiltering?.value) {
            const originalData = originalCategoryData.find(d => 
                d.table === categoryData.table && d.column === categoryData.column
            );
            if (originalData) {
                const currentCount = new Set(categoryData.values).size;
                const originalCount = new Set(originalData.values).size;
                
                if (currentCount < originalCount) {
                    const countBadge = document.createElement("span");
                    countBadge.className = "count-badge filtered";
                    countBadge.textContent = `${currentCount} of ${originalCount}`;
                    countBadge.title = "Filtered by other filters";
                    header.appendChild(countBadge);
                } else {
                    const countBadge = document.createElement("span");
                    countBadge.className = "count-badge";
                    countBadge.textContent = `${currentCount}`;
                    header.appendChild(countBadge);
                }
            }
        }
        
        controlSection.appendChild(header);

        const searchBox = document.createElement("input");
        searchBox.type = "text";
        searchBox.className = "search-input";
        searchBox.placeholder = `Search ${categoryData.displayName}...`;
        controlSection.appendChild(searchBox);

        const actionsRow = document.createElement("div");
        actionsRow.className = "actions-row";

        const selectAllBtn = document.createElement("button");
        selectAllBtn.textContent = "Select All";
        selectAllBtn.className = "action-btn";
        selectAllBtn.addEventListener("click", () => this.filterManager.selectAllCategories(categoryData, fieldKey));
        actionsRow.appendChild(selectAllBtn);

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.className = "action-btn";
        clearBtn.addEventListener("click", () => this.filterManager.clearCategorySelection(categoryData, fieldKey));
        actionsRow.appendChild(clearBtn);

        controlSection.appendChild(actionsRow);

        const valuesList = document.createElement("div");
        valuesList.className = "values-list";
        valuesList.id = `category-values-list-${fieldKey}`;

        categoryData.values.forEach((value, index) => {
            const item = this.createCategoryItem(categoryData, value, index, fieldKey);
            valuesList.appendChild(item);
        });

        controlSection.appendChild(valuesList);
        this.controlsContainer.appendChild(controlSection);

        searchBox.addEventListener("input", (e) => {
            this.filterCategoryList(fieldKey, (e.target as HTMLInputElement).value);
        });
    }

    private createCategoryItem(categoryData: CategoryData, value: any, index: number, fieldKey: string): HTMLElement {
        const item = document.createElement("div");
        item.className = "category-item";
        item.dataset.value = String(value);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `cat-${fieldKey}-${index}`;
        const selections = this.filterManager.getSelectedCategories().get(fieldKey);
        checkbox.checked = selections ? selections.has(value) : false;
        checkbox.addEventListener("change", () => this.filterManager.handleCategoryChange(categoryData, value, checkbox.checked, fieldKey));

        const label = document.createElement("label");
        label.htmlFor = `cat-${fieldKey}-${index}`;
        label.textContent = String(value);

        item.appendChild(checkbox);
        item.appendChild(label);

        return item;
    }

    private filterCategoryList(fieldKey: string, searchText: string): void {
        const list = document.getElementById(`category-values-list-${fieldKey}`);
        if (!list) return;

        const items = list.querySelectorAll(".category-item");
        const lowerSearch = searchText.toLowerCase();

        items.forEach((item: HTMLElement) => {
            const value = item.dataset.value || "";
            if (value.toLowerCase().includes(lowerSearch)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    }

    private renderFooter(formattingSettings: VisualFormattingSettingsModel, pendingChanges: boolean): void {
        while (this.footerContainer.firstChild) {
            this.footerContainer.removeChild(this.footerContainer.firstChild);
        }

        const applyMode = formattingSettings.panelSettingsCard.applyMode.value.value;
        const showReset = formattingSettings.panelSettingsCard.showReset.value;

        if (showReset) {
        const resetBtn = document.createElement("button");
        resetBtn.className = "footer-btn reset-btn";
        resetBtn.textContent = "Reset All";
        resetBtn.addEventListener("click", () => this.filterManager.resetAll());
        this.footerContainer.appendChild(resetBtn);
        }

        if (applyMode === "Commit") {
        const applyBtn = document.createElement("button");
        applyBtn.className = "footer-btn apply-btn";
        applyBtn.textContent = "Apply";
        applyBtn.disabled = !pendingChanges;
        applyBtn.addEventListener("click", () => this.filterManager.applyFilters());
        this.footerContainer.appendChild(applyBtn);
        }
    }

    private renderNumericControl(numericData: NumericData): void {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";

        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = numericData.displayName;
        controlSection.appendChild(header);

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
        this.filterManager.applyNumericFilter(numericData, { min, max });
        }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);

        this.controlsContainer.appendChild(controlSection);
    }

    private renderDateControl(dateData: DateData): void {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";

        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = dateData.displayName;
        controlSection.appendChild(header);

        const relativeDateLabel = document.createElement("label");
        relativeDateLabel.textContent = "Relative Date:";
        controlSection.appendChild(relativeDateLabel);

        const relativeDateSelect = document.createElement("select");
        
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
        this.filterManager.applyDateFilter(dateData, {
        operator: operator as any,
        timeUnitsCount: parseInt(count),
        timeUnit: unit as any,
        includeToday: true
        });
        }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);

        this.controlsContainer.appendChild(controlSection);
    }

    private renderTopNControl(categoryData: CategoryData[], measureData: any[]): void {
        const controlSection = document.createElement("div");
        controlSection.className = "control-section";

        const header = document.createElement("div");
        header.className = "control-header";
        header.textContent = "Top N Filter";
        controlSection.appendChild(header);

        const categoryLabel = document.createElement("label");
        categoryLabel.textContent = "Category:";
        controlSection.appendChild(categoryLabel);

        const categorySelect = document.createElement("select");
        
        const defaultCatOption = document.createElement("option");
        defaultCatOption.value = "";
        defaultCatOption.textContent = "Select category...";
        categorySelect.appendChild(defaultCatOption);
        
        categoryData.forEach(cat => {
            const option = document.createElement("option");
            option.value = `${cat.table}.${cat.column}`;
            option.textContent = cat.displayName;
            categorySelect.appendChild(option);
        });
        controlSection.appendChild(categorySelect);

        const measureLabel = document.createElement("label");
        measureLabel.textContent = "Order by Measure:";
        controlSection.appendChild(measureLabel);

        const measureSelect = document.createElement("select");
        
        const defaultMeasureOption = document.createElement("option");
        defaultMeasureOption.value = "";
        defaultMeasureOption.textContent = "Select measure...";
        measureSelect.appendChild(defaultMeasureOption);
        
        measureData.forEach(measure => {
            const option = document.createElement("option");
            option.value = `${measure.table}.${measure.column}`;
            option.textContent = measure.displayName;
            measureSelect.appendChild(option);
        });
        controlSection.appendChild(measureSelect);

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

        const directionLabel = document.createElement("label");
        directionLabel.textContent = "Direction:";
        controlSection.appendChild(directionLabel);

        const directionSelect = document.createElement("select");
        
        const topOption = document.createElement("option");
        topOption.value = "Top";
        topOption.textContent = "Top";
        directionSelect.appendChild(topOption);
        
        const bottomOption = document.createElement("option");
        bottomOption.value = "Bottom";
        bottomOption.textContent = "Bottom";
        directionSelect.appendChild(bottomOption);
        
        controlSection.appendChild(directionSelect);

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
        const operator = directionSelect.value as "Top" | "Bottom";

        if (categoryKey && measureKey && count > 0) {
        const [catTable, catColumn] = categoryKey.split(".");
        const [measureTable, measureColumn] = measureKey.split(".");
        
        this.filterManager.applyTopNFilter(
        { table: catTable, column: catColumn, displayName: categorySelect.options[categorySelect.selectedIndex].text, values: [] },
        {
        operator,
        itemCount: count,
        orderByTable: measureTable,
        orderByColumn: measureColumn
        }
        );
        }
        });
        actionsRow.appendChild(applyBtn);
        controlSection.appendChild(actionsRow);

        this.controlsContainer.appendChild(controlSection);
    }

    public applyTheming(formattingSettings: VisualFormattingSettingsModel): void {
        const accentColor = formattingSettings.themingCard.accentColor.value.value;
        const borderRadius = formattingSettings.themingCard.borderRadius.value;

        this.panelContainer.style.setProperty("--accent-color", accentColor);
        this.panelContainer.style.setProperty("--border-radius", `${borderRadius}px`);
    }
}
