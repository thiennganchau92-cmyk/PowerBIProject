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

        // Advanced search with scoring
        return this.advancedFilterData(data, searchTerm, caseSensitive);
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
            );

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
