import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { Button, Card, DisciplineBadges, Empty, Heading, Screen, SearchBar, SectionTitle } from "../components/ui";
import { FULL_WEEKDAYS, WEEKDAYS, dashboardRows, disciplineSummary, formatTime, isLessonActiveOn, todayIndex, type DashboardRow, type Student } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, lessonColors } from "../theme";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen({ navigate }: ScreenProps) {
  const { students, lessons, settings, studentById } = useStore();
  const [query, setQuery] = useState("");
  const firstName = settings.coachName.split(" ")[0] || "Coach";

  const today = todayIndex();
  const todays = lessons.filter((lesson) => lesson.day === today && isLessonActiveOn(lesson, new Date())).sort((a, b) => a.start - b.start);
  const todaysMinutes = todays.reduce((sum, lesson) => sum + lesson.duration, 0);

  // One list for both jobs: the next lessons, or (while searching) each matching student and their next lesson.
  // `today` is in the deps so the list refreshes when the day changes.
  const rows = useMemo(() => dashboardRows(students, lessons, query), [students, lessons, query, today]);

  return (
    <Screen>
      <Heading description="Everything you need to guide your skaters today." eyebrow="Coach dashboard" title={`${greeting()}, ${firstName}`} />

      <Card style={{ backgroundColor: colors.tealPanel, borderColor: "#dfeaec", marginBottom: 20 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#315d64" }}>Today’s schedule</Text>
        <Text style={{ fontSize: 26, fontWeight: "700", letterSpacing: -0.8, color: colors.text, marginTop: 6 }}>
          {todays.length} {todays.length === 1 ? "lesson" : "lessons"}
        </Text>
        <Text style={{ fontSize: 12, color: "#71858a", marginTop: 2 }}>
          {Math.floor(todaysMinutes / 60)}h {todaysMinutes % 60}m on ice
        </Text>
      </Card>

      <View style={{ marginBottom: 20 }}>
        <SearchBar onChangeText={setQuery} placeholder="Search students..." value={query} />
      </View>

      <SectionTitle right={<Button label="Calendar" onPress={() => navigate("Calendar")} variant="link" />} title="Coming up" />
      {rows.length ? (
        <Card style={{ padding: 0 }}>
          {rows.map((row, index) => (
            <UpcomingRow
              first={index === 0}
              key={row.key}
              onPress={() => navigate("Students", { kind: "openStudent", studentId: row.studentId })}
              row={row}
              student={studentById(row.studentId)}
              today={today}
            />
          ))}
        </Card>
      ) : (
        <Empty text={query.trim() ? `No students match “${query.trim()}”.` : students.length ? "No lessons scheduled yet." : "No students yet. Add your first student."} />
      )}
    </Screen>
  );
}

/** One row of "Coming up": when, who (with their levels) and what kind of lesson. Tap to open the student. */
function UpcomingRow({
  row,
  student,
  today,
  first,
  onPress,
}: {
  row: DashboardRow;
  student: Student | undefined;
  today: number;
  first: boolean;
  onPress: () => void;
}) {
  const { lesson, time } = row;
  const name = student?.name ?? "Removed student";
  // What VoiceOver (and Maestro) reads for the whole row, e.g. "Lily Kim, Silver Freeskate · Bronze Pattern Dance, Tuesday 9:00 AM".
  const when = lesson && time ? `${lesson.day === today ? "Today" : FULL_WEEKDAYS[lesson.day]} ${formatTime(lesson.start)}` : "Not scheduled";
  return (
    <Pressable
      accessibilityLabel={student ? `${name}, ${disciplineSummary(student)}, ${when}` : `${name}, ${when}`}
      accessibilityRole="button"
      disabled={!student}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.borderSoft,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: lesson ? lessonColors[lesson.color].border : colors.borderSoft }} />
      <View style={{ width: 62 }}>
        {lesson ? (
          <>
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 1 }}>
              {lesson.day === today ? "TODAY" : WEEKDAYS[lesson.day]}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.body, marginTop: 2 }}>{formatTime(lesson.start)}</Text>
          </>
        ) : (
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted }}>Not scheduled</Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
          {name}
        </Text>
        {student && <DisciplineBadges disciplines={student.disciplines} />}
        {lesson && (
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {lesson.type} · {lesson.duration}m
          </Text>
        )}
      </View>
      {student && <Icon color={colors.faint} name="chevron" size={16} />}
    </Pressable>
  );
}
