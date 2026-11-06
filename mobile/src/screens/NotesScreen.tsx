import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Share, Text, TextInput, View } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, Empty, Field, Heading, Label, PickerField, Screen, SearchBar, Sheet, ToggleRow, styles } from "../components/ui";
import { DURATIONS, LESSON_TYPES, OVERALL, formatShortDate, newId, type Note } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, radius } from "../theme";

export function NotesScreen({ intent, onIntentHandled }: ScreenProps) {
  const { notes, setNotes, students, studentById, settings } = useStore();
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);

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

  const visible = useMemo(
    () =>
      [...notes]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((note) => !studentFilter || note.studentId === studentFilter)
        .filter((note) => {
          const name = studentById(note.studentId)?.name ?? "";
          return `${name} ${note.title} ${note.observations} ${note.focus}`.toLowerCase().includes(search.toLowerCase());
        }),
    [notes, studentFilter, search, studentById],
  );

  function save(note: Note) {
    const saved = { ...note, title: note.title || `${note.lessonType} lesson` };
    setNotes((current) => (current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
    setEditing(null);
  }

  function remove(note: Note) {
    Alert.alert("Delete note?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setNotes((current) => current.filter((item) => item.id !== note.id));
          setEditing(null);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading description="Capture useful feedback, next steps, and progress after every session." eyebrow="Training history" title="Lesson notes" />

      <View style={{ gap: 10, marginBottom: 16 }}>
        <SearchBar onChangeText={setSearch} placeholder="Search notes..." value={search} />
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
      </View>

      <Button icon="plus" label="New lesson note" onPress={() => startNew(studentFilter ?? undefined)} style={{ marginBottom: 16 }} />

      {visible.length ? (
        <Card style={{ padding: 0 }}>
          {visible.map((note, index) => (
            <Pressable
              accessibilityRole="button"
              key={note.id}
              onPress={() => setEditing(note)}
              style={({ pressed }) => [
                { padding: 14, borderTopWidth: index ? 1 : 0, borderTopColor: colors.borderSoft },
                pressed && { backgroundColor: "#f1f7f7" },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{studentById(note.studentId)?.name ?? "Removed student"}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted }}>{formatShortDate(note.date)}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#596976", marginTop: 4 }}>{note.title}</Text>
              <Text numberOfLines={2} style={{ fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 4 }}>
                {note.observations || "Draft lesson note"}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : (
        <Empty text={search || studentFilter ? "No notes match." : "No notes yet. Write your first one after a lesson."} />
      )}

      {editing ? (
        <NoteEditor
          isNew={!notes.some((note) => note.id === editing.id)}
          note={editing}
          onClose={() => setEditing(null)}
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
      <PickerField label="Duration" onChange={(duration: string) => set({ duration })} options={DURATIONS} value={draft.duration} />
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
