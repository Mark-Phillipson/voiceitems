import * as vscode from 'vscode';
import { ListItem } from '../parsers/types';

export type SortMode = 'none' | 'alpha' | 'priority' | 'completion';
export type FilterMode = 'all' | 'incomplete' | 'completed';
export type GroupMode = 'none' | 'priority' | 'project' | 'tag';

/**
 * Service for filtering, sorting, and grouping list items
 */
export class FilterSortService {
    private keywordFilter = '';

    /**
     * Set keyword filter
     */
    setKeywordFilter(keyword: string): void {
        this.keywordFilter = keyword.toLowerCase();
    }

    /**
     * Get current keyword filter
     */
    getKeywordFilter(): string {
        return this.keywordFilter;
    }

    /**
     * Clear keyword filter
     */
    clearKeywordFilter(): void {
        this.keywordFilter = '';
    }

    /**
     * Filter items based on filter mode and keyword
     */
    filter(items: ListItem[], mode: FilterMode): ListItem[] {
        let filtered = items;

        // Apply completion filter
        if (mode === 'incomplete') {
            filtered = filtered.filter(item => !item.completed);
        } else if (mode === 'completed') {
            filtered = filtered.filter(item => item.completed);
        }

        // Apply keyword filter
        if (this.keywordFilter) {
            filtered = filtered.filter(item => 
                item.text.toLowerCase().includes(this.keywordFilter) ||
                item.tags.some(tag => tag.toLowerCase().includes(this.keywordFilter)) ||
                (item.project && item.project.toLowerCase().includes(this.keywordFilter))
            );
        }

        return filtered;
    }

    /**
     * Sort items based on sort mode
     */
    sort(items: ListItem[], mode: SortMode): ListItem[] {
        const sorted = [...items];

        switch (mode) {
            case 'alpha':
                return sorted.sort((a, b) => a.text.localeCompare(b.text));
            
            case 'priority':
                return sorted.sort((a, b) => {
                    const config = vscode.workspace.getConfiguration('voiceitems');
                    const priorities = config.get<string[]>('priorities', ['low', 'medium', 'high', 'critical']);
                    const priorityOrder: Record<string, number> = {};
                    priorities.forEach((p, idx) => priorityOrder[p.toLowerCase()] = idx);
                    const aOrder = a.priority ? (priorityOrder[a.priority.toLowerCase()] ?? 99) : 99;
                    const bOrder = b.priority ? (priorityOrder[b.priority.toLowerCase()] ?? 99) : 99;
                    return aOrder - bOrder;
                });
            
            case 'completion':
                return sorted.sort((a, b) => {
                    if (a.completed === b.completed) {
                        return 0;
                    }
                    return a.completed ? 1 : -1;
                });
            
            default:
                // Keep original order (by line number)
                return sorted.sort((a, b) => a.lineNumber - b.lineNumber);
        }
    }

    /**
     * Group items based on group mode
     */
    group(items: ListItem[], mode: GroupMode): Map<string, ListItem[]> {
        const groups = new Map<string, ListItem[]>();

        if (mode === 'none') {
            groups.set('All Items', items);
            return groups;
        }

        for (const item of items) {
            let keys: string[] = [];

            switch (mode) {
                case 'priority':
                    keys = [item.priority || 'No Priority'];
                    break;
                
                case 'project':
                    keys = [item.project || 'No Project'];
                    break;
                
                case 'tag':
                    keys = item.tags.length > 0 ? item.tags : ['No Tags'];
                    break;
            }

            for (const key of keys) {
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key)!.push(item);
            }
        }

        return groups;
    }

    /**
     * Apply all transformations: filter, sort, then group
     */
    transform(
        items: ListItem[],
        filterMode: FilterMode,
        sortMode: SortMode,
        groupMode: GroupMode
    ): Map<string, ListItem[]> {
        const filtered = this.filter(items, filterMode);
        const sorted = this.sort(filtered, sortMode);
        return this.group(sorted, groupMode);
    }
}
