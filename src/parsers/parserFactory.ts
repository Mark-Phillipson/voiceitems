import * as vscode from 'vscode';
import { ListParser } from './types';
import { TasksParser } from './tasksParser';
import { MarkdownParser } from './markdownParser';
import { PlainLineParser } from './plainLineParser';

/**
 * Factory to get the appropriate parser for a document
 */
export class ParserFactory {
    private parsers: ListParser[];

    constructor() {
        this.parsers = [
            new TasksParser(),
            new MarkdownParser(),
            new PlainLineParser()
        ];
    }

    /**
     * Get parser for a document based on file extension
     */
    getParser(document: vscode.TextDocument): ListParser | null {
        const ext = this.getFileExtension(document.fileName);
        
        for (const parser of this.parsers) {
            if (parser.supportedExtensions.includes(ext)) {
                return parser;
            }
        }

        return null;
    }

    /**
     * Check if a document is supported by any parser
     */
    isSupported(document: vscode.TextDocument): boolean {
        return this.getParser(document) !== null;
    }

    private getFileExtension(fileName: string): string {
        const match = fileName.match(/\.[^.]+$/);
        return match ? match[0].toLowerCase() : '';
    }
}
