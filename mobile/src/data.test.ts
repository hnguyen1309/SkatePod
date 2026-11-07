/// <reference types="node" />
// Unit tests for the plain rules in data.ts. Run them with `npm test` (in mobile/).
// They use Node's built-in test runner, so there's nothing extra to install, and they never open the app.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  colorForType,
  findClash,
  findNextLesson,
  isLessonActiveOn,
  nextLessonTime,
  isEmptyNote,
  lessonHistoryToAdd,
  matchesHistoryFilter,
  syncLessonNote,
  upgradeLesson,
  type Lesson,
  type Note,
} from "./data.ts";

// Made-up data: Lily's Thursday 9:00 AM Freestyle lesson, 105 minutes.
const lesson: Lesson = { id: "l2", studentId: "s2", day: 3, start: 9 * 60, type: "Freestyle", duration: 105, color: "teal" };
const thursday9am = new Date(2026, 10, 5, 9, 0); // Thu Nov 5, 2026 (months count from 0)

function note(changes: Partial<Note> = {}): Note {
  return {
    id: "n1",
    studentId: "s2",
    date: thursday9am.toISOString(),
    title: "Freestyle lesson",
    lessonType: "Freestyle",
    duration: "105 minutes",
    overall: "Steady",
    focus: "",
    observations: "Draft lesson note",
    nextSteps: "",
    skills: [],
    shared: true,
    lessonId: "l2",
    ...changes,
  };
}

describe("syncLessonNote: a lesson's note follows changes to the lesson", () => {
  test("changing the lesson type and length updates the note", () => {
    const edited = { ...lesson, type: "Public", duration: 60 };
    const [updated] = syncLessonNote([note()], lesson, edited, thursday9am, thursday9am);
    assert.equal(updated.lessonType, "Public");
    assert.equal(updated.duration, "60 minutes");
    assert.equal(updated.title, "Public lesson"); // the app-made title follows the new type
    assert.equal(updated.observations, "Draft lesson note"); // what the coach wrote is kept
  });

  test("changing the lesson's student moves the note to that student", () => {
    const [updated] = syncLessonNote([note()], lesson, { ...lesson, studentId: "s1" }, thursday9am, thursday9am);
    assert.equal(updated.studentId, "s1");
  });

  test("a title the coach typed is kept", () => {
    const edited = { ...lesson, type: "Public" };
    const [updated] = syncLessonNote([note({ title: "Spin session" })], lesson, edited, thursday9am, thursday9am);
    assert.equal(updated.title, "Spin session");
    assert.equal(updated.lessonType, "Public");
  });

  test("moving the lesson to another day and time moves the note's date", () => {
    const moved = { ...lesson, day: 4, start: 10 * 60 + 30 };
    const friday1030 = new Date(2026, 10, 6, 10, 30);
    const [updated] = syncLessonNote([note()], lesson, moved, thursday9am, friday1030);
    assert.equal(updated.date, friday1030.toISOString());
  });

  test("a note from another week isn't touched", () => {
    const lastWeek = note({ date: new Date(2026, 9, 29, 9, 0).toISOString() });
    const edited = { ...lesson, type: "Public" };
    const [unchanged] = syncLessonNote([lastWeek], lesson, edited, thursday9am, thursday9am);
    assert.deepEqual(unchanged, lastWeek);
  });

  test("another student's note on the same day isn't touched", () => {
    const emmasNote = note({ id: "n9", studentId: "s1", lessonId: undefined });
    const notes = syncLessonNote([emmasNote], lesson, { ...lesson, type: "Public" }, thursday9am, thursday9am);
    assert.deepEqual(notes, [emmasNote]);
  });

  test("an older note without a lessonId (same student, same day) is updated too", () => {
    const [updated] = syncLessonNote([note({ lessonId: undefined })], lesson, { ...lesson, duration: 45 }, thursday9am, thursday9am);
    assert.equal(updated.duration, "45 minutes");
    assert.equal(updated.lessonId, "l2"); // now linked, so it's found next time
  });

  test("with no note for the lesson, the notes come back unchanged", () => {
    const notes: Note[] = [];
    assert.equal(syncLessonNote(notes, lesson, { ...lesson, type: "Public" }, thursday9am, thursday9am), notes);
  });
});

describe("lesson colors come from the lesson type", () => {
  test("each type has its own color, matching the calendar legend", () => {
    assert.equal(colorForType("Freestyle"), "teal");
    assert.equal(colorForType("Public"), "sand");
    assert.equal(colorForType("Off-ice"), "purple");
  });

  test("a saved lesson whose color doesn't match its type is fixed when it loads", () => {
    const mismatched = { ...lesson, type: "Public", color: "teal" as const };
    assert.equal(upgradeLesson(mismatched).color, "sand");
  });

  test("a lesson saved with the old fixed times gets a start time and the right color", () => {
    const { start, ...old } = lesson;
    const upgraded = upgradeLesson({ ...old, row: 2, type: "Off-ice" } as Lesson & { row: number });
    assert.equal(upgraded.start, 11 * 60);
    assert.equal(upgraded.color, "purple");
  });
});

