import { ItemCountData } from "../interfaces";
import { DOMHelpers } from "../utils/domHelpers";

export class ItemCounter {
    private element: HTMLElement;

    constructor(parent: HTMLElement) {
        this.element = document.createElement("div");
        this.element.className = "item-count-badge hidden";
        parent.appendChild(this.element);
    }

    update(data: ItemCountData): void {
        // Clear existing content
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        if (data.hasFilter) {
            // Create formatted display with emphasized numbers
            const selectedSpan = document.createElement("span");
            selectedSpan.className = "count-number";
            selectedSpan.textContent = data.selectedCount.toString();
            
            const foundSpan = document.createElement("span");
            foundSpan.className = "count-number";
            foundSpan.textContent = data.totalVisible.toString();
            
            this.element.appendChild(selectedSpan);
            this.element.appendChild(document.createTextNode(" selected • "));
            this.element.appendChild(foundSpan);
            this.element.appendChild(document.createTextNode(" found"));
            
            this.element.classList.remove("hidden");
        } else if (data.selectedCount > 0) {
            const countSpan = document.createElement("span");
            countSpan.className = "count-number";
            countSpan.textContent = data.selectedCount.toString();
            
            this.element.appendChild(countSpan);
            this.element.appendChild(document.createTextNode(" selected"));
            
            this.element.classList.remove("hidden");
        } else {
            this.element.classList.add("hidden");
        }
    }

    hide(): void {
        this.element.classList.add("hidden");
    }

    show(): void {
        this.element.classList.remove("hidden");
    }
}
