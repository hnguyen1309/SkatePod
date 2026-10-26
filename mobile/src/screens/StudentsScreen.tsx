import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "../components/Icon";
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
  ProgressBar,
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
  initialsOf,
  nextLessonLabel,
  newId,
  sortDisciplines,
  type DisciplineCategory,
  type DisciplineId,
  type Student,
  type StudentDiscipline,
} from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { categoryColors, colors, radius } from "../theme";

type CategoryFilter = "ALL" | DisciplineCategory;
const CATEGORY_FILTERS: CategoryFilter[] = ["ALL", ...DISCIPLINE_CATEGORIES.map((category) => category.id)];

export function StudentsScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { students, setStudents, lessons, notes, programs, settings } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: "add" } | { mode: "edit"; student: Student } | null>(null);

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

  // iOS can't present a new sheet while another is still sliding away,
  // so close the detail sheet first and continue a moment later.
  function closeDetailThen(next: () => void) {
    setDetailId(null);
    setTimeout(next, 400);
  }

  function save(student: Student) {
    setStudents((current) =>
      current.some((item) => item.id === student.id) ? current.map((item) => (item.id === student.id ? student : item)) : [...current, student],
    );
    setEditor(null);
  }

  function remove(student: Student) {
    Alert.alert("Delete student?", `${student.name} will be removed. Their notes and lessons stay but show as "Removed student".`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setStudents((current) => current.filter((item) => item.id !== student.id));
          setEditor(null);
          setDetailId(null);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading description="Keep every skater’s training, goals, and upcoming work in one place." eyebrow="Student management" title="Students" />

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
                  {student.focus} · {nextLessonLabel(student.id, lessons)}
                </Text>
              </View>
              <View style={{ width: 56, alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.subtle }}>{student.progress}%</Text>
                <View style={{ width: 56 }}>
                  <ProgressBar percent={student.progress} />
                </View>
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

      <Sheet onClose={() => setDetailId(null)} title={detail?.name ?? "Student"} visible={Boolean(detail)}>
        {detail ? (
          <View>
            <View style={{ backgroundColor: colors.navy, borderRadius: radius.lg, padding: 18, marginBottom: 18 }}>
              <Avatar initials={initialsOf(detail.name)} size={48} tone={detail.tone} />
              <Text style={{ color: colors.white, fontSize: 20, fontWeight: "700", marginTop: 12 }}>{detail.name}</Text>
              <View style={{ marginTop: 8 }}>
                <DisciplineBadges disciplines={detail.disciplines} emptyColor="rgba(255,255,255,0.6)" />
              </View>
            </View>
            <Label>Training snapshot</Label>
            <DetailRow label="Current focus" value={detail.focus} />
            <DetailRow label="Weekly lessons" value={String(lessons.filter((lesson) => lesson.studentId === detail.id).length)} />
            <DetailRow label="Lesson notes" value={String(notes.filter((note) => note.studentId === detail.id).length)} />
            <DetailRow label="Practice completion" value={`${detail.progress}%`} />
            <DetailRow label="Program" value={programs[detail.id]?.musicTitle ?? "Not started"} />
            <View style={{ height: 1, backgroundColor: colors.borderSoft, marginVertical: 16 }} />
            <Label>Next lesson</Label>
            <View style={{ backgroundColor: "#f3f7f8", borderRadius: radius.md, padding: 12, marginBottom: 18 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#355e64" }}>{detailNext?.label ?? "Not scheduled"}</Text>
              <Text style={{ fontSize: 12, color: "#728387", marginTop: 3 }}>
                {detailNext ? `${detailNext.lesson.type} · ${detailNext.lesson.duration} minutes · ${settings.rink}` : "Add a lesson on the Calendar tab"}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <Button
                icon="notes"
                label="View notes"
                onPress={() => closeDetailThen(() => navigate("Notes", { kind: "filterNotes", studentId: detail.id }))}
                variant="secondary"
              />
              <Button
                icon="plus"
                label="New lesson note"
                onPress={() => closeDetailThen(() => navigate("Notes", { kind: "newNote", studentId: detail.id }))}
                variant="secondary"
              />
              <Button label="Edit profile" onPress={() => closeDetailThen(() => setEditor({ mode: "edit", student: detail }))} />
            </View>
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
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>(sortDisciplines(student?.disciplines ?? []));
  const [focus, setFocus] = useState(student?.focus ?? "");
  const [progress, setProgress] = useState(student?.progress ?? 50);

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
    onSave({
      id: student?.id ?? newId(),
      name: name.trim(),
      disciplines,
      focus: focus.trim() || "—",
      progress,
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
      <Field label="Current focus" onChangeText={setFocus} placeholder="e.g. Axel entrance" value={focus} />
      <Label>Progress: {progress}%</Label>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Stepper icon="down" label="Decrease progress" onPress={() => setProgress((value) => Math.max(0, value - 5))} />
        <View style={{ flex: 1 }}>
          <ProgressBar percent={progress} />
        </View>
        <Stepper icon="up" label="Increase progress" onPress={() => setProgress((value) => Math.min(100, value + 5))} />
      </View>
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

function Stepper({ icon, label, onPress }: { icon: "up" | "down"; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.input, alignItems: "center", justifyContent: "center" },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon color={colors.subtle} name={icon === "up" ? "plus" : "minus"} size={16} />
    </Pressable>
  );
}
