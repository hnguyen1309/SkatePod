import { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Alert, Animated, PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Icon } from "../components/Icon";
import { Button, Card, Field, Heading, IconButton, Label, PickerField, Screen, Segmented, Sheet } from "../components/ui";
import {
  DEFAULT_HOUR_HEIGHT,
  FIRST_HOUR,
  FULL_WEEKDAYS,
  LAST_HOUR,
  LESSON_TYPES,
  WEEKDAYS,
  calendarScale,
  findBlockOverlap,
  colorForType,
  findClash,
  findLessonNote,
  fromDateKey,
  nextLessonTime,
  toDateKey,
  isLessonActiveOn,
  syncLessonNote,
  formatHour,
  formatTime,
  newId,
  placeFor,
  todayIndex,
  unavailableStretches,
  weekDates,
  type AvailabilityBlock,
  type Lesson,
} from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, lessonColors, radius } from "../theme";

const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index); // 6 AM ... 9 PM

// Where a time sits on the grid, in pixels from the top (6 AM = 0). `hourHeight` changes with the zoom.
const topFor = (minutes: number, hourHeight: number) => ((minutes - FIRST_HOUR * 60) / 60) * hourHeight;
const ZOOM_STEP = 1.25; // each tap on − or + changes the hour height by a quarter
const MIN_GRID_HEIGHT = 280; // on a small screen the calendar box never gets shorter than this
const TIME_COLUMN_WIDTH = 52; // the hour labels down the left side
const DAY_HEADER_HEIGHT = 52; // the "MON 3" row at the top of each day in Week view
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
// The zoom (pixels per hour), kept the same way so it stays as the coach left it when they come back.
let rememberedHourHeight = DEFAULT_HOUR_HEIGHT;

