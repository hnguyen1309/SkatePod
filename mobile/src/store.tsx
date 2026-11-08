import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import * as api from "./api";
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
  /** Where students are kept: on this phone, or on the backend (when EXPO_PUBLIC_API_URL is set, see api.ts). */
  studentsSource: "phone" | "backend";
  /** Why students couldn't be loaded from the backend, or null. */
  studentsError: string | null;
  reloadStudents: () => Promise<void>;
  /** Adds or updates a student. Resolves to false (after telling the coach why) if the backend refused it. */
  saveStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
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
  const [phoneStudents, setPhoneStudents, l1] = usePersistentState<Student[]>("skatepod.students.v2", SAMPLE_STUDENTS);
  // Students come from the backend when it's set up. Lessons, notes, programs, availability and
  // settings stay on the phone for now (the app is being connected one feature at a time).
  const onBackend = api.API_URL !== null;
  const [backendStudents, setBackendStudents] = useState<Student[]>([]);
  const [backendLoaded, setBackendLoaded] = useState(!onBackend);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const students = onBackend ? backendStudents : phoneStudents;

  const reloadStudents = useCallback(async () => {
    if (!onBackend) return;
    try {
      setBackendStudents(await api.listStudents());
      setStudentsError(null);
    } catch (error) {
      setStudentsError(error instanceof Error ? error.message : String(error));
    } finally {
      setBackendLoaded(true);
    }
  }, [onBackend]);

  useEffect(() => {
    reloadStudents();
  }, [reloadStudents]);

  const saveStudent = useCallback(
    async (student: Student) => {
      if (!onBackend) {
        setPhoneStudents((current) =>
          current.some((item) => item.id === student.id) ? current.map((item) => (item.id === student.id ? student : item)) : [...current, student],
        );
        return true;
      }
      try {
        const isNew = !backendStudents.some((item) => item.id === student.id);
        // A new student gets its id from the backend, so the one the editor made up is dropped.
        const saved = isNew ? await api.createStudent(student) : await api.updateStudent(student);
        setBackendStudents((current) =>
          isNew ? [...current, saved] : current.map((item) => (item.id === saved.id ? saved : item)),
        );
        return true;
      } catch (error) {
        Alert.alert("Couldn't save the student", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, backendStudents, setPhoneStudents],
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      if (!onBackend) {
        setPhoneStudents((current) => current.filter((item) => item.id !== id));
        return true;
      }
      try {
        await api.deleteStudent(id);
        setBackendStudents((current) => current.filter((item) => item.id !== id));
        return true;
      } catch (error) {
        Alert.alert("Couldn't delete the student", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, setPhoneStudents],
  );
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
      studentsSource: onBackend ? "backend" : "phone",
      studentsError,
      reloadStudents,
      saveStudent,
      deleteStudent,
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
        // Students on the backend aren't touched: this only resets what's on the phone.
        if (onBackend) reloadStudents();
        else setPhoneStudents(SAMPLE_STUDENTS);
        setLessons(SAMPLE_LESSONS);
        setNotes(SAMPLE_NOTES);
        setPrograms({});
        setSettings(SAMPLE_SETTINGS);
        setAvailability([]);
        setHistoryCheckedAt(null);
        checkedAt.current = null;
      },
    }),
    [
      students, onBackend, studentsError, reloadStudents, saveStudent, deleteStudent, lessons, availability, notes, programs, settings,
      setPhoneStudents, setLessons, setAvailability, setNotes, setPrograms, setSettings,
    ],
  );

  if (!(l1 && l2 && l3 && l4 && l5 && l6 && l7 && backendLoaded)) {
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
