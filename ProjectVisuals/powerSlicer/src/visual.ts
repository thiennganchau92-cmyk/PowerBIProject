/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.  
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { IFilterColumnTarget, BasicFilter, IBasicFilter, IFilter, FilterType } from "powerbi-models";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import FilterAction = powerbi.FilterAction;
import { VisualFormattingSettingsModel } from "./settings";

interface SlicerNode {
    name: string;
    children: SlicerNode[];
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private searchInput: HTMLInputElement;
    private searchContainer: HTMLElement;
    private searchIcon: HTMLElement;
    private refreshIcon: HTMLElement;
    private dropdown: HTMLElement;
    private data: SlicerNode[] = [];
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private selectedItems: string[] = [];
    private dataView: powerbi.DataView;
    private selectedItemsContainer: HTMLElement;
    private focusedIndex: number = -1;
    private lastSelectedItemIndex: number = -1;
    private listbox: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private previousResetTrigger: boolean | null = null;
    private hostFilterActive: boolean = false;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();

        // Create selected items container
        this.selectedItemsContainer = document.createElement("div");
        this.selectedItemsContainer.className = "selected-items-container";
        this.target.appendChild(this.selectedItemsContainer);

        // Create search container with icons
        this.searchContainer = document.createElement("div");
        this.searchContainer.className = "search-container";
        
