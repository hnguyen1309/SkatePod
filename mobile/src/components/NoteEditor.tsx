import DateTimePicker from "@react-native-community/datetimepicker";
import { useState, type MutableRefObject } from "react";
import { Alert, Pressable, Share, Text, TextInput, View } from "react-native";
import { DURATIONS, OVERALL, formatShortDate, newId, noteHasChanges, type Note, type Settings } from "../data";
import { useStore } from "../store";
import { colors, radius } from "../theme";
import { Icon } from "./Icon";
import { Button, Dropdown, Field, Label, LessonTypePicker, PickerField, Sheet, SheetPage, ToggleRow, styles } from "./ui";

/** A new, empty note. From the calendar, `lesson` fills in that lesson's date, type and length. */
export function blankNote(
  settings: Pick<Settings, "lessonLength" | "sharedNotes">,
  studentId: string,
  lesson?: { id: string; date: string; type: string; duration: number },
): Note {
  return {
    id: newId(),
    studentId,
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

/**
 * The lesson note editor. On the Lessons tab it's its own sheet. On a student's profile it's `inline`:
 * a page that slides in over the profile inside the same sheet (see `PushedPage`), with a back arrow,
 * so nothing closes or switches tabs. `closeRef` lets the profile sheet ask it to close (e.g. when the
 * coach swipes the whole sheet down) so unsaved changes still get the "Discard changes?" question.
 */
export function NoteEditor({
  note,
  isNew,
  onClose,
  onSave,
  onDelete,
  inline = false,
  closeRef,
}: {
  note: Note;
  isNew: boolean;
  onClose: () => void;
  onSave: (note: Note) => Promise<void>; // may wait for the backend
  onDelete: () => void;
  inline?: boolean;
  closeRef?: MutableRefObject<(() => void) | null>;
}) {
  const { students, studentById, settings } = useStore();
  const [draft, setDraft] = useState<Note>(note);
  // True while the backend is saving, so a second tap doesn't add the note twice.
  const [saving, setSaving] = useState(false);
  async function saveDraft() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }
  const [newSkill, setNewSkill] = useState("");
  const set = (changes: Partial<Note>) => setDraft((current) => ({ ...current, ...changes }));
  const studentIds = students.map((student) => student.id);
  const studentName = studentById(draft.studentId)?.name ?? "Removed student";
  // A note written for a calendar lesson shows the lesson's details (student, date, type, length) read-only.
  // Those are changed on the lesson (Calendar > Lesson details > Edit), and the note follows (syncLessonNote).
  // Notes not tied to a lesson keep these fields editable.
  const fromLesson = Boolean(draft.lessonId);
  const [pickingDate, setPickingDate] = useState(false);

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

  // The X (and swiping the sheet down) closes without saving. If the coach changed anything,
  // including a skill typed in the box but not added yet, ask first so typed notes aren't lost by accident.
  // Cancel keeps the editor open with everything as it was; Discard closes it and drops the changes.
  function closeWithoutSaving() {
    if (!noteHasChanges(note, draft) && !newSkill.trim()) {
      onClose();
      return;
    }
    Alert.alert("Discard changes?", "What you changed in this note won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onClose },
    ]);
  }

  if (closeRef) closeRef.current = closeWithoutSaving;

  const Container = inline ? SheetPage : Sheet;
  return (
    <Container
      footer={
        <>
          {!isNew ? <Button label="Delete" onPress={onDelete} style={{ flex: 1 }} variant="danger" /> : null}
          <Button icon="share" label="Share" onPress={sharePreview} style={{ flex: 1 }} variant="secondary" />
          <Button disabled={saving} label="Save note" onPress={saveDraft} style={{ flex: 1.3 }} />
        </>
      }
      onBack={inline ? closeWithoutSaving : undefined}
      onClose={closeWithoutSaving}
      title={isNew ? (fromLesson ? "New lesson note" : "Add past lesson") : studentName}
      visible
    >
      {fromLesson ? (
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>
          {new Date(draft.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
      ) : (
        // A lesson that isn't on the calendar (e.g. one that already happened): pick when it was.
        // Only past times are allowed; future lessons go on the Calendar.
        <View style={{ marginBottom: 16 }}>
          <Label>When</Label>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickingDate((current) => !current)}
            style={{ borderWidth: 1, borderColor: pickingDate ? colors.teal : colors.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              {new Date(draft.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
              {new Date(draft.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </Text>
          </Pressable>
          {pickingDate ? (
            <DateTimePicker
              display="spinner"
              maximumDate={new Date()}
              mode="datetime"
              onChange={(_event, date) => date && set({ date: date.toISOString() })}
              style={{ alignSelf: "stretch" }}
              value={new Date(draft.date)}
            />
          ) : null}
        </View>
      )}

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
            <Dropdown
              label="Student"
              onChange={(studentId: string) => set({ studentId })}
              options={studentIds}
              renderLabel={(id) => studentById(id)?.name ?? id}
              value={studentIds.includes(draft.studentId) ? draft.studentId : studentIds[0]}
            />
          ) : null}
          <LessonTypePicker onChange={(lessonType) => set({ lessonType, title: `${lessonType} lesson` })} value={draft.lessonType} />
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
    </Container>
  );
}
