# UI test findings (Nov 7, 2026)

What the first runs of the Maestro UI suite (`mobile/.maestro`, run with `sh run-ui-tests.sh`) turned up on the iPhone 18 Pro Simulator (iOS 27) in Expo Go. Each item says where it is and how to see it. Han reviews these and decides what becomes a fix. Each one is a Highest-priority Bug in SKATE Sprint 1 (label `ui-tests`); the suite itself is story SKATE-81.

**Bug** = something doesn't work as it should. **Confusing** = it works, but a coach could easily misunderstand it.

## Bugs

### 1. Student and day chips are cut off in the lesson editor (SKATE-82)
- **Where:** Calendar → Add lesson (also tap an empty time, or Edit). The same chip rows are on Lessons → Add a past lesson.
- **Steps:** Open the lesson editor with the sample data.
- **What happens:** The Student row shows Emma, Lily, Jonah and half of "Sofia Ch…". Noah and Amelia are off the right edge, and so is **SUN** in the Day row. Nothing shows the row scrolls. A short swipe on a chip selects that student instead of scrolling (the test needed a long swipe to reach Amelia).
- **Expected:** Every student and every day can be seen and picked. CLAUDE.md says to use `Dropdown` for student pickers; these screens still use chips (`PickerField`).
- **Code:** `CalendarScreen.tsx` `LessonEditor` (Student, Day), `LessonsScreen.tsx` `NoteEditor` (Student, Overall session also runs off the edge).

### 2. Export backup leaves out availability blocks (SKATE-83)
- **Where:** Settings → Export backup.
- **What happens:** The backup has students, lessons, notes, programs and settings, but not availability blocks (`skatepod.availability.v1`). A coach who restores from it would lose their rinks and times. The share preview also shows raw JSON ("{"), and there is no import yet.
- **Code:** `SettingsScreen.tsx` `exportBackup`.

### 3. Closing a note with the X throws away what you typed, without asking (SKATE-84)
- **Where:** Lessons → any lesson, or Add a past lesson.
- **Steps:** Type observations, then tap the X at the top instead of Save note.
- **What happens:** The sheet closes and the text is gone. There's no "Discard changes?" question and no Cancel button, so X looks like "done".
- **Code:** `LessonsScreen.tsx` `closeEditor` (found reading the code while writing the test; worth a quick check on the phone).
- **Fixed (branch `fix/SKATE-84-discard-note-changes`):** the X now asks "Discard changes?" with Cancel and Discard when something changed (`noteHasChanges` in `data.ts`); with no changes it closes straight away. Covered in `06-lessons-history.yaml`.

### 4. "New program" doesn't start a new program (SKATE-85)
- **Where:** Programs → New program (header button).
- **What happens:** It warns "This clears Emma Miller's current program", but after "Start new" the same 4 starter elements (and "Untitled program") come back, so it looks like nothing happened. Every student also shows those 4 starter elements before the coach adds anything, while the student's profile says **Program: Not started**.
- **Expected:** Decide one of: a new program starts empty, or the starter elements are clearly marked as an example. The profile and Programs tab should agree.
- **Code:** `data.ts` `DEFAULT_PROGRAM` (`elements: STARTER_ELEMENTS`), `ProgramsScreen.tsx` intent `add`, `StudentsScreen.tsx` "Program" row.

## Confusing points

### 5. "Lesson reminders" switch does nothing (SKATE-86)
Settings → Workflow → Lesson reminders ("Show reminders before scheduled lessons"). Nothing in the app reads `settings.reminders`, so no reminder ever appears. Hide it or mark it "coming soon" until reminders exist.

### 6. "Shared history" promises a link that doesn't exist (SKATE-87)
The note's switch says "This note will appear in their read-only progress link", and Settings has "Share notes by default". There's no progress link yet, so the switch has no visible effect.

### 7. Settings are lost if you leave without "Save settings" (SKATE-88)
Change the coach name, then tap Home: the change is gone with no warning. The Save button is at the bottom, below the fold. Programs saves as you type, so the two screens behave differently.

### 8. Duration number pad has no way to close it (SKATE-89)
Calendar → lesson editor → Duration (minutes) opens a number pad with no Return or Done key. You have to tap somewhere else to close it. Also, clearing the box or typing 0 keeps the old duration silently (the box shows blank but the lesson saves with the previous length).

### 9. VoiceOver reads whole cards as one long label (SKATE-90)
Student rows, Dashboard cards, calendar lesson blocks and day buttons are each read as one run-on label (e.g. "Noah Bennett, Adult Gold · Adult Freeskate, Adult Silver · Adult Skills, Not scheduled"). It works, but it's long, and the tests have to match names inside the label. Give each card a short `accessibilityLabel` (for example "Noah Bennett, next lesson not scheduled").

## Checked by hand (not automated)

- **Export backup** opens the iOS share sheet. The share sheet runs outside the app, where Maestro can't see it.
- **Dragging and resizing lessons, the time wheels and the rink map** aren't in the suite yet. Maestro can't reliably do long-press-and-drag on React Native's PanResponder or turn iOS picker wheels. Try these on the phone after changes to the calendar or programs.
