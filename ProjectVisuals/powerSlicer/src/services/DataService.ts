import powerbi from "powerbi-visuals-api";
import { SlicerNode } from "../interfaces";
import { AdvancedSearchService, SearchOptions } from "./AdvancedSearchService";

export class DataService {
    static transformTreeData(node: powerbi.DataViewTreeNode): SlicerNode {
        const children = node.children && node.children.length > 0
            ? node.children.map(child => DataService.transformTreeData(child))
            : [];

        const name = DataService.getNodeDisplayName(node);

        return {
            name,
            // For tree data we currently only have a single display value,
            // so use it as the search text as well.
            searchText: name,
            children
        };
    }

    static getNodeDisplayName(node: powerbi.DataViewTreeNode): string {
        const raw = node.value !== undefined && node.value !== null ? node.value : node.name;
        return raw !== undefined && raw !== null ? raw.toString() : "";
    }

    static createLeafNode(value: any, searchText?: string, dataIndex?: number): SlicerNode {
        const display = value !== undefined && value !== null ? value.toString() : "";
        return {
            name: display,
            searchText: searchText || display,
            dataIndex,
            children: []
        };
    }

    static filterData(
        data: SlicerNode[],
        searchTerm: string,
        caseSensitive: boolean = false,
        useAdvancedSearch: boolean = true
    ): SlicerNode[] {
        if (!searchTerm) {
            return data;
        }

        if (!useAdvancedSearch) {
            // Fallback to simple search
            return this.simpleFilterData(data, searchTerm, caseSensitive);
        }

        // Wildcard search (supports '*' as multi-character wildcard)
        if (searchTerm.indexOf("*") > -1) {
            return this.wildcardFilterData(data, searchTerm, caseSensitive);
        }

        // Advanced search with scoring
        return this.advancedFilterData(data, searchTerm, caseSensitive);
    }

    /**
     * Wildcard matcher: treats '*' as "match any characters", anchors the pattern.
     * Examples:
     *  SA*   -> starts with SA
     *  *45   -> ends with 45
     *  S*A   -> S then anything then A
     */
    private static wildcardFilterData(
        data: SlicerNode[],
        pattern: string,
        caseSensitive: boolean
    ): SlicerNode[] {
        const cleanPattern = pattern.trim();
        const parsed = this.parseWildcardPattern(cleanPattern, caseSensitive);

        let order = 0;

        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const matchesWithScore: { node: SlicerNode; score: number; order: number }[] = [];

            for (const node of nodes) {
                // Wildcards should target the primary display (code) first to avoid matching descriptions
                const candidates = this.getWildcardCandidates(node);
                let bestScore = Number.NEGATIVE_INFINITY;

                for (const text of candidates) {
                    const score = this.wildcardScore(text, parsed);
                    if (score > bestScore) {
                        bestScore = score;
                    }
                }

                const matches = bestScore > Number.NEGATIVE_INFINITY;

                if (matches) {
                    matchesWithScore.push({ node, score: bestScore, order: order++ });
                } else if (node.children && node.children.length > 0) {
                    const filteredChildren = filterRecursive(node.children);
                    if (filteredChildren.length > 0) {
                        matchesWithScore.push({
                            node: { ...node, children: filteredChildren },
                            score: bestScore,
                            order: order++
                        });
                    }
                }
            }

            // Sort by best score, then by original order to preserve stability
            matchesWithScore.sort((a, b) => b.score - a.score || a.order - b.order);

            return matchesWithScore.map(entry => entry.node);
        };

