export interface SlicerNode {
    name: string;
    /**
     * Combined text used for search.
     * Typically includes the display name plus any additional bound columns.
     */
    searchText?: string;
    /**
     * Optional backing row index for categorical data.
     * Used when applying filters across multiple selected category columns.
     */
    dataIndex?: number;
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
