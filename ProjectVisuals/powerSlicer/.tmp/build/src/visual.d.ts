import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private searchInput;
    private searchContainer;
    private searchIcon;
    private refreshIcon;
    private dropdown;
    private data;
    private host;
    private selectionManager;
    private selectedItems;
    private dataView;
    private selectedItemsContainer;
    private focusedIndex;
    private lastSelectedItemIndex;
    private listbox;
    private formattingSettings;
    private formattingSettingsService;
    private previousResetTrigger;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private applyGlobalStyles;
    private transformData;
    private getNodeDisplayName;
    private createLeafNode;
    private getFilteredData;
    private renderDropdown;
    private renderNode;
    private applyFilter;
    private renderSelectedItems;
    private getAllNames;
    private hasSelectedDescendants;
    private parseFilterTarget;
    private clearAll;
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
