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
  /** Where students and lessons are kept: on this phone, or on the backend (when EXPO_PUBLIC_API_URL is set, see api.ts). */
  source: "phone" | "backend";
  /** Why students or lessons couldn't be loaded from the backend, or null. */
  backendError: string | null;
  /** Loads students and lessons from the backend again (does nothing when everything is on the phone). */
  reloadFromBackend: () => Promise<void>;
  /** Adds or updates a student. Resolves to false (after telling the coach why) if the backend refused it. */
  saveStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  lessons: Lesson[];
  /**
   * Adds or updates a weekly lesson. Resolves to the saved lesson (a new one gets its id from the
   * backend), or null (after telling the coach why) if the backend refused it.
   */
  saveLesson: (lesson: Lesson) => Promise<Lesson | null>;
  deleteLesson: (id: string) => Promise<boolean>;
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
  // Students and weekly lessons come from the backend when it's set up. Notes, programs, availability
  // and settings stay on the phone for now (the app is being connected one feature at a time).
  const onBackend = api.API_URL !== null;
  const [backendStudents, setBackendStudents] = useState<Student[]>([]);
  const [backendLessons, setBackendLessons] = useState<Lesson[]>([]);
  const [backendLoaded, setBackendLoaded] = useState(!onBackend);
  const [backendError, setBackendError] = useState<string | null>(null);
  const students = onBackend ? backendStudents : phoneStudents;

  const reloadFromBackend = useCallback(async () => {
    if (!onBackend) return;
    try {
      // Both at once, so the app opens as fast as the slower of the two.
      const [loadedStudents, loadedLessons] = await Promise.all([api.listStudents(), api.listLessons()]);
      setBackendStudents(loadedStudents);
      setBackendLessons(loadedLessons);
      setBackendError(null);
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : String(error));
    } finally {
      setBackendLoaded(true);
    }
  }, [onBackend]);

  useEffect(() => {
    reloadFromBackend();
  }, [reloadFromBackend]);

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
        // The backend deletes the student's lessons with them, so drop them here too.
        setBackendLessons((current) => current.filter((item) => item.studentId !== id));
        return true;
      } catch (error) {
        Alert.alert("Couldn't delete the student", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, setPhoneStudents],
  );
  const [savedLessons, setPhoneLessons, l2] = usePersistentState<Lesson[]>("skatepod.lessons.v1", SAMPLE_LESSONS);
  // Lessons saved before any-start-time have a `row` instead of `start`; upgrade them as they load.
  const phoneLessons = useMemo(() => savedLessons.map(upgradeLesson), [savedLessons]);
  const lessons = onBackend ? backendLessons : phoneLessons;

  const saveLesson = useCallback(
    async (lesson: Lesson) => {
      const replace = (list: Lesson[], saved: Lesson) => list.map((item) => (item.id === saved.id ? saved : item));
      const isNew = !lessons.some((item) => item.id === lesson.id);
      if (!onBackend) {
        setPhoneLessons((current) => (isNew ? [...current, lesson] : replace(current, lesson)));
        return lesson;
      }
      const before = lessons.find((item) => item.id === lesson.id);
      // A moved or resized lesson shows in its new place straight away, so dragging doesn't feel slow.
      // If the backend says no, it goes back where it was.
      if (before) setBackendLessons((current) => replace(current, lesson));
      try {
        // A new lesson gets its id from the backend, so the one the editor made up is dropped.
        const saved = isNew ? await api.createLesson(lesson) : await api.updateLesson(lesson);
        setBackendLessons((current) => (isNew ? [...current, saved] : replace(current, saved)));
        return saved;
      } catch (error) {
        if (before) setBackendLessons((current) => replace(current, before));
        Alert.alert("Couldn't save the lesson", error instanceof Error ? error.message : String(error));
        return null;
      }
    },
    [onBackend, lessons, setPhoneLessons],
  );

  const deleteLesson = useCallback(
    async (id: string) => {
      if (!onBackend) {
        setPhoneLessons((current) => current.filter((item) => item.id !== id));
        return true;
      }
      try {
        await api.deleteLesson(id);
        setBackendLessons((current) => current.filter((item) => item.id !== id));
        return true;
      } catch (error) {
        Alert.alert("Couldn't delete the lesson", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, setPhoneLessons],
  );
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
      source: onBackend ? "backend" : "phone",
      backendError,
      reloadFromBackend,
      saveStudent,
      deleteStudent,
      lessons,
      saveLesson,
      deleteLesson,
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
        // Students and lessons on the backend aren't touched: this only resets what's on the phone.
        if (onBackend) reloadFromBackend();
        else {
          setPhoneStudents(SAMPLE_STUDENTS);
          setPhoneLessons(SAMPLE_LESSONS);
        }
        setNotes(SAMPLE_NOTES);
        setPrograms({});
        setSettings(SAMPLE_SETTINGS);
        setAvailability([]);
        setHistoryCheckedAt(null);
        checkedAt.current = null;
      },
    }),
    [
      students, onBackend, backendError, reloadFromBackend, saveStudent, deleteStudent, lessons, saveLesson, deleteLesson, availability,
      notes, programs, settings, setPhoneStudents, setPhoneLessons, setAvailability, setNotes, setPrograms, setSettings,
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
