/**
 * State type definitions for PowerSlicer visual
 */

export interface ViewState {
    /** Whether the user is actively interacting with the visual */
    isInteracting: boolean;

    /** Whether any items are currently selected */
    hasSelections: boolean;

    /** Whether the visual is in expanded state (showing dropdown/actions) */
    isExpanded: boolean;

    /** Active category indices for multi-category support */
    activeCategoryIndices: number[];
}

export interface StyleConfig {
    /** Font size in pixels */
    fontSize: number;

    /** Default text color */
    defaultColor?: string;

    /** Background fill color for selected items */
    fill?: string;

    /** Text color for selected items */
    fillRule?: string;
}

export interface VisualConfiguration {
    /** Debounce delay for search input in milliseconds */
    searchDebounceDelay: number;

    /** Maximum number of items to display in dropdown */
    maxDropdownItems: number;

    /** Default font size */
    defaultFontSize: number;

    /** Enable keyboard navigation */
    keyboardNavigationEnabled: boolean;
}
