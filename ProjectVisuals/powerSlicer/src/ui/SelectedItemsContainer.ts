import { DOMHelpers } from "../utils/domHelpers";

export interface SelectedItemsConfig {
    onRemoveItem: (item: string) => void;
    fontSize: number;
    fill?: string;
    fillRule?: string;
    defaultColor?: string;
}

export class SelectedItemsContainer {
    private element: HTMLElement;
    private config: SelectedItemsConfig;

    constructor(parent: HTMLElement, config: SelectedItemsConfig) {
        this.config = config;
        this.element = document.createElement("div");
        this.element.className = "selected-items-container";
        parent.appendChild(this.element);
    }

    render(selectedItems: string[]): void {
        DOMHelpers.clearElement(this.element);

        selectedItems.forEach(item => {
            const selectedItem = this.createSelectedItem(item);
            this.element.appendChild(selectedItem);
        });
    }

    private createSelectedItem(itemName: string): HTMLElement {
        const item = document.createElement("div");
        item.className = "selected-item";
        item.textContent = itemName;

        DOMHelpers.applyStyles(item, {
            fontSize: `${this.config.fontSize}px`,
            backgroundColor: this.config.fill || undefined,
            color: this.config.fillRule || undefined
        });

        const removeButton = this.createRemoveButton(itemName);
        item.appendChild(removeButton);

        return item;
    }

    private createRemoveButton(itemName: string): HTMLElement {
        const button = document.createElement("span");
        button.className = "remove-item";
        button.textContent = "x";
        button.tabIndex = 0;
        button.setAttribute("role", "button");

        DOMHelpers.applyStyles(button, {
            fontSize: `${this.config.fontSize}px`,
            color: this.config.defaultColor || undefined
        });

        button.addEventListener("click", () => {
            this.config.onRemoveItem(itemName);
        });

        button.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.config.onRemoveItem(itemName);
            }
        });

        return button;
    }

    clear(): void {
        DOMHelpers.clearElement(this.element);
    }

    getElement(): HTMLElement {
        return this.element;
    }
}
