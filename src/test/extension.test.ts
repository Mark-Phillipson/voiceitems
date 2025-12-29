import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as path from 'path';
import { ParserFactory } from '../parsers/parserFactory';
import { FilterSortService } from '../treeView/filterSortService';
import { registerQuickPickCommands, buildKeywordPicks, buildHeadingPicks } from '../commands/quickPickCommands';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// Helper: create a file in the workspace with given content
	async function makeFile(name: string, content: string): Promise<vscode.Uri> {
		const folders = vscode.workspace.workspaceFolders;
		if (!folders || folders.length === 0) {
			throw new Error('Workspace folder is required for tests');
		}

		const uri = vscode.Uri.joinPath(folders[0].uri, name);
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
		return uri;
	}

	test('filter service returns only incomplete items when filterIncomplete is set', async () => {
		const content = `- [ ] First task !high\n- [x] Done task\n- [ ] Second task @proj`;
		const uri = await makeFile('test-filter.tasks', content);
		const doc = await vscode.workspace.openTextDocument(uri);

		const parser = new ParserFactory().getParser(doc);
		if (!parser) { throw new Error('Parser should be available for test file'); }
		const parseResult = parser.parse(doc);
		const service = new FilterSortService();
		service.setKeywordFilter('');
		const groups = service.transform(parseResult.items, 'incomplete', 'none', 'none');
		const items = groups.get('All Items') || [];
		assert.strictEqual(items.length, 2, 'Should return two incomplete items');
		// cleanup
		await vscode.workspace.fs.delete(uri);
	});

	test('buildKeywordPicks returns lines with highlighted keyword', async () => {
		const content = `First line with apple\nAnother line with Apple pie\nNo match here`;
		const uri = await makeFile('test-keyword.txt', content);
		const doc = await vscode.workspace.openTextDocument(uri);

		const picks = buildKeywordPicks(doc, 'apple');
		assert.strictEqual(picks.length, 2, 'Should find two matching lines');
		assert.ok(picks[0].label.includes('»apple«') || picks[0].label.toLowerCase().includes('apple'), 'Label should highlight the keyword');

		// cleanup
		await vscode.workspace.fs.delete(uri);
	});

	test('buildHeadingPicks returns headings with indentation and highlight markers', async () => {
		const content = `# Top level\nSome intro text\n## Subheading\n### Sub-sub\nAnother line\n# Another top`;
		const uri = await makeFile('test-headings.md', content);
		const doc = await vscode.workspace.openTextDocument(uri);

		const picks = buildHeadingPicks(doc);
		// We expect 4 headings: # Top level, ## Subheading, ### Sub-sub, # Another top
		assert.strictEqual(picks.length, 4, 'Should find 4 headings');
		assert.ok(picks[0].label.includes('»Top level«'), 'First heading should be highlighted');
		assert.ok(picks[1].label.startsWith('  »'), 'Second heading should preserve two-space indentation and highlight');
		assert.ok(picks[2].label.startsWith('    »'), 'Third heading should preserve deeper indentation and highlight');
		assert.strictEqual(picks[3].lineNumber, 5, 'Line number should be the index of the 4th heading (0-based)');

		// cleanup
		await vscode.workspace.fs.delete(uri);
	});

	test('toggleComplete command toggles a checkbox on a line', async () => {
		const content = `- [ ] Flip me`;
		const uri = await makeFile('test-toggle.tasks', content);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Register commands (now operate on documents directly)
		registerQuickPickCommands(({} as unknown) as vscode.ExtensionContext);

		// Execute toggle on line 0
		await vscode.commands.executeCommand('voiceitems.toggleComplete', uri, 0);

		// Re-open document to verify change
		const after = await vscode.workspace.openTextDocument(uri);
		const line = after.lineAt(0).text;
		assert.ok(/\[x\]/i.test(line), 'Line should be checked after toggle');

		// Toggle back to unchecked
		await vscode.commands.executeCommand('voiceitems.toggleComplete', uri, 0);
		const after2 = await vscode.workspace.openTextDocument(uri);
		const line2 = after2.lineAt(0).text;
			assert.strictEqual(line2, '- [ ] Flip me', 'Line should be restored to original unchecked form');

			// cleanup
			await vscode.workspace.fs.delete(uri);
		});

	test('toggleComplete handles variant spacing inside checkbox', async () => {
		const content = `- [  ] Spacing`;
		const uri = await makeFile('test-toggle-spacing.tasks', content);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Register commands (now operate on documents directly)
		registerQuickPickCommands(({} as unknown) as vscode.ExtensionContext);

		// Execute toggle on line 0 (from double-space to checked)
		await vscode.commands.executeCommand('voiceitems.toggleComplete', uri, 0);
		// Re-open document to verify change
		const after = await vscode.workspace.openTextDocument(uri);
		const line = after.lineAt(0).text;
		assert.ok(/\[x\]/i.test(line), 'Line should be checked after toggle from double-space');

		// Toggle back to unchecked
		await vscode.commands.executeCommand('voiceitems.toggleComplete', uri, 0);
		const after2 = await vscode.workspace.openTextDocument(uri);
		const line2 = after2.lineAt(0).text;
		assert.strictEqual(line2, '- [ ] Spacing');

		// cleanup
		await vscode.workspace.fs.delete(uri);
	});

	test('toggleComplete uses active editor current line when no args provided', async () => {
		const content = `- [ ] Active`;
		const uri = await makeFile('test-toggle-active.tasks', content);
		const doc = await vscode.workspace.openTextDocument(uri);
		const editor = await vscode.window.showTextDocument(doc);
		// place cursor at start of line 0
		const pos = new vscode.Position(0, 0);
		editor.selection = new vscode.Selection(pos, pos);

		// Register commands (now operate on documents directly)
		registerQuickPickCommands(({} as unknown) as vscode.ExtensionContext);

		// Call command without args
		await vscode.commands.executeCommand('voiceitems.toggleComplete');

		const after = await vscode.workspace.openTextDocument(uri);
		const line = after.lineAt(0).text;
		assert.ok(/\[x\]/i.test(line), 'Line should be checked when toggling with active editor');

		// Toggle back with no args
		// ensure active editor still selected
		await vscode.commands.executeCommand('voiceitems.toggleComplete');
		const after2 = await vscode.workspace.openTextDocument(uri);
		const line2 = after2.lineAt(0).text;
		assert.strictEqual(line2, '- [ ] Active');

		// cleanup
		await vscode.workspace.fs.delete(uri);
	});

});
