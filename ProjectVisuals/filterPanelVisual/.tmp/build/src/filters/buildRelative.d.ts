import * as models from "powerbi-models";
export interface RelativeDateConfig {
    operator: models.RelativeDateOperators;
    timeUnitsCount: number;
    timeUnit: models.RelativeDateFilterTimeUnit;
    includeToday?: boolean;
}
export declare function buildRelativeDateFilter(table: string, column: string, config: RelativeDateConfig): models.IRelativeDateFilter | null;
