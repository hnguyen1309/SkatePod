import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import * as api from "./api";
import {
  DEFAULT_PROGRAM,
  SAMPLE_LESSONS,
  SAMPLE_NOTES,
  SAMPLE_SETTINGS,
  SAMPLE_STUDENTS,
  lessonHistoryToAdd,
  newId,
  programNotReady,
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
  /** Adds or updates a note. Resolves to the saved note, or null (after telling the coach why) if the backend refused it. */
  saveNote: (note: Note) => Promise<Note | null>;
  /** Deletes one or more notes (Select mode deletes several). Resolves to false if any couldn't be deleted. */
  deleteNotes: (ids: string[]) => Promise<boolean>;
  /** Saved programs by student id. A student without one sees DEFAULT_PROGRAM. */
  programs: Record<string, ProgramData>;
  /**
   * Changes a student's program. It shows straight away; on the backend it's sent a moment after the
   * last change (so typing doesn't send a request per letter), once programNotReady says it's complete.
   */
  updateProgram: (studentId: string, changes: Partial<ProgramData>) => void;
  /** "Start a new program": removes the student's saved program. Resolves to false if the backend refused. */
  clearProgram: (studentId: string) => Promise<boolean>;
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
  const [backendPrograms, setBackendPrograms] = useState<Record<string, ProgramData>>({});
  // The same programs, readable straight away by the delayed save (state only updates on the next render).
  const backendProgramsRef = useRef<Record<string, ProgramData>>({});
  const showBackendPrograms = (next: Record<string, ProgramData>) => {
    backendProgramsRef.current = next;
    setBackendPrograms(next);
  };
  const [backendLoaded, setBackendLoaded] = useState(!onBackend);
  const [backendError, setBackendError] = useState<string | null>(null);
  const students = onBackend ? backendStudents : phoneStudents;

  const reloadFromBackend = useCallback(async () => {
    if (!onBackend) return;
    try {
      // All at once, so the app opens as fast as the slowest of them.
      const [loadedStudents, loadedLessons, loadedNotes] = await Promise.all([api.listStudents(), api.listLessons(), api.listNotes()]);
      setBackendStudents(loadedStudents);
      setBackendLessons(loadedLessons);
      setBackendNotes(loadedNotes);
      // There's one program per student, so ask for each student's (all at once). Only saved ones are kept.
      const loadedPrograms = await Promise.all(loadedStudents.map((student) => api.getProgram(student.id)));
      const byStudent: Record<string, ProgramData> = {};
      loadedStudents.forEach((student, index) => {
        const program = loadedPrograms[index];
        if (program) byStudent[student.id] = program;
      });
      showBackendPrograms(byStudent);
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
        // The backend deletes the student's lessons and notes with them, so drop them here too.
        setBackendLessons((current) => current.filter((item) => item.studentId !== id));
        setBackendNotes((current) => current.filter((item) => item.studentId !== id));
        const { [id]: _deleted, ...otherPrograms } = backendProgramsRef.current; // and their program
        showBackendPrograms(otherPrograms);
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
  const [phonePrograms, setPhonePrograms, l4] = usePersistentState<Record<string, ProgramData>>("skatepod.programs.v1", {});
  const programs = onBackend ? backendPrograms : phonePrograms;

  // One waiting save per student. Each change restarts the wait, so only the last version is sent.
  const programSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const PROGRAM_SAVE_DELAY_MS = 800;

  const updateProgram = useCallback(
    (studentId: string, changes: Partial<ProgramData>) => {
      if (!onBackend) {
        setPhonePrograms((all) => ({ ...all, [studentId]: { ...DEFAULT_PROGRAM, ...all[studentId], ...changes } }));
        return;
      }
      const all = backendProgramsRef.current;
      showBackendPrograms({ ...all, [studentId]: { ...DEFAULT_PROGRAM, ...all[studentId], ...changes } });
      clearTimeout(programSaveTimers.current[studentId]);
      programSaveTimers.current[studentId] = setTimeout(async () => {
        delete programSaveTimers.current[studentId];
        const program = backendProgramsRef.current[studentId];
        if (!program || programNotReady(program)) return; // the Programs screen says what's missing
        try {
          await api.saveProgram(studentId, program);
        } catch (error) {
          Alert.alert("Couldn't save the program", error instanceof Error ? error.message : String(error));
        }
      }, PROGRAM_SAVE_DELAY_MS);
    },
    [onBackend, setPhonePrograms],
  );

  const clearProgram = useCallback(
    async (studentId: string) => {
      if (!onBackend) {
        setPhonePrograms(({ [studentId]: _cleared, ...others }) => others);
        return true;
      }
      // A change still waiting to be sent would save the old program again, so drop it.
      clearTimeout(programSaveTimers.current[studentId]);
      delete programSaveTimers.current[studentId];
      try {
        await api.deleteProgram(studentId);
        const { [studentId]: _cleared, ...others } = backendProgramsRef.current;
        showBackendPrograms(others);
        return true;
      } catch (error) {
        Alert.alert("Couldn't start a new program", error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onBackend, setPhonePrograms],
  );
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
      updateProgram,
      clearProgram,
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
          setPhonePrograms({});
        }
        setSettings(SAMPLE_SETTINGS);
        setAvailability([]);
        setHistoryCheckedAt(null);
        checkedAt.current = null;
      },
    }),
    [
      students, onBackend, backendError, reloadFromBackend, saveStudent, deleteStudent, lessons, saveLesson, deleteLesson, availability,
      notes, saveNote, deleteNotes, programs, updateProgram, clearProgram, settings, setPhoneStudents, setPhoneLessons, setPhoneNotes,
      setPhonePrograms, setAvailability, setSettings,
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
