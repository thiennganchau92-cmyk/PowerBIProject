/**
 * Advanced Search Service
 * Provides intelligent text matching with fuzzy search, partial matching, and relevance scoring
 */

export interface SearchResult {
    text: string;
    score: number;
    matchType: 'exact' | 'startsWith' | 'contains' | 'fuzzy' | 'tokenMatch' | 'acronym';
}

export interface SearchOptions {
    caseSensitive?: boolean;
    fuzzyThreshold?: number;  // 0-1, lower = more strict
    minScore?: number;        // Minimum score to consider a match
    maxResults?: number;      // Limit results
}

export class AdvancedSearchService {
    private static readonly DEFAULT_OPTIONS: SearchOptions = {
        caseSensitive: false,
        fuzzyThreshold: 0.3,
        minScore: 0.3,
        maxResults: 30000
    };

    /**
     * Search with intelligent matching and scoring
     */
    static search(
        items: string[],
        query: string,
        options: SearchOptions = {}
    ): SearchResult[] {
        if (!query || query.trim().length === 0) {
            return items.map(text => ({ text, score: 1, matchType: 'exact' as const }));
        }

        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const normalizedQuery = opts.caseSensitive ? query : query.toLowerCase();
        const queryTokens = this.tokenize(normalizedQuery);

        const results: SearchResult[] = [];

        for (const item of items) {
            const normalizedItem = opts.caseSensitive ? item : item.toLowerCase();
            const result = this.matchItem(normalizedItem, item, normalizedQuery, queryTokens);

            if (result && result.score >= (opts.minScore || 0)) {
                results.push(result);
            }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        // Limit results
        if (opts.maxResults && results.length > opts.maxResults) {
            return results.slice(0, opts.maxResults);
        }

        return results;
    }

    /**
     * Match a single item against query
     */
    private static matchItem(
        normalizedItem: string,
        originalItem: string,
        query: string,
        queryTokens: string[]
    ): SearchResult | null {
        const queryLength = query.length;

        // 1. Exact match (highest score)
        if (normalizedItem === query) {
            return { text: originalItem, score: 1.0, matchType: 'exact' };
        }

        // 2. Starts with (very high score)
        if (normalizedItem.startsWith(query)) {
            const score = 0.95 - (normalizedItem.length - query.length) * 0.01;
            return { text: originalItem, score: Math.max(score, 0.8), matchType: 'startsWith' };
        }

        // 3. Contains (high score)
        if (normalizedItem.indexOf(query) > -1) {
            const position = normalizedItem.indexOf(query);
            const positionPenalty = position * 0.01;
            const score = 0.7 - positionPenalty;
            return { text: originalItem, score: Math.max(score, 0.5), matchType: 'contains' };
        }

        // 4. Tokenized match (search in individual words)
        const itemTokens = this.tokenize(normalizedItem);
        const tokenMatchScore = this.calculateTokenMatchScore(itemTokens, queryTokens);
        // Require stronger token matches for very short queries to avoid noisy results
        const minTokenScore =
            queryLength <= 2 ? 0.7 :
            queryLength <= 3 ? 0.55 :
            0.45;
        if (tokenMatchScore > minTokenScore) {
            return { text: originalItem, score: tokenMatchScore, matchType: 'tokenMatch' };
        }

        // 5. Acronym match (e.g., "LMA" matches "Laryngeal Mask Airway")
        if (query.length >= 2 && this.isAcronymMatch(normalizedItem, query)) {
            return { text: originalItem, score: 0.6, matchType: 'acronym' };
        }

        // 6. Fuzzy match (handles typos and variations)
        // Make fuzzy matching stricter for short queries so results feel more exact.
        const fuzzyScore = this.calculateFuzzyScore(normalizedItem, query);
        const minFuzzyScore =
            queryLength <= 2 ? 0.85 :
            queryLength <= 3 ? 0.7 :
            0.5;
        if (fuzzyScore > minFuzzyScore) {
            return { text: originalItem, score: fuzzyScore * 0.8, matchType: 'fuzzy' };
        }

        return null;
    }

    /**
     * Calculate fuzzy match score using Levenshtein distance
     */
    private static calculateFuzzyScore(text: string, query: string): number {
        const distance = this.levenshteinDistance(text, query);
        const maxLength = Math.max(text.length, query.length);
        
        if (maxLength === 0) return 1;
        
        const similarity = 1 - distance / maxLength;
        
        // Also check if query appears as substring with small modifications
        const minSubstringDistance = this.minSubstringDistance(text, query);
        const substringScore = 1 - minSubstringDistance / query.length;
        
        return Math.max(similarity, substringScore);
    }

    /**
     * Levenshtein distance (edit distance between two strings)
     */
    private static levenshteinDistance(str1: string, str2: string): number {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len1][len2];
    }

