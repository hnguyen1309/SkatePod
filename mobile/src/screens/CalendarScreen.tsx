import { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Alert, PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, Field, Heading, IconButton, Label, PickerField, Screen, Segmented, Sheet } from "../components/ui";
import {
  FIRST_HOUR,
  FULL_WEEKDAYS,
  LAST_HOUR,
  LESSON_TYPES,
  WEEKDAYS,
  findBlockOverlap,
  findClash,
  findLessonNote,
  syncLessonNote,
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

// The lesson whose preview is open. Kept outside the screen so it's still open when the coach comes back
// from writing the lesson's note (switching tabs removes and recreates this screen).
let rememberedPreviewId: string | null = null;

export function CalendarScreen({ intent, onIntentHandled, navigate }: ScreenProps) {
  const { lessons, setLessons, availability, setAvailability, notes, setNotes, students, studentById, settings } = useStore();
  const [mode, setMode] = useState<Mode>("Week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  // The lesson whose detail window is open (tap a lesson to open it), and the lesson being edited.
  const [detailId, setDetailIdState] = useState<string | null>(rememberedPreviewId);
  const setDetailId = (id: string | null) => {
    rememberedPreviewId = id;
    setDetailIdState(id);
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  // Where the coach tapped on the calendar, so the new lesson starts there (like Google Calendar).
  const [tapped, setTapped] = useState<{ day: number; start: number } | null>(null);
  // While a lesson is being dragged, the page and the week can't scroll, and its day column draws on top.
  const [draggingDay, setDraggingDay] = useState<number | null>(null);

  // Saves a dragged or resized lesson, unless the new time clashes with another lesson.
  // The date and time a weekly lesson falls on in the week on screen.
  function dateOf(lesson: Pick<Lesson, "day" | "start">) {
    const date = new Date(dates[lesson.day].date);
    date.setHours(Math.floor(lesson.start / 60), lesson.start % 60, 0, 0);
    return date;
  }

  // Saves a changed lesson. If a note was already written for it this week, the note follows the change
  // (type, length, day and time), so the coach doesn't end up with a note that says the old details.
  function saveLesson(before: Lesson, after: Lesson) {
    setLessons((current) => current.map((item) => (item.id === before.id ? after : item)));
    setNotes((current) => syncLessonNote(current, before, after, dateOf(before), dateOf(after)));
  }


  function moveLesson(lesson: Lesson, changes: Partial<Pick<Lesson, "day" | "start" | "duration">>) {
    const moved = { ...lesson, ...changes };
    if (moved.day === lesson.day && moved.start === lesson.start && moved.duration === lesson.duration) return;
    const clash = findClash(moved, lessons);
    if (clash) {
      const name = studentById(clash.studentId)?.name ?? "Another student";
      Alert.alert("That time is taken", `${name} already has a lesson on ${FULL_WEEKDAYS[clash.day]} at ${formatTime(clash.start)}. The lesson stayed where it was.`);
      return;
    }
    saveLesson(lesson, moved);
  }
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") setEditorOpen(true);
    onIntentHandled();
  }, [intent, onIntentHandled]);

  const dates = weekDates(weekOffset);
  const visibleDays = mode === "Day" ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6];
  const detail = lessons.find((lesson) => lesson.id === detailId) ?? null;
  // Lessons repeat weekly, so "this lesson" means its date in the week on screen, at its start time.
  const detailDate = detail ? new Date(dates[detail.day].date) : null;
  if (detail && detailDate) detailDate.setHours(Math.floor(detail.start / 60), detail.start % 60, 0, 0);
  const detailNote = detail && detailDate ? findLessonNote(notes, detail, detailDate) : undefined;
  const editing = lessons.find((lesson) => lesson.id === editingId) ?? null;
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
          setDetailId(null);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
    <Screen scrollEnabled={draggingDay === null}>
      <Heading description="Tap an empty time to add a lesson. Tap a lesson to preview it below, then drag it to move it or drag its bottom edge to change the length." eyebrow="Schedule" title="Calendar" />

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

        <ScrollView horizontal={mode === "Week"} key={mode} scrollEnabled={mode === "Week" && draggingDay === null} showsHorizontalScrollIndicator={false}>
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
                    zIndex: draggingDay === dayIndex ? 10 : 0, // a lesson dragged to another day stays visible
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
                    {/* Tap an empty spot to add a lesson there. The time is rounded down to the 15 minutes
                        under your finger, e.g. tapping just after 4 PM starts the lesson at 4:00. Lessons sit
                        on top of this, so tapping a lesson still selects it instead. */}
                    <Pressable
                      accessibilityHint="Adds a lesson at this time"
                      accessibilityLabel={`Add a lesson on ${FULL_WEEKDAYS[dayIndex]}`}
                      onPress={(event) => {
                        const quarters = Math.floor((event.nativeEvent.locationY / ROW_HEIGHT) * 4);
                        const start = Math.min(FIRST_HOUR * 60 + quarters * 15, (LAST_HOUR - 1) * 60 + 45);
                        setSelectedId(null);
                        setDetailId(null); // tapping an empty time closes the lesson preview
                        setTapped({ day: dayIndex, start });
                        setEditorOpen(true);
                      }}
                    >
                      {/* pointerEvents="none" so the tap lands on the Pressable itself: then locationY is measured
                          from the top of the whole column (6 AM), not from the top of one hour row. */}
                      <View pointerEvents="none">
                        {HOURS.map((hour) => (
                          <View key={hour} style={{ height: ROW_HEIGHT, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }} />
                        ))}
                      </View>
                    </Pressable>
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
                      .map((lesson) => (
                        <LessonBlock
                          active={lesson.id === selectedId}
                          dayWidth={mode === "Week" ? DAY_WIDTH : 0}
                          key={lesson.id}
                          lesson={lesson}
                          name={studentById(lesson.studentId)?.name.split(" ")[0] ?? "Removed"}
                          onDragChange={(dragging) => setDraggingDay(dragging ? lesson.day : null)}
                          onMove={(changes) => moveLesson(lesson, changes)}
                          onSelect={() => {
                            // Tapping a lesson opens its detail window. It also stays selected after you
                            // close the window, so you can then drag it or its bottom edge.
                            setSelectedId(lesson.id);
                            setDetailId(lesson.id);
                          }}
                        />
                      ))}
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


      {editing ? (
        <LessonEditor
          defaultDay={editing.day}
          defaultDuration={editing.duration}
          initial={editing}
          lessons={lessons}
          onClose={() => setEditingId(null)}
          onSave={(lesson) => {
            saveLesson(editing, lesson);
            setEditingId(null); // saved: back to the calendar, with the lesson's preview still open
          }}
          students={students.map((student) => ({ id: student.id, name: student.name }))}
        />
      ) : null}

      {editorOpen ? (
        <LessonEditor
          defaultDay={tapped?.day ?? (mode === "Day" ? selectedDay : todayIndex())}
          defaultStart={tapped?.start}
          defaultDuration={settings.lessonLength}
          lessons={lessons}
          onClose={() => {
            setEditorOpen(false);
            setTapped(null);
          }}
          onSave={(lesson) => {
            setLessons((current) => [...current, lesson]);
            setSelectedId(lesson.id);
            setEditorOpen(false);
            setTapped(null);
          }}
          students={students.map((student) => ({ id: student.id, name: student.name }))}
        />
      ) : null}

      {availabilityOpen ? (
        <AvailabilitySheet blocks={availability} onChange={setAvailability} onClose={() => setAvailabilityOpen(false)} />
      ) : null}
      {/* Room under the content so the preview panel doesn't cover the bottom of the page. */}
      {detail ? <View style={{ height: 260 }} /> : null}
    </Screen>

    {detail ? (
      <LessonPreview
        hasNote={Boolean(detailNote)}
        lesson={detail}
        onClose={() => setDetailId(null)}
        onDelete={() => remove(detail)}
        onEdit={() => setEditingId(detail.id)}
        onNotes={() => {
          // The note editor opens on the Notes tab and brings the coach back here when it closes.
          if (detailNote) {
            navigate("Notes", { kind: "openNote", noteId: detailNote.id, returnTo: "Calendar" });
          } else {
            navigate("Notes", {
              kind: "newNote",
              studentId: detail.studentId,
              lesson: { id: detail.id, date: (detailDate ?? new Date()).toISOString(), type: detail.type, duration: detail.duration },
              returnTo: "Calendar",
            });
          }
        }}
        place={placeFor(detail, availability)}
        student={studentById(detail.studentId)}
      />
    ) : null}
    </View>
  );
}

