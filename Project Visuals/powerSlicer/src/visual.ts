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
import { IFilterColumnTarget, BasicFilter } from "powerbi-models";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import FilterAction = powerbi.FilterAction;

export class Visual implements IVisual {
    private target: HTMLElement;
    private searchInput: HTMLInputElement;
    private dropdown: HTMLElement;
    private data: string[] = [];
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private selectedItems: string[] = [];
    private dataView: powerbi.DataView;
    private selectedItemsContainer: HTMLElement;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();

        // Create selected items container
        this.selectedItemsContainer = document.createElement("div");
        this.selectedItemsContainer.className = "selected-items-container";
        this.target.appendChild(this.selectedItemsContainer);

        // Create search bar
        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.placeholder = "Search...";
        this.target.appendChild(this.searchInput);

        // Create dropdown
        this.dropdown = document.createElement("div");
        this.dropdown.className = "dropdown";
        this.target.appendChild(this.dropdown);

        // Add event listener for search
        this.searchInput.addEventListener("input", () => {
            this.renderDropdown(this.searchInput.value);
        });
    }

    public update(options: VisualUpdateOptions) {
        // Get data from data view
        this.dataView = options.dataViews[0];
        if (this.dataView && this.dataView.categorical && this.dataView.categorical.categories && this.dataView.categorical.categories[0]) {
            this.data = this.dataView.categorical.categories[0].values.map(v => v.toString());
        } else {
            this.data = [];
        }

        // Render dropdown
        this.renderDropdown();
    }

    private renderDropdown(filter?: string) {
        // Clear previous dropdown items
        this.dropdown.innerHTML = "";

        // Filter data
        const filteredData = filter ? this.data.filter(item => item.toLowerCase().indexOf(filter.toLowerCase()) > -1) : this.data;

        // Create dropdown items
        filteredData.forEach(item => {
            const dropdownItem = document.createElement("div");
            dropdownItem.className = "dropdown-item";
            dropdownItem.textContent = item;

            // Set selected style
            if (this.selectedItems.indexOf(item) > -1) {
                dropdownItem.classList.add("selected");
            }

            // Add event listener for selection
            dropdownItem.addEventListener("click", () => {
                this.applyFilter(item);
            });

            this.dropdown.appendChild(dropdownItem);
        });
    }

    private applyFilter(selectedValue: string) {
        const index = this.selectedItems.indexOf(selectedValue);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
        } else {
            this.selectedItems.push(selectedValue);
        }

        this.renderSelectedItems();
        this.renderDropdown(this.searchInput.value);

        if (this.selectedItems.length > 0) {
            const target: IFilterColumnTarget = {
                table: this.dataView.categorical.categories[0].source.queryName.substr(0, this.dataView.categorical.categories[0].source.queryName.indexOf('.')),
                column: this.dataView.categorical.categories[0].source.displayName
            };

            const filter = new BasicFilter(target, "In", this.selectedItems);

            this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
        } else {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
        }
    }

    private renderSelectedItems() {
        this.selectedItemsContainer.innerHTML = "";
        this.selectedItems.forEach(item => {
            const selectedItem = document.createElement("div");
            selectedItem.className = "selected-item";
            selectedItem.textContent = item;

            const removeButton = document.createElement("span");
            removeButton.className = "remove-item";
            removeButton.textContent = "x";
            removeButton.addEventListener("click", () => {
                this.applyFilter(item);
            });

            selectedItem.appendChild(removeButton);
            this.selectedItemsContainer.appendChild(selectedItem);
        });
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return new FormattingSettingsService().buildFormattingModel(new (window as any).VisualFormattingSettingsModel());
    }
}