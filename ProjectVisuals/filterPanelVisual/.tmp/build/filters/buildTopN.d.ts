import * as models from "powerbi-models";
export type TopNOperator = "Top" | "Bottom";
export interface TopNConfig {
    operator: TopNOperator;
    itemCount: number;
    orderByTable: string;
    orderByColumn: string;
}
export declare function buildTopNFilter(table: string, column: string, config: TopNConfig): models.ITopNFilter | null;
