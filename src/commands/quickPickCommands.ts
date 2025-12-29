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

/**
 * Build quick pick items for Markdown headings (supports # .. ######)
 * Returns label with indentation representing heading level, and line number
 */
export function buildHeadingPicks(document: vscode.TextDocument) {
	const picks: Array<{ label: string; description?: string; lineNumber: number; level: number }> = [];
	const headingRegex = /^\s{0,3}(#{1,6})\s+(.*)$/;
	for (let i = 0; i < document.lineCount; i++) {
		const text = document.lineAt(i).text;
		const m = text.match(headingRegex);
		if (m) {
			const level = m[1].length; // number of '#'
			const headingText = m[2].trim();
			const indent = '  '.repeat(Math.max(0, level - 1));
			// Use guillemet-style highlighting (»text«) and preserve indentation
			const label = `${indent}»${headingText}«`;
			picks.push({ label, lineNumber: i, level });
		}
	}
	return picks;
}

/**
 * Build quick pick items for items matching one or more priorities.
 * Pass priority names (case-insensitive) in the `priorities` array.
 * Use the special value 'No Priority' to match items without a priority.
 */
export function buildPriorityPicks(document: vscode.TextDocument, priorities: string[]) {
	const picks: Array<{ label: string; detail: string; lineNumber: number }> = [];
	if (!priorities || priorities.length === 0) { return picks; }
	const parser = parserFactory.getParser(document);
	if (!parser) { return picks; }
	const parseResult = parser.parse(document);
	const lower = priorities.map(p => p.toLowerCase());
	for (const it of parseResult.items) {
		const itemPriority = it.priority ? it.priority.toLowerCase() : undefined;
		const hasNoPriority = !itemPriority;
		if (hasNoPriority && lower.includes('no priority')) {
			picks.push({ label: it.text.replace(/^\s*([-*+]|\d+\.)\s*/, ''), detail: `Line ${it.lineNumber + 1}`, lineNumber: it.lineNumber });
			continue;
		}
		if (itemPriority && lower.includes(itemPriority)) {
			picks.push({ label: it.text.replace(/^\s*([-*+]|\d+\.)\s*/, ''), detail: `Line ${it.lineNumber + 1}`, lineNumber: it.lineNumber });
		}
	}
	return picks;
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

// Apply temporary colored decorations to headings in the given editor. Returns a cleanup function.
function applyHeadingDecorations(editor: vscode.TextEditor, picks: Array<{ label: string; lineNumber: number; level: number }>) {
	// Create decoration types (per level) — lightweight and disposed when cleanup is called
	const decTypes = [
		vscode.window.createTextEditorDecorationType({ color: '#d9534f', fontWeight: 'bold' }), // H1
		vscode.window.createTextEditorDecorationType({ color: '#5cb85c', fontWeight: 'bold' }), // H2
		vscode.window.createTextEditorDecorationType({ color: '#0275d8' }), // H3
		vscode.window.createTextEditorDecorationType({ color: '#6f42c1' }), // H4
		vscode.window.createTextEditorDecorationType({ color: '#343a40' }), // H5
		vscode.window.createTextEditorDecorationType({ color: '#795548' })  // H6
	];

	const rangesByLevel: vscode.Range[][] = [[], [], [], [], [], []];
	for (let i = 0; i < picks.length; i++) {
		const p = picks[i];
		const level = Math.max(1, Math.min(p.level, 6));
		try {
			const line = p.lineNumber;
			const lineRange = editor.document.lineAt(line).range;
			rangesByLevel[level - 1].push(lineRange);
		} catch (err) {
			// ignore if line not present
		}
	}

	for (let lvl = 0; lvl < rangesByLevel.length; lvl++) {
		editor.setDecorations(decTypes[lvl], rangesByLevel[lvl]);
	}

	// Remove decorations and dispose types
	return () => {
		for (let lvl = 0; lvl < decTypes.length; lvl++) {
			editor.setDecorations(decTypes[lvl], []);
			decTypes[lvl].dispose();
		}
	};
}

export function registerQuickPickCommands(context: vscode.ExtensionContext) {
	// Ensure tests can pass a lightweight fake context object without subscriptions
	if (!context) { throw new Error('Extension context is required'); }
	if (!Array.isArray((context as any).subscriptions)) { (context as any).subscriptions = []; }

	// Helper that safely registers a command only if it doesn't already exist (avoids duplicate registration errors in tests)
	function safeRegister(cmd: string, handler: (...args: any[]) => any) {
		try {
			context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));
		} catch (err: any) {
			if (!String(err).includes('already exists')) {
				console.error(`Failed to register command ${cmd}:`, err);
				throw err;
			}
		}
	}

	// Show items from active document in a QuickPick for voice-friendly selection
	safeRegister('voiceitems.showItemsQuickPick', async () => {
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
	});

	// Show matches for a keyword across the whole document
	safeRegister('voiceitems.showKeywordMatches', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }
		const kw = filterSortService.getKeywordFilter();
		if (!kw) { vscode.window.showInformationMessage('No keyword set. Use Search by Keyword first.'); return; }
		await showKeywordMatches(editor, kw);
	});

	// Show Markdown headings — apply temporary in-editor decorations to color headings while QuickPick is open
	safeRegister('voiceitems.showMarkdownHeadings', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }
		const doc = editor.document;
		const isMarkdown = doc.languageId === 'markdown' || doc.fileName.toLowerCase().endsWith('.md') || doc.fileName.toLowerCase().endsWith('.markdown');
		if (!isMarkdown) { vscode.window.showInformationMessage('Active document is not a Markdown file'); return; }

		const picks = buildHeadingPicks(doc);
		if (picks.length === 0) { vscode.window.showInformationMessage('No headings found in current document'); return; }

		// Apply temporary decorations to the active editor showing colored headings in-place
		const clearDecorations = applyHeadingDecorations(editor, picks);

		// Setup a quick listener to clear decorations when the active editor changes
		let activeChangeDisposable: vscode.Disposable | undefined;
		activeChangeDisposable = vscode.window.onDidChangeActiveTextEditor(ev => {
			if (!ev || ev.document.uri.toString() !== doc.uri.toString()) {
				if (activeChangeDisposable) { activeChangeDisposable.dispose(); }
				clearDecorations();
			}
		});
		context.subscriptions.push(activeChangeDisposable!);

		// Show a clean QuickPick (strip guillemet highlighting while keeping indentation)
		const qpItems = picks.map(p => ({ label: p.label.replace(/[»«]/g, '').replace(/^\s+/, match => match), description: `Level ${p.level}`, lineNumber: p.lineNumber }));
		const pick = await vscode.window.showQuickPick(qpItems as any, { placeHolder: 'Select a heading to open', ignoreFocusOut: false });

		// Cleanup decorations and listener
		clearDecorations();
		if (activeChangeDisposable) { activeChangeDisposable.dispose(); }

		if (pick) {
			await vscode.commands.executeCommand('voiceitems.jumpToLine', doc.uri, (pick as any).lineNumber);
		}
	});

	// Toggle complete/incomplete on a line. Accepts either (uri, lineNumber) or a tree-item-like arg
	safeRegister('voiceitems.toggleComplete', async (...args: any[]) => {
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
	});

	// Keyword search for QuickPick (stores it in the FilterSortService)
	safeRegister('voiceitems.searchKeyword', async () => {
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
	});

	safeRegister('voiceitems.clearKeywordFilter', () => {
		filterSortService.clearKeywordFilter();
		vscode.window.showInformationMessage('Filter cleared');
	});

	// Show items by selected priorities. Prompts for one or more priorities to include.
	safeRegister('voiceitems.showPriorityItems', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }

		const config = vscode.workspace.getConfiguration('voiceitems');
		const priorities = config.get<string[]>('priorities', ['low', 'medium', 'high', 'critical']);
		const qpOptions = priorities.map(p => ({ label: `!${p}`, description: p }));
		qpOptions.push({ label: 'No Priority', description: 'No Priority' });

		const selected = await vscode.window.showQuickPick(qpOptions as any, { canPickMany: true, placeHolder: 'Select priorities to show' });
		if (!selected || selected.length === 0) {
			vscode.window.showInformationMessage('No priorities selected');
			return;
		}

		const chosen = selected.map((s: any) => (s.description || s.label.replace(/^!/, '')));
		const picks = buildPriorityPicks(editor.document, chosen);
		if (picks.length === 0) { vscode.window.showInformationMessage('No items found for selected priorities'); return; }

		const pick = await vscode.window.showQuickPick(picks as any, { placeHolder: 'Select an item to open' });
		if (pick) {
			await vscode.commands.executeCommand('voiceitems.jumpToLine', editor.document.uri, (pick as any).lineNumber);
		}
	});

	// Show only incomplete items in QuickPick
	safeRegister('voiceitems.showIncompleteItems', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }

		const parser = parserFactory.getParser(editor.document);
		if (!parser) { vscode.window.showInformationMessage('No supported document open'); return; }

		const parseResult = parser.parse(editor.document);
		const groups = filterSortService.transform(parseResult.items, 'incomplete', 'none', 'none');
		const items = groups.get('All Items') || [];
		if (items.length === 0) { vscode.window.showInformationMessage('No incomplete items found in current document'); return; }

		const picks = items.map((it, idx) => ({
			label: `${idx + 1}. ${it.text.replace(/^\s*([-*+]|\d+\.)\s*/, '')}`,
			description: it.project ? `@${it.project}` : undefined,
			detail: `Line ${it.lineNumber + 1}`,
			item: it
		}));

		const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Select an item to open' });
		if (pick) {
			await vscode.commands.executeCommand('voiceitems.jumpToLine', editor.document.uri, (pick as any).item.lineNumber);
		}
	});

	// Show only completed items in QuickPick
	safeRegister('voiceitems.showCompletedItems', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }

		const parser = parserFactory.getParser(editor.document);
		if (!parser) { vscode.window.showInformationMessage('No supported document open'); return; }

		const parseResult = parser.parse(editor.document);
		const groups = filterSortService.transform(parseResult.items, 'completed', 'none', 'none');
		const items = groups.get('All Items') || [];
		if (items.length === 0) { vscode.window.showInformationMessage('No completed items found in current document'); return; }

		const picks = items.map((it, idx) => ({
			label: `${idx + 1}. ${it.text.replace(/^\s*([-*+]|\d+\.)\s*/, '')}`,
			description: it.project ? `@${it.project}` : undefined,
			detail: `Line ${it.lineNumber + 1}`,
			item: it
		}));

		const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Select an item to open' });
		if (pick) {
			await vscode.commands.executeCommand('voiceitems.jumpToLine', editor.document.uri, (pick as any).item.lineNumber);
		}
	});

	// Change priority for an item (increase/up or decrease/down)
	async function changePriority(direction: 'up' | 'down', args: any[]) {
		let uri: vscode.Uri | undefined;
		let lineNumber: number | undefined;

		if (args.length >= 2 && args[0] instanceof vscode.Uri && typeof args[1] === 'number') {
			uri = args[0];
			lineNumber = args[1];
		} else if (args.length === 1 && args[0] && typeof args[0] === 'object' && args[0].lineNumber !== undefined && args[0].documentUri) {
			uri = args[0].documentUri;
			lineNumber = args[0].lineNumber;
		} else {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				uri = editor.document.uri;
				lineNumber = editor.selection.active.line;
			} else {
				vscode.window.showInformationMessage('No item selected to change priority');
				return;
			}
		}

		if (!uri || lineNumber === undefined) {
			vscode.window.showInformationMessage('No item selected to change priority');
			return;
		}

		try {
			const document = await vscode.workspace.openTextDocument(uri);
			const line = document.lineAt(lineNumber);
			let text = line.text;

			const priorityRegex = /!([A-Za-z0-9_-]+)/;
			const match = priorityRegex.exec(text);
			const config = vscode.workspace.getConfiguration('voiceitems');
			const priorities = config.get<string[]>('priorities', ['low', 'medium', 'high', 'critical']);

			if (match) {
				const current = match[1];
				const idx = priorities.findIndex(p => p.toLowerCase() === current.toLowerCase());
				if (idx === -1) {
					vscode.window.showInformationMessage(`Priority "${current}" is not in configured priorities`);
					return;
				}

				let newPriority: string | undefined;
				if (direction === 'up') {
					if (idx === priorities.length - 1) {
						vscode.window.showInformationMessage('Already at highest priority');
						return;
					}
					newPriority = priorities[idx + 1];
				} else {
					if (idx === 0) {
						vscode.window.showInformationMessage('Already at lowest priority');
						return;
					}
					newPriority = priorities[idx - 1];
				}

				const newText = text.replace(priorityRegex, `!${newPriority}`);
				const edit = new vscode.WorkspaceEdit();
				edit.replace(uri, line.range, newText);
				await vscode.workspace.applyEdit(edit);
				vscode.window.showInformationMessage(`Priority set to ${newPriority}`);
			} else {
				// No priority found — prompt user to pick one
				const pick = await vscode.window.showQuickPick(priorities.map(p => ({ label: `!${p}`, description: p })), { placeHolder: 'Select priority to set' });
				if (!pick) { return; }
				const selected = pick.description || pick.label.replace(/^!/, '');
				const newText = text.trim().length === 0 ? `!${selected}` : `${text} !${selected}`;
				const edit = new vscode.WorkspaceEdit();
				edit.replace(uri, line.range, newText);
				await vscode.workspace.applyEdit(edit);
				vscode.window.showInformationMessage(`Priority set to ${selected}`);
			}
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to change priority: ${String(err)}`);
		}
	}

	// Increase priority (make more urgent)
	safeRegister('voiceitems.increasePriority', async (...args: any[]) => {
		await changePriority('up', args);
	});

	// Decrease priority (make less urgent)
	safeRegister('voiceitems.decreasePriority', async (...args: any[]) => {
		await changePriority('down', args);
	});
}

