/*
 * Build BasicFilter for category/multi-select filtering
 * Used for In/NotIn operators with multiple values
 */
import * as models from "powerbi-models";
export function buildBasicFilter(table, column, values, operator = "In") {
    if (!table || !column || !values || values.length === 0) {
        return null;
    }
    const target = {
        table,
        column
    };
    const filter = new models.BasicFilter(target, operator, values);
    return filter.toJSON();
}
//# sourceMappingURL=buildBasic.js.map