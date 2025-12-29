# Testing VoiceItems Extension

## Quick Test Steps

1. **Start the extension in debug mode**:
   - Press `F5` to launch Extension Development Host
   - Or use: Run > Start Debugging

2. **Open the sample file**:
   - In the new VS Code window, open `sample.tasks`
   - The "List Items" view should appear in the Explorer sidebar

3. **Test basic functionality**:
   - Click on any item in the tree to jump to its line
   - Try the toolbar buttons to sort/filter/group
   - Use `Ctrl+F` in the tree view to search by keyword

4. **Test filters**:
   - Click "Show Incomplete Only" - should hide completed items
   - Click "Show Completed Only" - should show only [x] items
   - Click "Show All Items" - restore all

5. **Test sorting**:
   - Click "Sort by Priority" - items should order by !critical, !high, !medium, !low
   - Click "Sort Alphabetically" - items should sort A-Z
   - Click "Original Order" - restore file order

6. **Test grouping**:
   - Click "Group by Priority" - items should be organized under Critical, High, Medium, Low sections
   - Click "Group by Project" - items should be organized by @project tags
   - Click "Group by Tag" - items should be organized by #tags
   - Click "No Grouping" - restore flat list

7. **Test keyword search**:
   - Click the search icon or press `Ctrl+F`
   - Type "parser" - should show only items containing that word
   - Clear the filter to restore all items

8. **Test editing**:
   - Edit any line in the text editor
   - The tree view should auto-refresh
   - Jump to line should still work after edits

9. **Test with Markdown**:
   - Create a `.md` file with list items:
     ```markdown
     - [ ] Task one #test
     - [x] Task two @project
     ```
   - Tree view should parse and display these items

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
