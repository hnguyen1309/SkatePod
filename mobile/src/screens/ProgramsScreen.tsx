import { useEffect, useRef, useState } from "react";
import { Alert, Linking, PanResponder, Text, View } from "react-native";
import { Icon } from "../components/Icon";
import { RinkMap } from "../components/RinkMap";
import { Button, Card, Dropdown, Field, Heading, IconButton, Label, Screen, Segmented } from "../components/ui";
import {
  DEFAULT_PROGRAM,
  ELEMENT_CATALOG,
  REQUIREMENTS_CHECKED,
  REQUIREMENTS_PAGE_URL,
  REQUIREMENTS_SEASON,
  TRACKS,
  TRACK_LEVELS,
  requirementLinks,
  validTrackAndLevel,
  type ProgramData,
  type ProgramElement,
  type Track,
} from "../data";
import type { ScreenProps } from "../navigation";
import { useStore } from "../store";
import { colors, radius } from "../theme";

const VIEWS = ["Component sheet", "Rink map"] as const;
type View_ = (typeof VIEWS)[number];
// The same three groups U.S. Figure Skating's PPC form uses, so coaches already know where to look.
const ELEMENT_TYPES = ["Jumps", "Spins", "Steps & Spirals"] as const;
type ElementType = (typeof ELEMENT_TYPES)[number];

function typeOf(element: ProgramElement): ElementType {
  if (element.category === "Jump") return "Jumps";
  if (element.category === "Spin") return "Spins";
  return "Steps & Spirals"; // step, choreographic and spiral sequences
}

// Jump combinations, like EMS: pick "2 Jump Combination" first, then each jump (move) in order.
// The combination is saved as one element with a code like "1S+1T".
const COMBINATIONS: Record<string, number> = { "2 Jump Combination": 2, "3 Jump Combination": 3 };
const HALF_LOOP: ProgramElement = { code: "1Eu", title: "Single Euler", category: "Jump" };
// The half loop only counts inside a combination, so it's offered for the jumps but not on its own.
const COMBINATION_JUMPS = [...ELEMENT_CATALOG.filter((element) => element.category === "Jump"), HALF_LOOP];

