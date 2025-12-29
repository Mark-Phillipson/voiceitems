import * as vscode from 'vscode';
import { registerQuickPickCommands } from './commands/quickPickCommands';

export function activate(context: vscode.ExtensionContext) {
	console.log('VoiceItems extension is now active!');

	// Register basic command: Jump to line in editor
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

	// Register QuickPick commands that operate on current document only
	registerQuickPickCommands(context);

	// Note: Tree view and separate filtered-document functionality have been removed.
}

export function deactivate() {}
