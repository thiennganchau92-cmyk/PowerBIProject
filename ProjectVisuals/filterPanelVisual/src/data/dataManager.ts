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
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export interface CategoryData {
    table: string;
    column: string;
    displayName: string;
    values: any[];
}

export interface NumericData {
    table: string;
    column: string;
    displayName: string;
    min: number;
    max: number;
}

export interface DateData {
    table: string;
    column: string;
    displayName: string;
    minDate: Date;
    maxDate: Date;
}

export interface MeasureData {
    table: string;
    column: string;
    displayName: string;
}

export interface ActiveFilter {
    id: string;
    displayName: string;
    description: string;
    filterType: 'category' | 'numeric' | 'date' | 'topn';
}

export class DataManager {
    public categoryData: CategoryData[] = [];
    public numericData: NumericData[] = [];
    public dateData: DateData[] = [];
    public measureData: MeasureData[] = [];
    public originalCategoryData: CategoryData[] = [];
    public originalNumericData: NumericData[] = [];
    public originalDateData: DateData[] = [];
    public currentDataView: powerbi.DataView | null = null;

    public extractData(options: VisualUpdateOptions): void {
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }

        const dataView = options.dataViews[0];
        this.currentDataView = dataView;
        
        this.categoryData = [];
        this.numericData = [];
        this.dateData = [];
        this.measureData = [];
        
        this.originalCategoryData = [];
        this.originalNumericData = [];
        this.originalDateData = [];

        if (dataView.categorical && dataView.categorical.categories) {
            dataView.categorical.categories.forEach(category => {
                const source = category.source;
                const roles = source.roles;

                if (roles && roles['categoryFields']) {
                    const queryParts = source.queryName?.split('.') || [];
                    const uniqueValues = [...new Set(category.values as any[])].sort();
                    const catData = {
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Category",
                        values: uniqueValues
                    };
                    this.categoryData.push(catData);
                    this.originalCategoryData.push({...catData, values: [...uniqueValues]});
                } else if (roles && roles['dateFields']) {
                    const values = category.values as Date[];
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
                    this.originalDateData.push({...dateDataItem});
                }
            });
        }

        if (dataView.categorical && dataView.categorical.values) {
            dataView.categorical.values.forEach(measure => {
                const source = measure.source;
                const roles = source.roles;

                if (roles && roles['numericFields']) {
                    const values = measure.values as number[];
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
                    this.originalNumericData.push({...numData});
                } else if (roles && roles['topByMeasure']) {
                    const queryParts = source.queryName?.split('.') || [];
                    this.measureData.push({
                        table: queryParts[0] || "",
                        column: queryParts[1] || source.displayName || "",
                        displayName: source.displayName || "Measure"
                    });
                }
            });
        }
    }
}