export function ProgramsScreen({ intent, onIntentHandled }: ScreenProps) {
  const { students, programs, setPrograms } = useStore();
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  const [view, setView] = useState<View_>("Component sheet");
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const saved: ProgramData = { ...DEFAULT_PROGRAM, ...programs[studentId] };
  const current: ProgramData = { ...saved, ...validTrackAndLevel(saved.track, saved.level) };
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
        description="Select elements, drag them into skating order, and map the program on the rink."
        eyebrow="Program builder"
        title="Program components"
      />

      <Dropdown label="Student" onChange={setStudentId} options={studentIds} renderLabel={nameOf} value={studentId} />

      <Card style={{ marginBottom: 16 }}>
        {/* Dropdowns instead of chips: long lists (levels, students) were cut off on the right. */}
        <Dropdown
          label="Track"
          onChange={(track: Track) => update({ track, level: TRACK_LEVELS[track][0] })}
          options={TRACKS}
          value={current.track}
        />
        <Dropdown
          label="Level"
          onChange={(level: string) => update({ level })}
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
          <ComponentSheet
            elements={current.elements}
            onChange={(elements) => update({ elements })}
            onDragChange={(dragging) => setScrollEnabled(!dragging)}
          />
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
          {current.track} track
        </Text>
        <View style={{ gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#d6e5e6" }}>
          <ElementCount label="Jump elements" used={counts.Jump ?? 0} />
          <ElementCount label="Spin elements" used={counts.Spin ?? 0} />
          <ElementCount label="Steps & spirals" used={(counts.Sequence ?? 0) + (counts.Choreography ?? 0)} />
        </View>
        <View style={{ gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#d6e5e6" }}>
          <Label>Official {REQUIREMENTS_SEASON} requirements</Label>
          {requirementLinks(current.track, current.level).map((link) => (
            <Button key={link.url} label={link.label} onPress={() => openLink(link.url)} variant="secondary" />
          ))}
          <Button label="View all requirements" onPress={() => openLink(REQUIREMENTS_PAGE_URL)} variant="link" />
          <Text style={{ fontSize: 11, color: "#6c8285", textAlign: "center" }}>Links checked {REQUIREMENTS_CHECKED}</Text>
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#354654" }}>Catalog note</Text>
        <Text style={{ fontSize: 12, color: "#71808f", lineHeight: 18, marginTop: 6 }}>
          All elements are available at every level. Competition requirements can change by season;
          verify the final sheet against the current governing-body rulebook.
        </Text>
      </Card>
    </Screen>
  );
}

function ComponentSheet({
  elements,
  onChange,
  onDragChange,
}: {
  elements: ProgramElement[];
  onChange: (elements: ProgramElement[]) => void;
  /** Lets the parent stop page scrolling while a row is being dragged. */
  onDragChange: (dragging: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  // While a row is dragged: where it started, and how far the finger has moved (in pixels).
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const rowHeight = useRef(56); // measured from the first row, see onLayout below

  // Which slot the dragged row would land in if the finger let go now.
  const targetOf = (from: number, dy: number) =>
    Math.max(0, Math.min(elements.length - 1, from + Math.round(dy / rowHeight.current)));

  function startDrag(index: number) {
    setEditing(null); // the list is about to change order, so close any open edit
    setAdding(false);
    setDrag({ from: index, dy: 0 });
    onDragChange(true);
  }

  function endDrag(from: number, dy: number) {
    const to = targetOf(from, dy);
    setDrag(null);
    onDragChange(false);
    if (to === from) return;
    const next = [...elements];
    const [moved] = next.splice(from, 1); // take the element out...
    next.splice(to, 0, moved); // ...and put it back in its new slot
    onChange(next);
  }

  // While dragging, the rows between the old and new slot slide one row up or down to make room.
  function shiftFor(index: number) {
    if (!drag) return 0;
    if (index === drag.from) {
      // Keep the dragged row inside the list.
      const min = -drag.from * rowHeight.current;
      const max = (elements.length - 1 - drag.from) * rowHeight.current;
      return Math.max(min, Math.min(max, drag.dy));
    }
    const to = targetOf(drag.from, drag.dy);
    if (drag.from < to && index > drag.from && index <= to) return -rowHeight.current;
    if (drag.from > to && index >= to && index < drag.from) return rowHeight.current;
    return 0;
  }

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Label>Program components sheet</Label>
        <View style={{ backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.tealDark }}>{elements.length} {elements.length === 1 ? "element" : "elements"}</Text>
        </View>
      </View>

      <View style={{ borderWidth: 1, borderColor: "#e1e7eb", borderRadius: radius.md, marginBottom: 12 }}>
        {elements.length ? (
          elements.map((element, index) => {
            const dragged = drag?.from === index;
            return (
              <View
                key={`${element.code}-${index}`}
                onLayout={index === 0 ? (event) => (rowHeight.current = event.nativeEvent.layout.height) : undefined}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  padding: 10,
                  paddingLeft: 4,
                  borderTopWidth: index ? 1 : 0,
                  borderTopColor: "#e8edf1",
                  borderRadius: dragged ? radius.md : 0,
                  backgroundColor: editing === index ? colors.tealSoft : colors.white,
                  transform: [{ translateY: shiftFor(index) }],
                  // The dragged row floats above the others with a soft shadow.
                  zIndex: dragged ? 1 : 0,
                  shadowColor: "#000",
                  shadowOpacity: dragged ? 0.15 : 0,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <DragHandle
                  index={index}
                  onEnd={endDrag}
                  onMove={(dy) => setDrag((current) => (current ? { ...current, dy } : current))}
                  onStart={startDrag}
                />
                <Text style={{ width: 22, fontSize: 12, fontWeight: "700", color: colors.muted }}>{String(index + 1).padStart(2, "0")}</Text>
                <Text numberOfLines={1} style={{ minWidth: 48, fontSize: 13, fontWeight: "800", color: colors.tealDark }}>{element.code}</Text>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    {element.title}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 1 }}>{element.category}</Text>
                </View>
                <IconButton
                  icon="edit"
                  label="Edit"
                  onPress={() => {
                    setAdding(false);
                    setEditing(index);
                  }}
                  size={28}
                />
                <IconButton
                  background={colors.dangerSoft}
                  color={colors.danger}
                  icon="close"
                  label="Remove"
                  onPress={() => {
                    setEditing(null); // the numbers below this row change, so close any open edit
                    onChange(elements.filter((_, itemIndex) => itemIndex !== index));
                  }}
                  size={28}
                />
              </View>
            );
          })
        ) : (
          <Text style={{ padding: 20, textAlign: "center", fontSize: 13, color: colors.muted }}>Tap Add element to begin the sheet.</Text>
        )}
      </View>

      {editing !== null && elements[editing] ? (
        // key opens a fresh panel when the coach taps Edit on a different row
        <ElementPanel
          initial={elements[editing]}
          key={editing}
          onCancel={() => setEditing(null)}
          onSave={(element) => {
            onChange(elements.map((item, itemIndex) => (itemIndex === editing ? element : item)));
            setEditing(null);
          }}
          saveLabel="Save"
          title={`Edit element ${String(editing + 1).padStart(2, "0")}`}
        />
      ) : adding ? (
        <ElementPanel
          onCancel={() => setAdding(false)}
          onSave={(element) => {
            onChange([...elements, element]);
            setAdding(false);
          }}
          saveLabel="Add"
          title="Add element"
        />
      ) : (
        <Button icon="plus" label="Add element" onPress={() => setAdding(true)} variant="secondary" />
      )}
    </View>
  );
}

// The six-dot handle on the left of each row. Press and drag it up or down to change the
// skating order. Only the handle starts a drag, so the rest of the page still scrolls normally.
function DragHandle({
  index,
  onStart,
  onMove,
  onEnd,
}: {
  index: number;
  onStart: (index: number) => void;
  onMove: (dy: number) => void;
  onEnd: (index: number, dy: number) => void;
}) {
  // The responder is made once, so it reads the newest props through this ref (same trick as RinkMap).
  const latest = useRef({ index, onStart, onMove, onEnd });
  latest.current = { index, onStart, onMove, onEnd };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // don't let the page's scroll steal the drag
      onPanResponderGrant: () => latest.current.onStart(latest.current.index),
      onPanResponderMove: (_event, gesture) => latest.current.onMove(gesture.dy),
      onPanResponderRelease: (_event, gesture) => latest.current.onEnd(latest.current.index, gesture.dy),
      onPanResponderTerminate: (_event, gesture) => latest.current.onEnd(latest.current.index, gesture.dy),
    }),
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityHint="Drag up or down to change the order"
      accessibilityLabel="Reorder"
      hitSlop={6}
      style={{ width: 24, height: 36, alignItems: "center", justifyContent: "center" }}
    >
      <Icon color={colors.muted} name="grip" size={18} />
    </View>
  );
}

