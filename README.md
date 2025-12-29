# VoiceItems

**Maintain and edit lists with voice control via Cursorless extension - apply filters, sorts, and navigate easily.**

VoiceItems provides quick-pick and editor-based navigation for lists in the current document while preserving full Cursorless editing capabilities in the original text editor. Perfect for managing tasks, todo lists, and any structured text files.

## Features

### 📝 Multiple File Format Support
- **`.tasks`/`.todo`/`.task` files**: Checkbox syntax `[ ]` and `[x]`, priority markers `!low`, `!medium`, `!high`, `!critical` (defaults; configurable via the `voiceitems.priorities` setting) 
- **Markdown files**: Standard list items with optional task checkboxes `- [ ]` and `- [x]`
- **Plain text files**: Any `.txt` or `.list` file with line-based items
- **Common syntax**: Tags `#tagname`, projects `@projectname` work across all formats

### 🎯 Keyword Filtering
- **Keyword search**: Find items by text, tags, or projects in the current document

### 🚀 QuickPick & Editor Integration
- **QuickPick**: Show a voice-friendly list of items from the current document
- **Jump to line**: Select an item and jump directly to its line in the editor
- **Toggle complete**: Mark tasks complete/incomplete directly in the editor

### ⚡ Performance & Convenience
- **Large file warning**: Get notified when files exceed ~1000 lines
- **Keyboard shortcuts**: Quick access to common operations (via commands)


## Usage

### Quick Start
1. Open a supported file (`.tasks`, `.md`, `.txt`, etc.)
2. The **List Items** view appears in the Explorer sidebar
3. Use toolbar buttons or commands to filter/sort
4. Click any item to jump to its line in the editor
5. Edit directly in the text editor with full Cursorless support

### Task File Format (`.tasks`)
```
[ ] Incomplete task !high #tag @project
[x] Completed task !medium
  [ ] Nested sub-task
```

### Markdown Format (`.md`)
```markdown
- [ ] Todo item #important
- [x] Done item @myproject
  - [ ] Nested item
```

### Commands
- **Search by keyword**: `VoiceItems: Search by Keyword` — set a filter used by the QuickPick
- **Clear keyword filter**: `VoiceItems: Clear Keyword Filter`
- **Show items (Quick Pick)**: `VoiceItems: Show Items (Quick Pick)` — voice-friendly list selection from the current document
- **Show items by priority**: `VoiceItems: Show Items by Priority` — pick one or more priorities to show matching items in the QuickPick
- **Show incomplete items**: `VoiceItems: Show Incomplete Items` — show only uncompleted tasks in the QuickPick
- **Show completed items**: `VoiceItems: Show Completed Items` — show only completed tasks in the QuickPick
- **Toggle complete**: `VoiceItems: Toggle Complete` — toggle the checkbox on a specified line
- **Show Markdown headings**: `VoiceItems: Show Markdown Headings` — navigate by headings in a Markdown file (highlights headings in the active editor while QuickPick is open; line numbers are not shown)


### Keyboard Shortcuts
- `Ctrl+Alt+F` / `Cmd+Alt+F`: Search by keyword (run command)
- You can bind the QuickPick or Toggle commands to your preferred keys via VS Code keyboard shortcuts.

### Voice tips
- Use **Show Filtered Items** and speak the item number (e.g., "one" or "three") to jump to an item quickly.
- Use **Open Filtered Document** to get a plain editor view containing only matched lines; run **Jump to Original (from Filtered Doc)** on a selected line to navigate back to the source.

### Configuration

- **Priorities**: The list of supported priorities is configurable via the `voiceitems.priorities` setting (ascending order: lowest → highest). By default this extension uses GitHub-style priorities: `low`, `medium`, `high`, `critical`.

## Requirements

- VS Code 1.107.0 or higher
- Optional: [Cursorless](https://marketplace.visualstudio.com/items?itemName=pokey.cursorless) for voice editing

## Known Issues

- Files with more than ~1000 lines may experience performance degradation
- Hierarchical relationships require consistent indentation (2 spaces per level)

## Release Notes

### 0.0.1

Initial release:
- Support for `.tasks`, Markdown, and plain text files
- Filter, sort, and group functionality
- Jump-to-line navigation
- Keyword search
- Auto-refresh on file changes
- Large file warnings

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

##Debugging

To debug your extension, press `F5` to open a new Extension Development Host window. This will launch a new instance of VS Code with your extension loaded. You can set breakpoints and step through your code as needed.

```
code --extensionDevelopmentPath="c:\Users\MPhil\source\repos\MSP_VSCode_Extension\voiceitems\voiceitems" "c:\Users\MPhil\source\repos\MSP_VSCode_Extension\voiceitems\voiceitems\sample.tasks"
```