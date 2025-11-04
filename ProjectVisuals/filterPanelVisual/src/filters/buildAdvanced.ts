/*
 * Build AdvancedFilter for numeric range filtering
 * Used for operators like GreaterThan, LessThan, Between, etc.
 */

import * as models from "powerbi-models";

export interface NumericRange {
    min?: number;
    max?: number;
}

export function buildAdvancedFilter(
    table: string,
    column: string,
    range: NumericRange,
    logicalOperator: "And" | "Or" = "And"
): models.IAdvancedFilter | null {
    if (!table || !column) {
        return null;
    }

    const target: models.IFilterTarget = {
        table,
        column
    };

    const conditions: models.IAdvancedFilterCondition[] = [];

    // Add min condition
    if (range.min !== undefined && range.min !== null) {
        conditions.push({
            operator: "GreaterThanOrEqual",
            value: range.min
        });
    }

    // Add max condition
    if (range.max !== undefined && range.max !== null) {
        conditions.push({
            operator: "LessThanOrEqual",
            value: range.max
        });
    }

    if (conditions.length === 0) {
        return null;
    }

    const filter = new models.AdvancedFilter(
        target,
        logicalOperator,
        ...conditions
    );

    return filter.toJSON();
}
