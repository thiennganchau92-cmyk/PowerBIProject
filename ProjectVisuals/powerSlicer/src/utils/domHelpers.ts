export class DOMHelpers {
    static clearElement(element: HTMLElement): void {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    static toggleClass(element: HTMLElement, className: string, condition: boolean): void {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }

    static createSVG(width: number, height: number): SVGSVGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", width.toString());
        svg.setAttribute("height", height.toString());
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        return svg;
    }

    static applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
        Object.keys(styles).forEach(key => {
            const value = styles[key as any];
            if (value !== undefined) {
                (element.style as any)[key] = value;
            }
        });
    }

    static highlightText(container: HTMLElement, text: string, searchTerm: string): void {
        DOMHelpers.clearElement(container);

        if (!searchTerm || !text) {
            container.textContent = text;
            return;
        }

        const textLower = text.toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        // Try exact match first
        let startIndex = textLower.indexOf(searchLower);
        if (startIndex > -1) {
            this.addHighlightedParts(
                container,
                text,
                [{ start: startIndex, end: startIndex + searchTerm.length, type: 'exact' }]
            );
            return;
        }

        // Try word-by-word matching
        const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const matches: Array<{ start: number; end: number; type: string }> = [];

        searchTokens.forEach(token => {
            let pos = 0;
            while ((pos = textLower.indexOf(token, pos)) !== -1) {
                // Check if not already matched
                const overlaps = matches.some(m => 
                    (pos >= m.start && pos < m.end) || 
                    (pos + token.length > m.start && pos + token.length <= m.end)
                );
                
                if (!overlaps) {
                    matches.push({
                        start: pos,
                        end: pos + token.length,
                        type: 'token'
                    });
                }
                pos += token.length;
            }
        });

        if (matches.length > 0) {
            // Sort matches by position
            matches.sort((a, b) => a.start - b.start);
            this.addHighlightedParts(container, text, matches);
        } else {
            // No matches, just show text
            container.textContent = text;
        }
    }

    private static addHighlightedParts(
        container: HTMLElement,
        text: string,
        matches: Array<{ start: number; end: number; type: string }>
    ): void {
        let lastPos = 0;

        matches.forEach(match => {
            // Add text before match
            if (match.start > lastPos) {
                container.appendChild(
                    document.createTextNode(text.substring(lastPos, match.start))
                );
            }

            // Add highlighted match
            const strong = document.createElement('strong');
            strong.className = `match-${match.type}`;
            strong.textContent = text.substring(match.start, match.end);
            container.appendChild(strong);

            lastPos = match.end;
        });

        // Add remaining text
        if (lastPos < text.length) {
            container.appendChild(document.createTextNode(text.substring(lastPos)));
        }
    }
}