function LessonEditor({
  students,
  lessons,
  defaultDay,
  defaultStart = 9 * 60,
  defaultDuration,
  initial,
  onClose,
  onSave,
}: {
  students: { id: string; name: string }[];
  lessons: Lesson[];
  defaultDay: number;
  defaultStart?: number; // minutes after midnight; 9:00 AM when you use the Add button
  defaultDuration: number;
  initial?: Lesson; // set when editing an existing lesson; the form starts with its values
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}) {
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(initial?.studentId ?? studentIds[0] ?? "");
  const [day, setDay] = useState(WEEKDAYS[defaultDay]);
  // Start, end and duration stay in sync: change the start and the end moves with it (same length);
  // change the end or the duration and the other one updates.
  const [start, setStart] = useState(initial?.start ?? defaultStart);
  const [duration, setDuration] = useState(defaultDuration);
  const [durationText, setDurationText] = useState(String(defaultDuration));
  const [type, setType] = useState(initial?.type ?? LESSON_TYPES[0]);
  const end = start + duration;

  function changeDuration(minutes: number) {
    setDuration(minutes);
    setDurationText(String(minutes));
  }
  const [color, setColor] = useState<LessonColor>(initial?.color ?? "teal");
  const nameOf = (id: string) => students.find((student) => student.id === id)?.name ?? id;

  function submit() {
    if (!studentId) {
      Alert.alert("Add a student first", "Lessons need a student. Add one on the Students tab.");
      return;
    }
    if (duration < 5) {
      Alert.alert("Check the times", "The end time needs to be at least 5 minutes after the start.");
      return;
    }
    const outside = calendarHoursProblem(start, end);
    if (outside) {
      Alert.alert("Outside calendar hours", outside);
      return;
    }
    // Editing keeps the same id, so findClash doesn't count the lesson as clashing with itself.
    const lesson: Lesson = { id: initial?.id ?? newId(), studentId, day: WEEKDAYS.indexOf(day), start, type, duration, color };
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
          <Button label={initial ? "Save changes" : "Schedule lesson"} onPress={submit} style={{ flex: 1.5 }} />
        </>
      }
      onClose={onClose}
      title={initial ? "Edit lesson" : "Schedule lesson"}
      visible
    >
      {studentIds.length ? (
        <PickerField label="Student" onChange={setStudentId} options={studentIds} renderLabel={nameOf} value={studentId} />
      ) : (
        <Text style={{ color: colors.muted, marginBottom: 16 }}>You don’t have any students yet.</Text>
      )}
      <PickerField label="Day" onChange={setDay} options={WEEKDAYS} value={day} />
      <TimeRange
        end={end}
        onChangeEnd={(minutes) => changeDuration(Math.max(0, minutes - start))}
        onChangeStart={setStart}
        start={start}
      />
      <Field
        keyboardType="number-pad"
        label="Duration (minutes)"
        onChangeText={(text) => {
          setDurationText(text);
          const minutes = Number.parseInt(text, 10);
          if (minutes > 0) setDuration(minutes); // the end time follows as you type
        }}
        value={durationText}
      />
      <PickerField label="Lesson type" onChange={setType} options={LESSON_TYPES} value={type} />
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

// The window that opens when you tap a lesson: everything about that slot, plus Edit, Delete
// and Add notes. (Adding a new lesson is the Add button or tapping an empty time.)
// The small panel along the bottom third of the screen that opens when you tap a lesson, like a
// calendar app's event preview. The calendar stays visible and usable above it. It stays open while
// you edit the lesson or its note, and closes with the X, after Delete, or when you tap an empty time.
function LessonPreview({
  lesson,
  student,
  place,
  hasNote,
  onEdit,
  onDelete,
  onNotes,
  onClose,
}: {
  lesson: Lesson;
  student?: { name: string; focus: string };
  place?: string;
  hasNote: boolean; // a note was already written for this lesson in the week on screen
  onEdit: () => void;
  onDelete: () => void;
  onNotes: () => void;
  onClose: () => void;
}) {
  const palette = lessonColors[lesson.color];
  const { height } = useWindowDimensions();
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: height / 3,
        backgroundColor: colors.white,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -3 },
      }}
    >
      <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 10 }} />
      <ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 5, alignSelf: "stretch", borderRadius: 3, backgroundColor: palette.border }} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
              {student?.name ?? "Removed student"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {lesson.type} · {FULL_WEEKDAYS[lesson.day]} {formatTime(lesson.start)} – {formatTime(lesson.start + lesson.duration)}
            </Text>
          </View>
          <IconButton icon="close" label="Close preview" onPress={onClose} size={30} />
        </View>
        <View style={{ gap: 6, marginTop: 10 }}>
          {place ? <Meta icon="home" text={place} /> : null}
          <Meta icon="notes" text={student?.focus ? `Focus: ${student.focus}` : "No focus set"} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <Button icon="notes" label={hasNote ? "Open notes" : "Add notes"} onPress={onNotes} style={{ flex: 1.3 }} variant="secondary" />
          <Button icon="edit" label="Edit" onPress={onEdit} style={{ flex: 1 }} />
          <IconButton background={colors.dangerSoft} color={colors.danger} icon="trash" label="Delete lesson" onPress={onDelete} size={44} />
        </View>
      </ScrollView>
    </View>
  );
}

