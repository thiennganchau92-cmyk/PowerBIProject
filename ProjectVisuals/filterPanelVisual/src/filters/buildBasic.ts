/*
 * Build BasicFilter for category/multi-select filtering
 * Used for In/NotIn operators with multiple values
 */

import * as models from "powerbi-models";

export function buildBasicFilter(
    table: string,
    column: string,
    values: any[],
    operator: "In" | "NotIn" = "In"
): models.IBasicFilter | null {
    if (!table || !column || !values || values.length === 0) {
        return null;
    }

    const target: models.IFilterTarget = {
        table,
        column
    };

    const filter = new models.BasicFilter(
        target,
        operator,
        values
    );

    return filter.toJSON();
}
