# ACE Generator

#### Usage Guide

##### 1. Choose output sections

The **Controls** row holds five checkboxes. Check only the sections you need; unchecked sections are neither displayed nor exported.

| Control | Output |
| --- | --- |
| Title | `Mxheader` line |
| Match | match status, `\|pX=` and stream placeholders |
| Points | manual `p1`–`p6` fields |
| Games | dates, VODs and game count |
| Players | names, regions and per-game ranks |

##### 2. Select the points rule

**BO1** uses one points table for every game. **BO4** changes game counts in groups of four and uses four cycling tables; points are recalculated whenever the rule or a rank changes. The manual Points fields stay hidden unless **Points** is checked.

##### 3. Import a template

Paste a match template into **Template import** and click **Import template**. Importing replaces the current match list. To start empty, leave the box unchanged and use **Add match**.

##### 4. Fill the match header and status

**Title** fills `Mxheader`. The **Match** dropdown sets `finished=true` only when it is set to **Finished**. When **Match** is checked, `|pX=` and the stream placeholder line are always emitted, even though those fields have no UI.

##### 5. Fill games and times

**Add / Remove 4 games** (or 1 under BO1) changes the game count; the manual count field also works. Enter the first game time — **Auto-fill next** copies it forward by **Interval (min)**, and editing a later game recalculates the following games. **Time zone** is typed per match and is emitted only after a game time exists.

##### 6. Fill players

**Add / Remove 6 players** changes the player count by six; the manual count field also works. Enter each player's name, region and rank for every game.

##### 7. Fold and navigate

The arrow on the right of each match header folds that match; the arrow on the right of **Player rankings** folds the player table. The quick navigation bar jumps to `M1…Mn` and expands the target, or expands / collapses everything at once.

##### 8. Export and reset

The output updates as you type. **Copy** copies it and **Download .txt** saves it. **Clear cookies** and **Clear local data** reset browser state; both return the interface to English. The header button switches between English and Chinese
