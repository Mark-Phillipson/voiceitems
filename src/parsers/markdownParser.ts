import * as vscode from 'vscode';
import { ListItem, ListParser, ParseResult } from './types';

const LINE_LIMIT = 1000;

/**
 * Parser for Markdown list items
 * Supports: - item, * item, + item, and numbered lists
 * Also detects task list checkboxes: - [ ] or - [x]
 */
export class MarkdownParser implements ListParser {
    supportedExtensions = ['.md', '.markdown'];

    parse(document: vscode.TextDocument): ParseResult {
        const items: ListItem[] = [];
        const lineCount = document.lineCount;

        for (let i = 0; i < lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;

            const item = this.parseLine(text, i);
            if (item) {
                items.push(item);
            }
        }

        return {
            items,
            lineCount,
            exceedsLimit: lineCount > LINE_LIMIT
        };
    }

    private parseLine(text: string, lineNumber: number): ListItem | null {
        // Match list items: -, *, +, or numbered
        const listMatch = text.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        if (!listMatch) {
            return null;
        }

        const indent = listMatch[1].length;
        const level = Math.floor(indent / 2);
        const content = listMatch[3];

        // Check for task list checkboxes
        const checkboxMatch = content.match(/^\[([ x])\]\s*(.*)$/i);
        const completed = checkboxMatch ? checkboxMatch[1].toLowerCase() === 'x' : false;
        const actualText = checkboxMatch ? checkboxMatch[2] : content;

        // Extract tags
        const tagMatches = actualText.match(/#(\w+)/g);
        const tags = tagMatches ? tagMatches.map(t => t.substring(1)) : [];

        // Extract project
        const projectMatch = actualText.match(/@(\w+)/);
        const project = projectMatch ? projectMatch[1] : undefined;

        return {
            lineNumber,
            text: text.trimEnd(),
            level,
            tags,
            completed,
            project
        };
    }
}
