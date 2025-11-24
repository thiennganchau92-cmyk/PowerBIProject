import { ViewState } from "./StateTypes";

/**
 * Centralized state manager for visual view state
 * Provides single source of truth for UI state
 */
export class ViewStateManager {
    private state: ViewState;
    private listeners: Map<keyof ViewState, Set<(value: any) => void>>;

    constructor(initialState?: Partial<ViewState>) {
        this.state = {
            isInteracting: false,
            hasSelections: false,
            isExpanded: false,
            activeCategoryIndices: [0],
            ...initialState
        };
        this.listeners = new Map();
    }

    /**
     * Get the current state
     */
    getState(): Readonly<ViewState> {
        return { ...this.state };
    }

    /**
     * Get a specific state property
     */
    get<K extends keyof ViewState>(key: K): ViewState[K] {
        return this.state[key];
    }

    /**
     * Set a specific state property and notify listeners
     */
    set<K extends keyof ViewState>(key: K, value: ViewState[K]): void {
        if (this.state[key] !== value) {
            this.state[key] = value;
            this.notifyListeners(key, value);
        }
    }

    /**
     * Update multiple state properties at once
     */
    setState(updates: Partial<ViewState>): void {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key as keyof ViewState, value);
        });
    }

    /**
     * Reset state to initial values
     */
    reset(initialState?: Partial<ViewState>): void {
        this.state = {
            isInteracting: false,
            hasSelections: false,
            isExpanded: false,
            activeCategoryIndices: [0],
            ...initialState
        };
        // Notify all listeners of reset
        Object.keys(this.state).forEach(key => {
            this.notifyListeners(key as keyof ViewState, this.state[key as keyof ViewState]);
        });
    }

    /**
     * Subscribe to changes on a specific state property
     */
    subscribe<K extends keyof ViewState>(
        key: K,
        listener: (value: ViewState[K]) => void
    ): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key)?.delete(listener);
        };
    }

    /**
     * Notify all listeners for a specific state property
     */
    private notifyListeners<K extends keyof ViewState>(key: K, value: ViewState[K]): void {
        this.listeners.get(key)?.forEach(listener => listener(value));
    }

    /**
     * Clear all listeners
     */
    clearListeners(): void {
        this.listeners.clear();
    }
}
