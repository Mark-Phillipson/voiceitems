import * as vscode from 'vscode';
import { ListItemsProvider } from './treeView/listItemsProvider';
import { ParserFactory } from './parsers/parserFactory';

export function activate(context: vscode.ExtensionContext) {
	console.log('VoiceItems extension is now active!');

	const parserFactory = new ParserFactory();
	const listItemsProvider = new ListItemsProvider();
	
	// Register tree view
	const treeView = vscode.window.createTreeView('voiceitems.listView', {
		treeDataProvider: listItemsProvider,
		showCollapseAll: true
	});
	context.subscriptions.push(treeView);

	// Track active editor changes
	const updateTreeView = (editor: vscode.TextEditor | undefined) => {
		if (editor) {
			console.log('Active editor:', editor.document.fileName);
			const isSupported = parserFactory.isSupported(editor.document);
			console.log('Is supported:', isSupported);
			
			if (isSupported) {
				listItemsProvider.setDocument(editor.document);
				console.log('Document set for tree view');
			} else {
				listItemsProvider.setDocument(null);
				console.log('Document not supported');
			}
		} else {
			listItemsProvider.setDocument(null);
			console.log('No active editor');
		}
	};

	// Initialize with current editor
	console.log('Initializing with active editor...');
	const activeEditor = vscode.window.activeTextEditor;
	console.log('Active editor at startup:', activeEditor?.document.fileName || 'none');
	updateTreeView(activeEditor);

	// Also update when visible editors change
	context.subscriptions.push(
		vscode.window.onDidChangeVisibleTextEditors(editors => {
			if (editors.length > 0) {
				updateTreeView(editors[0]);
			}
		})
	);

	// Watch for editor changes
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(updateTreeView)
	);

	// Watch for document changes and refresh
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (listItemsProvider.getCurrentDocument() === event.document) {
				listItemsProvider.refresh();
			}
		})
	);

	// Command: Jump to line in editor
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.jumpToLine', async (uri: vscode.Uri, lineNumber: number) => {
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document, {
				preserveFocus: false,
				preview: false
			});
			
			const position = new vscode.Position(lineNumber, 0);
			editor.selection = new vscode.Selection(position, position);
			editor.revealRange(
				new vscode.Range(position, position),
				vscode.TextEditorRevealType.InCenter
			);
		})
	);

	// Command: Refresh tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.refresh', () => {
			listItemsProvider.refresh();
		})
	);

	// Command: Sort by priority
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.sortByPriority', () => {
			listItemsProvider.setSortMode('priority');
		})
	);

	// Command: Sort alphabetically
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.sortAlpha', () => {
			listItemsProvider.setSortMode('alpha');
		})
	);

	// Command: Sort by completion
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.sortByCompletion', () => {
			listItemsProvider.setSortMode('completion');
		})
	);

	// Command: No sorting (original order)
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.sortNone', () => {
			listItemsProvider.setSortMode('none');
		})
	);

	// Command: Filter - show all
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.filterAll', () => {
			listItemsProvider.setFilterMode('all');
		})
	);

	// Command: Filter - show incomplete only
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.filterIncomplete', () => {
			listItemsProvider.setFilterMode('incomplete');
		})
	);

	// Command: Filter - show completed only
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.filterCompleted', () => {
			listItemsProvider.setFilterMode('completed');
		})
	);

	// Command: Group by priority
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.groupByPriority', () => {
			listItemsProvider.setGroupMode('priority');
		})
	);

	// Command: Group by project
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.groupByProject', () => {
			listItemsProvider.setGroupMode('project');
		})
	);

	// Command: Group by tag
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.groupByTag', () => {
			listItemsProvider.setGroupMode('tag');
		})
	);

	// Command: No grouping
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.groupNone', () => {
			listItemsProvider.setGroupMode('none');
		})
	);

	// Command: Search by keyword
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.searchKeyword', async () => {
			const keyword = await vscode.window.showInputBox({
				prompt: 'Enter keyword to filter items',
				placeHolder: 'keyword...',
				value: listItemsProvider['filterSortService'].getKeywordFilter()
			});
			
			if (keyword !== undefined) {
				if (keyword.trim()) {
					listItemsProvider.setKeywordFilter(keyword.trim());
				} else {
					listItemsProvider.clearKeywordFilter();
				}
			}
		})
	);

	// Command: Clear keyword filter
	context.subscriptions.push(
		vscode.commands.registerCommand('voiceitems.clearKeywordFilter', () => {
			listItemsProvider.clearKeywordFilter();
		})
	);

	// File watcher for supported file types
	const fileWatcher = vscode.workspace.createFileSystemWatcher(
		'**/*.{tasks,todo,task,md,markdown,txt,list}'
	);

	context.subscriptions.push(
		fileWatcher.onDidChange(uri => {
			const currentDoc = listItemsProvider.getCurrentDocument();
			if (currentDoc && currentDoc.uri.toString() === uri.toString()) {
				listItemsProvider.refresh();
			}
		})
	);

	context.subscriptions.push(fileWatcher);
}

export function deactivate() {}
