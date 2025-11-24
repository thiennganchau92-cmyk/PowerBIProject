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

/**
 * Base configuration for UI components with styling
 */
export interface UIComponentConfig {
    fontSize: number;
    defaultColor?: string;
    fill?: string;
    fillRule?: string;
}

/**
 * Configuration for SearchBox component
 */
export interface SearchBoxConfig extends UIComponentConfig {
    onSearchChange: (value: string) => void;
    onClear: () => void;
    onRefresh: () => void;
    debounceDelay: number;
}

/**
 * Configuration for Dropdown component
 */
export interface DropdownConfig extends UIComponentConfig {
    onItemClick: (item: string, event: MouseEvent) => void;
}

/**
 * Configuration for ItemCounter component
 */
export interface ItemCounterConfig {
    // No additional config needed beyond what's passed to update()
}

/**
 * Configuration for SelectAllButton component
 */
export interface SelectAllButtonConfig {
    onClick: () => void;
}

/**
 * Configuration for SelectedItemsContainer component
 */
export interface SelectedItemsContainerConfig {
    onRemoveItem: (item: string) => void;
    fontSize: number;
}