    /**
     * Find minimum edit distance of query as substring in text
     */
    private static minSubstringDistance(text: string, query: string): number {
        let minDistance = Infinity;
        
        for (let i = 0; i <= text.length - query.length; i++) {
            const substring = text.substr(i, query.length);
            const distance = this.levenshteinDistance(substring, query);
            minDistance = Math.min(minDistance, distance);
        }
        
        return minDistance === Infinity ? query.length : minDistance;
    }

    /**
     * Tokenize text into words
     */
    private static tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    /**
     * Calculate token-based match score
     */
    private static calculateTokenMatchScore(
        itemTokens: string[],
        queryTokens: string[]
    ): number {
        if (queryTokens.length === 0 || itemTokens.length === 0) return 0;

        let matchedTokens = 0;
        let partialMatchScore = 0;

        for (const queryToken of queryTokens) {
            let bestMatchScore = 0;

            for (const itemToken of itemTokens) {
                // Exact token match
                if (itemToken === queryToken) {
                    matchedTokens++;
                    bestMatchScore = 1;
                    break;
                }
                
                // Starts with
                if (itemToken.startsWith(queryToken)) {
                    bestMatchScore = Math.max(bestMatchScore, 0.9);
                }
                
                // Contains
                if (itemToken.indexOf(queryToken) > -1) {
                    bestMatchScore = Math.max(bestMatchScore, 0.7);
                }
                
                // Fuzzy match on individual tokens
                const fuzzyScore = this.calculateFuzzyScore(itemToken, queryToken);
                if (fuzzyScore > 0.7) {
                    bestMatchScore = Math.max(bestMatchScore, fuzzyScore * 0.8);
                }
            }

            partialMatchScore += bestMatchScore;
        }

        // Score based on percentage of query tokens matched
        const matchRatio = (matchedTokens + partialMatchScore) / queryTokens.length;
        
        // Bonus if all tokens matched
        const allTokensBonus = matchedTokens === queryTokens.length ? 0.2 : 0;
        
        return Math.min(matchRatio + allTokensBonus, 1.0);
    }

    /**
     * Check if query matches as acronym
     * E.g., "LMA" matches "Laryngeal Mask Airway"
     */
    private static isAcronymMatch(text: string, query: string): boolean {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        if (words.length < query.length) return false;

        // Try matching query as acronym from start
        let queryIndex = 0;
        for (const word of words) {
            if (queryIndex >= query.length) break;
            if (word[0] && word[0].toLowerCase() === query[queryIndex].toLowerCase()) {
                queryIndex++;
            }
        }

        return queryIndex === query.length;
    }

    /**
     * Highlight matched portions in text
     */
    static highlightMatches(text: string, query: string): string {
        if (!query) return text;

        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();

        // Find best match position
        const exactIndex = textLower.indexOf(queryLower);
        if (exactIndex > -1) {
            return (
                text.substring(0, exactIndex) +
                '<mark>' + text.substring(exactIndex, exactIndex + query.length) + '</mark>' +
                text.substring(exactIndex + query.length)
            );
        }

        // Highlight token matches
        const queryTokens = this.tokenize(query);
        let highlightedText = text;

        for (const token of queryTokens) {
            const regex = new RegExp(`(${this.escapeRegex(token)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }

        return highlightedText;
    }

    /**
     * Escape special regex characters
     */
    private static escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get search suggestions based on partial input
     */
    static getSuggestions(
        items: string[],
        query: string,
        limit: number = 5
    ): string[] {
        const results = this.search(items, query, {
            maxResults: limit,
            minScore: 0.4
        });

        return results.map(r => r.text);
    }
}