// The distance between two fingers, for pinch to zoom.
function fingerDistance(event: GestureResponderEvent) {
  const [a, b] = event.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

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
  // The empty time under the coach's finger right now, shown as a dashed "+" slot until they let go.
  const [pressedSlot, setPressedSlot] = useState<{ day: number; start: number } | null>(null);
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

  // --- Size of the calendar box ---
  // The calendar is a box you scroll inside (up and down for the hours, sideways for the days). It's
  // sized to fill the screen once the "Calendar" title has scrolled away, so when the tab opens it
  // reaches a little past the bottom; swipe up on the week bar or the Day/Week row to see all of it.
  // To size it we measure: the whole screen area (rootHeight), the title (heading), where the card
  // starts (cardTop), the bar above the grid (week arrows, and the day strip in Day view), the legend
  // under it, and the box's width.
  const screenSize = useWindowDimensions();
  const [measured, setMeasured] = useState({ rootHeight: 0, heading: 0, cardTop: 0, aboveGrid: 0, legend: 0, gridWidth: 0 });
  const measure = (key: keyof typeof measured) => (event: { nativeEvent: { layout: { y: number; height: number; width: number } } }) => {
    const { y, height, width } = event.nativeEvent.layout;
    const value = key === "cardTop" ? y : key === "gridWidth" ? width : height;
    setMeasured((current) => (Math.abs(current[key] - value) < 1 ? current : { ...current, [key]: value }));
  };
  // cardTop - heading = what stays above the card once the title is scrolled away (the Day/Week row).
  // 2 = the card's top and bottom border, 12 = a little room above the tab bar.
  const gridHeight = measured.rootHeight
    ? Math.max(MIN_GRID_HEIGHT, measured.rootHeight - (measured.cardTop - measured.heading) - measured.aboveGrid - measured.legend - 2 - 12)
    : Math.max(MIN_GRID_HEIGHT, screenSize.height * 0.5); // first frame, before anything is measured
  const gridWidth = measured.gridWidth || screenSize.width - 42;
  const headerHeight = mode === "Week" ? DAY_HEADER_HEIGHT : 0;

  // --- Zoom ---
  // calendarScale (data.ts) turns the wished-for hour height into the real hour height and day width:
  // fully zoomed out shows 12 hours and all 7 days in the box.
  const [wantedHourHeight, setWantedHourHeight] = useState(rememberedHourHeight);
  const scale = calendarScale(wantedHourHeight, { width: gridWidth - TIME_COLUMN_WIDTH - 1, height: gridHeight - headerHeight });
  const { hourHeight } = scale;
  // The start time for a touch `locationY` pixels below 6 AM, rounded down to 15 minutes (tapping just
  // after 4 PM gives 4:00), and never later than 9:45 PM so a lesson still fits.
  const slotStart = (locationY: number) => Math.min(FIRST_HOUR * 60 + Math.floor((locationY / hourHeight) * 4) * 15, (LAST_HOUR - 1) * 60 + 45);
  const dayWidth = mode === "Week" ? scale.dayWidth : 0; // Day view: the one day fills the width
  const latestScale = useRef(scale);
  latestScale.current = scale;
  function zoomTo(wanted: number) {
    rememberedHourHeight = wanted;
    setWantedHourHeight(wanted);
  }
  // −/+ start from the real (clamped) size, so a tap always does something visible.
  const zoomBy = (factor: number) => zoomTo(calendarScale(scale.hourHeight * factor, { width: gridWidth - TIME_COLUMN_WIDTH - 1, height: gridHeight - headerHeight }).hourHeight);

  // Pinch with two fingers anywhere on the grid. The responder "captures" two-finger touches before the
  // scroll views and lessons underneath see them; one finger still scrolls, taps and drags as before.
  // While pinching, the scroll views are switched off so the pinch doesn't also scroll.
  const [pinching, setPinching] = useState(false);
  const pinchStart = useRef<{ distance: number; hourHeight: number } | null>(null);
  const pincher = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length === 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pinchStart.current = null;
        setPinching(true);
      },
      onPanResponderMove: (event) => {
        if (event.nativeEvent.touches.length < 2) return;
        if (!pinchStart.current) {
          pinchStart.current = { distance: fingerDistance(event), hourHeight: latestScale.current.hourHeight };
          return;
        }
        const wanted = (pinchStart.current.hourHeight * fingerDistance(event)) / pinchStart.current.distance;
        zoomTo(Math.round(wanted * 2) / 2); // half-pixel steps, so tiny finger jitter doesn't redraw
      },
      onPanResponderRelease: () => endPinch(),
      onPanResponderTerminate: () => endPinch(),
    }),
  ).current;
  function endPinch() {
    pinchStart.current = null;
    setPinching(false);
    zoomTo(latestScale.current.hourHeight); // forget any pinch past the limits
  }

  // --- Scrolling inside the box ---
  // The up-and-down scroll holds the hour labels and the days together. Inside it, the days scroll
  // sideways on their own, so the hour labels stay on the left. The day names row sits above both and
  // slides sideways with the days (scrollX moves it on the native side, so it doesn't lag behind).
  const hourScroll = useRef<ScrollView>(null);
  const weekScroll = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const offset = useRef({ x: 0, y: 0 });
  const onWeekScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current.x = event.nativeEvent.contentOffset.x;
    },
  });
  useEffect(() => {
    // Switching Week/Day makes a new sideways scroll that starts at the left.
    scrollX.setValue(0);
    offset.current.x = 0;
  }, [mode, scrollX]);

  // When the zoom changes, keep the middle of what you were looking at in the middle.
  const lastSize = useRef({ hourHeight, dayWidth });
  useEffect(() => {
    const before = lastSize.current;
    lastSize.current = { hourHeight, dayWidth };
    if (before.hourHeight !== hourHeight) {
      const middle = (gridHeight - headerHeight) / 2;
      const y = Math.max(0, ((offset.current.y + middle) * hourHeight) / before.hourHeight - middle);
      offset.current.y = y;
      hourScroll.current?.scrollTo({ y, animated: false });
    }
    if (mode === "Week" && before.dayWidth && before.dayWidth !== dayWidth) {
      const middle = (gridWidth - TIME_COLUMN_WIDTH) / 2;
      const x = Math.max(0, ((offset.current.x + middle) * dayWidth) / before.dayWidth - middle);
      offset.current.x = x;
      weekScroll.current?.scrollTo({ x, animated: false });
    }
  }, [hourHeight, dayWidth, gridHeight, gridWidth, headerHeight, mode]);

  // Week view is usually wider than the box, so "Today" (and opening the calendar) scrolls the days
  // sideways to put today's column on screen, with yesterday just before it.
  const scrolledOnce = useRef(false);
  function scrollToToday() {
    weekScroll.current?.scrollTo({ x: Math.max(0, (todayIndex() - 1) * scale.dayWidth), animated: true });
  }
  function scrollToTodayOnce() {
    if (scrolledOnce.current || mode !== "Week") return;
    scrolledOnce.current = true;
    scrollToToday();
  }

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
    <View onLayout={measure("rootHeight")} style={{ flex: 1 }}>
    <Screen scrollEnabled={draggingDay === null && !pinching}>
      {/* Kept short so the calendar gets the room. Adding a lesson is the "Add lesson" button at the top. */}
      <View onLayout={measure("heading")}>
        <Heading description="Tap a time to add a lesson. Pinch or use − and + to zoom." eyebrow="Schedule" title="Calendar" />
      </View>

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Segmented onChange={setMode} options={MODES} value={mode} />
        </View>
        <Button
          icon="clock"
          label={availability.length ? `Availability (${availability.length})` : "Availability"}
          onPress={() => setAvailabilityOpen(true)}
          variant="secondary"
        />
      </View>

      <View onLayout={measure("cardTop")}>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <View onLayout={measure("aboveGrid")}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 12, borderBottomWidth: 1, borderBottomColor: "#e8edf1" }}>
          <IconButton icon="chevronLeft" label="Previous week" onPress={() => setWeekOffset((value) => value - 1)} size={32} />
          <IconButton icon="chevron" label="Next week" onPress={() => setWeekOffset((value) => value + 1)} size={32} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}>{formatRange(weekOffset)}</Text>
          {/* Zoom out (down to 12 hours × 7 days) and in. Greyed out at the limit. Pinching does the same. */}
          <IconButton color={scale.canZoomOut ? colors.subtle : colors.input} icon="minus" label="Zoom out" onPress={() => zoomBy(1 / ZOOM_STEP)} size={32} />
          <IconButton color={scale.canZoomIn ? colors.subtle : colors.input} icon="plus" label="Zoom in" onPress={() => zoomBy(ZOOM_STEP)} size={32} />
          <Button
            label="Today"
            onPress={() => {
              setWeekOffset(0);
              setSelectedDay(todayIndex());
              scrollToToday();
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
        </View>

        {/* The calendar box: a fixed height that fits the screen, scrolled inside. */}
        <View {...pincher.panHandlers} onLayout={measure("gridWidth")} style={{ height: gridHeight }}>
          {mode === "Week" ? (
            // Day names. Not inside the up-and-down scroll, so they stay at the top; they slide sideways
            // with the days (translateX follows the days' scroll).
            <View style={{ flexDirection: "row", height: DAY_HEADER_HEIGHT, borderBottomWidth: 1, borderBottomColor: "#e8edf1" }}>
              <View style={{ width: TIME_COLUMN_WIDTH, borderRightWidth: 1, borderRightColor: colors.borderSoft }} />
              <View style={{ flex: 1, overflow: "hidden" }}>
                <Animated.View style={{ flexDirection: "row", transform: [{ translateX: Animated.multiply(scrollX, -1) }] }}>
                  {visibleDays.map((dayIndex, position) => {
                    const day = dates[dayIndex];
                    return (
                      <View
                        key={day.label}
                        style={{
                          width: dayWidth,
                          height: DAY_HEADER_HEIGHT - 1,
                          alignItems: "center",
                          justifyContent: "center",
                          borderLeftWidth: position === 0 ? 0 : 1,
                          borderLeftColor: colors.borderSoft,
                          backgroundColor: day.isToday ? "#f8fbfb" : undefined,
                        }}
                      >
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
                    );
                  })}
                </Animated.View>
              </View>
            </View>
          ) : null}

          {/* Up and down: the hour labels and the days move together. */}
          <ScrollView
            onScroll={(event) => {
              offset.current.y = event.nativeEvent.contentOffset.y;
            }}
            ref={hourScroll}
            scrollEnabled={draggingDay === null && !pinching}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: "row" }}>
              {/* The hour labels sit outside the sideways scroll, so they stay on the left while the days scroll past. */}
              <View style={{ width: TIME_COLUMN_WIDTH, borderRightWidth: 1, borderRightColor: colors.borderSoft, backgroundColor: colors.card }}>
                {HOURS.map((hour) => (
                  <View key={hour} style={{ height: hourHeight, alignItems: "center", paddingTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#929da7" }}>{formatHour(hour)}</Text>
                  </View>
                ))}
              </View>
              {(() => {
                const columns = visibleDays.map((dayIndex, position) => {
                  const day = dates[dayIndex];
                  return (
                    <View
                      key={day.label}
                      style={{
                        width: mode === "Week" ? dayWidth : undefined,
                        flex: mode === "Day" ? 1 : undefined,
                        borderLeftWidth: position === 0 ? 0 : 1, // the hour labels column draws the first line
                        borderLeftColor: colors.borderSoft,
                        backgroundColor: day.isToday ? "#f8fbfb" : undefined,
                        zIndex: draggingDay === dayIndex ? 10 : 0, // a lesson dragged to another day stays visible
                      }}
                    >
                      <View style={{ position: "relative" }}>
                        {/* Tap an empty spot to add a lesson there. The time is rounded down to the 15 minutes
                            under your finger, e.g. tapping just after 4 PM starts the lesson at 4:00. Lessons sit
                            on top of this, so tapping a lesson still selects it instead. */}
                        <Pressable
                          accessibilityHint="Adds a lesson at this time"
                          accessibilityLabel={`Add a lesson on ${FULL_WEEKDAYS[dayIndex]}`}
                          // Touching an empty time shows a dashed "+" slot where the lesson would go (the phone's
                          // version of hovering). The short delay means a swipe to scroll doesn't flash it.
                          onPressIn={(event) => setPressedSlot({ day: dayIndex, start: slotStart(event.nativeEvent.locationY) })}
                          onPressOut={() => setPressedSlot(null)}
                          unstable_pressDelay={90}
                          onPress={(event) => {
                            const start = slotStart(event.nativeEvent.locationY);
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
                              <View key={hour} style={{ height: hourHeight, justifyContent: "flex-end" }}>
                                <DashedLine />
                              </View>
                            ))}
                          </View>
                        </Pressable>
                        {/* On a day with availability blocks, the time outside them gets light diagonal stripes
                            (the background stays white). It's only a hint: tapping there still adds a lesson
                            (pointerEvents="none"), and lessons are drawn on top. Days without blocks stay plain. */}
                        {unavailableStretches(dayIndex, availability).map((stretch) => {
                          const top = topFor(stretch.start, hourHeight);
                          const height = topFor(stretch.end, hourHeight) - top;
                          return (
                            <View key={`off-${stretch.start}`} pointerEvents="none" style={{ position: "absolute", top, height, left: 0, right: 0, overflow: "hidden" }}>
                              <Stripes height={height} width={dayWidth || gridWidth} />
                            </View>
                          );
                        })}
                        {/* Availability blocks: a faint dashed outline, so open time reads as a slot you can fill.
                            The place name sits in the top corner. */}
                        {availability
                          .filter((block) => block.day === dayIndex)
                          .map((block) => (
                            <View
                              key={block.id}
                              pointerEvents="none"
                              style={{
                                position: "absolute",
                                top: topFor(block.start, hourHeight) + 1,
                                height: topFor(block.end, hourHeight) - topFor(block.start, hourHeight) - 2,
                                left: 2,
                                right: 2,
                                borderWidth: 1,
                                borderStyle: "dashed",
                                borderColor: colors.availableEdge,
                                borderRadius: radius.sm,
                                paddingHorizontal: 4,
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
                        {pressedSlot?.day === dayIndex ? (
                          <View
                            pointerEvents="none"
                            style={{
                              position: "absolute",
                              top: topFor(pressedSlot.start, hourHeight) + 1,
                              height: Math.max(16, (Math.min(settings.lessonLength, LAST_HOUR * 60 - pressedSlot.start) / 60) * hourHeight - 2),
                              left: 3,
                              right: 3,
                              borderWidth: 1.5,
                              borderStyle: "dashed",
                              borderColor: colors.teal,
                              borderRadius: radius.sm,
                              backgroundColor: colors.tealSoft,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon color={colors.teal} name="plus" size={16} />
                          </View>
                        ) : null}
                        {lessons
                          .filter((lesson) => lesson.day === dayIndex && isLessonActiveOn(lesson, day.date))
                          .map((lesson) => (
                            <LessonBlock
                              active={lesson.id === selectedId}
                              dayWidth={dayWidth}
                              hourHeight={hourHeight}
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
                });
                // Week view: the days scroll sideways. Day view: the one day fills the width.
                return mode === "Week" ? (
                  <Animated.ScrollView
                    horizontal
                    onContentSizeChange={scrollToTodayOnce}
                    onScroll={onWeekScroll}
                    ref={weekScroll}
                    scrollEnabled={draggingDay === null && !pinching}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                  >
                    {columns}
                  </Animated.ScrollView>
                ) : (
                  <View style={{ flex: 1, flexDirection: "row" }}>{columns}</View>
                );
              })()}
            </View>
          </ScrollView>
        </View>

        <View onLayout={measure("legend")} style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 12, borderTopWidth: 1, borderTopColor: "#e8edf1" }}>
          <Legend color={lessonColors.teal.dot} label="Freestyle" />
          <Legend color={lessonColors.sand.dot} label="Public" />
          <Legend color={lessonColors.purple.dot} label="Off-ice" />
          {/* Only once there's availability to compare against. */}
          {availability.length ? (
            <>
              <Legend color={colors.card} dashed edge={colors.availableEdge} label="Available" square />
              <Legend color={colors.card} edge={colors.border} label="Not available" square striped />
            </>
          ) : null}
        </View>
      </Card>
      </View>

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
          // Tapping a day in this or a later week starts the lesson that week; earlier weeks start today.
          defaultStartDate={tapped && toDateKey(dates[tapped.day].date) > toDateKey(new Date()) ? toDateKey(dates[tapped.day].date) : undefined}
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
          // The note editor opens on the Lessons tab and brings the coach back here when it closes.
          if (detailNote) {
            navigate("Lessons", { kind: "openNote", noteId: detailNote.id, returnTo: "Calendar" });
          } else {
            navigate("Lessons", {
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
  defaultStartDate,
  defaultDuration,
  initial,
  onClose,
  onSave,
}: {
  students: { id: string; name: string }[];
  lessons: Lesson[];
  defaultDay: number;
  defaultStart?: number; // minutes after midnight; 9:00 AM when you use the Add button
  defaultStartDate?: string; // "2026-11-12": the day tapped on the calendar (today when using Add)
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
  // A weekly lesson runs from its start date (today at the earliest) until its end date, or forever.
  // Lessons saved before start dates existed have none ("Already running") until the coach picks one.
  const today = toDateKey(new Date());
  const [startDate, setStartDate] = useState<string | undefined>(initial ? initial.startDate : (defaultStartDate ?? today));
  const [endDate, setEndDate] = useState<string | undefined>(initial?.endDate);
  const firstLesson = nextLessonTime({ day: WEEKDAYS.indexOf(day), start, startDate }, startDate ? fromDateKey(startDate) : new Date());

  function changeDuration(minutes: number) {
    setDuration(minutes);
    setDurationText(String(minutes));
  }
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
    if (startDate && startDate < today && startDate !== initial?.startDate) {
      Alert.alert("Check the start date", "A weekly lesson can start today at the earliest. To record a lesson that already happened, add a past lesson on the Lessons tab.");
      return;
    }
    if (endDate && startDate && endDate < startDate) {
      Alert.alert("Check the end date", "The end date needs to be on or after the start date.");
      return;
    }
    // Editing keeps the same id, so findClash doesn't count the lesson as clashing with itself.
    const lesson: Lesson = { id: initial?.id ?? newId(), studentId, day: WEEKDAYS.indexOf(day), start, type, duration, color: colorForType(type), createdAt: initial?.createdAt ?? new Date().toISOString(), startDate, endDate };
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
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <DateField
            emptyLabel="Already running"
            label="Starts"
            minimum={initial?.startDate && initial.startDate < today ? initial.startDate : today}
            onChange={setStartDate}
            value={startDate}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DateField emptyLabel="No end date" label="Ends (optional)" minimum={startDate ?? today} onChange={setEndDate} onClear={() => setEndDate(undefined)} value={endDate} />
        </View>
      </View>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: -6, marginBottom: 16 }}>
        {firstLesson
          ? `Every ${FULL_WEEKDAYS[WEEKDAYS.indexOf(day)]} at ${formatTime(start)}${endDate ? ` until ${formatDateKey(endDate)}` : ""}. ${startDate ? `First lesson: ${firstLesson.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}.` : ""}`
          : "No lessons fall between these dates. Move the end date later."}
      </Text>
    </Sheet>
  );
}

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
  student?: { name: string };
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
        {place ? (
          <View style={{ marginTop: 10 }}>
            <Meta icon="home" text={place} />
          </View>
        ) : null}
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
  hourHeight,
  onSelect,
  onMove,
  onDragChange,
}: {
  lesson: Lesson;
  name: string;
  active: boolean;
  dayWidth: number; // 0 in Day view, where lessons can only move up and down
  hourHeight: number; // pixels per hour at the current zoom
  onSelect: () => void;
  onMove: (changes: Partial<Pick<Lesson, "day" | "start" | "duration">>) => void;
  onDragChange: (dragging: boolean) => void;
}) {
  // How far the finger has moved while dragging, in pixels; null when not dragging.
  const [move, setMove] = useState<{ dx: number; dy: number } | null>(null);
  const [stretch, setStretch] = useState<number | null>(null);
  // The responders are made once, so they read the newest props through this ref (same trick as RinkMap).
  const latest = useRef({ lesson, active, dayWidth, hourHeight, onMove, onDragChange });
  latest.current = { lesson, active, dayWidth, hourHeight, onMove, onDragChange };

  const snap = (pixels: number) => Math.round(((pixels / latest.current.hourHeight) * 60) / 15) * 15; // pixels → minutes, in 15s

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
  // Zoomed out, lessons get small: drop the second line and the padding so the name still fits.
  const height = Math.max(14, (duration / 60) * hourHeight - 4);
  const compact = height < 36;
  const inset = dayWidth && dayWidth < 60 ? 2 : 5;

  return (
    <View
      {...mover.panHandlers}
      style={{
        position: "absolute",
        top: topFor(preview.start, hourHeight) + 2,
        height,
        left: inset + (preview.day - lesson.day) * dayWidth,
        right: inset - (preview.day - lesson.day) * dayWidth,
        zIndex: dragging ? 5 : active ? 2 : 1,
        opacity: dragging ? 0.9 : 1,
        // A small shadow lifts the card off the stripes and dashed lines behind it; a bigger one while dragging.
        shadowColor: colors.text,
        shadowOpacity: dragging ? 0.18 : 0.12,
        shadowRadius: dragging ? 8 : 2.5,
        shadowOffset: { width: 0, height: dragging ? 3 : 1 },
      }}
    >
      <Pressable
        // The card only shows the length (the color says the type), so VoiceOver gets the full details.
        accessibilityLabel={`${name} · ${lesson.type} · ${lesson.duration}m`}
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
          paddingHorizontal: compact ? 4 : 7,
          paddingVertical: compact ? 1 : 7,
          borderWidth: active ? 1.5 : 0,
          borderColor: active ? palette.border : undefined,
        }}
      >
        <Text numberOfLines={1} style={{ fontSize: compact ? 10 : 12, fontWeight: "700", color: palette.text }}>
          {compact && dragging ? formatTime(preview.start) : name}
        </Text>
        {/* Second line: a clock and the length ("60m"), short enough not to get cut off in a narrow
            day. The lesson type is already shown by the color (see the legend). While dragging it shows
            the new start time, and while stretching the new length. */}
        {compact ? null : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2, opacity: 0.75 }}>
            <Icon color={palette.text} name="clock" size={10} />
            <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 10, color: palette.text }}>
              {stretch !== null ? `${duration}m` : move !== null ? formatTime(preview.start) : `${lesson.duration}m`}
            </Text>
          </View>
        )}
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
// A day picker that opens the iOS date wheel inline (a pop-up can't open over a Sheet on iOS).
// `minimum` stops earlier days (e.g. a weekly lesson can't start in the past). onClear adds a "Clear" link.
function DateField({
  label,
  value,
  minimum,
  emptyLabel,
  onChange,
  onClear,
}: {
  label: string;
  value: string | undefined;
  minimum?: string;
  emptyLabel: string;
  onChange: (key: string) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <Pressable
        accessibilityLabel={`${label}, ${value ? formatDateKey(value) : emptyLabel}`}
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={{
          borderWidth: 1,
          borderColor: open ? colors.teal : colors.border,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: colors.white,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "600", color: value ? colors.text : colors.muted }}>{value ? formatDateKey(value) : emptyLabel}</Text>
      </Pressable>
      {value && onClear ? (
        <Pressable accessibilityRole="button" onPress={() => { onClear(); setOpen(false); }} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.tealDark }}>Clear</Text>
        </Pressable>
      ) : null}
      {open ? (
        <DateTimePicker
          display="spinner"
          minimumDate={minimum ? fromDateKey(minimum) : undefined}
          mode="date"
          onChange={(_event, date) => date && onChange(toDateKey(date))}
          style={{ alignSelf: "stretch" }}
          value={value ? fromDateKey(value) : minimum ? fromDateKey(minimum) : new Date()}
        />
      ) : null}
    </View>
  );
}

