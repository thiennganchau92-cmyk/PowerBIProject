"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { IFilterColumnTarget, BasicFilter, IBasicFilter, IFilter, FilterType } from "powerbi-models";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualFormattingSettingsModel } from "./settings";
import { SlicerNode } from "./interfaces";
import { DataService } from "./services/DataService";
import { FilterService } from "./services/FilterService";
import { SelectionStateManager } from "./services/SelectionManager";
import { SearchBox } from "./ui/SearchBox";
import { Dropdown } from "./ui/Dropdown";
import { ItemCounter } from "./ui/ItemCounter";
import { SelectAllButton } from "./ui/SelectAllButton";
import { SelectedItemsContainer } from "./ui/SelectedItemsContainer";
import { KeyboardHandler } from "./utils/keyboard";
import { DOMHelpers } from "./utils/domHelpers";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private dataView: powerbi.DataView;
    private data: SlicerNode[] = [];
    
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private previousResetTrigger: boolean | null = null;
    private hostFilterActive: boolean = false;

    private searchBox: SearchBox;
    private dropdown: Dropdown;
    private itemCounter: ItemCounter;
    private selectAllButton: SelectAllButton;
    private selectedItemsContainer: SelectedItemsContainer;
    
    private selectionManager: SelectionStateManager;
    private filterService: FilterService;
    private activeCategoryIndices: number[] = [0];
    private categorySelector: HTMLDivElement | null = null;
    
    private currentStyleConfig: {
        fontSize: number;
        defaultColor?: string;
        fill?: string;
        fillRule?: string;
    };

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        
        this.selectionManager = new SelectionStateManager();
        this.filterService = new FilterService(this.host);

        this.initializeUI();
    }

    private initializeUI(): void {
        // Initialize default style config
        this.currentStyleConfig = {
            fontSize: 12,
            defaultColor: undefined,
            fill: undefined,
            fillRule: undefined
        };

        this.searchBox = new SearchBox(this.target, {
            onSearchChange: (value) => this.handleSearchChange(value),
            onClear: () => this.handleSearchClear(),
            onRefresh: () => this.handleRefresh(),
            // Faster debounce so dropdown reflects typing more in real time
            debounceDelay: 150
        });

        this.selectedItemsContainer = new SelectedItemsContainer(this.target, {
            onRemoveItem: (item) => this.handleItemRemove(item),
            fontSize: 12
        });

        // Create compact actions bar
        this.createActionsBar();

        this.dropdown = new Dropdown(this.target, {
            onItemClick: (item, event) => this.handleItemClick(item, event),
            fontSize: 12
        });

        this.attachKeyboardHandlers();
        this.attachClickOutsideHandler();
    }

    private createActionsBar(): void {
        // Create container for count badge and select all button
        const actionsBar = document.createElement("div");
        actionsBar.className = "actions-bar hidden";
        actionsBar.id = "actions-bar";
        
        this.itemCounter = new ItemCounter(actionsBar);
        this.selectAllButton = new SelectAllButton(actionsBar, () => this.handleSelectAll());
        
        this.target.appendChild(actionsBar);
    }

    private attachKeyboardHandlers(): void {
        const searchInput = this.searchBox.getInput();

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === KeyboardHandler.Keys.ARROW_DOWN) {
                e.preventDefault();
                this.dropdown.focusFirstItem();
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (this.dropdown && this.dropdown.isVisible()) {
                    this.dropdown.selectFirstVisibleItem();
                }
                // After confirming via Enter, collapse to the compact view
                this.collapseView();
                searchInput.blur();
            } else if (e.key === KeyboardHandler.Keys.ESCAPE) {
                this.collapseView();
                searchInput.blur();
            }
        });

        searchInput.addEventListener("focus", () => {
            // Expand view when user focuses on search
            this.expandView();
        });
    }

    private attachClickOutsideHandler(): void {
        // Clicks inside the visual but outside interactive elements
        document.addEventListener("click", (e) => {
            const eventTarget = e.target as HTMLElement;
            const isInsideVisual = this.target.contains(eventTarget);

            if (!isInsideVisual) {
                // Click completely outside this iframe/document will not be seen here
                // but clicks in the visual's own background area will collapse it.
                this.collapseView();
            }
        });

        // Losing focus (e.g., user clicks elsewhere in the report)
        window.addEventListener("blur", () => {
            this.collapseView();
        });
    }

    private collapseView(): void {
        // Hide dropdown and actions bar to save space
        this.dropdown.hide();
        this.hideActionsBar();
        this.selectAllButton.hide();
        this.target.classList.add("collapsed");
    }

    private expandView(): void {
        this.target.classList.remove("collapsed");
        const searchValue = this.searchBox.getValue();
        if (searchValue && searchValue.trim().length > 0) {
            this.showActionsBar();
            this.selectAllButton.show();
            this.dropdown.show();
        }
    }

    public update(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews[0]
        );

        this.handleBookmarkReset();
        this.loadData(options.dataViews[0]);
        this.applyGlobalStyles();
        this.updateUI();
    }

    private handleBookmarkReset(): void {
        const currentResetTrigger = this.formattingSettings.dataPointCard.bookmarkResetTrigger.value;
        
        if (this.previousResetTrigger !== null && this.previousResetTrigger !== currentResetTrigger) {
            this.clearAll();
        }
        
        this.previousResetTrigger = currentResetTrigger;
    }

    private loadData(dataView: powerbi.DataView): void {
        this.dataView = dataView;

        if (dataView && dataView.tree && dataView.tree.root && dataView.tree.root.children) {
            this.data = dataView.tree.root.children.map(child =>
                DataService.transformTreeData(child)
            );
        } else if (dataView && dataView.categorical && dataView.categorical.categories && dataView.categorical.categories[0]) {
            const categorical = dataView.categorical;
            const categories = categorical.categories;
            const valueColumns = categorical.values;

            // Ensure category selector reflects available fields
            this.updateCategorySelector(categories);

            const totalCategories = categories.length;
            const activeIndices = this.getActiveCategoryIndices(totalCategories);
            const primaryIndex = this.getPrimaryCategoryIndex(totalCategories);

            const primaryCategory = categories[primaryIndex];
            const otherCategories = activeIndices
                .filter(index => index !== primaryIndex)
                .map(index => categories[index]);

            const nodes: SlicerNode[] = [];

            for (let rowIndex = 0; rowIndex < primaryCategory.values.length; rowIndex++) {
                const searchParts: string[] = [];

                const primaryRaw = primaryCategory.values[rowIndex];
                const primaryText = primaryRaw !== undefined && primaryRaw !== null ? primaryRaw.toString() : "";

                const display = primaryText;

                if (primaryText) {
                    searchParts.push(primaryText);
                }

                // Other categories: used to broaden search context only
                otherCategories.forEach(category => {
                    const catValues = category.values;
                    if (catValues && rowIndex < catValues.length) {
                        const extra = catValues[rowIndex];
                        if (extra !== undefined && extra !== null) {
                            const text = extra.toString();
                            if (text && searchParts.indexOf(text) === -1) {
                                searchParts.push(text);
                            }
                        }
                    }
                });

                // Measure/value fields -> search only
                if (valueColumns && valueColumns.length > 0) {
                    for (let vColIndex = 0; vColIndex < valueColumns.length; vColIndex++) {
                        const vCol = valueColumns[vColIndex];
                        const vValues = vCol.values;
                        if (vValues && rowIndex < vValues.length) {
                            const extra = vValues[rowIndex];
                            if (extra !== undefined && extra !== null) {
                                const text = extra.toString();
                                if (text && searchParts.indexOf(text) === -1) {
                                    searchParts.push(text);
                                }
                            }
                        }
                    }
                }

                const searchText = searchParts.join(" | ");
                nodes.push(DataService.createLeafNode(display, searchText, rowIndex));
            }

            this.data = nodes;
        } else {
            this.data = [];
        }
    }

    private applyGlobalStyles(): void {
        const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
        const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
        const layout = this.formattingSettings.dataPointCard.layout.value.value;

        const wasCollapsed = this.target.classList.contains("collapsed");
        this.target.className = `slicer-container ${layout}`;
        if (wasCollapsed) {
            this.target.classList.add("collapsed");
        }

        this.searchBox.applyStyles(fontSize, defaultColor);

        // Update current styling configuration (don't recreate components)
        this.currentStyleConfig = {
            fontSize,
            defaultColor,
            fill: this.formattingSettings.dataPointCard.fill.value?.value,
            fillRule: this.formattingSettings.dataPointCard.fillRule.value?.value
        };
    }

    private updateUI(): void {
        const searchValue = this.searchBox.getValue();
        
        // Re-render selected items with current styling
        this.renderSelectedItemsWithStyle();
        
        this.updateItemCounter(searchValue);

        if (searchValue && searchValue.trim().length > 0) {
            this.renderFilteredData(searchValue);
        }
    }

    private renderSelectedItemsWithStyle(): void {
        // Clear and re-render with updated config
        this.selectedItemsContainer.clear();
        
        // Render items with current style config
        const selectedItems = this.selectionManager.getSelectedItems();
        selectedItems.forEach(item => {
            this.renderSelectedItem(item);
        });
    }

    private renderSelectedItem(itemName: string): void {
        const selectedItem = document.createElement("div");
        selectedItem.className = "selected-item";
        selectedItem.title = itemName; // Full name on hover
        
        // Create text span for truncation
        const textSpan = document.createElement("span");
        textSpan.className = "selected-item-text";
        textSpan.textContent = itemName;
        
        // Apply styles
        if (this.currentStyleConfig.fill) {
            selectedItem.style.backgroundColor = this.currentStyleConfig.fill;
        }
        if (this.currentStyleConfig.fillRule) {
            selectedItem.style.color = this.currentStyleConfig.fillRule;
        }

        const removeButton = document.createElement("span");
        removeButton.className = "remove-item";
        removeButton.textContent = "×";
        removeButton.tabIndex = 0;
        removeButton.setAttribute("role", "button");
        removeButton.setAttribute("aria-label", `Remove ${itemName}`);
        if (this.currentStyleConfig.defaultColor) {
            removeButton.style.color = this.currentStyleConfig.defaultColor;
        }

        removeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.handleItemRemove(itemName);
        });
        removeButton.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                this.handleItemRemove(itemName);
            }
        });

        selectedItem.appendChild(textSpan);
        selectedItem.appendChild(removeButton);
        
        // Get the actual container element and append
        const containerElement = this.selectedItemsContainer.getElement();
        containerElement.appendChild(selectedItem);
    }

    private handleSearchChange(value: string): void {
        if (value && value.trim().length > 0) {
            this.target.classList.remove("collapsed");
            this.showActionsBar();
            this.selectAllButton.show();
            this.dropdown.show();
            this.renderFilteredData(value);
            this.updateItemCounter(value);
        } else {
            this.hideActionsBar();
            this.selectAllButton.hide();
            this.dropdown.hide();
            this.updateItemCounter();
        }
    }

    private showActionsBar(): void {
        const actionsBar = document.getElementById("actions-bar");
        if (actionsBar) {
            actionsBar.classList.remove("hidden");
        }
    }

    private hideActionsBar(): void {
        const actionsBar = document.getElementById("actions-bar");
        if (actionsBar) {
            actionsBar.classList.add("hidden");
        }
    }

    private handleSearchClear(): void {
        this.hideActionsBar();
        this.selectAllButton.hide();
        this.dropdown.hide();
        this.updateItemCounter();
        this.searchBox.focus();
    }

    private handleRefresh(): void {
        this.clearAll();
    }

    private handleItemRemove(item: string): void {
        this.selectionManager.removeItem(item);
        this.applyFilters();
        this.updateUI();
    }

    private handleItemClick(item: string, event: MouseEvent): void {
        const filteredData = this.getFilteredData();
        const allNames = DataService.getAllNames(filteredData);
        
        this.selectionManager.handleSelection(item, allNames, event.shiftKey);
        this.applyFilters();
        this.updateUI();
    }

    private handleSelectAll(): void {
        const filteredData = this.getFilteredData();
        const allNames = DataService.getAllNames(filteredData);
        
        this.selectionManager.selectAll(allNames);
        this.applyFilters();
        this.updateUI();
    }

    private getFilteredData(): SlicerNode[] {
        return DataService.filterData(
            this.data,
            this.searchBox.getValue(),
            false
        );
    }

    private renderFilteredData(searchValue: string): void {
        const filteredData = this.getFilteredData();
        const selectedItems = this.selectionManager.getSelectedItems();
        
        // Re-create dropdown with current style config
        const dropdownElement = this.dropdown.getElement();
        const parent = dropdownElement.parentElement;
        if (parent) {
            parent.removeChild(dropdownElement);
        }
        
        this.dropdown = new Dropdown(this.target, {
            onItemClick: (item, event) => this.handleItemClick(item, event),
            fontSize: this.currentStyleConfig.fontSize,
            defaultColor: this.currentStyleConfig.defaultColor,
            fill: this.currentStyleConfig.fill,
            fillRule: this.currentStyleConfig.fillRule
        });
        
        this.dropdown.render(filteredData, selectedItems, searchValue);
        
        if (searchValue && searchValue.trim().length > 0) {
            this.dropdown.show();
        }
    }

    private updateItemCounter(searchValue?: string): void {
        const filteredData = this.getFilteredData();
        const totalVisible = DataService.getAllNames(filteredData).length;
        const selectedCount = this.selectionManager.getSelectedCount();

        this.itemCounter.update({
            selectedCount,
            totalVisible,
            hasFilter: !!(searchValue && searchValue.trim().length > 0)
        });
    }

    private applyFilters(): void {
        const selectedItems = this.selectionManager.getSelectedItems();

        // No data or categories: fall back to simple single-field filter
        if (!this.dataView || !this.dataView.categorical || !this.dataView.categorical.categories) {
            const target = FilterService.parseFilterTarget(this.dataView, this.getPrimaryCategoryIndex());
            this.filterService.applyFilter(selectedItems, target);
            return;
        }

        // Single-category mode: always filter on the currently selected category field.
        if (selectedItems.length === 0) {
            this.filterService.removeFilter();
            return;
        }

        const categorical = this.dataView.categorical;
        const totalCategories = categorical.categories.length;
        const primaryIndex = this.getPrimaryCategoryIndex(totalCategories);
        const target = FilterService.parseFilterTarget(this.dataView, primaryIndex);

        this.filterService.applyFilter(selectedItems, target);
    }

    private clearAll(): void {
        this.selectionManager.clear();
        this.searchBox.clear();
        this.dropdown.hide();
        this.selectAllButton.hide();
        this.selectedItemsContainer.clear();
        this.updateItemCounter();
        this.filterService.removeFilter();
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private updateCategorySelector(categories: powerbi.DataViewCategoryColumn[]): void {
        const container = this.searchBox.getContainer();

        if (!this.categorySelector) {
            const selectorContainer = document.createElement("div");
            selectorContainer.className = "category-selector";

            this.categorySelector = selectorContainer;
            // Insert pills container between search icon and input
            container.insertBefore(selectorContainer, this.searchBox.getInput());
        }

        // Clear existing pills
        if (this.categorySelector) {
            DOMHelpers.clearElement(this.categorySelector);
        }

        const totalCategories = categories.length;
        const primaryIndex = this.getPrimaryCategoryIndex(totalCategories);

        // If only one category is available, hide selector
        if (categories.length <= 1) {
            this.categorySelector.style.display = "none";
            return;
        }

        this.categorySelector.style.display = "";

        // Create a dropdown (select) for category choice
        const select = document.createElement("select");
        select.className = "category-select";

        categories.forEach((category, index) => {
            const option = document.createElement("option");
            const source = category.source;
            option.value = index.toString();
            option.text = source.displayName || source.queryName || `Category ${index + 1}`;
            if (index === primaryIndex) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.title = "Choose which field to search";

        select.addEventListener("change", () => {
            const selectedIndex = parseInt(select.value, 10);
            const currentPrimary = this.getPrimaryCategoryIndex(totalCategories);

            if (selectedIndex === currentPrimary) {
                return;
            }

            // Single-category mode: switch active field and reset state
            this.activeCategoryIndices = [selectedIndex];
            this.clearAll();

            if (this.dataView) {
                this.loadData(this.dataView);
                this.applyGlobalStyles();
                this.updateUI();
            }
        });

        this.categorySelector.appendChild(select);
    }

    private getPrimaryCategoryIndex(totalCategories?: number): number {
        const first = this.activeCategoryIndices && this.activeCategoryIndices.length > 0
            ? this.activeCategoryIndices[0]
            : 0;

        if (totalCategories === undefined) {
            return first;
        }

        if (first < 0 || first >= totalCategories) {
            return 0;
        }

        return first;
    }

    private getActiveCategoryIndices(totalCategories: number): number[] {
        if (!this.activeCategoryIndices || this.activeCategoryIndices.length === 0) {
            return [0];
        }

        const filtered = this.activeCategoryIndices.filter(index => 
            index >= 0 && index < totalCategories
        );

        return filtered.length > 0 ? filtered : [0];
    }
}
