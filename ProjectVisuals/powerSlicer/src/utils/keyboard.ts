export class KeyboardHandler {
    static readonly Keys = {
        ARROW_UP: "ArrowUp",
        ARROW_DOWN: "ArrowDown",
        ENTER: "Enter",
        ESCAPE: "Escape",
        SPACE: " ",
        TAB: "Tab"
    };

    static handleArrowNavigation(
        event: KeyboardEvent,
        items: HTMLElement[],
        currentIndex: number,
        onNavigate: (newIndex: number) => void
    ): void {
        if (event.key === KeyboardHandler.Keys.ARROW_DOWN) {
            event.preventDefault();
            if (currentIndex < items.length - 1) {
                const newIndex = currentIndex + 1;
                onNavigate(newIndex);
                items[newIndex].focus();
                items[newIndex].scrollIntoView({ block: "nearest" });
            }
        } else if (event.key === KeyboardHandler.Keys.ARROW_UP) {
            event.preventDefault();
            if (currentIndex > 0) {
                const newIndex = currentIndex - 1;
                onNavigate(newIndex);
                items[newIndex].focus();
                items[newIndex].scrollIntoView({ block: "nearest" });
            }
        }
    }

    static isNavigationKey(key: string): boolean {
        return [
            KeyboardHandler.Keys.ARROW_UP,
            KeyboardHandler.Keys.ARROW_DOWN,
            KeyboardHandler.Keys.ENTER,
            KeyboardHandler.Keys.ESCAPE,
            KeyboardHandler.Keys.SPACE,
            KeyboardHandler.Keys.TAB
        ].includes(key);
    }
}
