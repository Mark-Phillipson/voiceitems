import * as vscode from 'vscode';
import { ParserFactory } from '../parsers/parserFactory';
import { ListItem, ParseResult } from '../parsers/types';
import { FilterSortService, SortMode, FilterMode, GroupMode } from './filterSortService';
import { ListItemTreeItem, GroupTreeItem } from './treeItems';

/**
 * Tree data provider for the list items view
 */
export class ListItemsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private parserFactory = new ParserFactory();
    private filterSortService = new FilterSortService();
    
    private currentDocument: vscode.TextDocument | null = null;
    private parseResult: ParseResult | null = null;
    
    // Current state
    private sortMode: SortMode = 'none';
    private filterMode: FilterMode = 'all';
    private groupMode: GroupMode = 'none';

    constructor() {}

    /**
     * Set the document to display
     */
    setDocument(document: vscode.TextDocument | null): void {
        this.currentDocument = document;
        this.refresh();
    }

    /**
     * Get current document
     */
    getCurrentDocument(): vscode.TextDocument | null {
        return this.currentDocument;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        if (this.currentDocument) {
            const parser = this.parserFactory.getParser(this.currentDocument);
            if (parser) {
                this.parseResult = parser.parse(this.currentDocument);
                
                // Warn about large files
                if (this.parseResult.exceedsLimit) {
                    vscode.window.showWarningMessage(
                        `File has ${this.parseResult.lineCount} lines (limit: ~1000). Consider splitting by section/project for better performance.`,
                        'OK'
                    );
                }
            } else {
                this.parseResult = null;
            }
        } else {
            this.parseResult = null;
        }
        
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set sort mode
     */
    setSortMode(mode: SortMode): void {
        this.sortMode = mode;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set filter mode
     */
    setFilterMode(mode: FilterMode): void {
        this.filterMode = mode;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set group mode
     */
    setGroupMode(mode: GroupMode): void {
        this.groupMode = mode;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set keyword filter
     */
    setKeywordFilter(keyword: string): void {
        this.filterSortService.setKeywordFilter(keyword);
        this._onDidChangeTreeData.fire();
    }

    /**
     * Clear keyword filter
     */
    clearKeywordFilter(): void {
        this.filterSortService.clearKeywordFilter();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get filtered items according to current modes (useful for QuickPick / filtered doc)
     */
    getFilteredItems(): { items: ListItem[]; documentUri: vscode.Uri | null } {
        if (!this.parseResult) {
            return { items: [], documentUri: null };
        }

        const groups = this.filterSortService.transform(
            this.parseResult.items,
            this.filterMode,
            this.sortMode,
            this.groupMode
        );

        if (this.groupMode === 'none') {
            const items = groups.get('All Items') || [];
            return { items, documentUri: this.currentDocument ? this.currentDocument.uri : null };
        } else {
            const items: ListItem[] = [];
            for (const [, groupItems] of groups) {
                items.push(...groupItems);
            }
            return { items, documentUri: this.currentDocument ? this.currentDocument.uri : null };
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!this.currentDocument || !this.parseResult) {
            return Promise.resolve([]);
        }

        // Root level - return groups or items
        if (!element) {
            const groups = this.filterSortService.transform(
                this.parseResult.items,
                this.filterMode,
                this.sortMode,
                this.groupMode
            );

            if (this.groupMode === 'none') {
                // No grouping - return items directly
                const items = groups.get('All Items') || [];
                return Promise.resolve(
                    this.buildTree(items, this.currentDocument.uri)
                );
            } else {
                // Grouping - return group items
                const groupItems: vscode.TreeItem[] = [];
                for (const [label, items] of groups) {
                    groupItems.push(new GroupTreeItem(
                        label,
                        items,
                        this.currentDocument.uri,
                        this.groupMode
                    ));
                }
                return Promise.resolve(groupItems);
            }
        }

        // Group level - return items in group
        if (element instanceof GroupTreeItem) {
            return Promise.resolve(
                this.buildTree(element.items, element.documentUri)
            );
        }

        // List item - return children if any
        if (element instanceof ListItemTreeItem) {
            const children = this.parseResult.items.filter(
                item => this.isChildOf(item, element.listItem)
            );
            return Promise.resolve(
                children.map(item => new ListItemTreeItem(
                    item,
                    vscode.TreeItemCollapsibleState.None,
                    this.currentDocument!.uri
                ))
            );
        }

        return Promise.resolve([]);
    }

    /**
     * Build hierarchical tree from flat list of items
     */
    private buildTree(items: ListItem[], documentUri: vscode.Uri): ListItemTreeItem[] {
        const roots: ListItemTreeItem[] = [];
        const rootLevel = items.length > 0 ? Math.min(...items.map(i => i.level)) : 0;

        for (const item of items) {
            // Only show root-level items at this level
            if (item.level === rootLevel) {
                const hasChildren = items.some(i => this.isChildOf(i, item));
                const state = hasChildren 
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None;
                
                roots.push(new ListItemTreeItem(item, state, documentUri));
            }
        }

        return roots;
    }

    /**
     * Check if item is a direct child of parent
     */
    private isChildOf(item: ListItem, parent: ListItem): boolean {
        // Must be the next level deeper
        if (item.level !== parent.level + 1) {
            return false;
        }

        // Must come after parent in the file
        if (item.lineNumber <= parent.lineNumber) {
            return false;
        }

        // Must not have any item of same or higher level between them
        if (this.parseResult) {
            const between = this.parseResult.items.filter(
                i => i.lineNumber > parent.lineNumber && 
                     i.lineNumber < item.lineNumber &&
                     i.level <= parent.level
            );
            if (between.length > 0) {
                return false;
            }
        }

        return true;
    }
}
