import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Share, Text, TextInput, View } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, Empty, Field, Heading, Label, PickerField, Screen, SearchBar, Segmented, Sheet, ToggleRow, styles } from "../components/ui";
import {
  DURATIONS,
  HISTORY_RANGES,
  LESSON_TYPES,
  OVERALL,
  formatShortDate,
  formatTime,
  isEmptyNote,
  matchesHistoryFilter,
  newId,
  type HistoryRange,
  type Note,
} from "../data";
import type { ScreenProps, Tab } from "../navigation";
import { useStore } from "../store";
import { colors, radius } from "../theme";

export function LessonsScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { notes, setNotes, students, studentById, settings } = useStore();
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

  // From the calendar, `lesson` fills in the note with that lesson's date, type and length.
  function blankNote(studentId?: string, lesson?: { id: string; date: string; type: string; duration: number }): Note {
    return {
      id: newId(),
      studentId: studentId ?? students[0]?.id ?? "",
      date: lesson?.date ?? new Date().toISOString(),
      title: `${lesson?.type ?? "Freestyle"} lesson`,
      lessonType: lesson?.type ?? "Freestyle",
      duration: `${lesson?.duration ?? settings.lessonLength} minutes`,
      lessonId: lesson?.id,
      overall: OVERALL[0],
      focus: "",
      observations: "",
      nextSteps: "",
      skills: [],
      shared: settings.sharedNotes,
    };
  }

  function startNew(studentId?: string, lesson?: { id: string; date: string; type: string; duration: number }) {
    if (!students.length) {
      Alert.alert("Add a student first", "Notes belong to a student. Add one on the Students tab.");
      return;
    }
    setEditing(blankNote(studentId, lesson));
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
        onPress: () => {
          setNotes((current) => current.filter((note) => !selected.includes(note.id)));
          stopSelecting();
        },
      },
    ]);
  }

  function save(note: Note) {
    const saved = { ...note, title: note.title || `${note.lessonType} lesson` };
    setNotes((current) => (current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
    closeEditor();
  }

  function remove(note: Note) {
    Alert.alert("Delete note?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setNotes((current) => current.filter((item) => item.id !== note.id));
          closeEditor();
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

function NoteEditor({
  note,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  note: Note;
  isNew: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: () => void;
}) {
  const { students, studentById, settings } = useStore();
  const [draft, setDraft] = useState<Note>(note);
  const [newSkill, setNewSkill] = useState("");
  const set = (changes: Partial<Note>) => setDraft((current) => ({ ...current, ...changes }));
  const studentIds = students.map((student) => student.id);
  const studentName = studentById(draft.studentId)?.name ?? "Removed student";
  // A note written for a calendar lesson shows the lesson's details (student, date, type, length) read-only.
  // Those are changed on the lesson (Calendar > Lesson details > Edit), and the note follows (syncLessonNote).
  // Notes not tied to a lesson keep these fields editable.
  const fromLesson = Boolean(draft.lessonId);

  function addSkill() {
    const skill = newSkill.trim();
    if (skill && !draft.skills.includes(skill)) set({ skills: [...draft.skills, skill] });
    setNewSkill("");
  }

  function sharePreview() {
    const body: string[] = [];
    if (draft.focus) body.push(`Focus: ${draft.focus}`);
    if (draft.observations) body.push(`Coach observations: ${draft.observations}`);
    if (draft.skills.length) body.push(`Skills: ${draft.skills.join(", ")}`);
    if (draft.nextSteps) body.push(`Next steps: ${draft.nextSteps}`);
    const lines = [
      `${studentName} · ${formatShortDate(draft.date)}`,
      `${draft.lessonType} · ${draft.duration}`,
      "",
      ...body,
      "",
      `— ${settings.coachName}, via SkatePod`,
    ];
    Share.share({ message: lines.join("\n") }).catch(() => {});
  }

  return (
    <Sheet
      footer={
        <>
          {!isNew ? <Button label="Delete" onPress={onDelete} style={{ flex: 1 }} variant="danger" /> : null}
          <Button icon="share" label="Share" onPress={sharePreview} style={{ flex: 1 }} variant="secondary" />
          <Button label="Save note" onPress={() => onSave(draft)} style={{ flex: 1.3 }} />
        </>
      }
      onClose={onClose}
      title={isNew ? "New lesson note" : studentName}
      visible
    >
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>
        {new Date(draft.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </Text>

      {fromLesson ? (
        <View style={{ marginBottom: 16, padding: 12, borderRadius: radius.md, backgroundColor: colors.tealSoft }}>
          <Label>Lesson</Label>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{studentName}</Text>
          <Text style={{ fontSize: 13, color: colors.body, marginTop: 3 }}>
            {draft.lessonType} · {draft.duration}
          </Text>
        </View>
      ) : (
        <>
          {studentIds.length ? (
            <PickerField
              label="Student"
              onChange={(studentId: string) => set({ studentId })}
              options={studentIds}
              renderLabel={(id) => studentById(id)?.name ?? id}
              value={studentIds.includes(draft.studentId) ? draft.studentId : studentIds[0]}
            />
          ) : null}
          <PickerField
            label="Lesson type"
            onChange={(lessonType: string) => set({ lessonType, title: `${lessonType} lesson` })}
            options={LESSON_TYPES}
            value={draft.lessonType}
          />
          <PickerField
            label="Duration"
            onChange={(duration: string) => set({ duration })}
            options={DURATIONS.includes(draft.duration) ? DURATIONS : [...DURATIONS, draft.duration]}
            value={draft.duration}
          />
        </>
      )}
      <PickerField label="Overall session" onChange={(overall: string) => set({ overall })} options={OVERALL} value={draft.overall} />

      <Field label="Session focus" onChangeText={(focus) => set({ focus })} placeholder="Skills, program sections, or goals covered..." value={draft.focus} />
      <Field
        label="Coach observations"
        multiline
        onChangeText={(observations) => set({ observations })}
        placeholder="What improved? What needs more attention?"
        rows={5}
        value={draft.observations}
      />

      <Label>Skills worked on</Label>
      <View style={{ borderWidth: 1, borderColor: colors.input, borderRadius: radius.md, padding: 10, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: draft.skills.length ? 10 : 0 }}>
          {draft.skills.map((skill) => (
            <Pressable
              accessibilityLabel={`Remove ${skill}`}
              accessibilityRole="button"
              key={skill}
              onPress={() => set({ skills: draft.skills.filter((item) => item !== skill) })}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.tealSoft, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f6f74" }}>{skill}</Text>
              <Icon color="#3f6f74" name="close" size={11} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            onChangeText={setNewSkill}
            onSubmitEditing={addSkill}
            placeholder="Add a skill, e.g. Axel"
            placeholderTextColor={colors.faint}
            returnKeyType="done"
            style={[styles.input, { flex: 1, paddingVertical: 8 }]}
            value={newSkill}
          />
          <Button label="Add" onPress={addSkill} variant="secondary" />
        </View>
      </View>

      <Field
        label="Next steps & practice assignment"
        multiline
        onChangeText={(nextSteps) => set({ nextSteps })}
        placeholder="What should the student work on before the next lesson?"
        rows={4}
        value={draft.nextSteps}
      />

      <View style={{ borderWidth: 1, borderColor: colors.input, borderRadius: radius.md, backgroundColor: "#fafbfc", paddingHorizontal: 14 }}>
        <ToggleRow
          description="This note will appear in their read-only progress link."
          label="Include in student’s shared history"
          onChange={(shared) => set({ shared })}
          value={draft.shared}
        />
      </View>
    </Sheet>
  );
}

// "Thu, Nov 5 · 9:00 AM": the day and start time of a lesson in the history.
function whenOf(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${formatTime(date.getHours() * 60 + date.getMinutes())}`;
}
