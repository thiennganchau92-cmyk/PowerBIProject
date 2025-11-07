export class PerformanceUtils {
    static debounce<T extends (...args: any[]) => void>(
        func: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: number | null = null;

        return (...args: Parameters<T>) => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                func(...args);
                timeoutId = null;
            }, delay);
        };
    }

    static throttle<T extends (...args: any[]) => void>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;

        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    static memoize<T extends (...args: any[]) => any>(func: T): T {
        const cache = new Map<string, ReturnType<T>>();

        return ((...args: Parameters<T>): ReturnType<T> => {
            const key = JSON.stringify(args);
            
            if (cache.has(key)) {
                return cache.get(key)!;
            }

            const result = func(...args);
            cache.set(key, result);
            return result;
        }) as T;
    }
}
