import { VisualFormattingSettingsModel } from "../settings";
import { DataManager } from "../data/dataManager";
import { FilterManager } from "../filters/filterManager";
export declare class CrossFilterManager {
    private dataManager;
    private filterManager;
    private formattingSettings;
    constructor(dataManager: DataManager, filterManager: FilterManager);
    updateFormattingSettings(formattingSettings: VisualFormattingSettingsModel): void;
    applyFiltersCount(): void;
    private computeFilteredCategoryData;
    private computeFilteredNumericData;
    private computeFilteredDateData;
    private getFiltersExcept;
    private getValidIndices;
    private getFilteredValues;
}
