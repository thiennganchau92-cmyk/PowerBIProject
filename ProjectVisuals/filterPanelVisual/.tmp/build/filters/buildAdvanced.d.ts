import * as models from "powerbi-models";
export interface NumericRange {
    min?: number;
    max?: number;
}
export declare function buildAdvancedFilter(table: string, column: string, range: NumericRange, logicalOperator?: "And" | "Or"): models.IAdvancedFilter | null;
