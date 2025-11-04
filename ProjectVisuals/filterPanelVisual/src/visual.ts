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
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import * as models from "powerbi-models";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualFormattingSettingsModel } from "./settings";

import { UIManager } from "./ui/uiManager";
import { DataManager, CategoryData, NumericData, DateData } from "./data/dataManager";
import { FilterManager } from "./filters/filterManager";
import { CrossFilterManager } from "./cross-filter/crossFilterManager";
import { NumericRange, RelativeDateConfig, TopNConfig } from "./filters";

export class Visual implements IVisual {
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private uiManager: UIManager;
    private dataManager: DataManager;
    private filterManager: FilterManager;
    private crossFilterManager: CrossFilterManager;

    private isInitialLoad: boolean = true;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        
        this.dataManager = new DataManager();
        this.filterManager = new FilterManager(this.host, this.dataManager, null, null); // UIManager and CrossFilterManager will be set after their instantiation
        this.crossFilterManager = new CrossFilterManager(this.dataManager, this.filterManager);
        this.uiManager = new UIManager(this, this.filterManager, this.crossFilterManager, options.element);

        // Now set the circular dependencies
        this.filterManager.uiManager = this.uiManager;
        this.filterManager.crossFilterManager = this.crossFilterManager;

        this.uiManager.initialize();
    }

    public update(options: VisualUpdateOptions) {
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        if (this.isInitialLoad) {
            this.uiManager.applyInitialPanelState(this.formattingSettings);
            this.isInitialLoad = false;
        }

        this.dataManager.extractData(options);
        this.filterManager.updateFormattingSettings(this.formattingSettings);
        this.crossFilterManager.updateFormattingSettings(this.formattingSettings);

        this.crossFilterManager.applyFiltersCount();

        this.uiManager.render(this.formattingSettings, {
            categoryData: this.dataManager.categoryData,
            numericData: this.dataManager.numericData,
            dateData: this.dataManager.dateData,
            measureData: this.dataManager.measureData,
            originalCategoryData: this.dataManager.originalCategoryData,
            activeFilters: this.filterManager.activeFilters,
            pendingChanges: this.filterManager.pendingChanges
        });
    }

    public handleCategoryChange(categoryData: CategoryData, value: any, checked: boolean, fieldKey: string): void {
        this.filterManager.handleCategoryChange(categoryData, value, checked, fieldKey);
    }

    public selectAllCategories(categoryData: CategoryData, fieldKey: string): void {
        this.filterManager.selectAllCategories(categoryData, fieldKey);
    }

    public clearCategorySelection(categoryData: CategoryData, fieldKey: string): void {
        this.filterManager.clearCategorySelection(categoryData, fieldKey);
    }

    public applyCategoryFilter(categoryData: CategoryData, fieldKey: string): void {
        this.filterManager.applyCategoryFilter(categoryData, fieldKey);
    }

    public applyFilters(): void {
        this.filterManager.applyFilters();
    }

    public removeFilter(id: string): void {
        this.filterManager.removeFilter(id);
    }

    public resetAll(): void {
        this.filterManager.resetAll();
    }

    public applyNumericFilter(numericData: NumericData, range: NumericRange): void {
        this.filterManager.applyNumericFilter(numericData, range);
    }

    public applyDateFilter(dateData: DateData, config: RelativeDateConfig): void {
        this.filterManager.applyDateFilter(dateData, config);
    }

    public applyTopNFilter(categoryData: CategoryData, config: TopNConfig): void {
        this.filterManager.applyTopNFilter(categoryData, config);
    }

    public getSelectedCategories(): Map<string, Set<any>> {
        return this.filterManager.selectedCategories;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
