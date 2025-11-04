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
export declare class DataManager {
    categoryData: CategoryData[];
    numericData: NumericData[];
    dateData: DateData[];
    measureData: MeasureData[];
    originalCategoryData: CategoryData[];
    originalNumericData: NumericData[];
    originalDateData: DateData[];
    currentDataView: powerbi.DataView | null;
    extractData(options: VisualUpdateOptions): void;
}
