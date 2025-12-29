import * as vscode from 'vscode';
import { ListItem } from '../parsers/types';

/**
 * Tree item representing a list item in the sidebar
 */
export class ListItemTreeItem extends vscode.TreeItem {
    constructor(
        public readonly listItem: ListItem,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly documentUri: vscode.Uri
    ) {
        super(listItem.text, collapsibleState);

        // Set the label without markup
        this.label = this.formatLabel(listItem);
        
        // Add description for additional info
        this.description = this.formatDescription(listItem);
        
        // Set icon based on completion status
        this.iconPath = this.getIcon(listItem);
        
        // Context value for command filtering
        this.contextValue = listItem.completed ? 'completedItem' : 'incompleteItem';
        
        // Command to jump to line
        this.command = {
            command: 'voiceitems.jumpToLine',
            title: 'Jump to Line',
            arguments: [documentUri, listItem.lineNumber]
        };

        // Set tooltip with full details
        this.tooltip = this.formatTooltip(listItem);
    }

    private formatLabel(item: ListItem): string {
        // Remove leading whitespace and checkbox markers for cleaner display
        let label = item.text.trim();
        
        // Remove checkbox markers
        label = label.replace(/^\[[ x]\]\s*/i, '');
        
        // Remove leading list markers (-, *, +, numbers)
        label = label.replace(/^([-*+]|\d+\.)\s+/, '');
        
        return label;
    }

    private formatDescription(item: ListItem): string {
        const parts: string[] = [];
        
        if (item.priority) {
            parts.push(`!${item.priority}`);
        }
        
        if (item.project) {
            parts.push(`@${item.project}`);
        }
        
        if (item.tags.length > 0) {
            parts.push(item.tags.map(t => `#${t}`).join(' '));
        }
        
        return parts.join(' ');
    }

    private getIcon(item: ListItem): vscode.ThemeIcon {
        if (item.completed) {
            return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
        }
        
        if (item.priority === 'critical') {
            return new vscode.ThemeIcon('alert', new vscode.ThemeColor('testing.iconFailed'));
        }
        
        if (item.priority === 'high') {
            return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        }
        
        return new vscode.ThemeIcon('circle-outline');
    }

    private formatTooltip(item: ListItem): string {
        const lines = [
            `Line ${item.lineNumber + 1}`,
            `Level: ${item.level}`,
            item.completed ? 'Status: Completed' : 'Status: Incomplete'
        ];
        
        if (item.priority) {
            lines.push(`Priority: ${item.priority}`);
        }
        
        if (item.project) {
            lines.push(`Project: ${item.project}`);
        }
        
        if (item.tags.length > 0) {
            lines.push(`Tags: ${item.tags.join(', ')}`);
        }
        
        return lines.join('\n');
    }
}

/**
 * Group item for organizing list items by category
 */
export class GroupTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly items: ListItem[],
        public readonly documentUri: vscode.Uri,
        public readonly groupType: 'priority' | 'project' | 'tag' | 'completion'
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        
        this.description = `${items.length} item${items.length !== 1 ? 's' : ''}`;
        this.contextValue = 'group';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}
