/*
 * Build TopNFilter for Top N filtering
 * Used for "Top 10 by Sales", "Bottom 5 by Profit", etc.
 */
import * as models from "powerbi-models";
export function buildTopNFilter(table, column, config) {
    if (!table || !column || !config || config.itemCount === undefined) {
        return null;
    }
    if (!config.orderByTable || !config.orderByColumn) {
        return null;
    }
    const target = {
        table,
        column
    };
    const orderBy = {
        table: config.orderByTable,
        column: config.orderByColumn
    };
    const filter = new models.TopNFilter(target, config.operator, config.itemCount, orderBy);
    return filter.toJSON();
}
//# sourceMappingURL=buildTopN.js.map