/*
 * Build AdvancedFilter for numeric range filtering
 * Used for operators like GreaterThan, LessThan, Between, etc.
 */
import * as models from "powerbi-models";
export function buildAdvancedFilter(table, column, range, logicalOperator = "And") {
    if (!table || !column) {
        return null;
    }
    const target = {
        table,
        column
    };
    const conditions = [];
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
    const filter = new models.AdvancedFilter(target, logicalOperator, ...conditions);
    return filter.toJSON();
}
//# sourceMappingURL=buildAdvanced.js.map