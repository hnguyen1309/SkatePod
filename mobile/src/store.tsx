import { createContext, useContext, useEffect, useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  SAMPLE_LESSONS,
  SAMPLE_NOTES,
  SAMPLE_SETTINGS,
  SAMPLE_STUDENTS,
  lessonHistoryToAdd,
  newId,
  startOfWeek,
  upgradeLesson,
  type AvailabilityBlock,
  type Lesson,
  type Note,
  type ProgramData,
  type Settings,
  type Student,
} from "./data";
import { usePersistentState } from "./storage";
import { colors } from "./theme";

type Setter<T> = Dispatch<SetStateAction<T>>;

type Store = {
  students: Student[];
  setStudents: Setter<Student[]>;
  lessons: Lesson[];
  setLessons: Setter<Lesson[]>;
  availability: AvailabilityBlock[]; // optional "available to coach" blocks, empty unless the coach adds some
  setAvailability: Setter<AvailabilityBlock[]>;
  notes: Note[];
  setNotes: Setter<Note[]>;
  programs: Record<string, ProgramData>;
  setPrograms: Setter<Record<string, ProgramData>>;
  settings: Settings;
  setSettings: Setter<Settings>;
  studentById: (id: string) => Student | undefined;
  resetSampleData: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [students, setStudents, l1] = usePersistentState<Student[]>("skatepod.students.v2", SAMPLE_STUDENTS);
  const [savedLessons, setLessons, l2] = usePersistentState<Lesson[]>("skatepod.lessons.v1", SAMPLE_LESSONS);
  // Lessons saved before any-start-time have a `row` instead of `start`; upgrade them as they load.
  const lessons = useMemo(() => savedLessons.map(upgradeLesson), [savedLessons]);
  const [notes, setNotes, l3] = usePersistentState<Note[]>("skatepod.notes.v1", SAMPLE_NOTES);
  const [programs, setPrograms, l4] = usePersistentState<Record<string, ProgramData>>("skatepod.programs.v1", {});
  const [settings, setSettings, l5] = usePersistentState<Settings>("skatepod.settings.v1", SAMPLE_SETTINGS);
  const [availability, setAvailability, l6] = usePersistentState<AvailabilityBlock[]>("skatepod.availability.v1", []);
  // The last time the training history was brought up to date (see lessonHistoryToAdd).
  const [historyCheckedAt, setHistoryCheckedAt, l7] = usePersistentState<string | null>("skatepod.historyCheckedAt.v1", null);

  const checkedAt = useRef<string | null>(null);
  // Every minute (and when the app opens), add a Lessons-tab entry for each calendar lesson that has
  // started since the last check. The first time, history starts from the beginning of this week.
  useEffect(() => {
    if (!(l1 && l2 && l3 && l4 && l5 && l6 && l7)) return;
    const catchUp = () => {
      const now = new Date();
      // A ref, so the timer always sees the latest check. Lessons are only added after it, which also
      // means an entry the coach deleted from the Lessons tab doesn't come back.
      checkedAt.current ??= historyCheckedAt;
      const since = checkedAt.current ? new Date(checkedAt.current) : startOfWeek(now);
      setNotes((current) => {
        const added = lessonHistoryToAdd(lessons, current, since, now, newId);
        return added.length ? [...added, ...current] : current;
      });
      checkedAt.current = now.toISOString();
      setHistoryCheckedAt(checkedAt.current);
    };
    catchUp();
    const timer = setInterval(catchUp, 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l1, l2, l3, l4, l5, l6, l7, lessons]);

  const value = useMemo<Store>(
    () => ({
      students,
      setStudents,
      lessons,
      setLessons,
      availability,
      setAvailability,
      notes,
      setNotes,
      programs,
      setPrograms,
      settings,
      setSettings,
      studentById: (id: string) => students.find((student) => student.id === id),
      resetSampleData: () => {
        setStudents(SAMPLE_STUDENTS);
        setLessons(SAMPLE_LESSONS);
        setNotes(SAMPLE_NOTES);
        setPrograms({});
        setSettings(SAMPLE_SETTINGS);
        setAvailability([]);
        setHistoryCheckedAt(null);
        checkedAt.current = null;
      },
    }),
    [students, lessons, availability, notes, programs, settings, setStudents, setLessons, setAvailability, setNotes, setPrograms, setSettings],
  );

  if (!(l1 && l2 && l3 && l4 && l5 && l6 && l7)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
