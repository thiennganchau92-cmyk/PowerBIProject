import { DOMHelpers } from "../utils/domHelpers";
import { PerformanceUtils } from "../utils/performance";

export class SearchBox {
    private container: HTMLElement;
    private input: HTMLInputElement;
    private searchIcon: HTMLElement;
    private clearIcon: HTMLElement;
    private refreshIcon: HTMLElement;
    private onSearchChange: (value: string) => void;
    private onClear: () => void;
    private onRefresh: () => void;

    constructor(
        parent: HTMLElement,
        config: {
            onSearchChange: (value: string) => void;
            onClear: () => void;
            onRefresh: () => void;
            debounceDelay?: number;
        }
    ) {
        this.onSearchChange = PerformanceUtils.debounce(
            config.onSearchChange,
            config.debounceDelay || 300
        );
        this.onClear = config.onClear;
        this.onRefresh = config.onRefresh;

        this.container = this.createContainer();
        this.searchIcon = this.createSearchIcon();
        this.input = this.createInput();
        this.clearIcon = this.createClearIcon();
        this.refreshIcon = this.createRefreshIcon();

        this.container.appendChild(this.searchIcon);
        this.container.appendChild(this.input);
        this.container.appendChild(this.clearIcon);
        this.container.appendChild(this.refreshIcon);

        parent.appendChild(this.container);
        this.attachEventListeners();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement("div");
        container.className = "search-container";
        return container;
    }

    private createSearchIcon(): HTMLElement {
        const icon = document.createElement("span");
        icon.className = "search-icon";

        const svg = DOMHelpers.createSVG(20, 20);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "9");
        circle.setAttribute("cy", "9");
        circle.setAttribute("r", "7");
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "21");
        line.setAttribute("y1", "21");
        line.setAttribute("x2", "14.65");
        line.setAttribute("y2", "14.65");

        svg.appendChild(circle);
        svg.appendChild(line);
        icon.appendChild(svg);

        return icon;
    }

    private createInput(): HTMLInputElement {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search...";
        input.className = "search-input";
        return input;
    }

    private createClearIcon(): HTMLElement {
        const icon = document.createElement("span");
        icon.className = "clear-search-icon hidden";
        icon.textContent = "×";
        icon.title = "Clear search";
        return icon;
    }

    private createRefreshIcon(): HTMLElement {
        const icon = document.createElement("span");
        icon.className = "refresh-icon";
        icon.textContent = "↻";
        icon.title = "Clear all selections";
        return icon;
    }

    private attachEventListeners(): void {
        this.input.addEventListener("input", () => {
            const value = this.input.value;
            DOMHelpers.toggleClass(this.clearIcon, "hidden", value.length === 0);
            this.onSearchChange(value);
        });

        this.clearIcon.addEventListener("click", () => {
            this.clear();
            this.onClear();
        });

        this.refreshIcon.addEventListener("click", () => {
            this.onRefresh();
        });
    }

    getValue(): string {
        return this.input.value;
    }

    setValue(value: string): void {
        this.input.value = value;
        DOMHelpers.toggleClass(this.clearIcon, "hidden", value.length === 0);
    }

    clear(): void {
        this.input.value = "";
        this.clearIcon.classList.add("hidden");
    }

    focus(): void {
        this.input.focus();
    }

    getInput(): HTMLInputElement {
        return this.input;
    }

    getContainer(): HTMLElement {
        return this.container;
    }

    applyStyles(fontSize: number, color?: string): void {
        DOMHelpers.applyStyles(this.input, {
            fontSize: `${fontSize}px`,
            color: color || undefined
        });

        DOMHelpers.applyStyles(this.searchIcon, {
            fontSize: `${fontSize + 2}px`,
            color: color || undefined
        });

        DOMHelpers.applyStyles(this.refreshIcon, {
            fontSize: `${fontSize + 4}px`,
            color: color || undefined
        });
    }
}
