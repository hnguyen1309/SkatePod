import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { RinkMap } from "../components/RinkMap";
import { Card, Chips, Field, Heading, IconButton, Label, PickerField, ProgressBar, Screen, Segmented } from "../components/ui";
import { DEFAULT_PROGRAM, TRACKS, TRACK_LEVELS, eligibleElements, type ProgramData, type ProgramElement, type Track } from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, radius } from "../theme";

const VIEWS = ["Component sheet", "Rink map"] as const;
type View_ = (typeof VIEWS)[number];
const CATEGORIES = ["All", "Jump", "Spin", "Sequence", "Choreography"] as const;
type Category = (typeof CATEGORIES)[number];

export function ProgramsScreen({ intent, onIntentHandled }: ScreenProps) {
  const { students, programs, setPrograms } = useStore();
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  const [view, setView] = useState<View_>("Component sheet");
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const current: ProgramData = { ...DEFAULT_PROGRAM, ...programs[studentId] };
  const allowed = eligibleElements(current.track, current.level);
  const nameOf = (id: string) => students.find((student) => student.id === id)?.name ?? "Student";

  useEffect(() => {
    if (!studentIds.includes(studentId) && studentIds[0]) setStudentId(studentIds[0]);
  }, [studentIds, studentId]);

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add" && studentId) {
      Alert.alert("Start a new program?", `This clears ${nameOf(studentId)}’s current program.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start new",
          style: "destructive",
          onPress: () =>
            setPrograms((all) => {
              const next = { ...all };
              delete next[studentId];
              return next;
            }),
        },
      ]);
    }
    onIntentHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  function update(changes: Partial<ProgramData>) {
    if (!studentId) return;
    setPrograms((all) => ({ ...all, [studentId]: { ...DEFAULT_PROGRAM, ...all[studentId], ...changes } }));
  }

  const counts = current.elements.reduce<Record<string, number>>((result, element) => {
    result[element.category] = (result[element.category] ?? 0) + 1;
    return result;
  }, {});

  if (!studentIds.length) {
    return (
      <Screen>
        <Heading description="Add a student first, then build their program here." eyebrow="Program builder" title="Program components" />
      </Screen>
    );
  }

  return (
    <Screen scrollEnabled={scrollEnabled}>
      <Heading
        description="Select eligible elements, set their skating order, and map the program on the rink."
        eyebrow="Program builder"
        title="Program components"
      />

      <PickerField label="Student" onChange={setStudentId} options={studentIds} renderLabel={nameOf} value={studentId} />

      <Card style={{ marginBottom: 16 }}>
        <PickerField
          label="Track"
          onChange={(track: Track) => update({ track, level: TRACK_LEVELS[track][0], elements: [] })}
          options={TRACKS}
          value={current.track}
        />
        <PickerField
          label="Level"
          onChange={(level: string) => update({ level, elements: [] })}
          options={TRACK_LEVELS[current.track] as readonly string[]}
          value={current.level}
        />
        <Field label="Music" onChangeText={(musicTitle) => update({ musicTitle })} value={current.musicTitle} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1.4 }}>
            <Field label="Artist" onChangeText={(artist) => update({ artist })} value={current.artist} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Duration" onChangeText={(duration) => update({ duration })} value={current.duration} />
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{current.musicTitle}</Text>
        <Text style={{ fontSize: 13, color: "#7c8996", marginTop: 3, marginBottom: 14 }}>
          {nameOf(studentId)} · {current.track} · {current.level}
        </Text>
        <View style={{ marginBottom: 16 }}>
          <Segmented onChange={setView} options={VIEWS} value={view} />
        </View>
        {view === "Component sheet" ? (
          <ComponentSheet allowed={allowed} elements={current.elements} onChange={(elements) => update({ elements })} />
        ) : (
          <RinkMap
            elements={current.elements}
            onDrawingChange={(drawing) => setScrollEnabled(!drawing)}
            onPathsChange={(paths) => update({ paths })}
            onPlacementsChange={(placements) => update({ placements })}
            paths={current.paths}
            placements={current.placements}
          />
        )}
      </Card>

      <Card style={{ backgroundColor: colors.tealSoft, borderColor: "#dce7e9", marginBottom: 16 }}>
        <Label>Selected classification</Label>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{current.level}</Text>
        <Text style={{ fontSize: 12, color: "#6c8285", marginTop: 3 }}>
          {current.track} track · {allowed.length} catalog elements
        </Text>
        <View style={{ gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#d6e5e6" }}>
          <Requirement label="Jump elements" percent={(counts.Jump ?? 0) * 20} used={counts.Jump ?? 0} />
          <Requirement label="Spin elements" percent={(counts.Spin ?? 0) * 34} used={counts.Spin ?? 0} />
          <Requirement
            label="Sequences"
            percent={((counts.Sequence ?? 0) + (counts.Choreography ?? 0)) * 50}
            used={(counts.Sequence ?? 0) + (counts.Choreography ?? 0)}
          />
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#354654" }}>Catalog note</Text>
        <Text style={{ fontSize: 12, color: "#71808f", lineHeight: 18, marginTop: 6 }}>
          Element availability follows the selected Championship, Aspire, or Adult progression. Competition requirements can change by season;
          verify the final sheet against the current governing-body rulebook.
        </Text>
      </Card>
    </Screen>
  );
}

function ComponentSheet({
  allowed,
  elements,
  onChange,
}: {
  allowed: ProgramElement[];
  elements: ProgramElement[];
  onChange: (elements: ProgramElement[]) => void;
}) {
  const [category, setCategory] = useState<Category>("All");
  const visible = category === "All" ? allowed : allowed.filter((element) => element.category === category);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= elements.length) return;
    const next = [...elements];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>Program components sheet</Label>
        <View style={{ backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.tealDark }}>{elements.length} elements</Text>
        </View>
      </View>

      <View style={{ borderWidth: 1, borderColor: "#e1e7eb", borderRadius: radius.md, overflow: "hidden", marginBottom: 20 }}>
        {elements.length ? (
          elements.map((element, index) => (
            <View
              key={`${element.code}-${index}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderTopWidth: index ? 1 : 0, borderTopColor: "#e8edf1" }}
            >
              <Text style={{ width: 22, fontSize: 12, fontWeight: "700", color: colors.muted }}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={{ width: 48, fontSize: 13, fontWeight: "800", color: colors.tealDark }}>{element.code}</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  {element.title}
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted, marginTop: 1 }}>{element.category}</Text>
              </View>
              <IconButton icon="up" label="Move up" onPress={() => move(index, -1)} size={28} />
              <IconButton icon="down" label="Move down" onPress={() => move(index, 1)} size={28} />
              <IconButton
                background={colors.dangerSoft}
                color={colors.danger}
                icon="close"
                label="Remove"
                onPress={() => onChange(elements.filter((_, itemIndex) => itemIndex !== index))}
                size={28}
              />
            </View>
          ))
        ) : (
          <Text style={{ padding: 20, textAlign: "center", fontSize: 13, color: colors.muted }}>Add eligible elements below to begin the sheet.</Text>
        )}
      </View>

      <Label>Add eligible elements</Label>
      <View style={{ marginBottom: 10 }}>
        <Chips onChange={setCategory} options={CATEGORIES} value={category} />
      </View>
      <View style={{ gap: 8 }}>
        {visible.map((element) => (
          <Pressable
            accessibilityRole="button"
            key={element.code}
            onPress={() => onChange([...elements, element])}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 10,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: "#e0e6ea",
                backgroundColor: colors.white,
              },
              pressed && { backgroundColor: "#f5fafa", borderColor: "#84afb2" },
            ]}
          >
            <View style={{ width: 40, height: 32, borderRadius: radius.sm, backgroundColor: colors.tealSoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.tealDark }}>{element.code}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                {element.title}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>{element.category}</Text>
            </View>
            <Icon color={colors.subtle} name="plus" size={16} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Requirement({ label, used, percent }: { label: string; used: number; percent: number }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#637b7e" }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#365f64" }}>{used} selected</Text>
      </View>
      <ProgressBar percent={Math.min(100, percent)} trackColor="rgba(255,255,255,0.8)" />
    </View>
  );
}
