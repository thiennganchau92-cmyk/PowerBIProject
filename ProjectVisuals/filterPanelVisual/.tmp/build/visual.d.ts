import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private host;
    private formattingSettings;
    private formattingSettingsService;
    private panelContainer;
    private activeChipsContainer;
    private controlsContainer;
    private footerContainer;
    private categoryData;
    private numericData;
    private dateData;
    private measureData;
    private originalCategoryData;
    private originalNumericData;
    private originalDateData;
    private currentDataView;
    private selectedCategories;
    private numericRanges;
    private relativeDateConfigs;
    private topNConfigs;
    private activeFilters;
    private pendingChanges;
    constructor(options: VisualConstructorOptions);
    private initializeUI;
    update(options: VisualUpdateOptions): void;
    private extractData;
    /**
     * Apply cross-filtering: compute filtered datasets based on active filters
     * This allows filters to constrain each other
     */
    private applyFiltersCount;
    private computeFilteredCategoryData;
    private computeFilteredNumericData;
    private computeFilteredDateData;
    private getFiltersExcept;
    private getFilteredValues;
    private renderActiveChips;
    private createFilterChip;
    private renderControls;
    private renderCategoryControl;
    private createCategoryItem;
    private filterCategoryList;
    private handleCategoryChange;
    private selectAllCategories;
    private clearCategorySelection;
    private renderFooter;
    private applyCategoryFilter;
    private applyFilters;
    private removeFilter;
    private resetAll;
    private renderNumericControl;
    private renderDateControl;
    private renderTopNControl;
    private applyNumericFilter;
    private applyDateFilter;
    private applyTopNFilter;
    private applyTheming;
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
