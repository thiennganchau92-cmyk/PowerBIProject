export interface SlicerNode {
    name: string;
    children: SlicerNode[];
}

export interface VisualState {
    selectedItems: string[];
    searchValue: string;
    focusedIndex: number;
    lastSelectedItemIndex: number;
}

export interface SearchConfig {
    caseSensitive: boolean;
    debounceDelay: number;
}

export interface ItemCountData {
    selectedCount: number;
    totalVisible: number;
    hasFilter: boolean;
}

export interface KeyboardNavigationEvent {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
}
