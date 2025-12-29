import * as vscode from 'vscode';
import { ParserFactory } from '../parsers/parserFactory';
import { FilterSortService } from '../treeView/filterSortService';

const parserFactory = new ParserFactory();
const filterSortService = new FilterSortService();

/**
 * Build quick pick items for lines in a document matching keyword (case-insensitive).
 * Highlight matches by wrapping with « and » for visibility.
 */
export function buildKeywordPicks(document: vscode.TextDocument, keyword: string) {
	const picks: Array<{ label: string; detail: string; lineNumber: number }> = [];
	if (!keyword) { return picks; }
	const kw = keyword.toLowerCase();
	for (let i = 0; i < document.lineCount; i++) {
		const text = document.lineAt(i).text;
		if (text.toLowerCase().includes(kw)) {
			// Create a highlighted version for display
			const highlighted = text.replace(new RegExp(`(${escapeRegExp(keyword)})`, 'ig'), '»$1«');
			picks.push({ label: highlighted.trim() || '(empty line)', detail: `Line ${i + 1}`, lineNumber: i });
		}
	}
	return picks;
}

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function showKeywordMatches(editor: vscode.TextEditor, keyword: string) {
	const picks = buildKeywordPicks(editor.document, keyword);
	if (picks.length === 0) {
		vscode.window.showInformationMessage(`No lines matched "${keyword}" in current document`);
		return;
	}

	const qp = picks.map(p => ({ label: p.label, detail: p.detail, lineNumber: p.lineNumber }));
	const pick = await vscode.window.showQuickPick(qp as any, { placeHolder: `Matches for "${keyword}"` });
	if (pick) {
		await vscode.commands.executeCommand('voiceitems.jumpToLine', editor.document.uri, (pick as any).lineNumber);
	}
}

export function registerQuickPickCommands(context: vscode.ExtensionContext) {
	// Show items from active document in a QuickPick for voice-friendly selection
	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.showItemsQuickPick', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		// If a keyword filter is set, show matches across the document instead
		const keyword = filterSortService.getKeywordFilter();
		if (keyword) {
			await showKeywordMatches(editor, keyword);
			return;
		}

		const parser = parserFactory.getParser(editor.document);
		if (!parser) {
			vscode.window.showInformationMessage('No supported document open');
			return;
		}

		const parseResult = parser.parse(editor.document);
		if (parseResult.items.length === 0) {
			vscode.window.showInformationMessage('No items found in current document');
			return;
		}

		// Warn about large files
		if (parseResult.exceedsLimit) {
			vscode.window.showWarningMessage(
				`File has ${parseResult.lineCount} lines (limit: ~1000). Consider splitting by section/project for better performance.`,
				'OK'
			);
		}

		// Use keyword filter if set
		const groups = filterSortService.transform(parseResult.items, 'all', 'none', 'none');
		const items = groups.get('All Items') || [];

		const picks = items.map((it, idx) => ({
			label: `${idx + 1}. ${it.text.replace(/^\s*([-*+]|\d+\.)\s*/, '')}`,
			description: it.project ? `@${it.project}` : undefined,
			detail: `Line ${it.lineNumber + 1}`,
			item: it
		}));

		const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Select an item to open' });
		if (pick) {
			await vscode.commands.executeCommand('voiceitems.jumpToLine', editor.document.uri, pick.item.lineNumber);
		}
	}));

	// Show matches for a keyword across the whole document
	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.showKeywordMatches', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }
		const kw = filterSortService.getKeywordFilter();
		if (!kw) { vscode.window.showInformationMessage('No keyword set. Use Search by Keyword first.'); return; }
		await showKeywordMatches(editor, kw);
	}));

	// Toggle complete/incomplete on a line. Accepts either (uri, lineNumber) or a tree-item-like arg
	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.toggleComplete', async (...args: any[]) => {
		let uri: vscode.Uri | undefined;
		let lineNumber: number | undefined;

		if (args.length >= 2 && args[0] instanceof vscode.Uri && typeof args[1] === 'number') {
			uri = args[0];
			lineNumber = args[1];
		} else if (args.length === 1 && args[0] && typeof args[0] === 'object' && args[0].lineNumber !== undefined && args[0].documentUri) {
			// object shaped like previous tree item
			uri = args[0].documentUri;
			lineNumber = args[0].lineNumber;
		} else {
			// No explicit args — fall back to the active editor's current line
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				uri = editor.document.uri;
				lineNumber = editor.selection.active.line;
			} else {
				vscode.window.showInformationMessage('No item selected to toggle');
				return;
			}
		}

		if (!uri || lineNumber === undefined) {
			vscode.window.showInformationMessage('No item selected to toggle');
			return;
		}

		try {
			const document = await vscode.workspace.openTextDocument(uri);
			const line = document.lineAt(lineNumber!);
			let text = line.text;
			// Match a checkbox with any whitespace inside the brackets (e.g. `[ ]`, `[  ]`, `[x]`, `[ X ]`)
			const checkboxRegex = /\[\s*[xX]?\s*\]/;
			const hasCheckbox = checkboxRegex.test(text);
			if (hasCheckbox) {
				const isChecked = /\[\s*[xX]\s*\]/.test(text);
				const newCheck = isChecked ? '[ ]' : '[x]';
				text = text.replace(checkboxRegex, newCheck);
			} else {
				// insert checking marker after list marker if possible
				const replaced = text.replace(/^(\s*([-*+]|\d+\.)\s*)/, `$1[x] `);
				if (replaced === text) {
					text = '[x] ' + text;
				} else {
					text = replaced;
				}
			}
			const edit = new vscode.WorkspaceEdit();
			edit.replace(uri!, line.range, text);
			await vscode.workspace.applyEdit(edit);
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to toggle complete: ${String(err)}`);
		}
	}));

	// Keyword search for QuickPick (stores it in the FilterSortService)
	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.searchKeyword', async () => {
		const keyword = await vscode.window.showInputBox({ prompt: 'Enter keyword to filter items', placeHolder: 'keyword...' });
		if (keyword !== undefined) {
			if (keyword.trim()) {
				const kw = keyword.trim();
				filterSortService.setKeywordFilter(kw);
				vscode.window.showInformationMessage(`Filter set: ${kw}`);
				// Immediately show matches for the keyword across the active document
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					await showKeywordMatches(editor, kw);
				}
			} else {
				filterSortService.clearKeywordFilter();
				vscode.window.showInformationMessage('Filter cleared');
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.clearKeywordFilter', () => {
		filterSortService.clearKeywordFilter();
		vscode.window.showInformationMessage('Filter cleared');
	}));
}

