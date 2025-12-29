
 can we improve the read me file regarding voice commands and can we include these as examples:

 ```talon voice
voice items:
    key(f1)
    sleep(100ms)
    insert("VoiceItems: ")
decrease priority:
    user.vscode("voiceitems.decreasePriority")
increase priority:
    user.vscode("voiceitems.increasePriority")
toggle complete: user.vscode("voiceitems.toggleComplete")
voice items pick: user.vscode("voiceitems.showItemsQuickPick")
voice items search: user.vscode("voiceitems.searchKeyword")
```