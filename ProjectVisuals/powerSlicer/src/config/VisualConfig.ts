/**
 * Centralized configuration constants for PowerSlicer visual
 * Single source of truth for all configuration values
 */
export const VisualConfig = {
    /**
     * Search input debounce delay in milliseconds
     * Reduces re-renders while typing
     */
    SEARCH_DEBOUNCE_DELAY: 150,

    /**
     * Maximum number of items to display in dropdown
     * Performance optimization for large datasets
     */
    MAX_DROPDOWN_ITEMS: 1000,

    /**
     * Default font size in pixels
     */
    DEFAULT_FONT_SIZE: 12,

    /**
     * Enable keyboard navigation
     */
    KEYBOARD_NAVIGATION_ENABLED: true,

    /**
     * Default active category index
     */
    DEFAULT_CATEGORY_INDEX: 0,

    /**
     * Minimum search term length to trigger search
     */
    MIN_SEARCH_LENGTH: 0,

    /**
     * Enable advanced search features (fuzzy matching, scoring)
     */
    ADVANCED_SEARCH_ENABLED: true,

    /**
     * Case sensitive search by default
     */
    CASE_SENSITIVE_SEARCH: false,

    /**
     * Animation duration in milliseconds
     */
    ANIMATION_DURATION: 200,

    /**
     * Scroll behavior for keyboard navigation
     */
    SCROLL_BEHAVIOR: "nearest" as ScrollLogicalPosition,

    /**
     * Maximum number of selected items to display
     * Before showing "X items selected" instead
     */
    MAX_VISIBLE_SELECTED_ITEMS: 50,

    /**
     * Enable virtual scrolling for large lists
     */
    VIRTUAL_SCROLLING_ENABLED: false,

    /**
     * Virtual scrolling item height in pixels
     */
    VIRTUAL_SCROLL_ITEM_HEIGHT: 30,

    /**
     * Enable performance monitoring
     */
    PERFORMANCE_MONITORING_ENABLED: false,

    /**
     * Log level for debugging
     */
    LOG_LEVEL: "error" as "debug" | "info" | "warn" | "error" | "none"
} as const;

/**
 * Type for visual configuration
 */
export type VisualConfigType = typeof VisualConfig;
