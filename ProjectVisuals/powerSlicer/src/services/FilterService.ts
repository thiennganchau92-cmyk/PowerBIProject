import powerbi from "powerbi-visuals-api";
import { IFilterColumnTarget, BasicFilter } from "powerbi-models";
import { EventBus } from "../events/EventBus";
import { EventNames } from "../events/EventTypes";
import FilterAction = powerbi.FilterAction;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class FilterService {
    private eventBus: EventBus | null = null;

    constructor(private host: IVisualHost) { }

    /**
     * Set the event bus for emitting filter events
     * @param eventBus EventBus instance
     */
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    /**
     * Apply filter to Power BI report
     * @param selectedItems Items to filter on
     * @param target Filter target (table and column)
     */
    applyFilter(selectedItems: string[], target: IFilterColumnTarget): void {
        try {
            if (!target || !target.table || !target.column) {
                console.error("Invalid filter target:", target);
                return;
            }

            if (selectedItems && selectedItems.length > 0) {
                const filter = new BasicFilter(target, "In", selectedItems);
                this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
                this.emitFilterApply(selectedItems);
            } else {
                this.removeFilter();
            }
        } catch (error) {
            console.error("Error applying filter:", error);
        }
    }

    /**
     * Remove filter from Power BI report
     */
    removeFilter(): void {
        try {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
            this.emitFilterRemove();
        } catch (error) {
            console.error("Error removing filter:", error);
        }
    }

    /**
     * Parse filter target from data view
     * @param dataView Power BI data view
     * @param categoryIndex Category index to use
     * @returns Filter target with table and column
     */
    static parseFilterTarget(dataView: powerbi.DataView, categoryIndex: number = 0): IFilterColumnTarget {
        try {
            if (!dataView || !dataView.categorical || !dataView.categorical.categories) {
                console.error("Invalid dataView structure");
                return { table: "", column: "" };
            }

            const categories = dataView.categorical.categories;
            if (categories.length === 0) {
                console.error("No categories found in dataView");
                return { table: "", column: "" };
            }

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
                    column = qn.substr(dotIndex + 1);
                } else {
                    table = qn || source.displayName || "";
                    column = qn || source.displayName || "";
                }
            }

            return { table, column };
        } catch (error) {
            console.error("Error parsing filter target:", error);
            return { table: "", column: "" };
        }
    }

    // Event emission methods
    private emitFilterApply(selectedItems: string[]): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.FILTER_APPLY, { selectedItems });
        }
    }

    private emitFilterRemove(): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.FILTER_REMOVE, {});
        }
    }
}