// One lesson on the grid. Tap it to select it. Once it's selected (it gets a border and a small handle
// at the bottom), drag it to move it, or drag the handle to change its length, like Google Calendar.
// Unselected lessons ignore drags, so swiping over them still scrolls the calendar.
// Everything snaps to 15 minutes. In Week view you can also drag a lesson sideways to another day.
function LessonBlock({
  lesson,
  name,
  active,
  dayWidth,
  onSelect,
  onMove,
  onDragChange,
}: {
  lesson: Lesson;
  name: string;
  active: boolean;
  dayWidth: number; // 0 in Day view, where lessons can only move up and down
  onSelect: () => void;
  onMove: (changes: Partial<Pick<Lesson, "day" | "start" | "duration">>) => void;
  onDragChange: (dragging: boolean) => void;
}) {
  // How far the finger has moved while dragging, in pixels; null when not dragging.
  const [move, setMove] = useState<{ dx: number; dy: number } | null>(null);
  const [stretch, setStretch] = useState<number | null>(null);
  // The responders are made once, so they read the newest props through this ref (same trick as RinkMap).
  const latest = useRef({ lesson, active, dayWidth, onMove, onDragChange });
  latest.current = { lesson, active, dayWidth, onMove, onDragChange };

  const snap = (pixels: number) => Math.round(((pixels / ROW_HEIGHT) * 60) / 15) * 15; // pixels → minutes, in 15s

  // Where the lesson would land for a drag of (dx, dy), kept inside the calendar's hours and days.
  function landing(dx: number, dy: number) {
    const { lesson: current, dayWidth: width } = latest.current;
    const day = width ? Math.max(0, Math.min(6, current.day + Math.round(dx / width))) : current.day;
    const start = Math.max(FIRST_HOUR * 60, Math.min(LAST_HOUR * 60 - current.duration, current.start + snap(dy)));
    return { day, start };
  }
  function stretched(dy: number) {
    const { lesson: current } = latest.current;
    return Math.max(15, Math.min(LAST_HOUR * 60 - current.start, current.duration + snap(dy)));
  }

  const mover = useRef(
    PanResponder.create({
      // Only a selected lesson can be dragged, and only once the finger actually moves,
      // so a plain tap still selects it.
      onStartShouldSetPanResponder: () => false,
      // "Capture" asks this view before the Pressable inside it, so a drag can take over from a tap.
      onMoveShouldSetPanResponderCapture: (_event, gesture) => latest.current.active && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragChange(true),
      onPanResponderMove: (_event, gesture) => setMove({ dx: gesture.dx, dy: gesture.dy }),
      onPanResponderRelease: (_event, gesture) => {
        setMove(null);
        latest.current.onDragChange(false);
        latest.current.onMove(landing(gesture.dx, gesture.dy));
      },
      onPanResponderTerminate: () => {
        setMove(null);
        latest.current.onDragChange(false);
      },
    }),
  ).current;

  const resizer = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragChange(true),
      onPanResponderMove: (_event, gesture) => setStretch(gesture.dy),
      onPanResponderRelease: (_event, gesture) => {
        setStretch(null);
        latest.current.onDragChange(false);
        latest.current.onMove({ duration: stretched(gesture.dy) });
      },
      onPanResponderTerminate: () => {
        setStretch(null);
        latest.current.onDragChange(false);
      },
    }),
  ).current;

  // While dragging, show the lesson where it will land (snapped), so the coach sees the exact time.
  const preview = move ? landing(move.dx, move.dy) : { day: lesson.day, start: lesson.start };
  const duration = stretch !== null ? stretched(stretch) : lesson.duration;
  const palette = lessonColors[lesson.color];
  const dragging = move !== null || stretch !== null;

  return (
    <View
      {...mover.panHandlers}
      style={{
        position: "absolute",
        top: topFor(preview.start) + 2,
        height: Math.max(30, (duration / 60) * ROW_HEIGHT - 4),
        left: 5 + (preview.day - lesson.day) * dayWidth,
        right: 5 - (preview.day - lesson.day) * dayWidth,
        zIndex: dragging ? 5 : active ? 2 : 1,
        opacity: dragging ? 0.9 : 1,
        shadowColor: "#000",
        shadowOpacity: dragging ? 0.18 : 0,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <Pressable
        accessibilityHint={active ? "Drag to move, or drag the bottom handle to change the length" : "Selects the lesson"}
        accessibilityRole="button"
        onPress={onSelect}
        style={{
          flex: 1,
          overflow: "hidden",
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
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 10, color: palette.text, opacity: 0.75, marginTop: 2 }}>
          {dragging ? `${formatTime(preview.start)} · ${duration}m` : `${lesson.type} · ${lesson.duration}m`}
        </Text>
      </Pressable>
      {active ? (
        // The resize handle: a small bar on the bottom edge with a bigger invisible touch area.
        <View
          {...resizer.panHandlers}
          accessibilityLabel="Change lesson length"
          hitSlop={{ top: 8, bottom: 10, left: 10, right: 10 }}
          style={{ position: "absolute", bottom: -6, alignSelf: "center", paddingVertical: 4, paddingHorizontal: 12 }}
        >
          <View style={{ width: 26, height: 5, borderRadius: 3, backgroundColor: palette.border }} />
        </View>
      ) : null}
    </View>
  );
}

// The calendar only draws 6 AM to 10 PM, so lessons and blocks have to fit inside it.
function calendarHoursProblem(start: number, end: number) {
  if (start < FIRST_HOUR * 60 || end > LAST_HOUR * 60) {
    return `The calendar shows ${formatHour(FIRST_HOUR)} to ${formatHour(LAST_HOUR)}. Pick times inside those hours.`;
  }
  return null;
}

// Start and end side by side, like the iPhone Calendar app. Tap one to open the iOS time wheel under it
// (any minute, e.g. 6:32). The wheel opens inline because a pop-up can't open on top of a Sheet on iOS.
function TimeRange({
  start,
  end,
  onChangeStart,
  onChangeEnd,
}: {
  start: number;
  end: number;
  onChangeStart: (minutes: number) => void;
  onChangeEnd: (minutes: number) => void;
}) {
  const [open, setOpen] = useState<"start" | "end" | null>(null);
  const field = (which: "start" | "end", label: string, minutes: number) => {
    const active = open === which;
    return (
      <View style={{ flex: 1 }}>
        <Label>{label}</Label>
        <Pressable
          accessibilityLabel={`${label}, ${formatTime(minutes)}`}
          accessibilityRole="button"
          onPress={() => setOpen(active ? null : which)}
          style={{
            borderWidth: 1,
            borderColor: active ? colors.teal : colors.border,
            borderRadius: radius.md,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: colors.white,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: active ? colors.tealDark : colors.text }}>{formatTime(minutes)}</Text>
        </Pressable>
      </View>
    );
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {field("start", "Start time", start)}
        {field("end", "End time", end)}
      </View>
      {open ? (
        <TimeWheel
          key={open}
          minutes={open === "start" ? start : end}
          onChange={open === "start" ? onChangeStart : onChangeEnd}
        />
      ) : null}
    </View>
  );
}

// The native iOS wheel (hours, minutes, AM/PM). Works in Expo Go.
function TimeWheel({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const value = new Date();
  value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return (
    <DateTimePicker
      display="spinner"
      minuteInterval={1}
      mode="time"
      onChange={(_event, date) => date && onChange(date.getHours() * 60 + date.getMinutes())}
      style={{ alignSelf: "stretch" }}
      value={value}
    />
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
    const outside = calendarHoursProblem(start, end);
    if (outside) {
      Alert.alert("Outside calendar hours", outside);
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
      <TimeRange end={end} onChangeEnd={setEnd} onChangeStart={setStart} start={start} />
      <Field label="Place (optional)" onChangeText={setPlace} placeholder="e.g. North Rink" value={place} />
      <Button icon="plus" label="Add block" onPress={add} variant="secondary" />
    </Sheet>
  );
}

function Meta({ icon, text }: { icon: "clock" | "calendar" | "notes" | "home"; text: string }) {
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
