import { SlicerNode } from "../interfaces";
import { AdvancedSearchService, SearchOptions } from "./AdvancedSearchService";
import { EventBus } from "../events/EventBus";
import { EventNames } from "../events/EventTypes";

/**
 * Parsed search query structure
 */
export interface ParsedSearchQuery {
    raw: string;
    normalized: string;
    includeAll: string[];
    orGroups: string[][];
    exclude: string[];
    hasWildcard: boolean;
}

/**
 * Search service for filtering and matching data
 * Extracted from DataService for better separation of concerns
 */
export class SearchService {
    private static eventBus: EventBus | null = null;

    /**
     * Set the event bus for emitting search events
     * @param eventBus EventBus instance
     */
    static setEventBus(eventBus: EventBus): void {
        SearchService.eventBus = eventBus;
    }
    /**
     * Filter data based on search term
     * @param data Array of SlicerNode items to filter
     * @param searchTerm Search term to filter by
     * @param caseSensitive Whether search should be case-sensitive
     * @param useAdvancedSearch Whether to use advanced search with fuzzy matching
     * @returns Filtered array of SlicerNode items
     */
    static filterData(
        data: SlicerNode[],
        searchTerm: string,
        caseSensitive: boolean = false,
        useAdvancedSearch: boolean = true
    ): SlicerNode[] {
        try {
            if (!data || data.length === 0) {
                return [];
            }

            if (!searchTerm) {
                return data;
            }

            const parsedQuery = this.parseSearchQuery(searchTerm, caseSensitive);

            if (!useAdvancedSearch) {
                return this.simpleFilterData(data, parsedQuery, caseSensitive);
            }

            // Wildcard search (supports '*' as multi-character wildcard)
            if (parsedQuery.hasWildcard) {
                return this.wildcardFilterData(data, searchTerm, caseSensitive);
            }

            // Code-like short queries (e.g., SA) should match strictly on the primary code/name
            const isCodeLike = /^[a-z0-9_]+$/i.test(parsedQuery.raw);
            if (isCodeLike && parsedQuery.raw.length <= 4) {
                return this.codeFilterData(data, parsedQuery.raw, caseSensitive);
            }

            // Advanced search with scoring
            return this.advancedFilterData(data, parsedQuery, caseSensitive);
        } catch (error) {
            console.error("Error filtering data:", error);
            this.emitSearchError(error as Error);
            return data; // Return original data on error
        }
    }

