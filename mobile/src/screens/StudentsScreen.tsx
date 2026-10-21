import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import {
  Avatar,
  Button,
  Card,
  Chips,
  DetailRow,
  Empty,
  Field,
  Heading,
  Label,
  ProgressBar,
  Screen,
  SearchBar,
  Sheet,
} from "../components/ui";
import { LEVEL_FILTERS, TONES, initialsOf, newId, type Student } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, radius } from "../theme";

export function StudentsScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { students, setStudents, lessons, notes, programs, settings } = useStore();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(LEVEL_FILTERS[0]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: "add" } | { mode: "edit"; student: Student } | null>(null);

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") setEditor({ mode: "add" });
    if (intent.kind === "openStudent") setDetailId(intent.studentId);
    onIntentHandled();
  }, [intent, onIntentHandled]);

  const filtered = students.filter((student) => {
    const matchesQuery = `${student.name} ${student.level} ${student.discipline}`.toLowerCase().includes(query.toLowerCase());
    const matchesLevel = level === "All levels" || student.level.toLowerCase().includes(level.toLowerCase());
    return matchesQuery && matchesLevel;
  });

  const detail = students.find((student) => student.id === detailId);

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
        <SearchBar onChangeText={setQuery} placeholder="Search by student or level..." value={query} />
        <Chips onChange={setLevel} options={LEVEL_FILTERS} value={level} />
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
              <View style={{ flex: 1, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                  {student.name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted }}>
                  {student.level} · {student.discipline}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: colors.subtle, fontWeight: "600" }}>
                  {student.focus} · {student.nextLesson}
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
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>
                {detail.level} · {detail.discipline}
              </Text>
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
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#355e64" }}>{detail.nextLesson}</Text>
              <Text style={{ fontSize: 12, color: "#728387", marginTop: 3 }}>
                {settings.rink} · {settings.lessonLength} minutes
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
  onClose,
  onSave,
  onDelete,
  toneIndex,
}: {
  student?: Student;
  onClose: () => void;
  onSave: (student: Student) => void;
  onDelete?: () => void;
  toneIndex: number;
}) {
  const [name, setName] = useState(student?.name ?? "");
  const [level, setLevel] = useState(student?.level ?? "Preliminary");
  const [discipline, setDiscipline] = useState(student?.discipline ?? "Freestyle");
  const [nextLesson, setNextLesson] = useState(student?.nextLesson ?? "Not scheduled");
  const [focus, setFocus] = useState(student?.focus ?? "");
  const [progress, setProgress] = useState(student?.progress ?? 50);

  function submit() {
    if (!name.trim()) {
      Alert.alert("Add a name", "Please enter the student’s name. First names or initials are fine.");
      return;
    }
    onSave({
      id: student?.id ?? newId(),
      name: name.trim(),
      level: level.trim() || "Preliminary",
      discipline: discipline.trim() || "Freestyle",
      nextLesson: nextLesson.trim() || "Not scheduled",
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
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Level" onChangeText={setLevel} value={level} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Discipline" onChangeText={setDiscipline} value={discipline} />
        </View>
      </View>
      <Field label="Next lesson" onChangeText={setNextLesson} value={nextLesson} />
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
