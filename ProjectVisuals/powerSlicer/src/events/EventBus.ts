import { EventName, EventPayloadMap } from "./EventTypes";

/**
 * Simple event bus for decoupled component communication
 * Provides type-safe event emission and subscription
 */
export class EventBus {
    private listeners: Map<string, Set<Function>>;

    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param event Event name
     * @param callback Callback function to invoke when event is emitted
     * @returns Unsubscribe function
     */
    on<T extends EventName>(
        event: T,
        callback: (payload: EventPayloadMap[T]) => void
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * Unsubscribe from an event
     * @param event Event name
     * @param callback Callback function to remove
     */
    off<T extends EventName>(
        event: T,
        callback: (payload: EventPayloadMap[T]) => void
    ): void {
        this.listeners.get(event)?.delete(callback);
    }

    /**
     * Emit an event with payload
     * @param event Event name
     * @param payload Event payload
     */
    emit<T extends EventName>(event: T, payload: EventPayloadMap[T]): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Subscribe to an event for one-time execution
     * @param event Event name
     * @param callback Callback function to invoke once
     * @returns Unsubscribe function
     */
    once<T extends EventName>(
        event: T,
        callback: (payload: EventPayloadMap[T]) => void
    ): () => void {
        const wrappedCallback = (payload: EventPayloadMap[T]) => {
            callback(payload);
            this.off(event, wrappedCallback as any);
        };

        return this.on(event, wrappedCallback as any);
    }

    /**
     * Clear all listeners for a specific event
     * @param event Event name (optional - clears all if not provided)
     */
    clear(event?: EventName): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the number of listeners for an event
     * @param event Event name
     * @returns Number of listeners
     */
    listenerCount(event: EventName): number {
        return this.listeners.get(event)?.size || 0;
    }

    /**
     * Check if there are any listeners for an event
     * @param event Event name
     * @returns True if there are listeners
     */
    hasListeners(event: EventName): boolean {
        return this.listenerCount(event) > 0;
    }
}
