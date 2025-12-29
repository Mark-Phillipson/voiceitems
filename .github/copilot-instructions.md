# VoiceItems Extension - Copilot Instructions

## Project Overview

**VoiceItems** is a VS Code extension designed to maintain and edit lists with voice control via the Cursorless extension. It provides a tree view sidebar for filtering and sorting text-based lists (tasks, markdown, plain text) while preserving full Cursorless editing capabilities in the original text editor.

**Key Architecture Decision**: This extension uses a read-only tree view for navigation that jumps directly to line numbers in the original text editor. This approach avoids custom editors/webviews, keeping Cursorless decorators and voice targets intact for accessibility.

## Build & Development Workflow

### Build System
- **Dual-watch setup**: Uses `npm-run-all` to run TypeScript type checking (`tsc --noEmit --watch`) and esbuild bundling in parallel
- **Entry point**: `src/extension.ts` bundles to `dist/extension.js` (CommonJS format)
- **Watch mode**: Run `npm run watch` (or use the VS Code task `watch`) - this is the primary development workflow
  - Watches both TypeScript types and esbuild compilation simultaneously
  - Type checking does NOT block bundling (esbuild compiles even with type errors)

### Development Commands
```bash
npm run watch          # Start dual-watch mode (recommended for development)
npm run compile        # One-time build with type checking and linting
npm run package        # Production build (minified, no sourcemaps)
npm run lint           # Run ESLint on src/
npm run test           # Run tests (compiles tests to out/)
```

### Testing
- Test files: `src/test/extension.test.ts`
- Tests compile to `out/` directory (separate from bundled extension)
- Use `@vscode/test-electron` for running extension tests
- Run via: `npm run test` or `npm run watch-tests` for continuous testing

## Project Structure & Conventions

### File Organization
```
src/
  extension.ts           # Main activation/deactivation entry point
  test/
    extension.test.ts    # Extension tests
dist/
  extension.js          # Bundled output (gitignored)
out/                    # Compiled tests (gitignored)
```

### TypeScript Configuration
- **Module system**: Node16 (ESM-aware)
- **Target**: ES2022
- **Strict mode**: Enabled
- **Source root**: `src/` directory only
- Type checking runs independently from bundling

### Code Style (ESLint)
- **Naming convention**: `camelCase` or `PascalCase` for imports
- **Required**: curly braces for control statements, strict equality (`===`), semicolons
- **Warnings only**: All rules are set to "warn" not "error"

## Extension Implementation Patterns

### Activation
- **Activation events**: Currently empty array (activates on any VS Code action)
- Register commands and tree views in `activate(context: vscode.ExtensionContext)`
- Push disposables to `context.subscriptions` for cleanup

### Command Registration Example
```typescript
const disposable = vscode.commands.registerCommand('voiceitems.helloWorld', () => {
  vscode.window.showInformationMessage('Hello World from VoiceItems!');
});
context.subscriptions.push(disposable);
```

## Planned Features (Extension Plan.md)

### Core Functionality
1. **Pluggable Parsers**: Support `.tasks` (checkbox/tag), Markdown lists, plain-line files
   - Capture: line numbers, hierarchy, tags, completion status
   - Expose file length warnings at ~1000 lines

2. **Tree View**: Read-only sidebar with:
   - Configurable filters/sorts (tags, project sections, completion, alphabetical)
   - Keyboard accelerators for top-level groups (e.g., `Alt+C` for critical, `Alt+H` for high priority)
   - Keyword search filtering

3. **Navigation**: Jump-to-line from tree → original text editor
   - **Critical**: Never use custom editors/webviews to preserve Cursorless functionality

4. **File Watching**: Auto-reparse on edits, persist filter/sort state per file/workspace

5. **Large File Handling**: Warn at ~1000 lines, suggest splitting by section/project

## Key Implementation Constraints

- **Cursorless Compatibility**: All editing must happen in the standard text editor to maintain voice control decorators
- **Navigation-Only Tree**: Tree view is strictly for filtering/sorting/navigation, not editing
- **Performance Boundary**: ~1000 line soft cap; disable expensive operations beyond this
- **State Persistence**: Store last filter/sort per file and workspace settings

## Dependencies & Integration

### External Dependencies
- **vscode**: Core VS Code API (externalized in esbuild, not bundled)
- **Cursorless**: External extension dependency (mentioned in description but not formal dependency yet)

### Dev Dependencies
- TypeScript 5.9.3 with typescript-eslint 8.48.1
- esbuild 0.27.1 for fast bundling
- npm-run-all for parallel script execution
- Mocha + @vscode/test-electron for testing

## Common Tasks for AI Agents

### Adding a New Command
1. Define command in `package.json` → `contributes.commands`
2. Implement handler in `src/extension.ts` → `activate()`
3. Register with `vscode.commands.registerCommand()`
4. Push disposable to `context.subscriptions`

### Adding a Tree View
1. Create a `TreeDataProvider<T>` implementation
2. Register with `vscode.window.createTreeView()` or `vscode.window.registerTreeDataProvider()`
3. Define view in `package.json` → `contributes.views`
4. Implement `getChildren()`, `getTreeItem()`, and optional `refresh()` methods

### File Watching Pattern
Use `vscode.workspace.createFileSystemWatcher()` for detecting changes to specific file patterns, then trigger re-parsing/refresh of tree view.

### Jump to Line Pattern
```typescript
const editor = await vscode.window.showTextDocument(document);
const position = new vscode.Position(lineNumber, 0);
editor.selection = new vscode.Selection(position, position);
editor.revealRange(new vscode.Range(position, position));
```

---

*Last updated: Based on early-stage codebase analysis (v0.0.1)*
