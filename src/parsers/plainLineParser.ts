import * as vscode from 'vscode';
import { ListItem, ListParser, ParseResult } from './types';

const LINE_LIMIT = 1000;

/**
 * Parser for plain text files - treats each non-empty line as an item
 * Detects indentation and optional tags/projects
 */
export class PlainLineParser implements ListParser {
    supportedExtensions = ['.txt', '.list', '.log'];

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

        const ts = this.tryParseDate(text);

        return {
            lineNumber,
            text: text.trimEnd(),
            level,
            tags,
            completed: false,
            project,
            timestamp: ts
        };
    }

    /**
     * Try to parse a timestamp at the start of the line. Returns ms since epoch or undefined.
     * Supports common formats like ISO 8601, `YYYY-MM-DD HH:mm[:ss]`, `YYYY/MM/DD`, and variants.
     */
    private tryParseDate(text: string): number | undefined {
        const s = text.trim();
        // Common ISO 8601 at start
        const isoMatch = s.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.+-Z]+)(?:\s|$)/);
        if (isoMatch) {
            const t = Date.parse(isoMatch[1]);
            if (!isNaN(t)) { return t; }
        }

        // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM
        const ymdMatch = s.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]([0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?)(?:\s|$)/);
        if (ymdMatch) {
            const iso = `${ymdMatch[1]}T${ymdMatch[2]}`;
            const t = Date.parse(iso);
            if (!isNaN(t)) { return t; }
        }

        // YYYY/MM/DD or DD/MM/YYYY (try YYYY first)
        const ymdSlash = s.match(/^([0-9]{4}\/\d{2}\/\d{2})(?:\s|$)/);
        if (ymdSlash) {
            const t = Date.parse(ymdSlash[1]);
            if (!isNaN(t)) { return t; }
        }

        // Fallback: attempt to parse the first token as a date
        const firstToken = s.split(/\s+/)[0];
        const t = Date.parse(firstToken);
        if (!isNaN(t)) { return t; }

        return undefined;
    }
}
