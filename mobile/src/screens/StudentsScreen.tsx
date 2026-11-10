import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { NoteEditor, blankNote } from "../components/NoteEditor";
import {
  Avatar,
  Button,
  Card,
  Chips,
  DetailRow,
  DisciplineBadges,
  Dropdown,
  Empty,
  Field,
  Heading,
  IconButton,
  Label,
  Screen,
  SearchBar,
  Sheet,
} from "../components/ui";
import {
  DISCIPLINES,
  DISCIPLINE_CATEGORIES,
  TONES,
  categoryName,
  disciplineInfo,
  disciplineSummary,
  findNextLesson,
  formatShortDate,
  isEmptyNote,
  initialsOf,
  nextLessonLabel,
  newId,
  notesForStudent,
  phoneLink,
  phoneProblem,
  placeFor,
  shareNotesMessage,
  sortDisciplines,
  type DisciplineCategory,
  type DisciplineId,
  type Student,
  type Note,
  type StudentDiscipline,
} from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { openTextMessage, useCanText } from "../texting";
import { categoryColors, colors, radius } from "../theme";

type CategoryFilter = "ALL" | DisciplineCategory;
const CATEGORY_FILTERS: CategoryFilter[] = ["ALL", ...DISCIPLINE_CATEGORIES.map((category) => category.id)];

