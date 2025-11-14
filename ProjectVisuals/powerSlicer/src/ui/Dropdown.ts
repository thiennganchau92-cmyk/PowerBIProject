import { SlicerNode } from "../interfaces";
import { DOMHelpers } from "../utils/domHelpers";
import { KeyboardHandler } from "../utils/keyboard";

export interface DropdownConfig {
    onItemClick: (item: string, event: MouseEvent) => void;
    fontSize: number;
    defaultColor?: string;
    fill?: string;
    fillRule?: string;
}

export class Dropdown {
    private element: HTMLElement;
    private items: HTMLElement[] = [];
    private focusedIndex: number = -1;
    private config: DropdownConfig;

    constructor(parent: HTMLElement, config: DropdownConfig) {
        this.config = config;
        this.element = this.createDropdown();
        parent.appendChild(this.element);
        this.attachEventListeners();
    }

    private createDropdown(): HTMLElement {
        const dropdown = document.createElement("div");
        dropdown.className = "dropdown hidden";
        dropdown.setAttribute("role", "listbox");
        dropdown.setAttribute("aria-multiselectable", "true");
        dropdown.tabIndex = 0;
        return dropdown;
    }

    private attachEventListeners(): void {
        this.element.addEventListener("keydown", (e) => {
            const visibleItems = this.items.filter(item => !item.classList.contains("hidden"));

            if (e.key === KeyboardHandler.Keys.ARROW_DOWN || e.key === KeyboardHandler.Keys.ARROW_UP) {
                KeyboardHandler.handleArrowNavigation(
                    e,
                    visibleItems,
                    this.focusedIndex,
                    (newIndex) => { this.focusedIndex = newIndex; }
                );
            } else if (e.key === KeyboardHandler.Keys.ENTER) {
                e.preventDefault();
                const focusedElement = document.activeElement as HTMLElement;
                if (focusedElement && focusedElement.classList.contains("dropdown-item")) {
                    focusedElement.click();
                }
            } else if (e.key === KeyboardHandler.Keys.ESCAPE) {
                this.hide();
            }
        });
    }

    render(
        data: SlicerNode[],
        selectedItems: string[],
        searchTerm: string = ""
    ): void {
        this.items = [];
        DOMHelpers.clearElement(this.element);

        data.forEach(node => {
            this.renderNode(node, this.element, 0, selectedItems, searchTerm);
        });
    }

    private renderNode(
        node: SlicerNode,
        parent: HTMLElement,
        level: number,
        selectedItems: string[],
        searchTerm: string
    ): void {
        const item = this.createDropdownItem(node, level, searchTerm);
        this.items.push(item);

        const isSelected = selectedItems.indexOf(node.name) > -1;
        this.applySelectionStyle(item, isSelected);

        item.addEventListener("click", (e: MouseEvent) => {
            this.config.onItemClick(node.name, e);
        });

        parent.appendChild(item);

        if (node.children && node.children.length > 0) {
            const hasSelectedDesc = this.hasSelectedDescendants(node, selectedItems);
            const childrenContainer = this.createChildrenContainer(hasSelectedDesc);
            item.appendChild(childrenContainer);

            node.children.forEach(child => {
                this.renderNode(child, childrenContainer, level + 1, selectedItems, searchTerm);
            });
        }
    }

    private createDropdownItem(node: SlicerNode, level: number, searchTerm: string): HTMLElement {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.style.marginLeft = `${level * 20}px`;
        item.tabIndex = 0;

        const expander = this.createExpander(node);
        item.appendChild(expander);

        const label = document.createElement("span");
        DOMHelpers.highlightText(label, node.name, searchTerm);
        this.applyLabelStyles(label);
        item.appendChild(label);

        return item;
    }

    private createExpander(node: SlicerNode): HTMLElement {
        const expander = document.createElement("span");
        expander.className = "expander";

        if (node.children && node.children.length > 0) {
            expander.textContent = "+";
            expander.addEventListener("click", (e) => {
                e.stopPropagation();
                const item = expander.parentElement!;
                const childrenContainer = item.querySelector(".children-container");
                if (childrenContainer) {
                    childrenContainer.classList.toggle("hidden");
                    expander.textContent = childrenContainer.classList.contains("hidden") ? "+" : "-";
                }
            });
        } else {
            expander.textContent = " ";
        }

        this.applyExpanderStyles(expander);
        return expander;
    }

    private createChildrenContainer(expanded: boolean): HTMLElement {
        const container = document.createElement("div");
        container.className = expanded ? "children-container" : "children-container hidden";
        return container;
    }

    private hasSelectedDescendants(node: SlicerNode, selectedItems: string[]): boolean {
        if (selectedItems.indexOf(node.name) > -1) {
            return true;
        }
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                if (this.hasSelectedDescendants(child, selectedItems)) {
                    return true;
                }
            }
        }
        return false;
    }

    private applySelectionStyle(item: HTMLElement, isSelected: boolean): void {
        if (isSelected) {
            item.classList.add("selected");
            item.setAttribute("aria-selected", "true");
            if (this.config.fill) {
                item.style.backgroundColor = this.config.fill;
            }
            if (this.config.fillRule) {
                item.style.color = this.config.fillRule;
            }
        } else {
            item.setAttribute("aria-selected", "false");
        }
    }

    private applyLabelStyles(label: HTMLElement): void {
        label.style.fontSize = `${this.config.fontSize}px`;
        if (this.config.defaultColor) {
            label.style.color = this.config.defaultColor;
        }
    }

    private applyExpanderStyles(expander: HTMLElement): void {
        expander.style.fontSize = `${this.config.fontSize}px`;
        if (this.config.defaultColor) {
            expander.style.color = this.config.defaultColor;
        }
    }

    show(): void {
        this.element.classList.remove("hidden");
    }

    hide(): void {
        this.element.classList.add("hidden");
        this.focusedIndex = -1;
    }

    isVisible(): boolean {
        return !this.element.classList.contains("hidden");
    }

    getElement(): HTMLElement {
        return this.element;
    }

    getFocusedIndex(): number {
        return this.focusedIndex;
    }

    setFocusedIndex(index: number): void {
        this.focusedIndex = index;
    }

    focusFirstItem(): void {
        const visibleItems = this.items.filter(item => !item.classList.contains("hidden"));
        if (visibleItems.length > 0) {
            this.focusedIndex = 0;
            visibleItems[0].focus();
            visibleItems[0].scrollIntoView({ block: "nearest" });
        }
    }
}
