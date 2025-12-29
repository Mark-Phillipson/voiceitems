import * as vscode from 'vscode';

// Core types for parsing list files

export interface ListItem {
    /** Original line number in the file (0-based) */
    lineNumber: number;
    /** Raw line text */
    text: string;
    /** Indentation level (0 = root) */
    level: number;
    /** Tags extracted from the line */
    tags: string[];
    /** Completion status (for tasks) */
    completed: boolean;
    /** Priority level if detected (free-form; configured via settings) */
    priority?: string;
    /** Project or section name */
    project?: string;
}

export interface ParseResult {
    /** All parsed items */
    items: ListItem[];
    /** Total line count in file */
    lineCount: number;
    /** Whether file exceeds soft limit */
    exceedsLimit: boolean;
}

export interface ListParser {
    /** File extensions this parser handles (e.g., ['.tasks', '.todo']) */
    supportedExtensions: string[];
    /** Parse a document into list items */
    parse(document: vscode.TextDocument): ParseResult;
}
