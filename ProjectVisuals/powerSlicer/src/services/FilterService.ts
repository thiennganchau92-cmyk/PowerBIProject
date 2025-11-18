import powerbi from "powerbi-visuals-api";
import { IFilterColumnTarget, BasicFilter } from "powerbi-models";
import FilterAction = powerbi.FilterAction;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class FilterService {
    constructor(private host: IVisualHost) {}

    applyFilter(selectedItems: string[], target: IFilterColumnTarget): void {
        if (selectedItems.length > 0) {
            const filter = new BasicFilter(target, "In", selectedItems);
            this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
        } else {
            this.removeFilter();
        }
    }

    removeFilter(): void {
        this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
    }

    static parseFilterTarget(dataView: powerbi.DataView, categoryIndex: number = 0): IFilterColumnTarget {
        const categories = dataView.categorical.categories;
        const safeIndex = categoryIndex >= 0 && categoryIndex < categories.length ? categoryIndex : 0;
        const source = categories[safeIndex].source;
        const qn = source.queryName || "";
        let table = "";
        let column = "";

        const bracketMatch = qn.match(/(.+?)\[(.+)\]$/);
        if (bracketMatch) {
            const before = bracketMatch[1];
            column = bracketMatch[2];
            const parts = before.split('.');
            table = parts[parts.length - 1];
        } else {
            const dotIndex = qn.indexOf('.');
            if (dotIndex > -1) {
                table = qn.substr(0, dotIndex);
            } else {
                table = qn || source.displayName || "";
            }
            column = source.displayName || qn;
        }

        return { table, column };
    }
}
