import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Share, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { NoteEditor, blankNote } from "../components/NoteEditor";
import { Button, Card, Empty, Heading, PickerField, Screen, SearchBar, Segmented } from "../components/ui";
import {
  HISTORY_RANGES,
  formatTime,
  isEmptyNote,
  matchesHistoryFilter,
  type HistoryRange,
  type Note,
} from "../data";
import type { ScreenProps, Tab } from "../navigation";
import { useStore } from "../store";
import { colors } from "../theme";

export function LessonsScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { notes, saveNote, deleteNotes, students, studentById, settings } = useStore();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<HistoryRange>("Last 30 days");
  const [level, setLevel] = useState<string | null>(null);
  // Select mode: tick several lessons to share or delete them together.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [studentFilter, setStudentFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  // Where to go when the editor closes, if it was opened from another screen (e.g. the Calendar).
  const [returnTo, setReturnTo] = useState<Tab | null>(null);
  function closeEditor() {
    setEditing(null);
    if (returnTo) {
      setReturnTo(null);
      navigate(returnTo);
    }
  }

  function startNew(studentId?: string, lesson?: { id: string; date: string; type: string; duration: number }) {
    if (!students.length) {
      Alert.alert("Add a student first", "Notes belong to a student. Add one on the Students tab.");
      return;
    }
    setEditing(blankNote(settings, studentId ?? students[0]?.id ?? "", lesson));
  }

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") startNew();
    if ((intent.kind === "newNote" || intent.kind === "openNote") && intent.returnTo) setReturnTo(intent.returnTo);
    if (intent.kind === "newNote") startNew(intent.studentId, intent.lesson);
    // The calendar found a note already written for that lesson: open it so the coach can add to it.
    if (intent.kind === "openNote") {
      const existing = notes.find((note) => note.id === intent.noteId);
      if (existing) setEditing(existing);
    }
    if (intent.kind === "filterNotes") setStudentFilter(intent.studentId);
    onIntentHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  // Every level any student is at, for the level filter.
  const levels = useMemo(
    () => [...new Set(students.flatMap((student) => student.disciplines.map((item) => item.level)))],
    [students],
  );

  const visible = useMemo(() => {
    const now = new Date();
    return [...notes]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((note) => !studentFilter || note.studentId === studentFilter)
      .filter((note) => matchesHistoryFilter(note, studentById(note.studentId), { name: search, range, level }, now));
  }, [notes, studentFilter, search, range, level, studentById]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }
  function stopSelecting() {
    setSelecting(false);
    setSelected([]);
  }

  function shareSelected() {
    const picked = visible.filter((note) => selected.includes(note.id));
    const message = picked
      .map((note) =>
        [
          `${studentById(note.studentId)?.name ?? "Student"} · ${whenOf(note.date)}`,
          `${note.lessonType} · ${note.duration}`,
          isEmptyNote(note) ? "No notes" : [note.focus && `Focus: ${note.focus}`, note.observations, note.nextSteps && `Next: ${note.nextSteps}`].filter(Boolean).join("\n"),
        ].join("\n"),
      )
      .join("\n\n");
    Share.share({ message: `${message}\n\n— ${settings.coachName}, via SkatePod` }).catch(() => {});
  }

  function deleteSelected() {
    Alert.alert(`Delete ${selected.length} ${selected.length === 1 ? "lesson" : "lessons"}?`, "They're removed from the training history, with their notes. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteNotes(selected); // tells the coach if some couldn't be deleted
          stopSelecting();
        },
      },
    ]);
  }

  // If the backend says no, the editor stays open so nothing typed is lost.
  async function save(note: Note) {
    const saved = await saveNote({ ...note, title: note.title || `${note.lessonType} lesson` });
    if (saved) closeEditor();
  }

  function remove(note: Note) {
    Alert.alert("Delete note?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (await deleteNotes([note.id])) closeEditor();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading
        description="Every lesson from your calendar lands here once it starts, with or without notes. Tap one to add or read its notes."
        eyebrow="Training history"
        title="Lessons"
      />

      <View style={{ gap: 10, marginBottom: 12 }}>
        <SearchBar onChangeText={setSearch} placeholder="Filter by student name..." value={search} />
        {studentFilter ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setStudentFilter(null)}
            style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.tealDark }}>{studentById(studentFilter)?.name ?? "Student"}</Text>
            <Icon color={colors.tealDark} name="close" size={12} />
          </Pressable>
        ) : null}
        <Segmented onChange={setRange} options={HISTORY_RANGES} value={range} />
      </View>
      {levels.length ? (
        <PickerField
          label="Level"
          onChange={(value: string) => setLevel(value === "All levels" ? null : value)}
          options={["All levels", ...levels]}
          value={level ?? "All levels"}
        />
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.subtle }}>
          {selecting ? `${selected.length} selected` : `${visible.length} ${visible.length === 1 ? "lesson" : "lessons"}`}
        </Text>
        <Button
          label={selecting ? "Cancel" : "Select"}
          onPress={() => (selecting ? stopSelecting() : setSelecting(true))}
          style={{ minHeight: 32, paddingVertical: 6, paddingHorizontal: 12 }}
          variant="secondary"
        />
      </View>
      {!selecting ? (
        <Button icon="plus" label="Add a past lesson" onPress={() => startNew(studentFilter ?? undefined)} style={{ marginBottom: 12 }} variant="secondary" />
      ) : null}
      {selecting ? (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <Button
            label={selected.length === visible.length ? "Clear all" : "Select all"}
            onPress={() => setSelected(selected.length === visible.length ? [] : visible.map((note) => note.id))}
            style={{ flex: 1 }}
            variant="secondary"
          />
          <Button disabled={!selected.length} icon="share" label="Share" onPress={shareSelected} style={{ flex: 1 }} variant="secondary" />
          <Button disabled={!selected.length} label="Delete" onPress={deleteSelected} style={{ flex: 1 }} variant="danger" />
        </View>
      ) : null}

      {visible.length ? (
        <Card style={{ padding: 0 }}>
          {visible.map((note, index) => {
            const empty = isEmptyNote(note);
            const ticked = selected.includes(note.id);
            return (
              <Pressable
                accessibilityRole={selecting ? "checkbox" : "button"}
                accessibilityState={selecting ? { checked: ticked } : undefined}
                key={note.id}
                onPress={() => (selecting ? toggle(note.id) : setEditing(note))}
                style={({ pressed }) => [
                  { flexDirection: "row", gap: 12, padding: 14, borderTopWidth: index ? 1 : 0, borderTopColor: colors.borderSoft },
                  (pressed || ticked) && { backgroundColor: "#f1f7f7" },
                ]}
              >
                {selecting ? (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: ticked ? colors.teal : colors.border,
                      backgroundColor: ticked ? colors.teal : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                    }}
                  >
                    {ticked ? <Icon color={colors.white} name="check" size={13} /> : null}
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{studentById(note.studentId)?.name ?? "Removed student"}</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted }}>{whenOf(note.date)}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#596976", marginTop: 4 }}>
                    {note.lessonType} · {note.duration}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 4, fontStyle: empty ? "italic" : "normal" }}
                  >
                    {empty ? "No notes yet" : note.observations || note.focus || note.nextSteps || note.skills.join(", ")}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Empty
          text={
            search || studentFilter || level || range !== "All"
              ? "No lessons match these filters."
              : "No lessons yet. Lessons from your calendar show up here once they start."
          }
        />
      )}

      {editing ? (
        <NoteEditor
          isNew={!notes.some((note) => note.id === editing.id)}
          note={editing}
          onClose={closeEditor}
          onDelete={() => remove(editing)}
          onSave={save}
        />
      ) : null}
    </Screen>
  );
}

// "Thu, Nov 5 · 9:00 AM": the day and start time of a lesson in the history.
function whenOf(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${formatTime(date.getHours() * 60 + date.getMinutes())}`;
}
