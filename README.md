# ACE Generator

#### Output effect

##### Standard BO4 match

``` wikitext
|M1header=Grand Finals
|M1={{Match|finished=
    |p1=0
    |twitch=|youtube=
    |map1={{Map|date=November 29, 2026 - 19:00 {{Abbr/CST}} |finished=|vod=}}
    |map2={{Map|date=November 29, 2026 - 19:40 {{Abbr/CST}} |finished=|vod=}}
    |map3={{Map|date=November 29, 2026 - 20:20 {{Abbr/CST}} |finished=|vod=}}
    |map4={{Map|date=November 29, 2026 - 21:00 {{Abbr/CST}} |finished=|vod=}}
    |opponent1={{SoloOpponent|Test 1|flag=cn
        |m1={{MS|1|p=10}}|m2={{MS|1|p=20}}|m3={{MS|1|p=20}}|m4={{MS|1|p=30}}
    }}
    |opponent2={{SoloOpponent|Test 2|flag=cn
        |m1={{MS|2|p=7}} |m2={{MS|2|p=14}}|m3={{MS|2|p=14}}|m4={{MS|2|p=21}}
    }}
}}
```

##### BO1 single game

``` wikitext
|M1header=Qualifier
|M1={{Match|finished=
    |p1=0
    |twitch=|youtube=
    |map1={{Map|date=November 29, 2026 - 19:00 {{Abbr/CST}} |finished=|vod=}}
    |opponent1={{SoloOpponent|Test 1|flag=cn
        |m1={{MS|1|p=10}}
    }}
    |opponent2={{SoloOpponent|Test 2|flag=cn
        |m1={{MS|2|p=7}}
    }}
}}
```

##### Games without VOD

``` wikitext
|M1={{Match|finished=
    |p1=0
    |twitch=|youtube=
    |map1={{Map|date=November 29, 2026 - 19:00 {{Abbr/CST}} |finished=}}
    |map2={{Map|date=November 29, 2026 - 19:40 {{Abbr/CST}} |finished=}}
}}
```

##### Qualification

``` wikitext
|M1={{Match|finished=
    |bg=1-10=up,11-48=down
    |p1=0
    |twitch=|youtube=
    |map1={{Map|date=November 29, 2026 - 19:00 {{Abbr/CST}} |finished=|vod=}}
}}
```

##### Finished match

``` wikitext
|M1={{Match|finished=true
    |p1=0
    |twitch=|youtube=
    |map1={{Map|date=November 29, 2026 - 19:00 {{Abbr/CST}} |finished=true|vod=}}
    |map2={{Map|date=November 29, 2026 - 19:40 {{Abbr/CST}} |finished=true|vod=}}
}}
```

##### Space-aligned players (single line)

``` wikitext
    |opponent1={{SoloOpponent|Test 1|flag=cn
        |m1={{MS|1|p=10}}|m2={{MS|1|p=20}}|m3={{MS|1|p=20}}|m4={{MS|1|p=30}}
    }}
    |opponent2={{SoloOpponent|Test 2|flag=cn
        |m1={{MS|2|p=7}} |m2={{MS|2|p=14}}|m3={{MS|2|p=14}}|m4={{MS|2|p=21}}
    }}
```

##### One round per line

``` wikitext
    |opponent1={{SoloOpponent|Test 1|flag=cn
        |m1={{MS|1|p=10}}|m2={{MS|1|p=20}}|m3={{MS|1|p=20}}|m4={{MS|1|p=30}}
        |m5={{MS|1|p=30}}|m6={{MS|1|p=30}}|m7={{MS|1|p=30}}|m8={{MS|1|p=30}}
    }}
```

##### Imported content preserved

``` wikitext
==Results==
{{MatchSchedule
|M1header=Grand Finals
|M1={{Match|finished=
    |p1=0
    |comment=kept comment
    |twitch=|youtube=
}}
}}
|footer=end
```

#### Usage Guide

##### 1. Choose output sections

The **Controls** row holds seven checkboxes. Check only the sections you need; unchecked sections are neither displayed nor exported. The Points checkbox is disabled in the lab stage; points are always preset.

| Control | Output |
| --- | --- |
| Title | `Mxheader` line |
| Match | match status, `\|pX=` and stream placeholders |
| Points | manual `p1`–`p6` fields (disabled in the lab stage) |
| Qualification | `\|bg=` rank segments and statuses |
| Games | dates, statuses and game count |
| VOD | `\|vod=` in every game line and its text field |
| Players | names, regions and per-game ranks |

##### 2. Select the points rule

- **BO1** — one points table for every game (`10 / 7 / 5 / 3 / 2 / 1`).
- **BO4** — four cycling tables: `M1` 10 / 7 / 5 / 3 / 2 / 1, `M2` and `M3` 20 / 14 / 10 / 6 / 4 / 2, `M4` 30 / 21 / 15 / 9 / 6 / 3; the four tables repeat for later games.
- **Add match** appends a new match card.
- Points are recalculated whenever the rule or a rank changes. Custom points are not supported in the lab stage, so the manual Points fields are unavailable.

##### 3. Import a template

- **Template import** — the text area. Paste a match template, or a whole page copied with select-all.
- **Import template** — parses the text and replaces the current match list.
- The arrow next to **Template import** folds or unfolds the text area and buttons.
- **Clear** — empties the text area and its status message.
- Lines the generator does not manage — surrounding templates, headings, comments, extra parameters, `|footer=end`, stream lines with values — are kept in the output. To start empty, leave the box unchanged and use **Add match**.

