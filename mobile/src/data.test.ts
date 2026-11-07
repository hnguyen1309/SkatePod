/// <reference types="node" />
// Unit tests for the plain rules in data.ts. Run them with `npm test` (in mobile/).
// They use Node's built-in test runner, so there's nothing extra to install, and they never open the app.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { syncLessonNote, type Lesson, type Note } from "./data.ts";

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
