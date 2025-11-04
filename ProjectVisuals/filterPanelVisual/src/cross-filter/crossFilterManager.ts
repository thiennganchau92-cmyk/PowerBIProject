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
import { DataManager, CategoryData, NumericData, DateData } from "../data/dataManager";
import { FilterManager } from "../filters/filterManager";

export class CrossFilterManager {
    private dataManager: DataManager;
    private filterManager: FilterManager;
    private formattingSettings: VisualFormattingSettingsModel;

    constructor(dataManager: DataManager, filterManager: FilterManager) {
        this.dataManager = dataManager;
        this.filterManager = filterManager;
    }

    public updateFormattingSettings(formattingSettings: VisualFormattingSettingsModel): void {
        this.formattingSettings = formattingSettings;
    }

    public applyFiltersCount(): void {
        if (!this.formattingSettings?.panelSettingsCard?.enableCrossFiltering?.value) {
            this.dataManager.categoryData = this.dataManager.originalCategoryData.map(d => ({...d, values: [...d.values]}));
            this.dataManager.numericData = this.dataManager.originalNumericData.map(d => ({...d}));
            this.dataManager.dateData = this.dataManager.originalDateData.map(d => ({...d}));
            return;
        }

        const activeCategoryFilters = Array.from(this.filterManager.selectedCategories.entries())
            .filter(([_, values]) => values.size > 0);
        const activeNumericFilters = Array.from(this.filterManager.numericRanges.entries());
        const activeDateFilters = Array.from(this.filterManager.relativeDateConfigs.entries());

        if (activeCategoryFilters.length === 0 && activeNumericFilters.length === 0 && activeDateFilters.length === 0) {
            this.dataManager.categoryData = this.dataManager.originalCategoryData.map(d => ({...d, values: [...d.values]}));
            this.dataManager.numericData = this.dataManager.originalNumericData.map(d => ({...d}));
            this.dataManager.dateData = this.dataManager.originalDateData.map(d => ({...d}));
            return;
        }

        this.computeFilteredCategoryData();
        this.computeFilteredNumericData();
        this.computeFilteredDateData();
    }

    private computeFilteredCategoryData(): void {
        this.dataManager.categoryData = this.dataManager.originalCategoryData.map(catData => {
            const fieldKey = `${catData.table}.${catData.column}`;
            const otherFilters = this.getFiltersExcept(fieldKey);
            
            if (otherFilters.length === 0) {
                return {...catData, values: [...catData.values]};
            }
            
            const filteredValues = this.getFilteredValues(catData, otherFilters);
            
            return {
                ...catData,
                values: filteredValues
            };
        });
    }

    private computeFilteredNumericData(): void {
        this.dataManager.numericData = this.dataManager.originalNumericData.map(numData => {
            const fieldKey = `${numData.table}.${numData.column}`;
            const otherFilters = this.getFiltersExcept(fieldKey);
            
            const validIndices = this.getValidIndices(otherFilters);
            const dataView = this.dataManager.currentDataView;
    
            if (!validIndices || !dataView || !dataView.categorical || !dataView.categorical.values) {
                return {...numData};
            }
    
            const numericColumn = dataView.categorical.values.find(v => v.source.queryName === fieldKey);
            if (!numericColumn) {
                return {...numData};
            }
    
            const filteredNumericValues: number[] = [];
            validIndices.forEach(index => {
                const val = numericColumn.values[index];
                if (val !== null && val !== undefined && typeof val === 'number') {
                    filteredNumericValues.push(val as number);
                }
            });
    
            if (filteredNumericValues.length > 0) {
                const newMin = Math.min(...filteredNumericValues);
                const newMax = Math.max(...filteredNumericValues);
                return {...numData, min: newMin, max: newMax};
            } else {
                return {...numData, min: 0, max: 0};
            }
        });
    }

