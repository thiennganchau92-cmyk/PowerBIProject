export class SelectionStateManager {
    private selectedItems: string[] = [];
    private lastSelectedIndex: number = -1;

    getSelectedItems(): string[] {
        return [...this.selectedItems];
    }

    setSelectedItems(items: string[]): void {
        this.selectedItems = [...items];
    }

    addItem(item: string): void {
        if (this.selectedItems.indexOf(item) === -1) {
            this.selectedItems.push(item);
        }
    }

    removeItem(item: string): void {
        const index = this.selectedItems.indexOf(item);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
        }
    }

    toggleItem(item: string): boolean {
        const index = this.selectedItems.indexOf(item);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
            return false;
        } else {
            this.selectedItems.push(item);
            return true;
        }
    }

    selectRange(items: string[], startIndex: number, endIndex: number): void {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        for (let i = start; i <= end; i++) {
            if (i >= 0 && i < items.length) {
                this.addItem(items[i]);
            }
        }
    }

    handleSelection(
        item: string,
        allItems: string[],
        shiftKey: boolean
    ): void {
        const currentIndex = allItems.indexOf(item);

        if (shiftKey && this.lastSelectedIndex !== -1 && currentIndex !== -1) {
            this.selectRange(allItems, this.lastSelectedIndex, currentIndex);
        } else {
            this.toggleItem(item);
        }

        this.lastSelectedIndex = currentIndex;
    }

    selectAll(items: string[]): void {
        items.forEach(item => this.addItem(item));
    }

    clear(): void {
        this.selectedItems = [];
        this.lastSelectedIndex = -1;
    }

    getSelectedCount(): number {
        return this.selectedItems.length;
    }

    isSelected(item: string): boolean {
        return this.selectedItems.indexOf(item) > -1;
    }
}
