"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

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

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private dataView: powerbi.DataView;
    private data: SlicerNode[] = [];
    
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private previousResetTrigger: boolean | null = null;

    private searchBox: SearchBox;
    private dropdown: Dropdown;
    private itemCounter: ItemCounter;
    private selectAllButton: SelectAllButton;
    private selectedItemsContainer: SelectedItemsContainer;
    
    private selectionManager: SelectionStateManager;
    private filterService: FilterService;
    
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

        this.selectedItemsContainer = new SelectedItemsContainer(this.target, {
            onRemoveItem: (item) => this.handleItemRemove(item),
            fontSize: 12
        });

        this.searchBox = new SearchBox(this.target, {
            onSearchChange: (value) => this.handleSearchChange(value),
            onClear: () => this.handleSearchClear(),
            onRefresh: () => this.handleRefresh(),
            debounceDelay: 300
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
            } else if (e.key === KeyboardHandler.Keys.ESCAPE) {
                this.dropdown.hide();
                this.selectAllButton.hide();
                searchInput.blur();
            }
        });

        searchInput.addEventListener("focus", () => {
            // Expand view when user focuses on search
            this.expandView();
        });
    }

    private attachClickOutsideHandler(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (!this.target.contains(target)) {
                this.collapseView();
            }
        });
    }

    private collapseView(): void {
        // Hide dropdown and actions bar to save space
        this.dropdown.hide();
        this.hideActionsBar();
        this.selectAllButton.hide();
    }

    private expandView(): void {
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
            this.data = dataView.categorical.categories[0].values.map(v => 
                DataService.createLeafNode(v)
            );
        } else {
            this.data = [];
        }
    }

    private applyGlobalStyles(): void {
        const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
        const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
        const layout = this.formattingSettings.dataPointCard.layout.value.value;

        this.target.className = `slicer-container ${layout}`;

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
        const target = FilterService.parseFilterTarget(this.dataView);
        
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
}
