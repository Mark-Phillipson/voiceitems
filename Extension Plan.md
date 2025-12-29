
But## Plan: Generic List Filtering Tree (Cursorless-Safe)

Sidebar tree for any text-based lists, navigation-only, preserves full Cursorless editing in the original editor. Include keyboard accelerators on main branches and apply a ~1000-line soft cap.

### Steps
1. Implement pluggable parsers for `.tasks` (checkbox/tag), Markdown lists, and plain-line files; capture line numbers, hierarchy, tags, completion, and expose file length to warn at ~1000 lines.
2. Build a read-only tree view with configurable filters/sorts (tags, project sections, completion, alpha) and assign unique accelerator keys to top-level groups (e.g., `Alt+C` critical, `Alt+H` high, `Alt+P` project sections).
3. Add jump-to-line navigation from tree items into the original text editor (no custom editors/webviews), keeping Cursorless decorators/targets intact.
4. Wire file watchers to re-parse on edits and reapply the last active filter/sort automatically; persist filter/sort state per file/workspace.
5. Surface limit handling: show a gentle warning when a file exceeds ~1000 lines and suggest splitting by section/project; keep parsing but caution about performance.
6.  Should also be able to filter or lines by a keyword search.
### Further Considerations
1. Accelerator scope: prefer single-letter mnemonics per main branch; fall back to numeric if collisions arise.
2. Persistence model: store last filter/sort per file vs per workspace; choose one and document defaults.
3. Large files: if over limit, optionally disable expensive sorts (e.g., regex filters) or prompt to split.