        return filterRecursive(data);
    }

    private static buildWildcardRegex(pattern: string, caseSensitive: boolean): RegExp {
        const escaped = pattern
            .split("")
            .map(char => {
                if (char === "*") {
                    return ".*";
                }
                // Escape regex special chars
                return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            })
            .join("");

        const flags = caseSensitive ? "" : "i";
        return new RegExp(`^${escaped}$`, flags);
    }

    private static getSearchCandidates(node: SlicerNode): string[] {
        const candidates = new Set<string>();

        if (node.name) {
            candidates.add(node.name);
        }

        if (node.searchText) {
            node.searchText
                .split("|")
                .map(part => part.trim())
                .filter(part => part.length > 0)
                .forEach(part => candidates.add(part));
        }

        return Array.from(candidates);
    }

    private static getWildcardCandidates(node: SlicerNode): string[] {
        const candidates = new Set<string>();

        if (node.name) {
            candidates.add(node.name);
        }

        return Array.from(candidates);
    }

    private static parseWildcardPattern(pattern: string, caseSensitive: boolean) {
        const normalized = caseSensitive ? pattern : pattern.toLowerCase();
        const hasLeadingWildcard = normalized.startsWith("*");
        const hasTrailingWildcard = normalized.endsWith("*");
        const tokens = normalized
            .split("*")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        return { tokens, hasLeadingWildcard, hasTrailingWildcard, caseSensitive };
    }

    private static matchesWildcard(text: string, parsed: { tokens: string[]; hasLeadingWildcard: boolean; hasTrailingWildcard: boolean; caseSensitive: boolean }): boolean {
        const { tokens, hasLeadingWildcard, hasTrailingWildcard, caseSensitive } = parsed;
        const source = caseSensitive ? text : text.toLowerCase();

        if (tokens.length === 0) {
            return true;
        }

        let position = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const idx = source.indexOf(token, position);
            if (idx === -1) {
                return false;
            }

            // First token must be at start if no leading wildcard
            if (i === 0 && !hasLeadingWildcard && idx !== 0) {
                return false;
            }

            // Last token must end the string if no trailing wildcard
            const isLast = i === tokens.length - 1;
            if (isLast && !hasTrailingWildcard && (idx + token.length !== source.length)) {
                return false;
            }

            position = idx + token.length;
        }

        return true;
    }

    private static wildcardScore(text: string, parsed: { tokens: string[]; hasLeadingWildcard: boolean; hasTrailingWildcard: boolean; caseSensitive: boolean }): number {
        const { tokens, hasLeadingWildcard, hasTrailingWildcard, caseSensitive } = parsed;
        const source = caseSensitive ? text : text.toLowerCase();

        if (tokens.length === 0) {
            return 0;
        }

        const positions: number[] = [];
        let position = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const idx = source.indexOf(token, position);
            if (idx === -1) {
                return Number.NEGATIVE_INFINITY;
            }
            positions.push(idx);
            position = idx + token.length;
        }

        const firstIdx = positions[0];
        const lastIdx = positions[positions.length - 1];
        const lastToken = tokens[tokens.length - 1];
        const lastEnd = lastIdx + lastToken.length;

        let score = 0;

        // Prefer results that start with the first token when there is no leading wildcard
        if (!hasLeadingWildcard) {
            score += firstIdx === 0 ? 5 : 2 - firstIdx * 0.1;
        } else {
            score += 2 - firstIdx * 0.05;
        }

        // Prefer results that end with the last token when there is no trailing wildcard
        if (!hasTrailingWildcard) {
            score += lastEnd === source.length ? 3 : 1 - (source.length - lastEnd) * 0.05;
        }

        // Penalize large gaps between tokens to favor tighter matches
        for (let i = 1; i < positions.length; i++) {
            const gap = positions[i] - (positions[i - 1] + tokens[i - 1].length);
            score -= gap * 0.02;
        }

        // Slight preference for shorter overall strings
        score -= source.length * 0.005;

        return score;
    }

    /**
     * Simple filter (legacy)
     */
    private static simpleFilterData(
        data: SlicerNode[],
        searchTerm: string,
        caseSensitive: boolean
    ): SlicerNode[] {
        const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

        const getNodeSearchText = (node: SlicerNode): string => {
            const base = node.searchText || node.name || "";
            return caseSensitive ? base : base.toLowerCase();
        };

        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const result: SlicerNode[] = [];

            for (const node of nodes) {
                const nodeText = getNodeSearchText(node);

                if (nodeText.indexOf(term) > -1) {
                    result.push(node);
                } else if (node.children && node.children.length > 0) {
                    const filteredChildren = filterRecursive(node.children);
                    if (filteredChildren.length > 0) {
                        result.push({ ...node, children: filteredChildren });
                    }
                }
            }

            return result;
        };

        return filterRecursive(data);
    }

    /**
     * Advanced filter with fuzzy matching and relevance scoring
     */
    private static advancedFilterData(
        data: SlicerNode[],
        searchTerm: string,
        caseSensitive: boolean
    ): SlicerNode[] {
        const normalizedQuery = caseSensitive ? searchTerm : searchTerm.toLowerCase();

        const searchOptions: SearchOptions = {
            caseSensitive,
            fuzzyThreshold: 0.3,
            minScore: 0.3
        };

        const getNodeSearchText = (node: SlicerNode): string => node.searchText || node.name || "";

        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const nodeTexts = nodes.map(n => getNodeSearchText(n));
            const searchResults = AdvancedSearchService.search(
                nodeTexts,
                searchTerm,
                searchOptions
            ).filter(result => {
                const text = caseSensitive ? result.text : result.text.toLowerCase();
                // Only keep results whose text actually contains the query
                return text.indexOf(normalizedQuery) > -1;
            });

            // Create a map of matched search texts to their scores
            const matchedTexts = new Map(
                searchResults.map(r => [r.text, r.score])
            );

            const result: SlicerNode[] = [];

            for (const node of nodes) {
                const key = getNodeSearchText(node);
                const score = matchedTexts.get(key);

                if (score !== undefined) {
                    // This node matches
                    result.push(node);
                } else if (node.children && node.children.length > 0) {
                    // Check children recursively
                    const filteredChildren = filterRecursive(node.children);
                    if (filteredChildren.length > 0) {
                        result.push({ ...node, children: filteredChildren });
                    }
                }
            }

            // Sort by relevance score (if available)
            result.sort((a, b) => {
                const keyA = getNodeSearchText(a);
                const keyB = getNodeSearchText(b);
                const scoreA = matchedTexts.get(keyA) || 0;
                const scoreB = matchedTexts.get(keyB) || 0;
                return scoreB - scoreA;
            });

            return result;
        };

        return filterRecursive(data);
    }

    static getAllNames(data: SlicerNode[]): string[] {
        const names: string[] = [];

        const collectNames = (nodes: SlicerNode[]): void => {
            for (const node of nodes) {
                names.push(node.name);
                if (node.children && node.children.length > 0) {
                    collectNames(node.children);
                }
            }
        };

        collectNames(data);
        return names;
    }

    static hasSelectedDescendants(node: SlicerNode, selectedItems: string[]): boolean {
        if (selectedItems.indexOf(node.name) > -1) {
            return true;
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                if (DataService.hasSelectedDescendants(child, selectedItems)) {
                    return true;
                }
            }
        }

        return false;
    }
}