// "2026-11-12" → "Thu, Nov 12"
function formatDateKey(key: string) {
  return fromDateKey(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

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

// A dot for a lesson type, or a small square for the availability marks: dashed for available,
// striped for not available (matching the grid).
function Legend({
  color,
  label,
  square,
  edge,
  dashed,
  striped,
}: {
  color: string;
  label: string;
  square?: boolean;
  edge?: string;
  dashed?: boolean;
  striped?: boolean;
}) {
  const size = square ? 12 : 8;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: square ? 2 : 4,
          backgroundColor: color,
          borderWidth: edge ? 1 : 0,
          borderStyle: dashed ? "dashed" : "solid",
          borderColor: edge,
          overflow: "hidden",
        }}
      >
        {striped ? <Stripes height={size} width={size} /> : null}
      </View>
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#75828e" }}>{label}</Text>
    </View>
  );
}

// A faint dashed line across the grid at the end of each hour, so open time matches the dashed
// "Available" mark in the legend. iOS only draws dashed borders when all four sides are dashed, so this
// is a 1 px tall window onto the top edge of a dashed box.
function DashedLine() {
  return (
    <View style={{ height: 1, overflow: "hidden" }}>
      <View style={{ height: 2, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border }} />
    </View>
  );
}

// Light diagonal stripes filling a width × height area, for time outside the coach's availability.
// One SVG path of parallel 45° lines, 8 px apart; the SVG cuts off whatever runs past its edges.
const STRIPE_GAP = 8;
function Stripes({ width, height }: { width: number; height: number }) {
  let path = "";
  for (let x = -height; x < width; x += STRIPE_GAP) path += `M${x} ${height}L${x + height} 0`;
  return (
    <Svg height={height} style={{ position: "absolute", top: 0, left: 0 }} width={width}>
      <Path d={path} stroke={colors.unavailable} strokeWidth={1.5} />
    </Svg>
  );
}