    private computeFilteredDateData(): void {
        this.dataManager.dateData = this.dataManager.originalDateData.map(dateDataItem => {
            const fieldKey = `${dateDataItem.table}.${dateDataItem.column}`;
            const otherFilters = this.getFiltersExcept(fieldKey);
    
            const validIndices = this.getValidIndices(otherFilters);
            const dataView = this.dataManager.currentDataView;
    
            if (!validIndices || !dataView || !dataView.categorical || !dataView.categorical.categories) {
                return {...dateDataItem};
            }
    
            const dateColumn = dataView.categorical.categories.find(c => c.source.queryName === fieldKey);
            if (!dateColumn) {
                return {...dateDataItem};
            }
    
            const filteredDates: Date[] = [];
            validIndices.forEach(index => {
                const val = dateColumn.values[index];
                if (val !== null && val !== undefined) {
                    filteredDates.push(new Date(val as any));
                }
            });
    
            if (filteredDates.length > 0) {
                const newMin = new Date(Math.min(...filteredDates.map(d => d.getTime())));
                const newMax = new Date(Math.max(...filteredDates.map(d => d.getTime())));
                return {...dateDataItem, minDate: newMin, maxDate: newMax};
            } else {
                const now = new Date();
                return {...dateDataItem, minDate: now, maxDate: now};
            }
        });
    }

    private getFiltersExcept(excludeFieldKey: string): any[] {
        const filters: any[] = [];
        
        this.filterManager.selectedCategories.forEach((values, key) => {
            if (key !== excludeFieldKey && values.size > 0) {
                filters.push({type: 'category', key, values: Array.from(values)});
            }
        });
        
        this.filterManager.numericRanges.forEach((range, key) => {
            if (key !== excludeFieldKey) {
                filters.push({type: 'numeric', key, range});
            }
        });
        
        this.filterManager.relativeDateConfigs.forEach((config, key) => {
            if (key !== excludeFieldKey) {
                filters.push({type: 'date', key, config});
            }
        });

        this.filterManager.topNConfigs.forEach((config, key) => {
            if (key !== excludeFieldKey) {
                filters.push({type: 'topn', key, config});
            }
        });
        
        return filters;
    }

    private getValidIndices(filters: any[]): Set<number> | null {
        const dataView = this.dataManager.currentDataView;
        if (!dataView || !dataView.categorical || !dataView.categorical.categories || !dataView.categorical.categories[0]) {
            return null;
        }
    
        const numRows = dataView.categorical.categories[0].values.length;
        let validIndices = new Set<number>(Array.from({length: numRows}, (_, i) => i));
        const allCategories = dataView.categorical.categories;
    
        const categoryFilters = filters.filter(f => f.type === 'category');
    
        categoryFilters.forEach(filter => {
            const filterKey = filter.key;
            const categoryColumn = allCategories.find(c => c.source.queryName === filterKey);
            if (categoryColumn) {
                const filterValues = new Set(filter.values);
                const indicesForThisFilter = new Set<number>();
                categoryColumn.values.forEach((val, index) => {
                    if (filterValues.has(val)) {
                        indicesForThisFilter.add(index);
                    }
                });
                validIndices = new Set([...validIndices].filter(i => indicesForThisFilter.has(i)));
            }
        });
    
        return validIndices;
    }

    private getFilteredValues(targetCatData: CategoryData, otherFilters: any[]): any[] {
        const validIndices = this.getValidIndices(otherFilters);
        const dataView = this.dataManager.currentDataView;
    
        if (!validIndices || !dataView || !dataView.categorical || !dataView.categorical.categories) {
            return Array.from(new Set(targetCatData.values)).sort();
        }
    
        const targetCategoryColumn = dataView.categorical.categories.find(c => c.source.queryName === `${targetCatData.table}.${targetCatData.column}`);
        if (!targetCategoryColumn) {
            return Array.from(new Set(targetCatData.values)).sort();
        }
    
        const filteredValues = new Set<any>();
        validIndices.forEach(index => {
            filteredValues.add(targetCategoryColumn.values[index]);
        });
    
        return Array.from(filteredValues).sort();
    }
}