export function StudentsScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { students, saveStudent, deleteStudent, backendError, reloadFromBackend, lessons, availability, notes, programs, saveNote, deleteNotes, settings } =
    useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: "add" } | { mode: "edit"; student: Student } | null>(null);
  // A note opened from the profile (a card or "New lesson note"). It slides in over the profile inside
  // the same sheet, so nothing closes and the tab doesn't change.
  const [openNote, setOpenNote] = useState<{ note: Note; isNew: boolean } | null>(null);
  // The open note editor's "close without saving" (asks first if something changed), for when the whole sheet is swiped down.
  const closeNoteRef = useRef<(() => void) | null>(null);
  // Select mode on the profile's note cards: tick some, then share them with the student.
  const [selectingNotes, setSelectingNotes] = useState(false);
  const [pickedNotes, setPickedNotes] = useState<string[]>([]);

  const canText = useCanText();

  // A different student (or none) starts with Select mode off.
  useEffect(() => {
    setSelectingNotes(false);
    setPickedNotes([]);
  }, [detailId]);

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") setEditor({ mode: "add" });
    if (intent.kind === "openStudent") setDetailId(intent.studentId);
    onIntentHandled();
  }, [intent, onIntentHandled]);

  const filtered = students.filter((student) => {
    const matchesQuery = `${student.name} ${disciplineSummary(student)}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      category === "ALL" || student.disciplines.some((item) => disciplineInfo(item.discipline).category === category);
    return matchesQuery && matchesCategory;
  });

  const detail = students.find((student) => student.id === detailId);
  const detailNext = detail ? findNextLesson(detail.id, lessons) : null;
  const detailNotes = detail ? notesForStudent(notes, detail.id) : [];

  function closeProfile() {
    if (openNote && closeNoteRef.current) {
      closeNoteRef.current();
      return;
    }
    setOpenNote(null);
    setDetailId(null);
  }

  function togglePicked(id: string) {
    setPickedNotes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function stopSelectingNotes() {
    setSelectingNotes(false);
    setPickedNotes([]);
  }

  // Opens the phone's share sheet (Messages, Mail, WhatsApp...) with a greeting, the picked notes and
  // "via SkatePod". The coach chooses who gets it there; the app doesn't send anything itself.
  function sharePickedNotes(studentName: string, studentNotes: Note[]) {
    const picked = studentNotes.filter((note) => pickedNotes.includes(note.id));
    if (!picked.length) return;
    Share.share({ message: shareNotesMessage(picked, studentName, settings.coachName) })
      .then((result) => {
        if (result.action === Share.sharedAction) stopSelectingNotes();
      })
      .catch(() => {});
  }

  // Texts the picked notes, addressed to the student's number when they have one (see texting.ts).
  async function textPickedNotes(student: Student, studentNotes: Note[]) {
    const picked = studentNotes.filter((note) => pickedNotes.includes(note.id));
    if (!picked.length) return;
    if (await openTextMessage(student.phone, shareNotesMessage(picked, student.name, settings.coachName))) stopSelectingNotes();
  }

  async function saveOpenNote(note: Note) {
    if (await saveNote({ ...note, title: note.title || `${note.lessonType} lesson` })) setOpenNote(null);
  }

  function deleteOpenNote(note: Note) {
    Alert.alert("Delete note?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (await deleteNotes([note.id])) setOpenNote(null);
        },
      },
    ]);
  }

  // iOS can't present a new sheet while another is still sliding away,
  // so close the detail sheet first and continue a moment later.
  function closeDetailThen(next: () => void) {
    setDetailId(null);
    setTimeout(next, 400);
  }

  // With the backend set up, this sends POST or PUT /api/students; the editor stays open if it fails.
  async function save(student: Student) {
    if (await saveStudent(student)) setEditor(null);
  }

  function remove(student: Student) {
    Alert.alert("Delete student?", `This deletes ${student.name} and everything that's theirs: weekly lessons, lesson notes, programs and their music files. It can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!(await deleteStudent(student.id))) return;
          setEditor(null);
          setDetailId(null);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading description="Keep every skater’s training, goals, and upcoming work in one place." eyebrow="Student management" title="Students" />

      {backendError ? (
        <Card style={{ marginBottom: 16, borderColor: colors.danger }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Couldn’t load from the backend</Text>
          <Text style={{ fontSize: 13, color: colors.subtle, marginTop: 4, marginBottom: 12 }}>{backendError}</Text>
          <Button label="Try again" onPress={() => reloadFromBackend()} variant="secondary" />
        </Card>
      ) : null}

      <View style={{ gap: 10, marginBottom: 16 }}>
        <SearchBar onChangeText={setQuery} placeholder="Search by student, discipline or level..." value={query} />
        <Chips
          onChange={setCategory}
          options={CATEGORY_FILTERS}
          renderLabel={(value) => (value === "ALL" ? "All" : categoryName(value))}
          value={category}
        />
      </View>

      <Card style={{ padding: 0, marginBottom: 16 }}>
        {filtered.length ? (
          filtered.map((student, index) => (
            <Pressable
              accessibilityRole="button"
              key={student.id}
              onPress={() => setDetailId(student.id)}
              style={({ pressed }) => [
                { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: index ? 1 : 0, borderTopColor: colors.borderSoft },
                pressed && { backgroundColor: "#f3f8f8" },
              ]}
            >
              <Avatar initials={initialsOf(student.name)} tone={student.tone} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                  {student.name}
                </Text>
                <DisciplineBadges disciplines={student.disciplines} />
                <Text numberOfLines={1} style={{ fontSize: 12, color: colors.subtle, fontWeight: "600" }}>
                  {nextLessonLabel(student.id, lessons)}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={{ padding: 16 }}>
            <Empty text="No students match those filters." />
          </View>
        )}
      </Card>

      <Button icon="plus" label="Add student" onPress={() => setEditor({ mode: "add" })} />

      <Sheet
        onClose={closeProfile}
        pushed={
          openNote ? (
            <NoteEditor
              closeRef={closeNoteRef}
              inline
              isNew={openNote.isNew}
              key={openNote.note.id}
              note={openNote.note}
              onClose={() => setOpenNote(null)}
              onDelete={() => deleteOpenNote(openNote.note)}
              onSave={saveOpenNote}
            />
          ) : null
        }
        title={detail?.name ?? "Student"}
        // The navy card stays put at the top while the snapshot and notes scroll under it.
        top={
          detail ? (
            <View style={{ backgroundColor: colors.navy, borderRadius: radius.lg, padding: 18 }}>
              {/* The pencil opens the editor. Its label stays "Edit profile" so screen readers and the Maestro flows find it. */}
              <View style={{ position: "absolute", top: 14, right: 14 }}>
                <IconButton
                  background="rgba(255,255,255,0.14)"
                  color={colors.white}
                  icon="edit"
                  label="Edit profile"
                  onPress={() => closeDetailThen(() => setEditor({ mode: "edit", student: detail }))}
                  size={36}
                />
              </View>
              <Avatar initials={initialsOf(detail.name)} size={48} tone={detail.tone} />
              <Text style={{ color: colors.white, fontSize: 20, fontWeight: "700", marginTop: 12 }}>{detail.name}</Text>
              {detail.phone ? (
                // Tap to call (the phone asks first).
                <Pressable
                  accessibilityLabel={`Call ${detail.phone}`}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(phoneLink(detail.phone ?? "")).catch(() => {})}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, alignSelf: "flex-start" }, pressed && { opacity: 0.6 }]}
                >
                  <Icon color="rgba(255,255,255,0.85)" name="phone" size={14} />
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" }}>{detail.phone}</Text>
                </Pressable>
              ) : null}
              <View style={{ marginTop: 8 }}>
                <DisciplineBadges disciplines={detail.disciplines} emptyColor="rgba(255,255,255,0.6)" />
              </View>
            </View>
          ) : null
        }
        visible={Boolean(detail)}
      >
        {detail ? (
          <View>
            <Label>Training snapshot</Label>
            <DetailRow label="Weekly lessons" value={String(lessons.filter((lesson) => lesson.studentId === detail.id).length)} />
            <DetailRow label="Lesson notes" value={String(notes.filter((note) => note.studentId === detail.id).length)} />
            <DetailRow
              label="Programs"
              value={programs.filter((program) => program.studentId === detail.id).map((program) => program.name).join(", ") || "Not started"}
            />
            <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical: 16 }} />
            <Label>Next lesson</Label>
            <View style={{ backgroundColor: "#f3f7f8", borderRadius: radius.md, padding: 12, marginBottom: 18 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#355e64" }}>{detailNext?.label ?? "Not scheduled"}</Text>
              <Text style={{ fontSize: 12, color: "#728387", marginTop: 3 }}>
                {detailNext
                  ? [detailNext.lesson.type, `${detailNext.lesson.duration} minutes`, placeFor(detailNext.lesson, availability)].filter(Boolean).join(" · ")
                  : "Add a lesson on the Calendar tab"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Label>Recent notes</Label>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 }}>
                {detailNotes.length ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => (selectingNotes ? stopSelectingNotes() : setSelectingNotes(true))}
                    style={({ pressed }) => pressed && { opacity: 0.6 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.teal }}>{selectingNotes ? "Cancel" : "Select"}</Text>
                  </Pressable>
                ) : null}
                {selectingNotes ? null : (
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() => closeDetailThen(() => navigate("Lessons", { kind: "filterNotes", studentId: detail.id }))}
                    style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 2 }, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.teal }}>Go to notes center</Text>
                    <Icon color={colors.teal} name="chevron" size={14} />
                  </Pressable>
                )}
              </View>
            </View>
            {selectingNotes ? (
              // Select mode: how many are ticked and Select all, then Share (any app) and, when this phone can
              // text, Text (to the student's number if they have one). Both stay grey until something is ticked.
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.subtle }}>{pickedNotes.length} selected</Text>
                  <Button
                    label={pickedNotes.length === detailNotes.length ? "Clear all" : "Select all"}
                    onPress={() => setPickedNotes(pickedNotes.length === detailNotes.length ? [] : detailNotes.map((note) => note.id))}
                    variant="link"
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button
                    disabled={!pickedNotes.length}
                    icon="share"
                    label="Share"
                    onPress={() => sharePickedNotes(detail.name, detailNotes)}
                    style={{ flex: 1 }}
                    variant={canText ? "secondary" : "primary"}
                  />
                  {canText ? (
                    <Button
                      disabled={!pickedNotes.length}
                      icon="phone"
                      label="Text"
                      onPress={() => textPickedNotes(detail, detailNotes)}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
            {detailNotes.length ? (
              // This student's notes, newest first, as full-width cards in a column (the sheet scrolls them).
              // Tapping one slides it in over the profile.
              <View style={{ gap: 10, marginBottom: 12 }}>
                {detailNotes.map((note) => {
                  const empty = isEmptyNote(note);
                  const ticked = pickedNotes.includes(note.id);
                  return (
                    <Pressable
                      accessibilityRole={selectingNotes ? "checkbox" : "button"}
                      accessibilityState={selectingNotes ? { checked: ticked } : undefined}
                      key={note.id}
                      onPress={() => (selectingNotes ? togglePicked(note.id) : setOpenNote({ note, isNew: false }))}
                      style={({ pressed }) => [
                        { flexDirection: "row", gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: 14 },
                        ticked && { borderColor: colors.teal, backgroundColor: "#f1f7f7" },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      {selectingNotes ? (
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
                          }}
                        >
                          {ticked ? <Icon color={colors.white} name="check" size={13} /> : null}
                        </View>
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                          <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}>
                            {note.lessonType} · {note.duration}
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>{formatShortDate(note.date)}</Text>
                        </View>
                        <Text
                          numberOfLines={2}
                          style={{ fontSize: 13, lineHeight: 18, color: colors.subtle, marginTop: 4, fontStyle: empty ? "italic" : "normal" }}
                        >
                          {empty ? "No notes yet" : note.observations || note.focus || note.nextSteps || note.skills.join(", ")}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ marginBottom: 12 }}>
                <Empty text="No lesson notes yet." />
              </View>
            )}
            <Button
              icon="plus"
              label="New lesson note"
              onPress={() => setOpenNote({ note: blankNote(settings, detail.id), isNew: true })}
              variant="secondary"
            />
          </View>
        ) : null}
      </Sheet>

      {editor ? (
        <StudentEditor
          onClose={() => setEditor(null)}
          onDelete={editor.mode === "edit" ? () => remove(editor.student) : undefined}
          nextLesson={editor.mode === "edit" ? nextLessonLabel(editor.student.id, lessons) : "Not scheduled"}
          onSave={save}
          student={editor.mode === "edit" ? editor.student : undefined}
          toneIndex={students.length}
        />
      ) : null}
    </Screen>
  );
}

function StudentEditor({
  student,
  nextLesson,
  onClose,
  onSave,
  onDelete,
  toneIndex,
}: {
  student?: Student;
  nextLesson: string;
  onClose: () => void;
  onSave: (student: Student) => void;
  onDelete?: () => void;
  toneIndex: number;
}) {
  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>(sortDisciplines(student?.disciplines ?? []));

  // Only disciplines the student doesn't have yet can be added.
  const addable = DISCIPLINES.filter((info) => !disciplines.some((item) => item.discipline === info.id)).map((info) => info.id);

  function addDiscipline(id: DisciplineId) {
    // Start at the lowest level. The coach picks the right one from the level dropdown.
    setDisciplines((current) => sortDisciplines([...current, { discipline: id, level: disciplineInfo(id).levels[0] }]));
  }

  function setLevel(id: DisciplineId, level: string) {
    setDisciplines((current) => current.map((item) => (item.discipline === id ? { ...item, level } : item)));
  }

  function removeDiscipline(id: DisciplineId) {
    setDisciplines((current) => current.filter((item) => item.discipline !== id));
  }

  function submit() {
    if (!name.trim()) {
      Alert.alert("Add a name", "Please enter the student’s name. First names or initials are fine.");
      return;
    }
    const phoneIssue = phoneProblem(phone);
    if (phoneIssue) {
      Alert.alert("Check the phone number", phoneIssue);
      return;
    }
    onSave({
      id: student?.id ?? newId(),
      name: name.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      disciplines,
      tone: student?.tone ?? TONES[toneIndex % TONES.length],
    });
  }

  return (
    <Sheet
      footer={
        <>
          {onDelete ? <Button label="Delete" onPress={onDelete} style={{ flex: 1 }} variant="danger" /> : null}
          <Button label="Cancel" onPress={onClose} style={{ flex: 1 }} variant="secondary" />
          <Button label="Save student" onPress={submit} style={{ flex: 1.4 }} />
        </>
      }
      onClose={onClose}
      title={student ? "Edit student" : "Add student"}
      visible
    >
      <Field autoCapitalize="words" label="Student name" onChangeText={setName} placeholder="First name or initials" value={name} />
      <Field keyboardType="phone-pad" label="Phone number" onChangeText={setPhone} placeholder="Optional, e.g. (555) 010-2030" value={phone} />
      <Label>Disciplines and levels</Label>
      {disciplines.map((item) => {
        const info = disciplineInfo(item.discipline);
        const tone = categoryColors[info.category];
        return (
          <View key={item.discipline} style={styles.disciplineRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tone.fg }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{info.name}</Text>
                <Text style={{ fontSize: 11, color: tone.fg, fontWeight: "600" }}>{categoryName(info.category)}</Text>
              </View>
              <IconButton color={colors.danger} icon="trash" label={`Remove ${info.name}`} onPress={() => removeDiscipline(item.discipline)} />
            </View>
            <Dropdown label="Level" onChange={(level) => setLevel(item.discipline, level)} options={info.levels} value={item.level} />
          </View>
        );
      })}
      {addable.length ? (
        <Dropdown
          label={disciplines.length ? "Add another discipline" : "Add a discipline"}
          onChange={addDiscipline}
          options={addable}
          placeholder="Choose a discipline"
          renderLabel={(id) => `${categoryName(disciplineInfo(id).category)} · ${disciplineInfo(id).name}`}
          value={null}
        />
      ) : null}
      {/* Read-only: the next lesson always comes from the calendar, so it's never typed in twice. */}
      <Label>Next lesson</Label>
      <View style={styles.readOnly}>
        <Icon color={colors.muted} name="calendar" size={16} />
        <Text style={{ flex: 1, fontSize: 15, color: colors.subtle }}>{nextLesson}</Text>
      </View>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, marginBottom: 16 }}>
        From your calendar. Schedule or delete lessons on the Calendar tab to change it.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  disciplineRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 12,
  },
});

