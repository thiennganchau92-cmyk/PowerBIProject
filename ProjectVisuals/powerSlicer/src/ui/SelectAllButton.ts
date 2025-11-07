export class SelectAllButton {
    private button: HTMLButtonElement;
    private onClick: () => void;

    constructor(parent: HTMLElement, onClick: () => void) {
        this.onClick = onClick;
        this.button = this.createButton();
        parent.appendChild(this.button);
    }

    private createButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "select-all-button";
        button.textContent = "Select All";
        button.title = "Select all visible items";
        button.addEventListener("click", () => this.onClick());
        return button;
    }

    show(): void {
        this.button.classList.remove("hidden");
    }

    hide(): void {
        this.button.classList.add("hidden");
    }

    isVisible(): boolean {
        return !this.button.classList.contains("hidden");
    }
}
