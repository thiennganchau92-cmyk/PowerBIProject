/*
 * Build TopNFilter for Top N filtering
 * Used for "Top 10 by Sales", "Bottom 5 by Profit", etc.
 */

import * as models from "powerbi-models";

export type TopNOperator = "Top" | "Bottom";

export interface TopNConfig {
    operator: TopNOperator;
    itemCount: number;
    orderByTable: string;
    orderByColumn: string;
}

export function buildTopNFilter(
    table: string,
    column: string,
    config: TopNConfig
): models.ITopNFilter | null {
    if (!table || !column || !config || config.itemCount === undefined) {
        return null;
    }

    if (!config.orderByTable || !config.orderByColumn) {
        return null;
    }

    const target: models.IFilterTarget = {
        table,
        column
    };

    const orderBy: models.IFilterTarget = {
        table: config.orderByTable,
        column: config.orderByColumn
    };

    const filter = new models.TopNFilter(
        target,
        config.operator,
        config.itemCount,
        orderBy
    );

    return filter.toJSON();
}
