import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, Field, Heading, IconButton, Label, PickerField, Screen, Segmented, Sheet } from "../components/ui";
import { LESSON_TYPES, TIMES, WEEKDAYS, newId, todayIndex, weekDates, type Lesson } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, lessonColors, radius, type LessonColor } from "../theme";

const ROW_HEIGHT = 78;
const DAY_WIDTH = 104;
const MODES = ["Day", "Week"] as const;
type Mode = (typeof MODES)[number];

function formatRange(offset: number) {
  const dates = weekDates(offset);
  const fmt = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(dates[0].date)} – ${fmt(dates[6].date)}`;
}

export function CalendarScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { lessons, setLessons, students, studentById, settings } = useStore();
  const [mode, setMode] = useState<Mode>("Week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") setEditorOpen(true);
    onIntentHandled();
  }, [intent, onIntentHandled]);

  const dates = weekDates(weekOffset);
  const visibleDays = mode === "Day" ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
  const selected = lessons.find((lesson) => lesson.id === selectedId) ?? null;
  const selectedStudent = selected ? studentById(selected.studentId) : undefined;
  const weekMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

  function remove(lesson: Lesson) {
    Alert.alert("Delete lesson?", "This removes it from your weekly schedule.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLessons((current) => current.filter((item) => item.id !== lesson.id));
          setSelectedId(null);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading description="Plan lessons, rink time, and off-ice sessions across your roster." eyebrow="Schedule" title="Calendar" />

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Segmented onChange={setMode} options={MODES} value={mode} />
        </View>
        <Button icon="plus" label="Add" onPress={() => setEditorOpen(true)} />
      </View>

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: "#e8edf1" }}>
          <IconButton icon="chevronLeft" label="Previous week" onPress={() => setWeekOffset((value) => value - 1)} size={32} />
          <IconButton icon="chevron" label="Next week" onPress={() => setWeekOffset((value) => value + 1)} size={32} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}>{formatRange(weekOffset)}</Text>
          <Button
            label="Today"
            onPress={() => {
              setWeekOffset(0);
              setSelectedDay(todayIndex());
            }}
            style={{ minHeight: 32, paddingVertical: 6, paddingHorizontal: 10 }}
            variant="secondary"
          />
        </View>

        {mode === "Day" ? (
          <ScrollView contentContainerStyle={{ gap: 6, padding: 10 }} horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((day, index) => {
              const active = index === selectedDay;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={day.label}
                  onPress={() => setSelectedDay(index)}
                  style={{ width: 46, alignItems: "center", paddingVertical: 8, borderRadius: radius.md, backgroundColor: active ? colors.navy : "transparent" }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: active ? "rgba(255,255,255,0.7)" : colors.muted }}>{day.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", marginTop: 3, color: active ? colors.white : day.isToday ? colors.teal : colors.body }}>
                    {day.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView horizontal={mode === "Week"} key={mode} scrollEnabled={mode === "Week"} showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: 52 }}>
              <View style={{ height: mode === "Week" ? 52 : 0 }} />
              {TIMES.map((time) => (
                <View key={time} style={{ height: ROW_HEIGHT, alignItems: "center", paddingTop: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#929da7" }}>{time}</Text>
                </View>
              ))}
            </View>
            {visibleDays.map((dayIndex) => {
              const day = dates[dayIndex];
              return (
                <View
                  key={day.label}
                  style={{
                    width: mode === "Week" ? DAY_WIDTH : undefined,
                    flex: mode === "Day" ? 1 : undefined,
                    minWidth: mode === "Day" ? 240 : undefined,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.borderSoft,
                    backgroundColor: day.isToday ? "#f8fbfb" : undefined,
                  }}
                >
                  {mode === "Week" ? (
                    <View style={{ height: 52, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#e8edf1" }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 1 }}>{day.label}</Text>
                      <View
                        style={{
                          marginTop: 3,
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: day.isToday ? colors.navy : "transparent",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: day.isToday ? colors.white : "#40515f" }}>{day.date.getDate()}</Text>
                      </View>
                    </View>
                  ) : null}
                  <View style={{ position: "relative" }}>
                    {TIMES.map((time) => (
                      <View key={time} style={{ height: ROW_HEIGHT, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }} />
                    ))}
                    {lessons
                      .filter((lesson) => lesson.day === dayIndex)
                      .map((lesson) => {
                        const palette = lessonColors[lesson.color];
                        const student = studentById(lesson.studentId);
                        const active = lesson.id === selectedId;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={lesson.id}
                            onPress={() => setSelectedId(lesson.id)}
                            style={{
                              position: "absolute",
                              top: lesson.row * ROW_HEIGHT + 6,
                              left: 5,
                              right: 5,
                              borderLeftWidth: 3,
                              borderLeftColor: palette.border,
                              backgroundColor: palette.bg,
                              borderRadius: radius.sm,
                              padding: 7,
                              borderWidth: active ? 1.5 : 0,
                              borderColor: active ? palette.border : undefined,
                            }}
                          >
                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: palette.text }}>
                              {student?.name.split(" ")[0] ?? "Removed"}
                            </Text>
                            <Text numberOfLines={1} style={{ fontSize: 10, color: palette.text, opacity: 0.75, marginTop: 2 }}>
                              {lesson.type} · {lesson.duration}m
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 12, borderTopWidth: 1, borderTopColor: "#e8edf1" }}>
          <Legend color={lessonColors.teal.dot} label="Freestyle" />
          <Legend color={lessonColors.sand.dot} label="Moves" />
          <Legend color={lessonColors.purple.dot} label="Off-ice / program" />
        </View>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Label>Selected lesson</Label>
        {selected ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              {selectedStudent?.name ?? "Removed student"} · {selected.type}
            </Text>
            <View style={{ gap: 8, marginVertical: 14, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderSoft }}>
              <Meta icon="clock" text={`${WEEKDAYS[selected.day]} · ${TIMES[selected.row]} · ${selected.duration} minutes`} />
              <Meta icon="calendar" text={settings.rink} />
              <Meta icon="notes" text={selectedStudent?.focus ?? "—"} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Delete" onPress={() => remove(selected)} style={{ flex: 1 }} variant="danger" />
              <Button
                label="Add notes"
                onPress={() => navigate("Notes", { kind: "newNote", studentId: selected.studentId })}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <Text style={{ color: colors.muted, fontSize: 13 }}>Tap a lesson on the calendar to see its details.</Text>
        )}
      </Card>

      <Card style={{ backgroundColor: colors.navy, borderColor: colors.navy }}>
        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: "#a9dfe1" }}>EVERY WEEK</Text>
        <Text style={{ fontSize: 28, fontWeight: "700", letterSpacing: -1, color: colors.white, marginTop: 8 }}>
          {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>On-ice time</Text>
          <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700" }}>
            {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}m
          </Text>
        </View>
      </Card>

      {editorOpen ? (
        <LessonEditor
          defaultDay={mode === "Day" ? selectedDay : todayIndex()}
          defaultDuration={settings.lessonLength}
          onClose={() => setEditorOpen(false)}
          onSave={(lesson) => {
            setLessons((current) => [...current, lesson]);
            setSelectedId(lesson.id);
            setEditorOpen(false);
          }}
          students={students.map((student) => ({ id: student.id, name: student.name }))}
        />
      ) : null}
    </Screen>
  );
}

function LessonEditor({
  students,
  defaultDay,
  defaultDuration,
  onClose,
  onSave,
}: {
  students: { id: string; name: string }[];
  defaultDay: number;
  defaultDuration: number;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}) {
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  const [day, setDay] = useState(WEEKDAYS[defaultDay]);
  const [time, setTime] = useState(TIMES[0]);
  const [type, setType] = useState(LESSON_TYPES[0]);
  const [duration, setDuration] = useState(String(defaultDuration));
  const [color, setColor] = useState<LessonColor>("teal");
  const nameOf = (id: string) => students.find((student) => student.id === id)?.name ?? id;

  function submit() {
    if (!studentId) {
      Alert.alert("Add a student first", "Lessons need a student. Add one on the Students tab.");
      return;
    }
    onSave({
      id: newId(),
      studentId,
      day: WEEKDAYS.indexOf(day),
      row: TIMES.indexOf(time),
      type,
      duration: Math.max(5, Number.parseInt(duration, 10) || 45),
      color,
    });
  }

  return (
    <Sheet
      footer={
        <>
          <Button label="Cancel" onPress={onClose} style={{ flex: 1 }} variant="secondary" />
          <Button label="Schedule lesson" onPress={submit} style={{ flex: 1.5 }} />
        </>
      }
      onClose={onClose}
      title="Schedule lesson"
      visible
    >
      {studentIds.length ? (
        <PickerField label="Student" onChange={setStudentId} options={studentIds} renderLabel={nameOf} value={studentId} />
      ) : (
        <Text style={{ color: colors.muted, marginBottom: 16 }}>You don’t have any students yet.</Text>
      )}
      <PickerField label="Day" onChange={setDay} options={WEEKDAYS} value={day} />
      <PickerField label="Start time" onChange={setTime} options={TIMES} value={time} />
      <PickerField label="Lesson type" onChange={setType} options={LESSON_TYPES} value={type} />
      <Field keyboardType="number-pad" label="Duration (minutes)" onChangeText={setDuration} value={duration} />
      <PickerField
        label="Color"
        onChange={setColor}
        options={["teal", "sand", "purple"] as const}
        renderLabel={(value) => ({ teal: "Freestyle", sand: "Moves", purple: "Off-ice / program" })[value]}
        value={color}
      />
    </Sheet>
  );
}

function Meta({ icon, text }: { icon: "clock" | "calendar" | "notes"; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon color="#5f9195" name={icon} size={15} />
      <Text style={{ fontSize: 13, color: "#667581", flexShrink: 1 }}>{text}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#75828e" }}>{label}</Text>
    </View>
  );
}