// Adding and editing work like U.S. Figure Skating's PPC form: pick a type, then an element
// of that type, then Add (or Save). New elements go to the end; drag them into skating order.
// When editing, `initial` fills the dropdowns with the element's current values.
function ElementPanel({
  initial,
  title,
  saveLabel,
  onSave,
  onCancel,
}: {
  initial?: ProgramElement;
  title: string;
  saveLabel: string;
  onSave: (element: ProgramElement) => void;
  onCancel: () => void;
}) {
  // A saved combination has a code like "1T+1Eu+1S", so split it back into its jumps.
  const initialJumps = initial?.code.includes("+") ? initial.code.split("+") : [];
  const initialCombination = Object.keys(COMBINATIONS).find((name) => COMBINATIONS[name] === initialJumps.length);
  const [type, setType] = useState<ElementType | null>(initial ? typeOf(initial) : null);
  const [code, setCode] = useState<string | null>(initialCombination ?? initial?.code ?? null);
  const [jumps, setJumps] = useState<(string | null)[]>(initialCombination ? initialJumps : []);
  const choices = type ? ELEMENT_CATALOG.filter((element) => typeOf(element) === type) : [];
  const jumpCount = code ? COMBINATIONS[code] : undefined;
  const options = [...choices.map((element) => element.code), ...(type === "Jumps" ? Object.keys(COMBINATIONS) : [])];
  const titleOf = (value: string) => [...ELEMENT_CATALOG, HALF_LOOP].find((element) => element.code === value)?.title ?? value;

  // What Add/Save will keep: a single element, or one combination element once every jump is picked.
  const picked = jumps.filter((jump): jump is string => Boolean(jump));
  const chosen: ProgramElement | undefined = jumpCount
    ? picked.length === jumpCount
      ? { code: picked.join("+"), title: code ?? "", category: "Jump" }
      : undefined
    : choices.find((element) => element.code === code);

  return (
    <View style={{ borderWidth: 1, borderColor: "#d6e5e6", borderRadius: radius.md, padding: 14, backgroundColor: "#f7fbfb" }}>
      <Label>{title}</Label>
      <Dropdown
        label="Type"
        onChange={(next) => {
          setType(next);
          setCode(null); // a new type has different elements, so clear the old pick
          setJumps([]);
        }}
        options={ELEMENT_TYPES}
        placeholder="Select type"
        value={type}
      />
      {/* key resets the list when the type changes, so it never shows the previous type's elements */}
      <Dropdown
        key={type ?? "none"}
        label="Element"
        onChange={(next) => {
          setCode(next);
          setJumps(COMBINATIONS[next] ? Array(COMBINATIONS[next]).fill(null) : []);
        }}
        options={options}
        placeholder={type ? "Select element" : "Select a type first"}
        renderLabel={(value) => (COMBINATIONS[value] ? value : titleOf(value))}
        value={code}
      />
      {jumps.map((jump, index) => (
        <Dropdown
          key={`${code}-${index}`}
          label={`Move ${index + 1}`}
          onChange={(next) => setJumps((all) => all.map((item, itemIndex) => (itemIndex === index ? next : item)))}
          options={COMBINATION_JUMPS.map((element) => element.code)}
          placeholder="Select move"
          renderLabel={titleOf}
          value={jump}
        />
      ))}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label="Cancel" onPress={onCancel} style={{ flex: 1 }} variant="secondary" />
        <Button disabled={!chosen} label={saveLabel} onPress={() => chosen && onSave(chosen)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// Opens the official page in the phone's browser, and tells the coach if that fails.
function openLink(url: string) {
  Linking.openURL(url).catch(() => Alert.alert("Couldn’t open the link", "Check your connection and try again."));
}

// Just a count, with no target: requirements change by season and have exceptions,
// so the app doesn't judge whether a program has too few or too many elements.
function ElementCount({ label, used }: { label: string; used: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#637b7e" }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#365f64" }}>{used} selected</Text>
    </View>
  );
}
