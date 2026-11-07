import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { Avatar, Card, DisciplineBadges, Empty, Heading, Screen, SearchBar, SectionTitle, Button } from "../components/ui";
import { WEEKDAYS, formatTime, disciplineSummary, initialsOf, nextLessonLabel, todayIndex, type Student } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, lessonColors, radius } from "../theme";

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

  const filtered = students.filter((student) =>
    `${student.name} ${disciplineSummary(student)}`.toLowerCase().includes(query.toLowerCase()),
  );

  const today = todayIndex();
  const todays = lessons.filter((lesson) => lesson.day === today).sort((a, b) => a.start - b.start);
  const todaysMinutes = todays.reduce((sum, lesson) => sum + lesson.duration, 0);

  const upcoming = useMemo(() => {
    const ordered = [...lessons].sort((a, b) => {
      const dayA = (a.day - today + 7) % 7;
      const dayB = (b.day - today + 7) % 7;
      return dayA - dayB || a.start - b.start;
    });
    return ordered.slice(0, 6);
  }, [lessons, today]);

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

      <SectionTitle
        right={<Button label="View all" onPress={() => navigate("Students")} variant="link" />}
        title={`Your students · ${students.length}`}
      />
      {filtered.length ? (
        <View style={{ gap: 12, marginBottom: 28 }}>
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              nextLesson={nextLessonLabel(student.id, lessons)}
              onPress={() => navigate("Students", { kind: "openStudent", studentId: student.id })}
              student={student}
            />
          ))}
        </View>
      ) : (
        <View style={{ marginBottom: 28 }}>
          <Empty text={query ? `No students match “${query}”.` : "No students yet. Add your first student."} />
        </View>
      )}

      <SectionTitle right={<Button label="Calendar" onPress={() => navigate("Calendar")} variant="link" />} title="Coming up" />
      <Card style={{ padding: 0 }}>
        {upcoming.length ? (
          upcoming.map((lesson, index) => {
            const student = studentById(lesson.studentId);
            const palette = lessonColors[lesson.color];
            return (
              <View
                key={lesson.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderTopWidth: index ? 1 : 0,
                  borderTopColor: colors.borderSoft,
                }}
              >
                <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: palette.border }} />
                <View style={{ width: 62 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 1 }}>
                    {lesson.day === today ? "TODAY" : WEEKDAYS[lesson.day]}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.body, marginTop: 2 }}>{formatTime(lesson.start)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{student?.name ?? "Removed student"}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {lesson.type} · {lesson.duration}m
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ padding: 16, color: colors.muted }}>No lessons scheduled yet.</Text>
        )}
      </Card>
    </Screen>
  );
}

function StudentCard({ student, nextLesson, onPress }: { student: Student; nextLesson: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar initials={initialsOf(student.name)} size={44} tone={student.tone} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              {student.name}
            </Text>
            <View style={{ marginTop: 4 }}>
              <DisciplineBadges disciplines={student.disciplines} />
            </View>
          </View>
          <Icon color={colors.faint} name="chevron" size={16} />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            backgroundColor: "#f7f9fa",
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Icon color="#5f9195" name="clock" size={15} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.subtle }}>{nextLesson}</Text>
        </View>
      </Card>
    </Pressable>
  );
}
