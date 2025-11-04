/*
 * Build RelativeDateFilter for relative date filtering
 * Used for "Last N days", "This month", etc.
 */

import * as models from "powerbi-models";

export interface RelativeDateConfig {
    operator: models.RelativeDateOperators;
    timeUnitsCount: number;
    timeUnit: models.RelativeDateFilterTimeUnit;
    includeToday?: boolean;
}

export function buildRelativeDateFilter(
    table: string,
    column: string,
    config: RelativeDateConfig
): models.IRelativeDateFilter | null {
    if (!table || !column || !config || config.timeUnitsCount === undefined) {
        return null;
    }

    const target: models.IFilterTarget = {
        table,
        column
    };

    const filter = new models.RelativeDateFilter(
        target,
        config.operator,
        config.timeUnitsCount,
        config.timeUnit,
        config.includeToday || false
    );

    return filter.toJSON();
}
