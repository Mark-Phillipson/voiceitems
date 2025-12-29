# VoiceItems

**Maintain and edit lists with voice control via Cursorless extension - apply filters, sorts, and navigate easily.**

VoiceItems provides a sidebar tree view for filtering, sorting, and navigating text-based lists while preserving full Cursorless editing capabilities in the original text editor. Perfect for managing tasks, todo lists, and any structured text files.

## Features

### 📝 Multiple File Format Support
- **`.tasks`/`.todo`/`.task` files**: Checkbox syntax `[ ]` and `[x]`, priority markers `!critical`, `!high`, `!medium`, `!low`
- **Markdown files**: Standard list items with optional task checkboxes `- [ ]` and `- [x]`
- **Plain text files**: Any `.txt` or `.list` file with line-based items
- **Common syntax**: Tags `#tagname`, projects `@projectname` work across all formats

### 🎯 Filtering & Sorting
- **Filter by completion**: Show all, incomplete only, or completed only
- **Sort options**: Priority, alphabetically, completion status, or original order
- **Keyword search**: Find items by text, tags, or projects
- **Smart grouping**: Group by priority, project, or tags

### 🚀 Cursorless-Safe Navigation
- **Read-only tree view**: Navigation only - all editing happens in the original text editor
- **Jump to line**: Click any item to navigate directly to its line in the editor
- **Preserves voice control**: Full Cursorless decorators and targets remain intact
- **Hierarchical display**: Automatic detection of indented sub-items

### ⚡ Performance & Convenience
- **Auto-refresh**: Tree updates automatically when you edit the file
- **Large file warning**: Get notified when files exceed ~1000 lines
- **Keyboard shortcuts**: Quick access to common operations
- **File watching**: Changes are detected and displayed immediately

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
- **Refresh**: `VoiceItems: Refresh` - Manually refresh the tree
- **Sort**: Sort by priority, alphabetically, completion, or original order
- **Filter**: Show all, incomplete only, or completed only
- **Group**: Group items by priority, project, tag, or no grouping
- **Search**: `Ctrl+F` (Mac: `Cmd+F`) when focused on List Items view

### Keyboard Shortcuts
- `Ctrl+F` / `Cmd+F`: Search by keyword (when tree view is focused)
- `Alt+P`: Group by priority (when in tree view)

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