    /**
     * Strict code filter: contains check against the primary display name only
     */
    private static codeFilterData(
        data: SlicerNode[],
        searchTerm: string,
        caseSensitive: boolean
    ): SlicerNode[] {
        const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

        const matchesCode = (node: SlicerNode): boolean => {
            const name = node.name || "";
            const source = caseSensitive ? name : name.toLowerCase();
            return source.indexOf(term) > -1;
        };

        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const result: SlicerNode[] = [];

            for (const node of nodes) {
                if (matchesCode(node)) {
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
     * Wildcard filter: treats '*' as "match any characters"
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

            matchesWithScore.sort((a, b) => b.score - a.score || a.order - b.order);
            return matchesWithScore.map(entry => entry.node);
        };

        return filterRecursive(data);
    }

    /**
     * Simple filter (legacy)
     */
    private static simpleFilterData(
        data: SlicerNode[],
        parsedQuery: ParsedSearchQuery,
        caseSensitive: boolean
    ): SlicerNode[] {
        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const result: SlicerNode[] = [];

            for (const node of nodes) {
                const nodeText = node.searchText || node.name || "";

                if (this.textMatchesParsedQuery(nodeText, parsedQuery, caseSensitive)) {
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
        parsedQuery: ParsedSearchQuery,
        caseSensitive: boolean
    ): SlicerNode[] {
        const searchOptions: SearchOptions = {
            caseSensitive,
            fuzzyThreshold: 0.3,
            minScore: 0.3
        };

        const getNodeSearchText = (node: SlicerNode): string => node.searchText || node.name || "";

        const allNodeTexts: string[] = [];
        const collectTexts = (nodes: SlicerNode[]): void => {
            for (const node of nodes) {
                allNodeTexts.push(getNodeSearchText(node));
                if (node.children && node.children.length > 0) {
                    collectTexts(node.children);
                }
            }
        };
        collectTexts(data);

        const searchResults = AdvancedSearchService.search(
            allNodeTexts,
            parsedQuery.raw,
            searchOptions
        ).filter(result => this.textMatchesParsedQuery(result.text, parsedQuery, caseSensitive));

        const matchedTexts = new Map<string, number>();
        for (const res of searchResults) {
            const existing = matchedTexts.get(res.text);
            if (existing === undefined || res.score > existing) {
                matchedTexts.set(res.text, res.score);
            }
        }

        const filterRecursive = (nodes: SlicerNode[]): SlicerNode[] => {
            const result: SlicerNode[] = [];

            for (const node of nodes) {
                const key = getNodeSearchText(node);
                const score = matchedTexts.get(key);

                if (score !== undefined) {
                    result.push(node);
                } else if (node.children && node.children.length > 0) {
                    const filteredChildren = filterRecursive(node.children);
                    if (filteredChildren.length > 0) {
                        result.push({ ...node, children: filteredChildren });
                    }
                }
            }

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

    /**
     * Parse search query into structured format
     */
    static parseSearchQuery(searchTerm: string, caseSensitive: boolean): ParsedSearchQuery {
        const raw = searchTerm.trim();
        type QueryPart = { text: string; isPhrase: boolean };
        const parts: QueryPart[] = [];
        const exclude: string[] = [];

        const regex = /"([^"]+)"|(\S+)/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(raw)) !== null) {
            const phrase = match[1];
            const token = match[2];
            if (phrase) {
                parts.push({ text: phrase, isPhrase: true });
            } else if (token) {
                parts.push({ text: token, isPhrase: false });
            }
        }

        const normalized = this.normalizeText(raw, caseSensitive);

        const groups: string[][] = [];
        let currentGroup: string[] = [];
        let hasOr = false;

        const pushCurrentGroup = () => {
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
        };

        for (const part of parts) {
            const normalizedValue = this.normalizeText(part.text, caseSensitive);
            if (!normalizedValue) {
                continue;
            }

            if (!part.isPhrase && normalizedValue === "or") {
                hasOr = true;
                pushCurrentGroup();
                continue;
            }

            const isExclusion = !part.isPhrase && normalizedValue.startsWith("-");
            const cleanToken = isExclusion ? normalizedValue.substring(1) : normalizedValue;
            if (!cleanToken) {
                continue;
            }

            if (isExclusion) {
                exclude.push(cleanToken);
                continue;
            }

            currentGroup.push(cleanToken);
        }
        pushCurrentGroup();

        const filteredGroups = groups.filter(group => group.length > 0);

        const includeAll: string[] = [];
        const orGroups: string[][] = [];

        if (hasOr && filteredGroups.length > 0) {
            orGroups.push(...filteredGroups);
        } else if (filteredGroups.length > 0) {
            includeAll.push(...filteredGroups.flat());
        }

        return {
            raw,
            normalized,
            includeAll,
            orGroups,
            exclude,
            hasWildcard: raw.indexOf("*") > -1
        };
    }

    /**
     * Check if text matches parsed query
     */
    static textMatchesParsedQuery(
        text: string,
        parsed: ParsedSearchQuery,
        caseSensitive: boolean
    ): boolean {
        if (!parsed.raw) {
            return true;
        }

        const normalizedText = this.normalizeText(text, caseSensitive);

        if (parsed.exclude.some(tok => normalizedText.indexOf(tok) > -1)) {
            return false;
        }

        if (parsed.orGroups.length > 0) {
            const matchesGroup = parsed.orGroups.some(group =>
                group.every(tok => normalizedText.indexOf(tok) > -1)
            );
            if (!matchesGroup) {
                return false;
            }
        } else if (parsed.includeAll.length > 0) {
            const allMatch = parsed.includeAll.every(tok => normalizedText.indexOf(tok) > -1);
            if (!allMatch) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalize text for searching
     */
    static normalizeText(text: string, caseSensitive: boolean): string {
        const stripped = text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        return caseSensitive ? stripped : stripped.toLowerCase();
    }

    /**
     * Parse wildcard pattern
     */
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

    /**
     * Calculate wildcard match score
     */
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

        if (!hasLeadingWildcard) {
            score += firstIdx === 0 ? 5 : 2 - firstIdx * 0.1;
        } else {
            score += 2 - firstIdx * 0.05;
        }

        if (!hasTrailingWildcard) {
            score += lastEnd === source.length ? 3 : 1 - (source.length - lastEnd) * 0.05;
        }

        for (let i = 1; i < positions.length; i++) {
            const gap = positions[i] - (positions[i - 1] + tokens[i - 1].length);
            score -= gap * 0.02;
        }

        score -= source.length * 0.005;

        return score;
    }

    /**
     * Get wildcard candidates from node
     */
    private static getWildcardCandidates(node: SlicerNode): string[] {
        const candidates = new Set<string>();

        if (node.name) {
            candidates.add(node.name);
        }

        return Array.from(candidates);
    }

    /**
     * Get search candidates from node
     */
    static getSearchCandidates(node: SlicerNode): string[] {
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

    /**
     * Build search text for a node
     */
    static buildSearchText(name: string): string {
        const normalized = this.normalizeText(name, false);
        return normalized && normalized !== name ? `${name}|${normalized}` : name;
    }

    /**
     * Emit search error event
     * @param error Error that occurred during search
     */
    private static emitSearchError(error: Error): void {
        if (SearchService.eventBus) {
            SearchService.eventBus.emit(EventNames.DATA_ERROR, { error: error.message });
        }
    }
}
