# Testing VoiceItems Extension

## Quick Test Steps

1. **Start the extension in debug mode**:
   - Press `F5` to launch Extension Development Host
   - Or use: Run > Start Debugging

2. **Open the sample file**:
   - In the new VS Code window, open `sample.tasks`

3. **Test basic functionality**:
   - Run `VoiceItems: Show Items (Quick Pick)` to show items parsed from the active document
   - Select an item to jump to its line in the editor
   - Use `VoiceItems: Toggle Complete` to mark a task complete/incomplete by passing its URI and line number

4. **Test keyword search**:
   - Run `VoiceItems: Search by Keyword` and enter a term such as `parser`
   - Run `VoiceItems: Show Items (Quick Pick)` to see filtered results
   - Run `VoiceItems: Clear Keyword Filter` to remove the filter

5. **Test editing**:
   - Edit any line in the text editor
   - Run `VoiceItems: Show Items (Quick Pick)` again to verify the updated items

6. **Test with Markdown**:
   - Create a `.md` file with list items:
     ```markdown
     - [ ] Task one #test
     - [x] Task two @project
     ```
   - Run `VoiceItems: Show Items (Quick Pick)` to verify the items are parsed

7. **Test large file warning**:
   - Create a file with > 1000 lines
   - Should see a warning message about performance

10. **Test large file warning**:
    - Create a file with > 1000 lines
    - Should see a warning message about performance

## Expected Behavior

✅ Tree view appears when opening `.tasks`, `.md`, `.txt`, `.list` files
✅ Clicking items jumps to the correct line in the editor
✅ All editing happens in the text editor, not the tree view
✅ Tree auto-refreshes on file changes
✅ Filters, sorts, and groups work correctly
✅ Icons show completion status and priority
✅ Hierarchical items (indented) show as collapsible tree nodes

## Troubleshooting

- **Tree view not appearing**: Check that file has supported extension
- **Items not updating**: Try clicking the Refresh button
- **Jump to line not working**: Check console for errors (Help > Toggle Developer Tools)
