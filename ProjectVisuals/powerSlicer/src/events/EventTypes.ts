/**
 * Event type definitions for EventBus
 */

export interface SearchChangeEvent {
    value: string;
}

export interface SearchClearEvent {
    // No payload needed
}

export interface SelectionAddEvent {
    item: string;
}

export interface SelectionRemoveEvent {
    item: string;
}

export interface SelectionClearEvent {
    // No payload needed
}

export interface SelectionToggleEvent {
    item: string;
    isSelected: boolean;
}

export interface SelectAllEvent {
    items: string[];
}

export interface ViewExpandEvent {
    // No payload needed
}

export interface ViewCollapseEvent {
    // No payload needed
}

export interface FilterApplyEvent {
    selectedItems: string[];
}

export interface FilterRemoveEvent {
    // No payload needed
}

export interface StyleUpdateEvent {
    fontSize?: number;
    defaultColor?: string;
    fill?: string;
    fillRule?: string;
}

export interface DataLoadedEvent {
    nodeCount: number;
}

export interface DataErrorEvent {
    error: string;
}

/**
 * Event name constants
 */
export const EventNames = {
    SEARCH_CHANGE: "search:change",
    SEARCH_CLEAR: "search:clear",
    SELECTION_ADD: "selection:add",
    SELECTION_REMOVE: "selection:remove",
    SELECTION_CLEAR: "selection:clear",
    SELECTION_TOGGLE: "selection:toggle",
    SELECT_ALL: "select:all",
    VIEW_EXPAND: "view:expand",
    VIEW_COLLAPSE: "view:collapse",
    FILTER_APPLY: "filter:apply",
    FILTER_REMOVE: "filter:remove",
    STYLE_UPDATE: "style:update",
    DATA_LOADED: "data:loaded",
    DATA_ERROR: "data:error"
} as const;

export type EventName = typeof EventNames[keyof typeof EventNames];

/**
 * Event payload type mapping
 */
export interface EventPayloadMap {
    [EventNames.SEARCH_CHANGE]: SearchChangeEvent;
    [EventNames.SEARCH_CLEAR]: SearchClearEvent;
    [EventNames.SELECTION_ADD]: SelectionAddEvent;
    [EventNames.SELECTION_REMOVE]: SelectionRemoveEvent;
    [EventNames.SELECTION_CLEAR]: SelectionClearEvent;
    [EventNames.SELECTION_TOGGLE]: SelectionToggleEvent;
    [EventNames.SELECT_ALL]: SelectAllEvent;
    [EventNames.VIEW_EXPAND]: ViewExpandEvent;
    [EventNames.VIEW_COLLAPSE]: ViewCollapseEvent;
    [EventNames.FILTER_APPLY]: FilterApplyEvent;
    [EventNames.FILTER_REMOVE]: FilterRemoveEvent;
    [EventNames.STYLE_UPDATE]: StyleUpdateEvent;
    [EventNames.DATA_LOADED]: DataLoadedEvent;
    [EventNames.DATA_ERROR]: DataErrorEvent;
}
