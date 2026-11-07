import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "./src/components/Icon";
import type { Intent, ScreenProps, Tab } from "./src/navigation";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LessonsScreen } from "./src/screens/LessonsScreen";
import { ProgramsScreen } from "./src/screens/ProgramsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { StudentsScreen } from "./src/screens/StudentsScreen";
import { StoreProvider } from "./src/store";
import { colors, radius } from "./src/theme";

const TABS: { tab: Tab; icon: IconName; label: string }[] = [
  { tab: "Dashboard", icon: "home", label: "Home" },
  { tab: "Students", icon: "students", label: "Students" },
  { tab: "Calendar", icon: "calendar", label: "Calendar" },
  { tab: "Programs", icon: "music", label: "Programs" },
  { tab: "Lessons", icon: "notes", label: "Lessons" },
];

const ADD_LABELS: Partial<Record<Tab, string>> = {
  Dashboard: "Add lesson",
  Students: "Add student",
  Calendar: "Add lesson",
  Programs: "New program",
  Lessons: "Add note",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [pending, setPending] = useState<{ tab: Tab; intent: Intent } | null>(null);

  const navigate = useCallback((next: Tab, intent?: Intent) => {
    setTab(next);
    setPending(intent ? { tab: next, intent } : null);
  }, []);
  const onIntentHandled = useCallback(() => setPending(null), []);

  function onAdd() {
    if (tab === "Dashboard") navigate("Calendar", { kind: "add" });
    else if (tab !== "Settings") navigate(tab, { kind: "add" });
  }

  const props: ScreenProps = {
    intent: pending && pending.tab === tab ? pending.intent : null,
    onIntentHandled,
    navigate,
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: "#e6eaf0" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
            <Icon color={colors.white} name="logo" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", letterSpacing: -0.6, color: colors.text }}>SkatePod</Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: "#84909e" }}>
              {today}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => navigate("Settings")}
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tab === "Settings" ? colors.tealSoft : "#f4f6f8",
            }}
          >
            <Icon color={tab === "Settings" ? colors.navy : colors.subtle} name="settings" size={20} />
          </Pressable>
          {ADD_LABELS[tab] ? (
            <Pressable
              accessibilityLabel={ADD_LABELS[tab]}
              accessibilityRole="button"
              onPress={onAdd}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: 12,
                borderRadius: radius.md,
                backgroundColor: colors.navy,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Icon color={colors.white} name="plus" size={16} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>{ADD_LABELS[tab]}</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {tab === "Dashboard" ? <DashboardScreen {...props} /> : null}
        {tab === "Students" ? <StudentsScreen {...props} /> : null}
        {tab === "Calendar" ? <CalendarScreen {...props} /> : null}
        {tab === "Programs" ? <ProgramsScreen {...props} /> : null}
        {tab === "Lessons" ? <LessonsScreen {...props} /> : null}
        {tab === "Settings" ? <SettingsScreen {...props} /> : null}
      </View>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: "#e6eaf0" }}>
        <View style={{ flexDirection: "row", paddingTop: 6 }}>
          {TABS.map((item) => {
            const active = tab === item.tab;
            return (
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={item.tab}
                onPress={() => navigate(item.tab)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 6, gap: 3 }}
              >
                <Icon color={active ? colors.navy : "#8a96a3"} name={item.icon} size={22} />
                <Text style={{ fontSize: 10, fontWeight: active ? "700" : "600", color: active ? colors.navy : "#8a96a3" }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
