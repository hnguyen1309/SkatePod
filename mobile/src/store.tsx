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
  sortStudentsByName,
  upgradeOldPrograms,
  startOfWeek,
  upgradeLesson,
  type AvailabilityBlock,
  type Lesson,
  type Note,
  type MusicFile,
  type Program,
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
  /** Adds or updates a note. Resolves to the saved note, or null (after telling the coach why) if the backend refused it. */
  saveNote: (note: Note) => Promise<Note | null>;
  /** Deletes one or more notes (Select mode deletes several). Resolves to false if any couldn't be deleted. */
  deleteNotes: (ids: string[]) => Promise<boolean>;
  /** Every student's saved programs, oldest first. A student can have several, or none. */
  programs: Program[];
  /** Adds or updates a program (the Save button). Resolves to the saved program, or null after telling the coach why not. */
  saveProgram: (program: Program) => Promise<Program | null>;
  deleteProgram: (id: string) => Promise<boolean>;
  /** Uploads a music file to the backend. Resolves once it's all there, or to null after telling the coach why not. */
  uploadMusic: (file: { uri: string; name: string; mimeType?: string }) => Promise<MusicFile | null>;
  settings: Settings;
  setSettings: Setter<Settings>;
  studentById: (id: string) => Student | undefined;
  resetSampleData: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [phoneStudents, setPhoneStudents, l1] = usePersistentState<Student[]>("skatepod.students.v2", SAMPLE_STUDENTS);
  // Students, weekly lessons, notes and programs come from the backend when it's set up. Availability
  // and settings stay on the phone for now (the app is being connected one feature at a time).
  const onBackend = api.API_URL !== null;
  const [backendStudents, setBackendStudents] = useState<Student[]>([]);
  const [backendLessons, setBackendLessons] = useState<Lesson[]>([]);
  const [backendNotes, setBackendNotes] = useState<Note[]>([]);
  const [backendPrograms, setBackendPrograms] = useState<Program[]>([]);
  const [backendLoaded, setBackendLoaded] = useState(!onBackend);
  const [backendError, setBackendError] = useState<string | null>(null);
  const students = onBackend ? backendStudents : phoneStudents;

  const reloadFromBackend = useCallback(async () => {
    if (!onBackend) return;
    try {
      // All at once, so the app opens as fast as the slowest of them.
      const [loadedStudents, loadedLessons, loadedNotes, loadedPrograms] = await Promise.all([
        api.listStudents(),
        api.listLessons(),
        api.listNotes(),
        api.listPrograms(),
      ]);
      setBackendStudents(loadedStudents);
      setBackendLessons(loadedLessons);
      setBackendNotes(loadedNotes);
      setBackendPrograms(loadedPrograms);
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
          // A to Z, like the backend's list, so nothing jumps around when the app reloads it.
          sortStudentsByName(isNew ? [...current, saved] : current.map((item) => (item.id === saved.id ? saved : item))),
        );
        return true;
      } catch (error) {
        Alert.alert("Couldn't save the student", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, backendStudents, setPhoneStudents],
  );

  // On the phone, deleting a student also deletes their lessons, notes and programs, like the backend does
  // (StudentService.delete). Those lists are set up further down, so this is filled in once they exist.
  const deletePhoneStudentData = useRef<(studentId: string) => void>(() => {});

  const deleteStudent = useCallback(
    async (id: string) => {
      if (!onBackend) {
        setPhoneStudents((current) => current.filter((item) => item.id !== id));
        deletePhoneStudentData.current(id);
        return true;
      }
      try {
        await api.deleteStudent(id);
        setBackendStudents((current) => current.filter((item) => item.id !== id));
        // The backend deletes the student's lessons and notes with them, so drop them here too.
        setBackendLessons((current) => current.filter((item) => item.studentId !== id));
        setBackendNotes((current) => current.filter((item) => item.studentId !== id));
        setBackendPrograms((current) => current.filter((item) => item.studentId !== id)); // and their programs
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
        // The backend keeps the lesson's notes in the history, they just lose the link to the lesson.
        setBackendNotes((current) => current.map((note) => (note.lessonId === id ? { ...note, lessonId: undefined } : note)));
        return true;
      } catch (error) {
        Alert.alert("Couldn't delete the lesson", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, setPhoneLessons],
  );
  const [phoneNotes, setPhoneNotes, l3] = usePersistentState<Note[]>("skatepod.notes.v1", SAMPLE_NOTES);
  const notes = onBackend ? backendNotes : phoneNotes;

  const saveNote = useCallback(
    async (note: Note) => {
      const isNew = !notes.some((item) => item.id === note.id);
      const add = (list: Note[], saved: Note) => (isNew ? [saved, ...list] : list.map((item) => (item.id === saved.id ? saved : item)));
      if (!onBackend) {
        setPhoneNotes((current) => add(current, note));
        return note;
      }
      try {
        // A new note gets its id from the backend, so the one the editor made up is dropped.
        const saved = isNew ? await api.createNote(note) : await api.updateNote(note);
        setBackendNotes((current) => add(current, saved));
        return saved;
      } catch (error) {
        Alert.alert("Couldn't save the note", error instanceof Error ? error.message : String(error));
        return null;
      }
    },
    [onBackend, notes, setPhoneNotes],
  );

  const deleteNotes = useCallback(
    async (ids: string[]) => {
      if (!onBackend) {
        setPhoneNotes((current) => current.filter((item) => !ids.includes(item.id)));
        return true;
      }
      // One DELETE per note, all at once. The ones that worked are removed even if another one failed.
      const results = await Promise.allSettled(ids.map((id) => api.deleteNote(id)));
      const deleted = ids.filter((_, index) => results[index].status === "fulfilled");
      setBackendNotes((current) => current.filter((item) => !deleted.includes(item.id)));
      const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (failed) {
        const reason = failed.reason instanceof Error ? failed.reason.message : String(failed.reason);
        Alert.alert(ids.length === 1 ? "Couldn't delete the note" : "Couldn't delete every note", reason);
        return false;
      }
      return true;
    },
    [onBackend, setPhoneNotes],
  );
  // Programs on the phone. Before Nov 2026 there was one per student, saved under programs.v1 as
  // { studentId: program }; the new list (programs.v2) starts from those until it's first saved.
  const [oldPhonePrograms, , l4] = usePersistentState<Record<string, ProgramData>>("skatepod.programs.v1", {});
  const [savedPhonePrograms, setPhonePrograms, l8] = usePersistentState<Program[] | null>("skatepod.programs.v2", null);
  const phonePrograms = useMemo(() => savedPhonePrograms ?? upgradeOldPrograms(oldPhonePrograms), [savedPhonePrograms, oldPhonePrograms]);
  const programs = onBackend ? backendPrograms : phonePrograms;

  const saveProgram = useCallback(
    async (program: Program) => {
      const isNew = !programs.some((item) => item.id === program.id);
      const add = (list: Program[], saved: Program) => (isNew ? [...list, saved] : list.map((item) => (item.id === saved.id ? saved : item)));
      if (!onBackend) {
        setPhonePrograms((current) => add(current ?? phonePrograms, program));
        return program;
      }
      try {
        // A new program gets its id from the backend, so the one the screen made up is dropped.
        const saved = isNew ? await api.createProgram(program) : await api.updateProgram(program);
        setBackendPrograms((current) => add(current, saved));
        return saved;
      } catch (error) {
        Alert.alert("Couldn't save the program", error instanceof Error ? error.message : String(error));
        return null;
      }
    },
    [onBackend, programs, phonePrograms, setPhonePrograms],
  );

  const deleteProgram = useCallback(
    async (id: string) => {
      if (!onBackend) {
        setPhonePrograms((current) => (current ?? phonePrograms).filter((item) => item.id !== id));
        return true;
      }
      try {
        await api.deleteProgram(id);
        setBackendPrograms((current) => current.filter((item) => item.id !== id));
        return true;
      } catch (error) {
        Alert.alert("Couldn't delete the program", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, phonePrograms, setPhonePrograms],
  );

  const uploadMusic = useCallback(async (file: { uri: string; name: string; mimeType?: string }) => {
    try {
      return await api.uploadMusic(file);
    } catch (error) {
      Alert.alert("Couldn't upload the music", error instanceof Error ? error.message : String(error));
      return null;
    }
  }, []);

  deletePhoneStudentData.current = (studentId: string) => {
    setPhoneLessons((current) => current.filter((item) => item.studentId !== studentId));
    setPhoneNotes((current) => current.filter((item) => item.studentId !== studentId));
    setPhonePrograms((current) => (current ?? phonePrograms).filter((item) => item.studentId !== studentId));
  };

  const [settings, setSettings, l5] = usePersistentState<Settings>("skatepod.settings.v1", SAMPLE_SETTINGS);
  const [availability, setAvailability, l6] = usePersistentState<AvailabilityBlock[]>("skatepod.availability.v1", []);
  // The last time the training history was brought up to date (see lessonHistoryToAdd).
  const [historyCheckedAt, setHistoryCheckedAt, l7] = usePersistentState<string | null>("skatepod.historyCheckedAt.v1", null);

  // On the backend, the backend adds the history entries itself each time the notes are loaded
  // (GET /api/notes), so the app just loads them again every minute.
  useEffect(() => {
    if (!onBackend) return;
    const timer = setInterval(() => {
      api.listNotes().then(setBackendNotes, () => {}); // a missed refresh is fine: the next one tries again
    }, 60_000);
    return () => clearInterval(timer);
  }, [onBackend]);

  const checkedAt = useRef<string | null>(null);
  // On the phone: every minute (and when the app opens), add a Lessons-tab entry for each calendar lesson
  // that has started since the last check. The first time, history starts from the beginning of this week.
  useEffect(() => {
    if (onBackend || !(l1 && l2 && l3 && l4 && l5 && l6 && l7)) return;
    const catchUp = () => {
      const now = new Date();
      // A ref, so the timer always sees the latest check. Lessons are only added after it, which also
      // means an entry the coach deleted from the Lessons tab doesn't come back.
      checkedAt.current ??= historyCheckedAt;
      const since = checkedAt.current ? new Date(checkedAt.current) : startOfWeek(now);
      setPhoneNotes((current) => {
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
      saveNote,
      deleteNotes,
      programs,
      saveProgram,
      deleteProgram,
      uploadMusic,
      settings,
      setSettings,
      studentById: (id: string) => students.find((student) => student.id === id),
      resetSampleData: () => {
        // Students, lessons, notes and programs on the backend aren't touched: this only resets what's on the phone.
        if (onBackend) reloadFromBackend();
        else {
          setPhoneStudents(SAMPLE_STUDENTS);
          setPhoneLessons(SAMPLE_LESSONS);
          setPhoneNotes(SAMPLE_NOTES);
          setPhonePrograms([]);
        }
        setSettings(SAMPLE_SETTINGS);
        setAvailability([]);
        setHistoryCheckedAt(null);
        checkedAt.current = null;
      },
    }),
    [
      students, onBackend, backendError, reloadFromBackend, saveStudent, deleteStudent, lessons, saveLesson, deleteLesson, availability,
      notes, saveNote, deleteNotes, programs, saveProgram, deleteProgram, uploadMusic, settings, setPhoneStudents, setPhoneLessons, setPhoneNotes,
      setPhonePrograms, setAvailability, setSettings,
    ],
  );

  if (!(l1 && l2 && l3 && l4 && l5 && l6 && l7 && l8 && backendLoaded)) {
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
