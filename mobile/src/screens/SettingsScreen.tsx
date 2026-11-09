import { useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import * as api from "../api";
import { Button, Card, Field, Heading, PickerField, Screen, ToggleRow } from "../components/ui";
import { SAMPLE_SETTINGS } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors } from "../theme";

const LENGTHS = ["30", "45", "60"] as const;

export function SettingsScreen(_props: ScreenProps) {
  const { settings, setSettings, students, source, reloadFromBackend, lessons, notes, programs, resetSampleData } = useStore();
  const [checking, setChecking] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const set = (changes: Partial<typeof draft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setSaved(false);
  };

  function save() {
    setSettings(draft);
    setSaved(true);
  }

  function exportBackup() {
    const backup = { exportedAt: new Date().toISOString(), students, lessons, notes, programs, settings };
    Share.share({ title: "SkatePod backup", message: JSON.stringify(backup, null, 2) }).catch(() => {});
  }

  // Sends GET /api/students. The backend terminal prints a line for it, and so does the Expo terminal.
  async function testConnection() {
    setChecking(true);
    try {
      const result = await api.checkConnection();
      Alert.alert("Connected", `The backend answered in ${result.millis} ms and has ${result.students} students.`);
      reloadFromBackend();
    } catch (error) {
      Alert.alert("Not connected", error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  }

  function reset() {
    Alert.alert("Reset to sample data?", "This replaces all students, lessons, notes, programs and settings on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetSampleData();
          setDraft(SAMPLE_SETTINGS);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Heading description="Manage your coach profile, defaults, sharing, and local data." eyebrow="Workspace preferences" title="Settings" />

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Coach profile</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3, marginBottom: 16 }}>Shown on schedules and shared training histories.</Text>
        <Field autoCapitalize="words" label="Coach name" onChangeText={(coachName) => set({ coachName })} value={draft.coachName} />
        <Field autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={(email) => set({ email })} value={draft.email} />
        <PickerField
          label="Default lesson length"
          onChange={(value) => set({ lessonLength: Number(value) })}
          options={LENGTHS}
          renderLabel={(value) => `${value} minutes`}
          value={String(draft.lessonLength) as (typeof LENGTHS)[number]}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Workflow</Text>
        <ToggleRow
          description="Show reminders before scheduled lessons."
          label="Lesson reminders"
          onChange={(reminders) => set({ reminders })}
          value={draft.reminders}
        />
        <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
        <ToggleRow
          description="Include new lesson notes in read-only histories by default."
          label="Share notes by default"
          onChange={(sharedNotes) => set({ sharedNotes })}
          value={draft.sharedNotes}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Backend</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3, marginBottom: 14 }}>
          {api.API_URL
            ? `Students, lessons, notes and programs are saved on the backend at ${api.API_URL}. Availability and settings stay on this phone for now.`
            : "Not set up: everything is stored on this phone. To use the backend, add EXPO_PUBLIC_API_URL to mobile/.env and restart Expo."}
        </Text>
        <Button
          label={checking ? "Testing…" : "Test connection"}
          onPress={testConnection}
          variant="secondary"
          disabled={!api.API_URL || checking}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Your data</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3, marginBottom: 14 }}>
          {source === "backend"
            ? "Students, lessons, notes and programs are on the backend. Availability and settings are stored on this phone. Export a backup."
            : "Everything is stored on this phone. Export a backup of students, lessons, notes, and programs."}
        </Text>
        <View style={{ gap: 10 }}>
          <Button icon="share" label="Export backup" onPress={exportBackup} variant="secondary" />
          <Button label="Reset to sample data" onPress={reset} variant="danger" />
        </View>
      </Card>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
        {saved ? <Text style={{ fontSize: 13, fontWeight: "600", color: "#4d8589" }}>Changes saved</Text> : null}
        <Button label="Save settings" onPress={save} />
      </View>
    </Screen>
  );
}