describe("lessonHistoryToAdd: every lesson that happened shows up in the Lessons tab", () => {
  let next = 0;
  const id = () => `h${next++}`;
  const monday = new Date(2026, 10, 2, 0, 0); // Mon Nov 2, 2026
  const fridayNight = new Date(2026, 10, 6, 22, 0); // Fri Nov 6, 10 PM

  test("a lesson that already started this week gets an empty entry", () => {
    const added = lessonHistoryToAdd([lesson], [], monday, fridayNight, id);
    assert.equal(added.length, 1);
    assert.equal(added[0].date, thursday9am.toISOString());
    assert.equal(added[0].lessonId, "l2");
    assert.ok(isEmptyNote(added[0]));
  });

  test("a lesson later than now isn't added yet", () => {
    const wednesdayNoon = new Date(2026, 10, 4, 12, 0);
    assert.equal(lessonHistoryToAdd([lesson], [], monday, wednesdayNoon, id).length, 0);
  });

  test("a lesson that already has a note that day isn't added twice", () => {
    assert.equal(lessonHistoryToAdd([lesson], [note()], monday, fridayNight, id).length, 0);
  });

  test("history starts when the lesson was added, not before", () => {
    const addedFriday = { ...lesson, createdAt: new Date(2026, 10, 6, 8, 0).toISOString() }; // added after Thursday's time
    assert.equal(lessonHistoryToAdd([addedFriday], [], monday, fridayNight, id).length, 0);
  });

  test("weeks in between are all filled in", () => {
    const threeWeeksLater = new Date(2026, 10, 20, 22, 0); // Fri Nov 20
    const added = lessonHistoryToAdd([lesson], [], monday, threeWeeksLater, id);
    assert.deepEqual(
      added.map((item) => new Date(item.date).getDate()),
      [5, 12, 19],
    );
  });
});

describe("matchesHistoryFilter: filters on the Lessons tab", () => {
  const lily = { name: "Lily Kim", disciplines: [{ discipline: "STANDARD_FREESKATE" as const, level: "Silver" }] };
  const now = new Date(2026, 10, 6, 22, 0);
  const all = { name: "", range: "All" as const, level: null };

  test("by student name, ignoring capitals", () => {
    assert.equal(matchesHistoryFilter(note(), lily, { ...all, name: "lily" }, now), true);
    assert.equal(matchesHistoryFilter(note(), lily, { ...all, name: "emma" }, now), false);
  });

  test("by time", () => {
    const old = note({ date: new Date(2026, 8, 1).toISOString() });
    assert.equal(matchesHistoryFilter(note(), lily, { ...all, range: "This week" }, now), true);
    assert.equal(matchesHistoryFilter(old, lily, { ...all, range: "Last 30 days" }, now), false);
    assert.equal(matchesHistoryFilter(old, lily, all, now), true);
  });

  test("by level", () => {
    assert.equal(matchesHistoryFilter(note(), lily, { ...all, level: "Silver" }, now), true);
    assert.equal(matchesHistoryFilter(note(), lily, { ...all, level: "Gold" }, now), false);
  });
});

describe("weekly lessons with a start date and an optional end date", () => {
  const fridayNight = new Date(2026, 10, 6, 22, 0); // Fri Nov 6

  test("a lesson only runs between its start and end dates", () => {
    const fall = { startDate: "2026-11-12", endDate: "2026-12-17" };
    assert.equal(isLessonActiveOn(fall, new Date(2026, 10, 5)), false);
    assert.equal(isLessonActiveOn(fall, new Date(2026, 10, 12)), true);
    assert.equal(isLessonActiveOn(fall, new Date(2026, 11, 24)), false);
    assert.equal(isLessonActiveOn({}, new Date(2020, 0, 1)), true); // older lessons without dates: always on
  });

  test("the next lesson waits for the start date", () => {
    const startsLater = { ...lesson, startDate: "2026-11-19" }; // a Thursday two weeks out
    assert.equal(nextLessonTime(startsLater, fridayNight)?.toDateString(), new Date(2026, 10, 19).toDateString());
  });

  test("a lesson past its end date has no next lesson", () => {
    assert.equal(nextLessonTime({ ...lesson, endDate: "2026-11-05" }, fridayNight), null);
  });

  test("the next-lesson label says the date when it's more than two weeks away", () => {
    const later = { ...lesson, startDate: "2026-11-26" };
    assert.equal(findNextLesson("s2", [later], fridayNight)?.label, "Thu, Nov 26, 9:00 AM");
    assert.equal(findNextLesson("s2", [lesson], fridayNight)?.label, "Thursday, 9:00 AM");
  });

  test("lessons at the same time don't clash if their dates never overlap", () => {
    const fall = { ...lesson, id: "a", endDate: "2026-12-17" };
    const spring = { ...lesson, id: "b", startDate: "2027-01-07" };
    assert.equal(findClash(spring, [fall]), undefined);
    assert.equal(findClash({ ...spring, startDate: "2026-12-10" }, [fall])?.id, "a");
  });

  test("training history follows the start and end dates", () => {
    let next = 0;
    const id = () => `d${next++}`;
    const since = new Date(2026, 10, 2);
    const fourWeeksLater = new Date(2026, 10, 30, 22, 0);
    const added = lessonHistoryToAdd([{ ...lesson, startDate: "2026-11-12", endDate: "2026-11-19" }], [], since, fourWeeksLater, id);
    assert.deepEqual(added.map((item) => new Date(item.date).getDate()), [12, 19]);
  });
});
