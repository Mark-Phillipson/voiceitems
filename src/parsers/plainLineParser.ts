import * as vscode from 'vscode';
import { ListItem, ListParser, ParseResult } from './types';

const LINE_LIMIT = 1000;

/**
 * Parser for plain text files - treats each non-empty line as an item
 * Detects indentation and optional tags/projects
 */
export class PlainLineParser implements ListParser {
    supportedExtensions = ['.txt', '.list'];

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
        const level = Math.floor(indent / 2);

        // Extract tags
        const tagMatches = text.match(/#(\w+)/g);
        const tags = tagMatches ? tagMatches.map(t => t.substring(1)) : [];

        // Extract project
        const projectMatch = text.match(/@(\w+)/);
        const project = projectMatch ? projectMatch[1] : undefined;

        return {
            lineNumber,
            text: text.trimEnd(),
            level,
            tags,
            completed: false,
            project
        };
    }
}
