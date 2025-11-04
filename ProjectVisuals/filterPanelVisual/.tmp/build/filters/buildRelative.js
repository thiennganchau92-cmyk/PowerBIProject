/*
 * Build RelativeDateFilter for relative date filtering
 * Used for "Last N days", "This month", etc.
 */
import * as models from "powerbi-models";
export function buildRelativeDateFilter(table, column, config) {
    if (!table || !column || !config || config.timeUnitsCount === undefined) {
        return null;
    }
    const target = {
        table,
        column
    };
    const filter = new models.RelativeDateFilter(target, config.operator, config.timeUnitsCount, config.timeUnit, config.includeToday || false);
    return filter.toJSON();
}
//# sourceMappingURL=buildRelative.js.map