##### 4. Fill the match header and status

- **Title** sits in the match header and fills `Mxheader`.
- The **Match** dropdown sets `finished=true` only when it is set to **Finished**. Any status change is applied to every game in that match. Changing **Finished** back to **Pending** or **Running** asks for confirmation because reverting a match status may cause the status display of a finished match to be incorrect.
- **Remove match** deletes the match card; when the last one is removed a fresh empty match is created.
- The arrow on the right of the match header folds that match; the arrow on the right of **Player rankings** folds the player table.
- When **Match** is checked, `|pX=` and the stream placeholder line are always emitted, even though those fields have no UI.

##### 5. Fill games and times

- The card actions bar holds **Add / Remove 4 games** (or 1 under BO1), **Add / Remove 6 players**, then two checkboxes: **Auto-fill** and **Halftime break**. The checkbox state is the on/off switch.
- The **Game data** row is styled like **Player rankings**: it holds **Time zone**, **Games**, and the two interval fields, whose visibility is controlled by those toggle buttons.
- **Time zone** is typed per match (for example `CST`) and is emitted as `{{Abbr/CST}}` only after a game time exists.
- When **Auto-fill** is checked, **Auto-fill interval (min)** (1–240) copies the first game time forward; editing a later game recalculates the following games. Unchecking it hides the field and stops automatic filling.
- When **Halftime break** is checked, **Halftime interval (min)** (10 by default) is added to the gap between game 2 and game 3 of every four-game group. Unchecking it hides the field and removes the extra gap.
- The game table has a header row with **Games / Match time / Match status / VOD**. Each row is labelled G1…Gn and the headings are centered.
- The **Game data** row has a fold arrow on its right, matching the player table; **Expand all** and **Collapse all** include it too.
- Each game row has a **datetime-local** picker, a status dropdown and a `×` button that removes that single game. The **VOD** text field is shown only when **VOD** is checked; with it unchecked, `|vod=` is omitted from the output.

##### 6. Fill players

- **Add / Remove 6 players** changes the player count by six; the **Players** number field also accepts a manual value.
- The player table header lists **Player** and **Country/Region** in separate centered columns, with G1…Gn game columns; generated wikitext still uses `|mN=`.
- Each player row has an index, a name, a region code (`cn` by default) and a rank input for every game; points are filled automatically from the preset table.
- The `×` button at the end of a row removes that single player.

##### 7. Navigate and read the notes

The quick navigation bar is pinned to the top while scrolling; the floating button in the lower-right corner returns to the top. The left column holds the notes card and a plain-text block with the project links, **Recent updates**, and the LICENSE link in the project links. The page uses Bootstrap and jQuery.

- `M1…Mn` buttons jump to a match and expand it.
- **Expand all** / **Collapse all** unfold or fold every match and player table at once.
- **↑ Top** returns to the top of the page.
- On narrow screens the notes block is pinned to the top of the page and starts collapsed; click **☰ Notes** to expand it, click again to fold it.
- The notes explain that custom points are not supported in the lab stage, remind that this is an early version, and list the preset points rules.
- **Recent updates** records the latest changes (currently "Fixed some known issues.") and is shown as a plain line without a box.

##### 8. Export and reset

The output updates as you type. The arrow next to **Output** folds or unfolds the result area.

- **Copy** copies the result.
- **Download .txt** saves it as `ACE-template.txt`.
- **Player output** switches between a single line and one round (four games) per line; player columns are always space-aligned.
- **Clear cookies** deletes site cookies and resets the language.
- **Clear local data** clears local storage and resets the language.
- **中文 / EN** switches between Chinese and English. Both reset buttons return the interface to English.

##### Button reference

| Button / control | Where | What it does |
| --- | --- | --- |
| Clear cookies | Header | Deletes cookies for this site and returns to English. |
| Clear local data | Header | Clears local storage and returns to English. |
| 中文 / EN | Header | Switches the interface language. |
| Import template | Template import | Parses pasted text and rebuilds the match list. |
| Clear | Template import | Empties the import box. |
| Add match | Controls | Appends an empty match card. |
| Points rule (BO1 / BO4) | Controls | Selects the preset points table. |
| Seven control checkboxes | Controls | Show / hide and export only chosen sections; Points is disabled in the lab stage. |
| Panel fold arrows | Template import / Output headings | Folds or unfolds that panel's body. |
| VOD checkbox | Controls | Show VOD fields and include `\|vod=` in game lines. |
| Add / Remove 4 games | Match card | Changes game count by four (one under BO1). |
| Auto-fill checkbox | Card actions | Switches automatic time filling and shows / hides its interval field. |
| Halftime break checkbox | Card actions | Switches the extra gap between game 2 and 3 of each four-game group. |
| Add / Remove 6 players | Match card | Changes player count by six. |
| Remove match | Match header | Deletes that match. |
| Fold arrows | Match header / Player rankings | Folds one match or the player table. |
| × | Game / player row | Removes one game or one player. |
| M1…Mn | Top bar | Jumps to a match and expands it. |
| Expand all / Collapse all | Top bar | Folds or unfolds everything at once. |
| ↑ Top | Floating button | Scrolls back to the top. |
| ☰ Notes | Left column (narrow screens) | Expands or folds the notes block pinned to the top. |
| Copy | Output | Copies the generated text. |
| Download .txt | Output | Saves the generated text as a file. |
| Player output | Output | Single line or one round per line. |