        // Create search icon
        this.searchIcon = document.createElement("span");
        this.searchIcon.className = "search-icon";
        this.searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="9" r="7"></circle>
        <line x1="21" y1="21" x2="14.65" y2="14.65"></line>
        </svg>`; // Search icon
        this.searchContainer.appendChild(this.searchIcon);

        // Create search input
        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.placeholder = "Search...";
        this.searchInput.className = "search-input";
        this.searchContainer.appendChild(this.searchInput);

        // Create refresh icon
        this.refreshIcon = document.createElement("span");
        this.refreshIcon.className = "refresh-icon";
        this.refreshIcon.textContent = "↻"; // Refresh icon
        this.refreshIcon.title = "Clear all selections";
        this.refreshIcon.addEventListener("click", () => this.clearAll());
        this.searchContainer.appendChild(this.refreshIcon);

        this.target.appendChild(this.searchContainer);

            // Create dropdown
            this.dropdown = document.createElement("div");
            this.dropdown.className = "dropdown";
            // Use listbox role for accessibility
        this.dropdown.setAttribute("role", "listbox");
            this.dropdown.setAttribute("aria-multiselectable", "true");
            this.dropdown.tabIndex = 0;
            this.target.appendChild(this.dropdown);

        // Initially hide dropdown
        this.dropdown.classList.add("hidden");

        // Add event listener for search
        this.searchInput.addEventListener("input", () => {
            const searchValue = this.searchInput.value;
            
            // Show dropdown only when there's search text
            if (searchValue && searchValue.trim().length > 0) {
                this.dropdown.classList.remove("hidden");
                this.renderDropdown(searchValue);
            } else {
                this.dropdown.classList.add("hidden");
            }
        });

        // Show dropdown when search input gets focus (if there's text)
        this.searchInput.addEventListener("focus", () => {
            if (this.searchInput.value && this.searchInput.value.trim().length > 0) {
                this.dropdown.classList.remove("hidden");
            }
        });

        // Keyboard: pressing ArrowDown on search focuses first item
        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const first = this.dropdown.querySelector<HTMLElement>(".dropdown-item");
                if (first) {
                    first.focus();
                    this.focusedIndex = 0;
                }
            } else if (e.key === "Escape") {
                // Hide dropdown on Escape
                this.dropdown.classList.add("hidden");
                this.searchInput.blur();
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (!this.target.contains(target)) {
                this.dropdown.classList.add("hidden");
            }
        });
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        // Check if reset trigger has changed (bookmark-based reset via toggle)
        const currentResetTrigger = this.formattingSettings.dataPointCard.bookmarkResetTrigger.value;
        if (this.previousResetTrigger !== null && this.previousResetTrigger !== currentResetTrigger) {
            console.log('PowerSlicer: Bookmark reset trigger changed, clearing all selections');
            this.clearAll();
        }
        this.previousResetTrigger = currentResetTrigger;

        // Get data from data view
        this.dataView = options.dataViews[0];
        if (this.dataView && this.dataView.tree && this.dataView.tree.root && this.dataView.tree.root.children) {
            this.data = this.dataView.tree.root.children.map(child => this.transformData(child));
        } else if (this.dataView && this.dataView.categorical && this.dataView.categorical.categories && this.dataView.categorical.categories[0]) {
            this.data = this.dataView.categorical.categories[0].values.map(v => this.createLeafNode(v));
        } else {
            this.data = [];
        }

        // Apply layout
        this.target.className = `slicer-container ${this.formattingSettings.dataPointCard.layout.value.value}`;

        // Apply global styles
        this.applyGlobalStyles();

        this.syncSelectionsFromFilters(options.jsonFilters as IFilter[] | undefined);

        // Render dropdown
        this.renderDropdown();
    }

    private syncSelectionsFromFilters(jsonFilters?: IFilter[]): void {
        if (!this.dataView || !this.dataView.categorical || !this.dataView.categorical.categories || this.dataView.categorical.categories.length === 0) {
            return;
        }

        const target = this.parseFilterTarget();
        let matchingFilter: IBasicFilter | undefined;

        if (jsonFilters && jsonFilters.length > 0) {
            for (const filter of jsonFilters) {
                if (!filter) {
                    continue;
                }

                if (filter.filterType === FilterType.Basic) {
                    const basicFilter = filter as IBasicFilter;
                    const filterTarget = basicFilter.target as IFilterColumnTarget;

                    if (filterTarget && filterTarget.table === target.table && filterTarget.column === target.column) {
                        matchingFilter = basicFilter;
                        break;
                    }
                }
            }
        }

        if (matchingFilter && Array.isArray(matchingFilter.values)) {
            const hostSelections = matchingFilter.values
                .map(value => value !== null && value !== undefined ? value.toString() : "")
                .filter(value => value.length > 0);

            if (!this.areSelectionsEqual(hostSelections, this.selectedItems)) {
                this.selectedItems = hostSelections;
                this.renderSelectedItems();
                this.dropdown.classList.add("hidden");
            }

            this.hostFilterActive = hostSelections.length > 0;
        } else {
            if (this.hostFilterActive && this.selectedItems.length > 0) {
                this.clearAll(false);
            }

            this.hostFilterActive = false;
        }
    }

    private areSelectionsEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) {
            return false;
        }

        const sortedA = [...a].sort();
        const sortedB = [...b].sort();

        for (let i = 0; i < sortedA.length; i++) {
            if (sortedA[i] !== sortedB[i]) {
                return false;
            }
        }

        return true;
    }

    private applyGlobalStyles() {
        const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
        const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
        const fill = this.formattingSettings.dataPointCard.fill.value?.value;
        const fillRule = this.formattingSettings.dataPointCard.fillRule.value?.value;

        // OUCRU Theme colors
        const oucruBackground = "#F9F7F2";
        const oucruForeground = "#0A400C";
        const oucruText = "#141414";

        // Apply to search container
        if (this.searchContainer) {
            this.searchContainer.style.backgroundColor = oucruBackground;
        }

        // Apply to search input
        if (this.searchInput) {
            this.searchInput.style.fontSize = `${fontSize}px`;
            this.searchInput.style.color = defaultColor || oucruText;
            this.searchInput.style.backgroundColor = oucruBackground;
            this.searchInput.style.borderColor = "#ccc";
        }

        // Apply to search icon
        if (this.searchIcon) {
            this.searchIcon.style.fontSize = `${fontSize + 2}px`;
            this.searchIcon.style.color = defaultColor || oucruForeground;
        }

        // Apply to refresh icon
        if (this.refreshIcon) {
            this.refreshIcon.style.fontSize = `${fontSize + 4}px`;
            this.refreshIcon.style.color = defaultColor || oucruForeground;
        }
    }

    private transformData(node: powerbi.DataViewTreeNode): SlicerNode {
        const children = node.children && node.children.length > 0
            ? node.children.map(child => this.transformData(child))
            : [];

        return {
            name: this.getNodeDisplayName(node),
            children
        };
    }

    private getNodeDisplayName(node: powerbi.DataViewTreeNode): string {
        const raw = node.value !== undefined && node.value !== null ? node.value : node.name;
        return raw !== undefined && raw !== null ? raw.toString() : "";
    }

    private createLeafNode(value: any): SlicerNode {
        const display = value !== undefined && value !== null ? value.toString() : "";
        return {
            name: display,
            children: []
        };
    }

    private getFilteredData(filter?: string): SlicerNode[] {
        if (!filter) {
            return this.data;
        }

        const lowerCaseFilter = filter.toLowerCase();

        const filterData = (data: SlicerNode[]) => {
            const result: SlicerNode[] = [];
            for (const item of data) {
                if (item.name.toLowerCase().indexOf(lowerCaseFilter) > -1) {
                    result.push(item);
                } else if (item.children && item.children.length > 0) {
                    const filteredChildren = filterData(item.children);
                    if (filteredChildren.length > 0) {
                        result.push({ ...item, children: filteredChildren });
                    }
                }
            }
            return result;
        };

        return filterData(this.data);
    }

    private renderDropdown(filter?: string) {
    const filteredData = this.getFilteredData(filter);

    // Clear previous dropdown items safely
    while (this.dropdown.firstChild) {
        this.dropdown.removeChild(this.dropdown.firstChild);
        }

    // Create dropdown items
    for (const item of filteredData) {
        this.renderNode(item, this.dropdown, 0);
        }
    }

    private renderNode(node: SlicerNode, parentElement: HTMLElement, level: number) {
    const dropdownItem = document.createElement("div");
    dropdownItem.className = "dropdown-item";
    dropdownItem.style.marginLeft = `${level * 20}px`;

    const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
    const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
    const fill = this.formattingSettings.dataPointCard.fill.value?.value;
    const fillRule = this.formattingSettings.dataPointCard.fillRule.value?.value;

    // Apply styles
    dropdownItem.style.fontSize = `${fontSize}px`;
    if (defaultColor) dropdownItem.style.color = defaultColor;

    const expander = document.createElement("span");
    expander.className = "expander";
    expander.style.fontSize = `${fontSize}px`;
    if (defaultColor) expander.style.color = defaultColor;
        let hasSelectedDescendants = this.hasSelectedDescendants(node);
    if (node.children && node.children.length > 0) {
        expander.textContent = hasSelectedDescendants ? "-" : "+";
        expander.addEventListener("click", (e) => {
                e.stopPropagation();
                const childrenContainer = dropdownItem.querySelector(".children-container");
                if (childrenContainer) {
                    childrenContainer.classList.toggle("hidden");
                    expander.textContent = childrenContainer.classList.contains("hidden") ? "+" : "-";
                }
        });
    } else {
    expander.textContent = " ";
    }
    dropdownItem.appendChild(expander);

        const label = document.createElement("span");
    label.textContent = node.name;
    label.style.fontSize = `${fontSize}px`;
    if (defaultColor) label.style.color = defaultColor;
    dropdownItem.appendChild(label);

    // Set selected style
        if (this.selectedItems.indexOf(node.name) > -1) {
        dropdownItem.classList.add("selected");
    dropdownItem.setAttribute("aria-selected", "true");
    if (fill) dropdownItem.style.backgroundColor = fill;
    if (fillRule) dropdownItem.style.color = fillRule;
    } else {
    dropdownItem.setAttribute("aria-selected", "false");
    }

        // Click toggles selection
        dropdownItem.addEventListener("click", (e: MouseEvent) => {
            this.applyFilter(node.name, e);
        });

        parentElement.appendChild(dropdownItem);

        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = hasSelectedDescendants ? "children-container" : "children-container hidden";
            dropdownItem.appendChild(childrenContainer);
            node.children.forEach(child => {
                this.renderNode(child, childrenContainer, level + 1);
            });
        }
    }

    private applyFilter(selectedValue: string, e?: MouseEvent) {
        const filteredData = this.getFilteredData(this.searchInput.value);
        const filteredNames = this.getAllNames(filteredData);
        const currentIndex = filteredNames.indexOf(selectedValue);

        if (e && e.shiftKey && this.lastSelectedItemIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(this.lastSelectedItemIndex, currentIndex);
            const end = Math.max(this.lastSelectedItemIndex, currentIndex);
            for (let i = start; i <= end; i++) {
                const name = filteredNames[i];
                if (name && this.selectedItems.indexOf(name) === -1) {
                    this.selectedItems.push(name);
                }
            }
        } else {
            const index = this.selectedItems.indexOf(selectedValue);
            if (index > -1) {
                this.selectedItems.splice(index, 1);
            } else {
                if (selectedValue) {
                    this.selectedItems.push(selectedValue);
                }
            }
        }

        this.lastSelectedItemIndex = currentIndex;

        this.renderSelectedItems();
        this.renderDropdown(this.searchInput.value);

        if (this.selectedItems.length > 0) {
            const target = this.parseFilterTarget();

            const filter = new BasicFilter(target, "In", this.selectedItems);

            this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
        } else {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
        }
    }

    private renderSelectedItems() {
    // Clear safely
    while (this.selectedItemsContainer.firstChild) {
    this.selectedItemsContainer.removeChild(this.selectedItemsContainer.firstChild);
    }

    const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
    const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
    const fill = this.formattingSettings.dataPointCard.fill.value?.value;
    const fillRule = this.formattingSettings.dataPointCard.fillRule.value?.value;

    this.selectedItems.forEach(item => {
    const selectedItem = document.createElement("div");
    selectedItem.className = "selected-item";
    selectedItem.textContent = item;
    selectedItem.style.fontSize = `${fontSize}px`;
    if (fill) selectedItem.style.backgroundColor = fill;
    if (fillRule) selectedItem.style.color = fillRule;

    const removeButton = document.createElement("span");
    removeButton.className = "remove-item";
    removeButton.textContent = "x";
    removeButton.tabIndex = 0;
    removeButton.setAttribute("role", "button");
            removeButton.style.fontSize = `${fontSize}px`;
    if (defaultColor) removeButton.style.color = defaultColor;
    removeButton.addEventListener("click", () => {
            this.applyFilter(item);
            });
            removeButton.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    this.applyFilter(item);
                }
            });

            selectedItem.appendChild(removeButton);
            this.selectedItemsContainer.appendChild(selectedItem);
        });
    }

    private getAllNames(data: SlicerNode[]): string[] {
    const names: string[] = [];
    for (const item of data) {
    names.push(item.name);
    if (item.children && item.children.length > 0) {
    names.push(...this.getAllNames(item.children));
    }
    }
    return names;
    }

    private hasSelectedDescendants(node: SlicerNode): boolean {
        if (this.selectedItems.indexOf(node.name) > -1) {
            return true;
        }
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                if (this.hasSelectedDescendants(child)) {
                    return true;
                }
            }
        }
        return false;
    }

    private parseFilterTarget(): IFilterColumnTarget {
    const source = this.dataView.categorical.categories[0].source;
    const qn = source.queryName || "";
    let table = "";
    let column = "";

    // Try to parse forms like Table[Column] or schema.Table[Column]
    const bracketMatch = qn.match(/(.+?)\[(.+)\]$/);
    if (bracketMatch) {
    const before = bracketMatch[1];
    column = bracketMatch[2];
        // take last token separated by dot as table
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

    private clearAll(notifyHost: boolean = true): void {
        this.selectedItems = [];
        this.lastSelectedItemIndex = -1;
        this.searchInput.value = ""; // Clear search input
        this.dropdown.classList.add("hidden"); // Hide dropdown
        this.renderSelectedItems();
        this.hostFilterActive = false;

        if (notifyHost) {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
        public getFormattingModel(): powerbi.visuals.FormattingModel {
            return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
        }
    }