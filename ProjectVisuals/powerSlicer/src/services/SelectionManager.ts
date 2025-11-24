import { EventBus } from "../events/EventBus";
import { EventNames } from "../events/EventTypes";

export class SelectionStateManager {
    private selectedItems: string[] = [];
    private lastSelectedIndex: number = -1;
    private eventBus: EventBus | null = null;

    /**
     * Set the event bus for emitting selection events
     * @param eventBus EventBus instance
     */
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    getSelectedItems(): string[] {
        return [...this.selectedItems];
    }

    setSelectedItems(items: string[]): void {
        if (!items) {
            this.selectedItems = [];
            return;
        }
        this.selectedItems = [...items];
    }

    /**
     * Get the current selection state
     * @returns Object containing selected items and last selected index
     */
    getSelectionState(): { selectedItems: string[]; lastSelectedIndex: number } {
        return {
            selectedItems: [...this.selectedItems],
            lastSelectedIndex: this.lastSelectedIndex
        };
    }

    /**
     * Restore selection state
     * @param state Selection state to restore
     */
    restoreSelectionState(state: { selectedItems: string[]; lastSelectedIndex: number }): void {
        this.selectedItems = [...state.selectedItems];
        this.lastSelectedIndex = state.lastSelectedIndex;
    }

    addItem(item: string): void {
        if (!item) {
            return;
        }
        if (this.selectedItems.indexOf(item) === -1) {
            this.selectedItems.push(item);
            this.emitSelectionAdd(item);
        }
    }

    removeItem(item: string): void {
        if (!item) {
            return;
        }
        const index = this.selectedItems.indexOf(item);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
            this.emitSelectionRemove(item);
        }
    }

    toggleItem(item: string): boolean {
        const index = this.selectedItems.indexOf(item);
        const isSelected = index === -1;

        if (index > -1) {
            this.selectedItems.splice(index, 1);
        } else {
            this.selectedItems.push(item);
        }

        this.emitSelectionToggle(item, isSelected);
        return isSelected;
    }

    selectRange(items: string[], startIndex: number, endIndex: number): void {
        if (!items || items.length === 0) {
            return;
        }

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
        if (!item || !allItems) {
            return;
        }

        const currentIndex = allItems.indexOf(item);

        if (shiftKey && this.lastSelectedIndex !== -1 && currentIndex !== -1) {
            this.selectRange(allItems, this.lastSelectedIndex, currentIndex);
        } else {
            this.toggleItem(item);
        }

        this.lastSelectedIndex = currentIndex;
    }

    selectAll(items: string[]): void {
        if (!items || items.length === 0) {
            return;
        }
        items.forEach(item => this.addItem(item));
        this.emitSelectAll(items);
    }

    clear(): void {
        this.selectedItems = [];
        this.lastSelectedIndex = -1;
        this.emitSelectionClear();
    }

    getSelectedCount(): number {
        return this.selectedItems.length;
    }

    isSelected(item: string): boolean {
        return this.selectedItems.indexOf(item) > -1;
    }

    // Event emission methods
    private emitSelectionAdd(item: string): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.SELECTION_ADD, { item });
        }
    }

    private emitSelectionRemove(item: string): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.SELECTION_REMOVE, { item });
        }
    }

    private emitSelectionToggle(item: string, isSelected: boolean): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.SELECTION_TOGGLE, { item, isSelected });
        }
    }

    private emitSelectAll(items: string[]): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.SELECT_ALL, { items });
        }
    }

    private emitSelectionClear(): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.SELECTION_CLEAR, {});
        }
    }
}

