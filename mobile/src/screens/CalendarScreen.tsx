import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, Dropdown, Field, Heading, IconButton, Label, PickerField, Screen, Segmented, Sheet } from "../components/ui";
import {
  FIRST_HOUR,
  FULL_WEEKDAYS,
  LAST_HOUR,
  LESSON_TYPES,
  MINUTE_STEPS,
  WEEKDAYS,
  findBlockOverlap,
  findClash,
  formatHour,
  formatTime,
  newId,
  placeFor,
  todayIndex,
  weekDates,
  type AvailabilityBlock,
  type Lesson,
} from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, lessonColors, radius, type LessonColor } from "../theme";

const ROW_HEIGHT = 64; // one hour
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index); // 6 AM ... 9 PM

// Where a time sits on the grid, in pixels from the top (6 AM = 0).
const topFor = (minutes: number) => ((minutes - FIRST_HOUR * 60) / 60) * ROW_HEIGHT;
const DAY_WIDTH = 104;
const MODES = ["Day", "Week"] as const;
type Mode = (typeof MODES)[number];

function formatRange(offset: number) {
  const dates = weekDates(offset);
  const fmt = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(dates[0].date)} – ${fmt(dates[6].date)}`;
}

export function CalendarScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { lessons, setLessons, availability, setAvailability, students, studentById, settings } = useStore();
  const [mode, setMode] = useState<Mode>("Week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

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
      <Heading description="Add lessons at any time, or set the times you’re available to coach (optional)." eyebrow="Schedule" title="Calendar" />

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Segmented onChange={setMode} options={MODES} value={mode} />
        </View>
        <Button icon="plus" label="Add" onPress={() => setEditorOpen(true)} />
      </View>
      <Button
        icon="clock"
        label={availability.length ? `Availability (${availability.length})` : "Set availability (optional)"}
        onPress={() => setAvailabilityOpen(true)}
        style={{ marginBottom: 14 }}
        variant="secondary"
      />

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
              {HOURS.map((hour) => (
                <View key={hour} style={{ height: ROW_HEIGHT, alignItems: "center", paddingTop: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#929da7" }}>{formatHour(hour)}</Text>
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
                    {HOURS.map((hour) => (
                      <View key={hour} style={{ height: ROW_HEIGHT, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }} />
                    ))}
                    {/* Optional availability blocks sit behind the lessons as a soft shaded area. */}
                    {availability
                      .filter((block) => block.day === dayIndex)
                      .map((block) => (
                        <View
                          key={block.id}
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            top: topFor(block.start),
                            height: topFor(block.end) - topFor(block.start),
                            left: 0,
                            right: 0,
                            backgroundColor: colors.tealSoft,
                            borderLeftWidth: 2,
                            borderLeftColor: "#bcd9db",
                            paddingHorizontal: 5,
                            paddingTop: 2,
                          }}
                        >
                          {block.place ? (
                            <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: "700", color: "#5f9195" }}>
                              {block.place}
                            </Text>
                          ) : null}
                        </View>
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
                              top: topFor(lesson.start) + 2,
                              height: Math.max(30, (lesson.duration / 60) * ROW_HEIGHT - 4),
                              overflow: "hidden",
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
          <Legend color={lessonColors.sand.dot} label="Public" />
          <Legend color={lessonColors.purple.dot} label="Off-ice" />
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
              <Meta icon="clock" text={`${WEEKDAYS[selected.day]} · ${formatTime(selected.start)} · ${selected.duration} minutes`} />
              {placeFor(selected, availability) ? <Meta icon="calendar" text={placeFor(selected, availability) ?? ""} /> : null}
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
          lessons={lessons}
          onClose={() => setEditorOpen(false)}
          onSave={(lesson) => {
            setLessons((current) => [...current, lesson]);
            setSelectedId(lesson.id);
            setEditorOpen(false);
          }}
          students={students.map((student) => ({ id: student.id, name: student.name }))}
        />
      ) : null}

      {availabilityOpen ? (
        <AvailabilitySheet blocks={availability} onChange={setAvailability} onClose={() => setAvailabilityOpen(false)} />
      ) : null}
    </Screen>
  );
}

function LessonEditor({
  students,
  lessons,
  defaultDay,
  defaultDuration,
  onClose,
  onSave,
}: {
  students: { id: string; name: string }[];
  lessons: Lesson[];
  defaultDay: number;
  defaultDuration: number;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}) {
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  const [day, setDay] = useState(WEEKDAYS[defaultDay]);
  const [start, setStart] = useState(9 * 60); // 9:00 AM
  const [type, setType] = useState(LESSON_TYPES[0]);
  const [duration, setDuration] = useState(String(defaultDuration));
  const [color, setColor] = useState<LessonColor>("teal");
  const nameOf = (id: string) => students.find((student) => student.id === id)?.name ?? id;

  function submit() {
    if (!studentId) {
      Alert.alert("Add a student first", "Lessons need a student. Add one on the Students tab.");
      return;
    }
    const lesson: Lesson = {
      id: newId(),
      studentId,
      day: WEEKDAYS.indexOf(day),
      start,
      type,
      duration: Math.max(5, Number.parseInt(duration, 10) || 45),
      color,
    };
    // Block double booking: you can only coach one lesson at a time.
    const clash = findClash(lesson, lessons);
    if (clash) {
      Alert.alert(
        "That time is taken",
        `${nameOf(clash.studentId)} already has a lesson on ${FULL_WEEKDAYS[clash.day]} at ${formatTime(clash.start)} (${clash.duration} minutes). Pick another time or day.`,
      );
      return;
    }
    onSave(lesson);
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
      <TimePicker label="Start time" onChange={setStart} value={start} />
      <PickerField label="Lesson type" onChange={setType} options={LESSON_TYPES} value={type} />
      <Field keyboardType="number-pad" label="Duration (minutes)" onChangeText={setDuration} value={duration} />
      <PickerField
        label="Color"
        onChange={setColor}
        options={["teal", "sand", "purple"] as const}
        renderLabel={(value) => ({ teal: "Freestyle", sand: "Public", purple: "Off-ice" })[value]}
        value={color}
      />
    </Sheet>
  );
}

// Picks a time in 15-minute steps: an hour from a dropdown, then the minutes.
// Lessons can start at any time; nothing is tied to rink session times.
function TimePicker({ label, value, onChange, lastHour = LAST_HOUR - 1 }: { label: string; value: number; onChange: (minutes: number) => void; lastHour?: number }) {
  const hours = Array.from({ length: lastHour - FIRST_HOUR + 1 }, (_, index) => formatHour(FIRST_HOUR + index));
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const minuteLabels = MINUTE_STEPS.map((step) => `:${String(step).padStart(2, "0")}`);
  return (
    <View>
      <Dropdown
        label={label}
        onChange={(next) => onChange((FIRST_HOUR + hours.indexOf(next)) * 60 + minute)}
        options={hours}
        value={formatHour(hour)}
      />
      <View style={{ marginTop: -8, marginBottom: 16 }}>
        <Segmented
          onChange={(next) => onChange(hour * 60 + Number(next.slice(1)))}
          options={minuteLabels}
          value={`:${String(minute).padStart(2, "0")}`}
        />
      </View>
    </View>
  );
}

// Optional: the times the coach is available to coach, with an optional place (rink, studio...).
// A coach who teaches at several rinks adds one block per rink. Lessons can still go anywhere.
function AvailabilitySheet({
  blocks,
  onChange,
  onClose,
}: {
  blocks: AvailabilityBlock[];
  onChange: (blocks: AvailabilityBlock[]) => void;
  onClose: () => void;
}) {
  const [day, setDay] = useState(WEEKDAYS[todayIndex()]);
  const [start, setStart] = useState(15 * 60); // 3:00 PM
  const [end, setEnd] = useState(18 * 60); // 6:00 PM
  const [place, setPlace] = useState("");
  const sorted = [...blocks].sort((a, b) => a.day - b.day || a.start - b.start);

  function add() {
    const block: AvailabilityBlock = { id: newId(), day: WEEKDAYS.indexOf(day), start, end, place: place.trim() || undefined };
    if (end <= start) {
      Alert.alert("Check the times", "The end time needs to be after the start time.");
      return;
    }
    const overlap = findBlockOverlap(block, blocks);
    if (overlap) {
      Alert.alert(
        "That overlaps another block",
        `You're already available ${FULL_WEEKDAYS[overlap.day]} ${formatTime(overlap.start)}–${formatTime(overlap.end)}. Change the times or delete that block first.`,
      );
      return;
    }
    onChange([...blocks, block]);
    setPlace("");
  }

  return (
    <Sheet footer={<Button label="Done" onPress={onClose} style={{ flex: 1 }} />} onClose={onClose} title="Availability" visible>
      <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 16 }}>
        Optional. Mark when you’re available to coach, and where. You can still book lessons at any time.
      </Text>

      {sorted.length ? (
        <View style={{ borderWidth: 1, borderColor: "#e1e7eb", borderRadius: radius.md, marginBottom: 18 }}>
          {sorted.map((block, index) => (
            <View
              key={block.id}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderTopWidth: index ? 1 : 0, borderTopColor: "#e8edf1" }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  {FULL_WEEKDAYS[block.day]} · {formatTime(block.start)}–{formatTime(block.end)}
                </Text>
                {block.place ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{block.place}</Text> : null}
              </View>
              <IconButton
                background={colors.dangerSoft}
                color={colors.danger}
                icon="close"
                label="Delete block"
                onPress={() => onChange(blocks.filter((item) => item.id !== block.id))}
                size={28}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Label>Add a block</Label>
      <PickerField label="Day" onChange={setDay} options={WEEKDAYS} value={day} />
      <TimePicker label="From" onChange={setStart} value={start} />
      <TimePicker label="To" lastHour={LAST_HOUR} onChange={(minutes) => setEnd(Math.min(minutes, LAST_HOUR * 60))} value={end} />
      <Field label="Place (optional)" onChangeText={setPlace} placeholder="e.g. North Rink" value={place} />
      <Button icon="plus" label="Add block" onPress={add} variant="secondary" />
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
