import * as vscode from 'vscode';
import { ListItem, ListParser, ParseResult } from './types';

const LINE_LIMIT = 1000;

/**
 * Parser for .tasks files with checkbox syntax and tags
 * Format: [ ] or [x] for completion, #tags for tags, !priority for priority
 */
export class TasksParser implements ListParser {
    supportedExtensions = ['.tasks', '.todo', '.task'];

    parse(document: vscode.TextDocument): ParseResult {
        const items: ListItem[] = [];
        const lineCount = document.lineCount;

        for (let i = 0; i < lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;

            // Skip empty lines
            if (text.trim().length === 0) {
                continue;
            }

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
        // Calculate indentation level
        const match = text.match(/^(\s*)/);
        const indent = match ? match[1].length : 0;
        const level = Math.floor(indent / 2); // 2 spaces = 1 level

        // Check for checkbox completion
        const completed = /\[x\]/i.test(text);

        // Extract tags (words starting with #)
        const tagMatches = text.match(/#(\w+)/g);
        const tags = tagMatches ? tagMatches.map(t => t.substring(1)) : [];

        // Extract priority (words starting with !)
        let priority: 'critical' | 'high' | 'medium' | 'low' | undefined;
        if (/!critical/i.test(text)) {
            priority = 'critical';
        } else if (/!high/i.test(text)) {
            priority = 'high';
        } else if (/!medium/i.test(text)) {
            priority = 'medium';
        } else if (/!low/i.test(text)) {
            priority = 'low';
        }

        // Extract project (words starting with @)
        const projectMatch = text.match(/@(\w+)/);
        const project = projectMatch ? projectMatch[1] : undefined;

        return {
            lineNumber,
            text: text.trimEnd(),
            level,
            tags,
            completed,
            priority,
            project
        };
    }
}
