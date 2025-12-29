
Implemented: Added QuickPick commands

- `voiceitems.showPriorityItems` — prompts to pick one or more priorities (from `voiceitems.priorities`) and shows matching items in the QuickPick.
- `voiceitems.showIncompleteItems` — shows only uncompleted tasks in the QuickPick.
- `voiceitems.showCompletedItems` — shows only completed tasks in the QuickPick.

Also added a helper `buildPriorityPicks(document, priorities)` (exported) and unit tests for it.

