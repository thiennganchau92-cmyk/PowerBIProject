import * as models from "powerbi-models";
export declare function buildBasicFilter(table: string, column: string, values: any[], operator?: "In" | "NotIn"): models.IBasicFilter | null;
