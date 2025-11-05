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
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import FilterAction = powerbi.FilterAction;

import { VisualFormattingSettingsModel } from "../settings";
import { buildBasicFilter, buildAdvancedFilter, buildRelativeDateFilter, buildTopNFilter, NumericRange, RelativeDateConfig, TopNConfig } from "./index"; 
import { DataManager, CategoryData, NumericData, DateData, ActiveFilter } from "../data/dataManager";
import { UIManager } from "../ui/uiManager";
import { CrossFilterManager } from "../cross-filter/crossFilterManager";

export class FilterManager {
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private dataManager: DataManager;
    public uiManager: UIManager;
    public crossFilterManager: CrossFilterManager;

    public selectedCategories: Map<string, Set<any>> = new Map();
    public numericRanges: Map<string, NumericRange> = new Map();
    public relativeDateConfigs: Map<string, RelativeDateConfig> = new Map();
    public topNConfigs: Map<string, TopNConfig> = new Map();
    public activeFilters: Map<string, ActiveFilter> = new Map();
    public pendingChanges: boolean = false;

    constructor(host: IVisualHost, dataManager: DataManager, uiManager: UIManager, crossFilterManager: CrossFilterManager) {
        this.host = host;
        this.dataManager = dataManager;
        this.uiManager = uiManager;
        this.crossFilterManager = crossFilterManager;
    }

    public updateFormattingSettings(formattingSettings: VisualFormattingSettingsModel): void {
        this.formattingSettings = formattingSettings;
    }

    public handleCategoryChange(categoryData: CategoryData, value: any, checked: boolean, fieldKey: string): void {
        let selections = this.selectedCategories.get(fieldKey);
        if (!selections) {
            selections = new Set();
            this.selectedCategories.set(fieldKey, selections);
        }

        if (checked) {
            selections.add(value);
        } else {
            selections.delete(value);
        }

        this.pendingChanges = true;
        this.renderUI();

        const applyMode = this.formattingSettings.panelSettingsCard.applyMode.value.value;
        if (applyMode === "Instant") {
            this.applyCategoryFilter(categoryData, fieldKey);
        } else {
            this.renderUI();
        }
    }

    public selectAllCategories(categoryData: CategoryData, fieldKey: string): void {
        let selections = this.selectedCategories.get(fieldKey);
        if (!selections) {
            selections = new Set();
            this.selectedCategories.set(fieldKey, selections);
        }

        categoryData.values.forEach(value => {
            selections.add(value);
        });

        this.renderUI();
        this.applyCategoryFilter(categoryData, fieldKey);
    }

    public clearCategorySelection(categoryData: CategoryData, fieldKey: string): void {
        this.selectedCategories.delete(fieldKey);
        this.removeFilter(fieldKey);
        this.renderUI();
    }

    public applyCategoryFilter(categoryData: CategoryData, fieldKey: string): void {
        const selections = this.selectedCategories.get(fieldKey);
        const selectedValues = selections ? Array.from(selections) : [];

        if (selectedValues.length > 0) {
            const filter = buildBasicFilter(
                categoryData.table,
                categoryData.column,
                selectedValues,
                "In"
            );

            if (filter) {
                this.host.applyJsonFilter(
                    filter,
                    "general",
                    "filter",
                    FilterAction.merge
                );

                this.activeFilters.set(fieldKey, {
                    id: fieldKey,
                    displayName: categoryData.displayName,
                    description: `${selectedValues.length} selected`,
                    filterType: 'category'
                });
            }
        } else {
            this.removeFilter(fieldKey);
        }

        this.pendingChanges = false;
        this.renderUI();
    }

    public applyFilters(): void {
        this.dataManager.categoryData.forEach(category => {
            const fieldKey = `${category.table}.${category.column}`;
            this.applyCategoryFilter(category, fieldKey);
        });

        this.pendingChanges = false;
        this.renderUI();
    }

    public removeFilter(id: string): void {
        this.activeFilters.delete(id);

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

        this.host.applyJsonFilter(
            null,
            "general",
            "filter",
            FilterAction.remove
        );

        this.renderUI();
    }

    public resetAll(): void {
        this.selectedCategories.clear();
        this.numericRanges.clear();
        this.relativeDateConfigs.clear();
        this.topNConfigs.clear();
        this.activeFilters.clear();
        this.pendingChanges = false;
        this.host.applyJsonFilter(
            null,
            "general",
            "filter",
            FilterAction.remove
        );

        this.renderUI();
    }

    public applyNumericFilter(numericData: NumericData, range: NumericRange): void {
        const filter = buildAdvancedFilter(
            numericData.table,
            numericData.column,
            range,
            "And"
        );

        if (filter) {
            this.host.applyJsonFilter(
                filter,
                "general",
                "filter",
                FilterAction.merge
            );

            const fieldKey = `${numericData.table}.${numericData.column}`;
            this.numericRanges.set(fieldKey, range);

            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: numericData.displayName,
                description: `${range.min} - ${range.max}`,
                filterType: 'numeric'
            });

            this.renderUI();
        }
    }

    public applyDateFilter(dateData: DateData, config: RelativeDateConfig): void {
        const filter = buildRelativeDateFilter(
            dateData.table,
            dateData.column,
            config
        );

        if (filter) {
            this.host.applyJsonFilter(
                filter,
                "general",
                "filter",
                FilterAction.merge
            );

            const fieldKey = `${dateData.table}.${dateData.column}`;
            this.relativeDateConfigs.set(fieldKey, config);

            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: dateData.displayName,
                description: `${config.operator} ${config.timeUnitsCount} ${config.timeUnit}`,
                filterType: 'date'
            });

            this.renderUI();
        }
    }

    public applyTopNFilter(categoryData: CategoryData, config: TopNConfig): void {
        const filter = buildTopNFilter(
            categoryData.table,
            categoryData.column,
            config
        );

        if (filter) {
            this.host.applyJsonFilter(
                filter,
                "general",
                "filter",
                FilterAction.merge
            );

            const fieldKey = `${categoryData.table}.${categoryData.column}`;
            this.topNConfigs.set(fieldKey, config);

            this.activeFilters.set(fieldKey, {
                id: fieldKey,
                displayName: categoryData.displayName,
                description: `${config.operator} ${config.itemCount}`,
                filterType: 'topn'
            });

            this.renderUI();
        }
    }

    public getSelectedCategories(): Map<string, Set<any>> {
        return this.selectedCategories;
    }

    private renderUI(): void {
        this.crossFilterManager.applyFiltersCount();
        this.uiManager.render(this.formattingSettings, {
            categoryData: this.dataManager.categoryData,
            numericData: this.dataManager.numericData,
            dateData: this.dataManager.dateData,
            measureData: this.dataManager.measureData,
            originalCategoryData: this.dataManager.originalCategoryData,
            activeFilters: this.activeFilters,
            pendingChanges: this.pendingChanges
        }, this.formattingSettings.panelSettingsCard.layout.value.value as string);
    }
}