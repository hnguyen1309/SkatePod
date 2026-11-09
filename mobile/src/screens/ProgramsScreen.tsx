import * as DocumentPicker from "expo-document-picker";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Linking, PanResponder, Pressable, Text, View } from "react-native";
import * as api from "../api";
import { Icon } from "../components/Icon";
import { RinkMap } from "../components/RinkMap";
import { Button, Card, Dropdown, Field, Heading, IconButton, Label, Screen, Segmented } from "../components/ui";
import {
  ELEMENT_CATALOG,
  MAX_MUSIC_BYTES,
  REQUIREMENTS_CHECKED,
  REQUIREMENTS_PAGE_URL,
  REQUIREMENTS_SEASON,
  TRACKS,
  TRACK_LEVELS,
  formatFileSize,
  musicServiceName,
  newId,
  newProgramFor,
  programHasChanges,
  programNotReady,
  requirementLinks,
  validTrackAndLevel,
  type Program,
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

// How the Programs tab works (Nov 2026):
// - A student can have several programs. Each is a card: closed, it's one row (name, music, track and
//   level, and a trash can); tap it to open the whole program. Only one is open at a time.
// - Changes are made on a copy (`draft`) and only kept when the coach taps Save. Save is grey until
//   something changed, and while a music file is still uploading.
// - Closing a card, opening another one or switching student with unsaved changes asks first.
export function ProgramsScreen({ intent, onIntentHandled }: ScreenProps) {
  const { students, programs, saveProgram, deleteProgram, uploadMusic, source } = useStore();
  const studentIds = students.map((student) => student.id);
  const [studentId, setStudentId] = useState(studentIds[0] ?? "");
  // The open program: the copy being edited, and the version it started from (to see what changed).
  const [draft, setDraft] = useState<Program | null>(null);
  const [base, setBase] = useState<Program | null>(null);
  const [view, setView] = useState<View_>("Component sheet");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // the name of the file being uploaded
  const [saving, setSaving] = useState(false);

  const nameOf = (id: string) => students.find((student) => student.id === id)?.name ?? "Student";
  const studentPrograms = programs.filter((program) => program.studentId === studentId);
  const draftIsNew = Boolean(draft && !programs.some((program) => program.id === draft.id));
  const listed = draft && draftIsNew ? [...studentPrograms, draft] : studentPrograms;
  const dirty = Boolean(draft && base && programHasChanges(base, draft));

  useEffect(() => {
    if (!studentIds.includes(studentId) && studentIds[0]) setStudentId(studentIds[0]);
  }, [studentIds, studentId]);

  // Does `then` straight away, or after the coach agrees to drop unsaved changes.
  function leaveDraft(then: () => void) {
    if (uploading) {
      Alert.alert("Still uploading", `Wait until ${uploading} has finished uploading.`);
      return;
    }
    if (!dirty) {
      then();
      return;
    }
    Alert.alert("Discard changes?", `What you changed in “${draft?.name.trim() || "this program"}” won't be saved.`, [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: then },
    ]);
  }

  function open(program: Program | null) {
    setDraft(program);
    setBase(program);
    setView("Component sheet");
  }

  function toggle(program: Program) {
    if (draft?.id === program.id) leaveDraft(() => open(null));
    else leaveDraft(() => open(program));
  }

  function startNew() {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    leaveDraft(() => open(newProgramFor(student, newId())));
  }

  useEffect(() => {
    if (!intent) return;
    if (intent.kind === "add") startNew(); // the "New program" button at the top
    onIntentHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  function change(changes: Partial<Program>) {
    setDraft((current) => (current ? { ...current, ...changes } : current));
  }

  async function save() {
    if (!draft || !dirty || uploading || saving) return;
    const problem = programNotReady(draft);
    if (problem) {
      Alert.alert("Can't save yet", problem);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProgram({ ...draft, ...validTrackAndLevel(draft.track, draft.level) });
      if (saved) open(saved); // stays open, now with nothing left to save
    } finally {
      setSaving(false);
    }
  }

  function remove(program: Program) {
    const isNew = !programs.some((item) => item.id === program.id);
    const name = (draft?.id === program.id ? draft.name : program.name).trim() || "this program";
    const file = program.musicFile ? ` and its music file (${program.musicFile.fileName})` : "";
    Alert.alert(`Delete “${name}”?`, `This deletes the program${file}. It can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!isNew && !(await deleteProgram(program.id))) return; // the store said why
          if (draft?.id === program.id) open(null);
        },
      },
    ]);
  }

  async function pickMusic() {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];
    if (file.size && file.size > MAX_MUSIC_BYTES) {
      Alert.alert("That file is too big", `${file.name} is ${formatFileSize(file.size)}. Music files can be up to 20 MB.`);
      return;
    }
    setUploading(file.name);
    try {
      const uploaded = await uploadMusic({ uri: file.uri, name: file.name, mimeType: file.mimeType ?? undefined });
      if (!uploaded) return; // the store told the coach why
      // A program still called "Untitled program" takes the file's name as its music title.
      const title = file.name.replace(/\.[^.]+$/, "");
      setDraft((current) =>
        current ? { ...current, musicFile: uploaded, musicTitle: current.musicTitle === "Untitled program" ? title : current.musicTitle } : current,
      );
    } finally {
      setUploading(null);
    }
  }

  if (!studentIds.length) {
    return (
      <Screen>
        <Heading description="Add a student first, then build their programs here." eyebrow="Program builder" title="Program components" />
      </Screen>
    );
  }

  return (
    <Screen scrollEnabled={scrollEnabled}>
      <Heading
        description="Each student can have several programs. Tap one to open it, change it, then Save."
        eyebrow="Program builder"
        title="Program components"
      />

      <Dropdown
        label="Student"
        onChange={(next: string) => leaveDraft(() => {
          open(null);
          setStudentId(next);
        })}
        options={studentIds}
        renderLabel={nameOf}
        value={studentId}
      />

      {listed.length ? null : (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>No programs yet</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Add {nameOf(studentId)}’s first program: a free skate, a short program, a showcase…
          </Text>
        </Card>
      )}

      {listed.map((program) => {
        const isOpen = draft?.id === program.id;
        const shown = isOpen && draft ? draft : program;
        return (
          <ProgramCard
            isNew={!programs.some((item) => item.id === program.id)}
            key={program.id}
            onDelete={() => remove(program)}
            onToggle={() => toggle(program)}
            open={isOpen}
            program={shown}
          >
            {isOpen && draft ? (
              <ProgramEditor
                canUpload={source === "backend"}
                dirty={dirty}
                isNew={draftIsNew}
                onCancel={() => (draftIsNew ? leaveDraft(() => open(null)) : setDraft(base))}
                onChange={change}
                onPickMusic={pickMusic}
                onSave={save}
                onScrollLock={(locked) => setScrollEnabled(!locked)}
                onViewChange={setView}
                program={draft}
                saving={saving}
                studentName={nameOf(studentId)}
                uploading={uploading}
                view={view}
              />
            ) : null}
          </ProgramCard>
        );
      })}

      <Button icon="plus" label="Add a program" onPress={startNew} style={{ marginBottom: 16 }} variant="secondary" />

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

// One program. Closed, it's a single row: the name, a summary, and the trash can in the top corner.
// Tap the row to open or close it; open, the editor (`children`) shows under the row.
function ProgramCard({
  program,
  open,
  isNew,
  onToggle,
  onDelete,
  children,
}: {
  program: Program;
  open: boolean;
  isNew: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const name = program.name.trim() || (isNew ? "New program" : "Untitled");
  const hasMusic = Boolean(program.musicFile || program.musicLink.trim());
  return (
    <Card style={{ marginBottom: 12, padding: 0, borderColor: open ? colors.availableEdge : colors.border }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 }}>
        <Pressable
          accessibilityHint={open ? "Closes the program" : "Opens the program"}
          accessibilityLabel={`${name} · ${program.musicTitle} · ${program.track} · ${program.level}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          style={{ flex: 1, flexDirection: "row", gap: 10 }}
        >
          <View style={{ paddingTop: 2, transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
            <Icon color={colors.muted} name="chevron" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: program.name.trim() ? colors.text : colors.muted }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
              {hasMusic ? "♪ " : ""}
              {program.musicTitle} · {program.track} · {program.level}
            </Text>
            {!open ? (
              <Text style={{ fontSize: 11, color: colors.faint, marginTop: 3 }}>
                {program.elements.length} {program.elements.length === 1 ? "element" : "elements"}
                {isNew ? " · not saved yet" : ""}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <IconButton background={colors.dangerSoft} color={colors.danger} icon="trash" label={`Delete ${name}`} onPress={onDelete} size={32} />
      </View>
      {open ? <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSoft, padding: 14 }}>{children}</View> : null}
    </Card>
  );
}

// Everything inside an open program card: name, track and level, music, the component sheet or rink
// map, the classification with its official requirement links, and Cancel / Save at the bottom.
function ProgramEditor({
  program,
  studentName,
  dirty,
  isNew,
  saving,
  uploading,
  canUpload,
  view,
  onViewChange,
  onChange,
  onPickMusic,
  onSave,
  onCancel,
  onScrollLock,
}: {
  program: Program;
  studentName: string;
  dirty: boolean;
  isNew: boolean;
  saving: boolean;
  uploading: string | null;
  canUpload: boolean;
  view: View_;
  onViewChange: (view: View_) => void;
  onChange: (changes: Partial<Program>) => void;
  onPickMusic: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScrollLock: (locked: boolean) => void;
}) {
  const current = { ...program, ...validTrackAndLevel(program.track, program.level) };
  const counts = current.elements.reduce<Record<string, number>>((result, element) => {
    result[element.category] = (result[element.category] ?? 0) + 1;
    return result;
  }, {});
  const link = program.musicLink.trim();
  const service = /^https?:\/\/\S+$/i.test(link) ? musicServiceName(link) : null;

  return (
    <View>
      <Field label="Program name" onChangeText={(name) => onChange({ name })} placeholder="Free skate 2026-27" value={program.name} />
      {/* Dropdowns instead of chips: long lists (levels, students) were cut off on the right. */}
      <Dropdown
        label="Track"
        onChange={(track: Track) => onChange({ track, level: TRACK_LEVELS[track][0] })}
        options={TRACKS}
        value={current.track}
      />
      <Dropdown
        label="Level"
        onChange={(level: string) => onChange({ level })}
        options={TRACK_LEVELS[current.track] as readonly string[]}
        value={current.level}
      />
      <Field label="Music" onChangeText={(musicTitle) => onChange({ musicTitle })} value={program.musicTitle} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1.4 }}>
          <Field label="Artist" onChangeText={(artist) => onChange({ artist })} value={program.artist} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Duration" onChangeText={(duration) => onChange({ duration })} value={program.duration} />
        </View>
      </View>

      {/* The music: an uploaded file (on the backend) and/or a link to where it's streamed. */}
      <Label>Music file</Label>
      <View style={{ borderWidth: 1, borderColor: colors.input, borderRadius: radius.md, padding: 12, marginBottom: 16 }}>
        {uploading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={colors.teal} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: colors.body }}>
              Uploading {uploading}…
            </Text>
          </View>
        ) : program.musicFile ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon color={colors.teal} name="music" size={18} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  {program.musicFile.fileName}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{formatFileSize(program.musicFile.sizeBytes)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button label="Play" onPress={() => program.musicFile && openLink(api.musicFileUrl(program.musicFile.id))} style={{ flex: 1 }} variant="secondary" />
              <Button label="Replace" onPress={onPickMusic} style={{ flex: 1 }} variant="secondary" />
              <Button label="Remove" onPress={() => onChange({ musicFile: null })} style={{ flex: 1 }} variant="danger" />
            </View>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <Button disabled={!canUpload} icon="music" label="Upload a music file" onPress={onPickMusic} variant="secondary" />
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>
              {canUpload ? "MP3, M4A, WAV or other audio, up to 20 MB." : "Uploading files needs the backend. You can still add a link below."}
            </Text>
          </View>
        )}
      </View>
      <Field
        autoCapitalize="none"
        label="Music link"
        onChangeText={(musicLink) => onChange({ musicLink })}
        placeholder="YouTube, Apple Music or Spotify link"
        value={program.musicLink}
      />
      {service ? (
        <Button label={`Open in ${service}`} onPress={() => openLink(link)} style={{ marginTop: -8, marginBottom: 12 }} variant="link" />
      ) : null}

      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 4 }}>{program.musicTitle}</Text>
      <Text style={{ fontSize: 13, color: "#7c8996", marginTop: 3, marginBottom: 14 }}>
        {studentName} · {current.track} · {current.level}
      </Text>
      <View style={{ marginBottom: 16 }}>
        <Segmented onChange={onViewChange} options={VIEWS} value={view} />
      </View>
      {view === "Component sheet" ? (
        <ComponentSheet elements={current.elements} onChange={(elements) => onChange({ elements })} onDragChange={onScrollLock} />
      ) : (
        <RinkMap
          elements={current.elements}
          onDrawingChange={onScrollLock}
          onPathsChange={(paths) => onChange({ paths })}
          onPlacementsChange={(placements) => onChange({ placements })}
          paths={current.paths}
          placements={current.placements}
        />
      )}

      <View style={{ backgroundColor: colors.tealSoft, borderColor: "#dce7e9", borderWidth: 1, borderRadius: radius.md, padding: 14, marginTop: 16 }}>
        <Label>Selected classification</Label>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{current.level}</Text>
        <Text style={{ fontSize: 12, color: "#6c8285", marginTop: 3 }}>{current.track} track</Text>
        <View style={{ gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#d6e5e6" }}>
          <ElementCount label="Jump elements" used={counts.Jump ?? 0} />
          <ElementCount label="Spin elements" used={counts.Spin ?? 0} />
          <ElementCount label="Steps & spirals" used={(counts.Sequence ?? 0) + (counts.Choreography ?? 0)} />
        </View>
        <View style={{ gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#d6e5e6" }}>
          <Label>Official {REQUIREMENTS_SEASON} requirements</Label>
          {requirementLinks(current.track, current.level).map((item) => (
            <Button key={item.url} label={item.label} onPress={() => openLink(item.url)} variant="secondary" />
          ))}
          <Button label="View all requirements" onPress={() => openLink(REQUIREMENTS_PAGE_URL)} variant="link" />
          <Text style={{ fontSize: 11, color: "#6c8285", textAlign: "center" }}>Links checked {REQUIREMENTS_CHECKED}</Text>
        </View>
      </View>

      {/* Save is grey until something changed, and while a music file is still uploading. */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Button disabled={!dirty || Boolean(uploading) || saving} label="Cancel" onPress={onCancel} style={{ flex: 1 }} variant="secondary" />
        <Button disabled={!dirty || Boolean(uploading) || saving} label={saving ? "Saving…" : "Save program"} onPress={onSave} style={{ flex: 1.4 }} />
      </View>
      {/* Says why Save is grey or not, in words: a grey button alone is easy to miss (and the UI tests check this). */}
      <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 8 }}>
        {saveStatus({ uploading, saving, dirty, isNew })}
      </Text>
    </View>
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

/** The line under Save program: what's left to do before (or after) saving. */
function saveStatus({ uploading, saving, dirty, isNew }: { uploading: string | null; saving: boolean; dirty: boolean; isNew: boolean }) {
  if (uploading) return "Uploading the music file… Save turns on when it's done.";
  if (saving) return "Saving…";
  if (dirty) return "You have unsaved changes.";
  return isNew ? "Not saved yet: give the program a name to start." : "All changes saved.";
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
