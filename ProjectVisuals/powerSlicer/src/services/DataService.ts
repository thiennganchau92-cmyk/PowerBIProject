import { SlicerNode } from "../interfaces";
import { EventBus } from "../events/EventBus";
import { EventNames } from "../events/EventTypes";

/**
 * Data service for managing and transforming SlicerNode data
 * Handles data operations that are not search-related
 */
export class DataService {
    private eventBus: EventBus | null = null;

    /**
     * Set the event bus for emitting data events
     * @param eventBus EventBus instance
     */
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    /**
     * Extract all names from a hierarchical SlicerNode structure
     * @param data Array of SlicerNode items
     * @returns Flat array of all node names
     */
    static getAllNames(data: SlicerNode[]): string[] {
        if (!data || data.length === 0) {
            return [];
        }

        const names: string[] = [];

        const collectNames = (nodes: SlicerNode[]): void => {
            for (const node of nodes) {
                if (node.name) {
                    names.push(node.name);
                }
                if (node.children && node.children.length > 0) {
                    collectNames(node.children);
                }
            }
        };

        try {
            collectNames(data);
        } catch (error) {
            console.error("Error collecting names from data:", error);
            return [];
        }

        return names;
    }

    /**
     * Check if a node or any of its descendants are in the selected items list
     * @param node SlicerNode to check
     * @param selectedItems Array of selected item names
     * @returns True if node or any descendant is selected
     */
    static hasSelectedDescendants(node: SlicerNode, selectedItems: string[]): boolean {
        if (!node || !selectedItems || selectedItems.length === 0) {
            return false;
        }

        try {
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
        } catch (error) {
            console.error("Error checking selected descendants:", error);
            return false;
        }

        return false;
    }

    /**
     * Count total nodes in a hierarchical structure
     * @param data Array of SlicerNode items
     * @returns Total count of all nodes
     */
    static countNodes(data: SlicerNode[]): number {
        if (!data || data.length === 0) {
            return 0;
        }

        let count = 0;

        const countRecursive = (nodes: SlicerNode[]): void => {
            for (const node of nodes) {
                count++;
                if (node.children && node.children.length > 0) {
                    countRecursive(node.children);
                }
            }
        };

        try {
            countRecursive(data);
        } catch (error) {
            console.error("Error counting nodes:", error);
            return 0;
        }

        return count;
    }

    /**
     * Find a node by name in the hierarchy
     * @param data Array of SlicerNode items
     * @param name Name to search for
     * @returns Found node or null
     */
    static findNodeByName(data: SlicerNode[], name: string): SlicerNode | null {
        if (!data || data.length === 0 || !name) {
            return null;
        }

        const findRecursive = (nodes: SlicerNode[]): SlicerNode | null => {
            for (const node of nodes) {
                if (node.name === name) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    const found = findRecursive(node.children);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        };

        try {
            return findRecursive(data);
        } catch (error) {
            console.error("Error finding node by name:", error);
            return null;
        }
    }

    /**
     * Get all leaf nodes (nodes without children)
     * @param data Array of SlicerNode items
     * @returns Array of leaf nodes
     */
    static getLeafNodes(data: SlicerNode[]): SlicerNode[] {
        if (!data || data.length === 0) {
            return [];
        }

        const leaves: SlicerNode[] = [];

        const collectLeaves = (nodes: SlicerNode[]): void => {
            for (const node of nodes) {
                if (!node.children || node.children.length === 0) {
                    leaves.push(node);
                } else {
                    collectLeaves(node.children);
                }
            }
        };

        try {
            collectLeaves(data);
        } catch (error) {
            console.error("Error collecting leaf nodes:", error);
            return [];
        }

        return leaves;
    }

    /**
     * Transform Power BI tree data node to SlicerNode format
     * @param treeNode Power BI tree node
     * @returns Transformed SlicerNode
     */
    static transformTreeData(treeNode: any): SlicerNode {
        const name = treeNode.value || "";
        const children: SlicerNode[] = [];

        if (treeNode.children && Array.isArray(treeNode.children)) {
            for (const child of treeNode.children) {
                children.push(DataService.transformTreeData(child));
            }
        }

        return {
            name,
            children,
            searchText: name
        };
    }

    /**
     * Create a leaf node (node without children)
     * @param name Node name
     * @param searchText Search text for the node
     * @param dataIndex Optional data index
     * @returns SlicerNode
     */
    static createLeafNode(name: string, searchText: string, dataIndex?: number): SlicerNode {
        const node: SlicerNode = {
            name,
            children: [],
            searchText
        };

        if (dataIndex !== undefined) {
            node.dataIndex = dataIndex;
        }

        return node;
    }

    /**
     * Emit data loaded event
     * @param nodeCount Number of nodes loaded
     */
    private emitDataLoaded(nodeCount: number): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.DATA_LOADED, { nodeCount });
        }
    }

    /**
     * Emit data error event
     * @param error Error that occurred
     */
    private emitDataError(error: Error): void {
        if (this.eventBus) {
            this.eventBus.emit(EventNames.DATA_ERROR, { error: error.message });
        }
    }
}
