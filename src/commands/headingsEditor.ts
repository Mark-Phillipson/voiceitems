import * as vscode from 'vscode';
import { buildHeadingPicks } from './quickPickCommands';

const SCHEME = 'voiceitems-headings';

// A simple content provider that returns a document containing only headings
export class HeadingsProvider implements vscode.TextDocumentContentProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	readonly onDidChange = this._onDidChange.event;

	// Provide the headings document content by reading the original document URI from uri.query
	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		try {
			if (!uri.query) { return 'Invalid headings document (no source)'; }
			const original = vscode.Uri.parse(uri.query);
			const doc = await vscode.workspace.openTextDocument(original);
			const picks = buildHeadingPicks(doc);
			// Build a simple plaintext view with one heading per line (preserve indentation)
			return picks.map(p => p.label).join('\n');
		} catch (err) {
			return `Failed to build headings: ${String(err)}`;
		}
	}

	// Utility to signal a refresh
	refresh(uri: vscode.Uri) {
		this._onDidChange.fire(uri);
	}
}

// Map from headings-doc uri to info { mapping, source }
const headingsMap = new Map<string, { mapping: number[]; source: vscode.Uri }>();
// Reverse map: source uri -> set of headings doc uris
const sourceToHeadings = new Map<string, Set<string>>();

export function registerHeadingsEditor(context: vscode.ExtensionContext) {
	const provider = new HeadingsProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider));

	// Decoration types per heading level
	const decorationTypes = [
		vscode.window.createTextEditorDecorationType({ color: '#d9534f' }), // H1 - red
		vscode.window.createTextEditorDecorationType({ color: '#5cb85c' }), // H2 - green
		vscode.window.createTextEditorDecorationType({ color: '#0275d8' }), // H3 - blue
		vscode.window.createTextEditorDecorationType({ color: '#6f42c1' }), // H4 - purple
		vscode.window.createTextEditorDecorationType({ color: '#343a40' }), // H5 - dark
		vscode.window.createTextEditorDecorationType({ color: '#795548' })  // H6 - brown
	];
	context.subscriptions.push(...decorationTypes);

	// When the user runs the command, open a headings doc for the active editor
	context.subscriptions.push(vscode.commands.registerCommand('voiceitems.showHeadingsEditor', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showInformationMessage('No active editor'); return; }
		const doc = editor.document;
		const picks = buildHeadingPicks(doc);
		if (picks.length === 0) { vscode.window.showInformationMessage('No headings found in current document'); return; }

		try {
			// Use the query field to encode the source uri (avoids path parsing/encoding issues)
			const uri = vscode.Uri.from({ scheme: SCHEME, path: '/', query: doc.uri.toString() });
			const headingsDoc = await vscode.workspace.openTextDocument(uri);
			const shown = await vscode.window.showTextDocument(headingsDoc, { preview: false, preserveFocus: false });

			// Build mapping of lines and store reverse mapping
			headingsMap.set(headingsDoc.uri.toString(), { mapping: picks.map(p => p.lineNumber), source: doc.uri });
			let set = sourceToHeadings.get(doc.uri.toString());
			if (!set) { set = new Set<string>(); sourceToHeadings.set(doc.uri.toString(), set); }
			set.add(headingsDoc.uri.toString());

			// Apply decorations per level
			const rangesByLevel: vscode.Range[][] = [[], [], [], [], [], []];
			for (let i = 0; i < picks.length; i++) {
				const level = Math.max(1, Math.min(picks[i].level, 6));
				const line = i; // headingsDoc mirrors picks order
				const lineText = headingsDoc.lineAt(line).text;
				const start = new vscode.Position(line, 0);
				const end = new vscode.Position(line, lineText.length);
				rangesByLevel[level - 1].push(new vscode.Range(start, end));
			}

			for (let lvl = 0; lvl < rangesByLevel.length; lvl++) {
				shown.setDecorations(decorationTypes[lvl], rangesByLevel[lvl]);
			}

			// track last programmatic selection to avoid immediate jump
			let ignoreNextSelection = true;
			const selHandler = vscode.window.onDidChangeTextEditorSelection(async ev => {
				if (ev.textEditor.document.uri.toString() !== headingsDoc.uri.toString()) { return; }
				if (ignoreNextSelection) { ignoreNextSelection = false; return; }
				const activeLine = ev.selections[0].start.line;
				const info = headingsMap.get(headingsDoc.uri.toString());
				if (!info) { return; }
				const targetLine = info.mapping[activeLine];
				if (targetLine === undefined) { return; }
				// Jump to original document
				await vscode.commands.executeCommand('voiceitems.jumpToLine', info.source, targetLine);
			});

			context.subscriptions.push(selHandler);
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to open headings view: ${String(err)}`);
		}
	}));

	// When source document changes, refresh the headings view(s) if open
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(ev => {
		const set = sourceToHeadings.get(ev.document.uri.toString());
		if (!set) { return; }
		for (const docUri of set) {
			provider.refresh(vscode.Uri.parse(docUri));
		}
	}));
}