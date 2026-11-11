/// <reference types="node" />
// Unit tests for the plain rules in data.ts. Run them with `npm test` (in mobile/).
// They use Node's built-in test runner, so there's nothing extra to install, and they never open the app.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  smsLink,
  shareNotesMessage,
  phoneLink,
  phoneProblem,
  coachProfileHasChanges,
  coachProfileOf,
  coachProfileProblem,
  notesForStudent,
  DASHBOARD_UPCOMING,
  SAMPLE_LESSONS,
  SAMPLE_STUDENTS,
  dashboardRows,
  TONES,
  defaultTrackFor,
  studentFromApi,
  apiTimeFromMinutes,
  lessonFromApi,
  lessonToApi,
  minutesFromDuration,
  noteFromApi,
  noteToApi,
  DEFAULT_PROGRAM,
  formatFileSize,
  musicServiceName,
  newProgramFor,
  programFromApi,
  programHasChanges,
  programNotReady,
  programToApi,
  trackFromApi,
  sortStudentsByName,
  startsLaterNote,
  weekOffsetOf,
  upgradeOldPrograms,
  type Program,
  minutesFromApiTime,
  studentToApi,
  toneFor,
  MAX_DAY_WIDTH,
  MAX_HOUR_HEIGHT,
  addDaysToKey,
  countWeeklyLessons,
  durationChoices,
  lessonSummary,
  endDateAfterLessons,
  isOneTimeLesson,
  moveToWeekday,
  nextDateOnWeekday,
  weekdayOfKey,
  calendarScale,
  colorForType,
  findClash,
  findNextLesson,
  isLessonActiveOn,
  nextLessonTime,
  isEmptyNote,
  lessonHistoryToAdd,
  noteHasChanges,
  matchesHistoryFilter,
  syncLessonNote,
  unavailableStretches,
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

describe("noteHasChanges: closing a note with the X asks first only if something changed", () => {
  test("a note that wasn't touched has no changes", () => {
    assert.equal(noteHasChanges(note(), note()), false);
  });

  test("typing in a text box is a change", () => {
    assert.equal(noteHasChanges(note(), note({ observations: "Draft lesson note, better edges" })), true);
  });

  test("adding or removing a skill is a change", () => {
    assert.equal(noteHasChanges(note(), note({ skills: ["Layback"] })), true);
    assert.equal(noteHasChanges(note({ skills: ["Layback"] }), note()), true);
  });

  test("the same skills in a new copy of the list are not a change", () => {
    assert.equal(noteHasChanges(note({ skills: ["Layback", "Axel"] }), note({ skills: ["Layback", "Axel"] })), false);
  });

  test("flipping the shared switch is a change", () => {
    assert.equal(noteHasChanges(note(), note({ shared: false })), true);
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

describe("unavailableStretches: time outside the coach's availability is greyed out", () => {
  // Made-up blocks: Tuesday (day 1) 3–6 PM at North Rink.
  const tuesday = { day: 1, start: 15 * 60, end: 18 * 60 };

  test("no blocks at all: nothing is greyed out", () => {
    assert.deepEqual(unavailableStretches(1, []), []);
  });

  test("a day without blocks isn't greyed out, even when other days have some", () => {
    assert.deepEqual(unavailableStretches(0, [tuesday]), []);
  });

  test("one block greys out the time before and after it", () => {
    assert.deepEqual(unavailableStretches(1, [tuesday]), [
      { start: 6 * 60, end: 15 * 60 },
      { start: 18 * 60, end: 22 * 60 },
    ]);
  });

  test("the gap between two blocks is greyed out, in time order", () => {
    const morning = { day: 1, start: 7 * 60, end: 9 * 60 };
    assert.deepEqual(unavailableStretches(1, [tuesday, morning]), [
      { start: 6 * 60, end: 7 * 60 },
      { start: 9 * 60, end: 15 * 60 },
      { start: 18 * 60, end: 22 * 60 },
    ]);
  });

  test("back-to-back blocks and blocks at the calendar's edges leave no grey slivers", () => {
    const early = { day: 1, start: 6 * 60, end: 12 * 60 };
    const late = { day: 1, start: 12 * 60, end: 22 * 60 };
    assert.deepEqual(unavailableStretches(1, [late, early]), []);
  });
});

describe("calendarScale: zooming the calendar", () => {
  // A phone-sized box for the day columns: 300 wide, 480 tall.
  const phone = { width: 300, height: 480 };

  test("fully zoomed out, 12 hours fit the height and 7 days fit the width", () => {
    const scale = calendarScale(1, phone);
    assert.equal(scale.hourHeight * 12, 480);
    assert.equal(scale.dayWidth * 7, 300);
    assert.equal(scale.canZoomOut, false);
    assert.equal(scale.canZoomIn, true);
  });

  test("fully zoomed in stops at the maximum hour height and day width", () => {
    const scale = calendarScale(1000, phone);
    assert.equal(scale.hourHeight, MAX_HOUR_HEIGHT);
    assert.equal(scale.dayWidth, MAX_DAY_WIDTH);
    assert.equal(scale.canZoomIn, false);
    assert.equal(scale.canZoomOut, true);
  });

  test("in between, the day width grows with the hour height", () => {
    const small = calendarScale(50, phone);
    const big = calendarScale(80, phone);
    assert.equal(small.hourHeight, 50);
    assert.ok(big.dayWidth > small.dayWidth);
  });

  test("on a very big screen, fully zoomed out is also the most it can zoom in", () => {
    const scale = calendarScale(64, { width: 1400, height: 1440 });
    assert.equal(scale.hourHeight, 120); // 1440 / 12
    assert.equal(scale.dayWidth, 200); // 1400 / 7
    assert.equal(scale.canZoomIn, false);
    assert.equal(scale.canZoomOut, false);
  });
});

describe("students on the backend", () => {
  test("adult disciplines default to the Adult track, the rest to Championship", () => {
    assert.equal(defaultTrackFor("ADULT_FREESKATE"), "ADULT");
    assert.equal(defaultTrackFor("ADULT_LEARN_TO_SKATE"), "ADULT");
    assert.equal(defaultTrackFor("STANDARD_FREESKATE"), "CHAMPIONSHIP");
    assert.equal(defaultTrackFor("SYNCHRO"), "CHAMPIONSHIP");
  });

  test("a student always gets the same avatar color from their id", () => {
    const id = "3f2a6c1e-0000-4000-8000-000000000001";
    assert.deepEqual(toneFor(id), toneFor(id));
    assert.ok(TONES.includes(toneFor(id)));
  });

  test("turns the backend's student into the app's, keeping the hidden track", () => {
    const student = studentFromApi({
      id: "abc",
      name: "Lily Kim",
      disciplines: [{ discipline: "STANDARD_FREESKATE", track: "EXCEL", level: "Silver" }],
    });
    assert.equal(student.name, "Lily Kim");
    assert.deepEqual(student.disciplines, [{ discipline: "STANDARD_FREESKATE", track: "EXCEL", level: "Silver" }]);
    assert.deepEqual(student.tone, toneFor("abc"));
  });

  test("sends each discipline's track, or the default one for a newly added discipline", () => {
    const body = studentToApi({
      name: "Lily Kim",
      disciplines: [
        { discipline: "STANDARD_FREESKATE", track: "EXCEL", level: "Silver" },
        { discipline: "ADULT_SKILLS", level: "Adult Bronze" },
      ],
    });
    assert.deepEqual(body, {
      name: "Lily Kim",
      phone: null,
      disciplines: [
        { discipline: "STANDARD_FREESKATE", track: "EXCEL", level: "Silver" },
        { discipline: "ADULT_SKILLS", track: "ADULT", level: "Adult Bronze" },
      ],
    });
  });
});

describe("lessons on the backend", () => {
  test("turns the backend's times into minutes and back", () => {
    assert.equal(minutesFromApiTime("09:30"), 570);
    assert.equal(minutesFromApiTime("06:32:00"), 392);
    assert.equal(apiTimeFromMinutes(570), "09:30");
    assert.equal(apiTimeFromMinutes(392), "06:32");
    assert.equal(apiTimeFromMinutes(21 * 60 + 5), "21:05");
  });

  test("turns the backend's lesson into the app's, with the color from the type", () => {
    const lesson = lessonFromApi({
      id: "l1",
      studentId: "s1",
      dayOfWeek: "TUESDAY",
      startTime: "09:30:00",
      durationMinutes: 45,
      type: "Off-ice",
      startDate: "2026-11-10",
      endDate: null,
      createdAt: "2026-11-07T10:00:00Z",
    });
    assert.deepEqual(lesson, {
      id: "l1",
      studentId: "s1",
      day: 1,
      start: 570,
      duration: 45,
      type: "Off-ice",
      color: "purple",
      createdAt: "2026-11-07T10:00:00Z",
      startDate: "2026-11-10",
      endDate: undefined,
    });
  });

  test("sends day names and times, and null for missing dates", () => {
    const body = lessonToApi({ id: "l1", studentId: "s1", day: 6, start: 1020, duration: 60, type: "Public", color: "sand" });
    assert.deepEqual(body, {
      studentId: "s1",
      dayOfWeek: "SUNDAY",
      startTime: "17:00",
      durationMinutes: 60,
      type: "Public",
      startDate: null,
      endDate: null,
    });
  });
});

describe("notes on the backend", () => {
  test("reads the minutes out of the app's length text", () => {
    assert.equal(minutesFromDuration("45 minutes"), 45);
    assert.equal(minutesFromDuration("60"), 60);
    assert.equal(minutesFromDuration(""), 60);
  });

  test("turns the backend's note into the app's, with empty text for missing fields", () => {
    const note = noteFromApi({
      id: "n1",
      studentId: "s1",
      lessonId: null,
      date: "2026-11-07T15:00:00Z",
      title: "Freestyle lesson",
      lessonType: "Freestyle",
      durationMinutes: 45,
      overall: null,
      focus: null,
      observations: "Clean axel",
      nextSteps: null,
      skills: null,
      shared: false,
    });
    assert.deepEqual(note, {
      id: "n1",
      studentId: "s1",
      lessonId: undefined,
      date: "2026-11-07T15:00:00.000Z",
      title: "Freestyle lesson",
      lessonType: "Freestyle",
      duration: "45 minutes",
      overall: "",
      focus: "",
      observations: "Clean axel",
      nextSteps: "",
      skills: [],
      shared: false,
    });
  });

  test("sends the length in minutes and null for a note without a lesson", () => {
    const body = noteToApi({
      id: "n1",
      studentId: "s1",
      date: "2026-11-07T15:00:00.000Z",
      title: "Public lesson",
      lessonType: "Public",
      duration: "30 minutes",
      overall: "Steady",
      focus: "Edges",
      observations: "",
      nextSteps: "",
      skills: ["Waltz jump"],
      shared: true,
    });
    assert.equal(body.durationMinutes, 30);
    assert.equal(body.lessonId, null);
    assert.equal(body.overall, "Steady");
    assert.deepEqual(body.skills, ["Waltz jump"]);
    assert.equal("id" in body, false);
  });
});

describe("programs (several per student, with music)", () => {
  const program = (changes: Partial<Program> = {}): Program => ({
    ...DEFAULT_PROGRAM,
    id: "p1",
    studentId: "s1",
    name: "Free skate",
    musicLink: "",
    musicFile: null,
    ...changes,
  });

  test("turns the backend's program into the app's, keeping combination titles and the music", () => {
    const result = programFromApi({
      id: "p1",
      studentId: "s1",
      name: "Free skate 2026-27",
      musicTitle: "Nocturne",
      artist: null,
      duration: "2:10",
      track: "EXCEL",
      level: "Excel Juvenile",
      musicLink: null,
      musicFile: { id: "f1", fileName: "Nocturne.mp3", contentType: "audio/mpeg", sizeBytes: 300000 },
      elements: [
        { code: "1A", title: "Single Axel", category: "Jump" },
        { code: "1S+1T", title: "2 Jump Combination", category: "Jump" },
      ],
      paths: [[{ x: 1, y: 2 }]],
      placements: [{ id: "m1", code: "1A", x: 3, y: 4 }],
      createdAt: "2026-11-08T05:00:00Z",
    });
    assert.equal(result.name, "Free skate 2026-27");
    assert.equal(result.track, "Excel");
    assert.equal(result.artist, "");
    assert.equal(result.musicLink, "");
    assert.equal(result.musicFile?.fileName, "Nocturne.mp3");
    assert.deepEqual(result.elements[1], { code: "1S+1T", title: "2 Jump Combination", category: "Jump" });
  });

  test("sends element codes, the backend's track name and only the music file's id", () => {
    const body = programToApi(
      program({
        name: " Free skate ",
        track: "Adult",
        level: "Adult Bronze",
        musicLink: " https://open.spotify.com/track/1 ",
        musicFile: { id: "f1", fileName: "a.mp3", contentType: "audio/mpeg", sizeBytes: 1 },
        elements: [{ code: "2S", title: "Double Salchow", category: "Jump" }],
      }),
    );
    assert.equal(body.name, "Free skate");
    assert.equal(body.track, "ADULT");
    assert.equal(body.musicLink, "https://open.spotify.com/track/1");
    assert.equal(body.musicFileId, "f1");
    assert.deepEqual(body.elements, ["2S"]);
  });

  test("a level that isn't on the track is fixed before sending", () => {
    assert.equal(programToApi(program({ track: "Excel", level: "Juvenile" })).level, "Excel Pre-Preliminary");
  });

  test("every backend track maps to the app's", () => {
    assert.equal(trackFromApi("CHAMPIONSHIP"), "Championship");
    assert.equal(trackFromApi("EXCEL"), "Excel");
    assert.equal(trackFromApi("ADULT"), "Adult");
  });

  test("a new program starts on the student's freeskate track and level, with no name", () => {
    const lily = newProgramFor(
      {
        id: "s1",
        disciplines: [
          { discipline: "PATTERN_DANCE", level: "Bronze" },
          { discipline: "STANDARD_FREESKATE", track: "EXCEL", level: "Excel Juvenile" },
        ],
      },
      "new1",
    );
    assert.equal(lily.track, "Excel");
    assert.equal(lily.level, "Excel Juvenile");
    assert.equal(lily.name, "");
    assert.equal(lily.studentId, "s1");
    assert.equal(lily.id, "new1");
    assert.deepEqual(lily.elements, DEFAULT_PROGRAM.elements);

    // Adult freeskate without a stored track gets the Adult track; a level not on the track starts at the first.
    const noah = newProgramFor({ id: "s2", disciplines: [{ discipline: "ADULT_FREESKATE", level: "Gold" }] }, "new2");
    assert.equal(noah.track, "Adult");
    assert.equal(noah.level, "Adult Pre-Bronze");

    const none = newProgramFor({ id: "s3", disciplines: [] }, "new3");
    assert.equal(none.track, "Championship");
    assert.equal(none.level, "Preliminary");
  });

  test("names where a music link opens", () => {
    assert.equal(musicServiceName("https://www.youtube.com/watch?v=abc"), "YouTube");
    assert.equal(musicServiceName("https://youtu.be/abc"), "YouTube");
    assert.equal(musicServiceName("https://music.youtube.com/watch?v=abc"), "YouTube Music");
    assert.equal(musicServiceName("https://open.spotify.com/track/1"), "Spotify");
    assert.equal(musicServiceName("https://music.apple.com/us/album/1"), "Apple Music");
    assert.equal(musicServiceName("https://example.org/song"), "example.org");
    assert.equal(musicServiceName("spotify"), null);
  });

  test("a program needs a name, a music title, a duration like 2:10 and a real link to save", () => {
    const ready = { name: "Free skate", musicTitle: "Nocturne", duration: "2:10", musicLink: "" };
    assert.equal(programNotReady(ready), null);
    assert.equal(programNotReady({ ...ready, musicLink: "https://youtu.be/abc" }), null);
    assert.match(programNotReady({ ...ready, name: " " }) ?? "", /name/);
    assert.match(programNotReady({ ...ready, musicTitle: "" }) ?? "", /title/);
    assert.match(programNotReady({ ...ready, duration: "2:" }) ?? "", /duration/);
    assert.match(programNotReady({ ...ready, musicLink: "spotify song" }) ?? "", /link/);
  });

  test("Save turns on only when something changed", () => {
    const saved = program();
    assert.equal(programHasChanges(saved, { ...saved }), false);
    assert.equal(programHasChanges(saved, { ...saved, level: "Juvenile" }), true);
    assert.equal(programHasChanges(saved, { ...saved, musicFile: { id: "f1", fileName: "a.mp3", contentType: "audio/mpeg", sizeBytes: 1 } }), true);
    assert.equal(programHasChanges(saved, { ...saved, elements: [] }), true);
  });

  test("file sizes read like 4.6 MB", () => {
    assert.equal(formatFileSize(4812345), "4.6 MB");
    assert.equal(formatFileSize(300000), "293 KB");
    assert.equal(formatFileSize(10), "1 KB");
  });

  test("programs saved on the phone before Nov 2026 (one per student) are kept", () => {
    const upgraded = upgradeOldPrograms({ s1: { ...DEFAULT_PROGRAM, musicTitle: "Nocturne" } });
    assert.equal(upgraded.length, 1);
    assert.equal(upgraded[0].id, "old-s1");
    assert.equal(upgraded[0].studentId, "s1");
    assert.equal(upgraded[0].name, "Program");
    assert.equal(upgraded[0].musicTitle, "Nocturne");
  });
});

describe("sortStudentsByName: students A to Z, like the backend's list", () => {
  test("ignores upper/lower case and accents, and keeps the original list as it was", () => {
    const students = [{ name: "Sofia" }, { name: "amelia" }, { name: "Élodie" }, { name: "Flow Skater" }, { name: "Emma" }];
    assert.deepEqual(sortStudentsByName(students).map((student) => student.name), ["amelia", "Élodie", "Emma", "Flow Skater", "Sofia"]);
    assert.equal(students[0].name, "Sofia");
  });
});

describe("a lesson booked for a day that has already passed this week", () => {
  // Sunday Nov 8, 2026, 5 PM: Saturday Nov 7 has passed, so a Saturday lesson booked now starts Nov 14.
  const sunday = new Date(2026, 10, 8, 17, 0);
  const saturdayLesson = { day: 5, start: 7 * 60 + 15, startDate: "2026-11-08" };

  test("weekOffsetOf counts weeks from this one (Monday to Sunday)", () => {
    assert.equal(weekOffsetOf(new Date(2026, 10, 2), sunday), 0); // Monday of this week
    assert.equal(weekOffsetOf(new Date(2026, 10, 14), sunday), 1); // next Saturday
    assert.equal(weekOffsetOf(new Date(2026, 10, 1), sunday), -1); // last Sunday
  });

  test("the clash alert says when a lesson that hasn't happened yet starts", () => {
    assert.equal(startsLaterNote(saturdayLesson, sunday), " (starting Sat, Nov 14)");
  });

  test("no note for lessons that are already going, or have no dates", () => {
    assert.equal(startsLaterNote({ ...saturdayLesson, startDate: "2026-10-01" }, sunday), "");
    assert.equal(startsLaterNote({ day: 5, start: 600 }, sunday), "");
  });
});

describe("one-time and repeating lessons", () => {
  test("day keys: add days, weekday, next date on a weekday", () => {
    assert.equal(addDaysToKey("2026-11-28", 7), "2026-12-05");
    assert.equal(addDaysToKey("2026-03-01", -1), "2026-02-28");
    assert.equal(weekdayOfKey("2026-11-08"), 6); // a Sunday
    assert.equal(weekdayOfKey("2026-11-09"), 0); // a Monday
    assert.equal(nextDateOnWeekday("2026-11-08", 1), "2026-11-10"); // Sunday → the coming Tuesday
    assert.equal(nextDateOnWeekday("2026-11-10", 1), "2026-11-10"); // already a Tuesday
  });

  test("a lesson that starts and ends on the same day is one-time", () => {
    assert.equal(isOneTimeLesson({ startDate: "2026-11-10", endDate: "2026-11-10" }), true);
    assert.equal(isOneTimeLesson({ startDate: "2026-11-10", endDate: "2026-11-17" }), false);
    assert.equal(isOneTimeLesson({ startDate: "2026-11-10" }), false);
    assert.equal(isOneTimeLesson({}), false);
  });

  test("a one-time lesson only runs on its date", () => {
    const lesson = { day: 1, start: 600, startDate: "2026-11-10", endDate: "2026-11-10" };
    assert.equal(nextLessonTime(lesson, new Date(2026, 10, 8))?.getDate(), 10);
    assert.equal(nextLessonTime(lesson, new Date(2026, 10, 11)), null);
  });

  test("after X lessons: the end date is the last lesson's date, and counting gives X back", () => {
    assert.equal(endDateAfterLessons("2026-11-10", 1), "2026-11-10");
    assert.equal(endDateAfterLessons("2026-11-10", 4), "2026-12-01");
    assert.equal(countWeeklyLessons("2026-11-10", "2026-12-01"), 4);
    assert.equal(countWeeklyLessons("2026-11-10", "2026-12-03"), 4);
    assert.equal(countWeeklyLessons("2026-11-10", "2026-11-09"), 0);
  });

  test("moving a one-time lesson to another weekday moves its date within the same week", () => {
    const oneTime = { day: 1, startDate: "2026-11-10", endDate: "2026-11-10" };
    assert.deepEqual(moveToWeekday(oneTime, 3), { day: 3, startDate: "2026-11-12", endDate: "2026-11-12" });
    assert.deepEqual(moveToWeekday(oneTime, 0), { day: 0, startDate: "2026-11-09", endDate: "2026-11-09" });
    const weekly = { day: 1, startDate: "2026-11-10" };
    assert.deepEqual(moveToWeekday(weekly, 3), { day: 3, startDate: "2026-11-10" });
  });
});

describe("Home: Coming up list", () => {
  // Sunday Nov 8, 2026 at noon: every sample lesson is still ahead this week.
  const sunday = new Date(2026, 10, 8, 12, 0);

  test("without a search it shows the next lessons, soonest first", () => {
    const rows = dashboardRows(SAMPLE_STUDENTS, SAMPLE_LESSONS, "", sunday);
    assert.equal(rows.length, DASHBOARD_UPCOMING);
    assert.deepEqual(rows.map((row) => row.lesson?.id), ["l1", "l2", "l3", "l4", "l5", "l6"]);
  });

  test("a search by name shows that student once, with their next lesson", () => {
    const rows = dashboardRows(SAMPLE_STUDENTS, SAMPLE_LESSONS, "lily", sunday);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].studentId, "s2");
    assert.equal(rows[0].lesson?.id, "l2");
  });

  test("a search by level finds students, and the ones with nothing scheduled come last", () => {
    // "Gold" matches Emma (Gold skills), Sofia (Gold freeskate, no lessons) and Noah (Adult Gold, no lessons).
    const rows = dashboardRows(SAMPLE_STUDENTS, SAMPLE_LESSONS, "gold", sunday);
    assert.deepEqual(rows.map((row) => row.studentId), ["s1", "s5", "s4"]);
    assert.equal(rows[0].lesson?.id, "l3");
    assert.equal(rows[1].lesson, null);
    assert.equal(rows[2].time, null);
  });

  test("a search with no match gives no rows", () => {
    assert.deepEqual(dashboardRows(SAMPLE_STUDENTS, SAMPLE_LESSONS, "zzz", sunday), []);
  });
});

describe("notesForStudent", () => {
  const note = (id: string, studentId: string, date: string) =>
    ({ id, studentId, date, title: "", lessonType: "Freestyle", duration: "60 minutes", overall: "", focus: "", observations: "", nextSteps: "", skills: [], shared: false }) as Note;

  test("keeps only that student's notes, newest first", () => {
    const notes = [note("a", "s1", "2026-11-01"), note("b", "s2", "2026-11-05"), note("c", "s1", "2026-11-08"), note("d", "s1", "2026-10-20")];
    assert.deepEqual(notesForStudent(notes, "s1").map((item) => item.id), ["c", "a", "d"]);
  });

  test("is empty for a student without notes", () => {
    assert.deepEqual(notesForStudent([note("a", "s1", "2026-11-01")], "s9"), []);
  });
});

describe("phoneProblem", () => {
  test("blank is fine: the phone number is optional", () => {
    assert.equal(phoneProblem(""), null);
    assert.equal(phoneProblem("   "), null);
  });

  test("accepts 7 to 15 digits with spaces and + ( ) - .", () => {
    assert.equal(phoneProblem("+1 (555) 010-2030"), null);
    assert.equal(phoneProblem("555.0102"), null);
  });

  test("refuses letters and too few or too many digits", () => {
    assert.match(phoneProblem("555-CALL") ?? "", /digits only/);
    assert.match(phoneProblem("555-01") ?? "", /7 to 15/);
    assert.match(phoneProblem("1234567890123456") ?? "", /7 to 15/);
  });

  test("phoneLink keeps only digits and +", () => {
    assert.equal(phoneLink("+1 (555) 010-2030"), "tel:+15550102030");
  });
});

describe("student phone and the API", () => {
  test("studentToApi sends a trimmed phone, or null", () => {
    assert.equal(studentToApi({ name: "Emma", disciplines: [], phone: " 555 0102 " }).phone, "555 0102");
    assert.equal(studentToApi({ name: "Emma", disciplines: [], phone: "  " }).phone, null);
    assert.equal(studentToApi({ name: "Emma", disciplines: [] }).phone, null);
  });

  test("studentFromApi keeps the phone and leaves it out when there is none", () => {
    assert.equal(studentFromApi({ id: "a", name: "Emma", phone: "555 0102", disciplines: [] }).phone, "555 0102");
    assert.equal("phone" in studentFromApi({ id: "a", name: "Emma", phone: null, disciplines: [] }), false);
  });
});

describe("shareNotesMessage", () => {
  const note = (id: string, date: string, changes: Partial<Note> = {}) =>
    ({ id, studentId: "s2", date, title: "", lessonType: "Freestyle", duration: "60 minutes", overall: "", focus: "", observations: "", nextSteps: "", skills: [], shared: false, ...changes }) as Note;

  test("greets the student by first name, lists the notes oldest first and signs off via SkatePod", () => {
    const message = shareNotesMessage(
      [note("b", "2026-11-06T14:00:00", { focus: "Axel", skills: ["Axel", "Loop"] }), note("a", "2026-11-02T14:00:00", { observations: "Strong edges.", nextSteps: "Spirals" })],
      "Lily Kim",
      "Mia Carter",
    );
    const parts = message.split("\n\n");
    assert.equal(parts[0], "Hi Lily, here are your notes from our last 2 lessons:");
    assert.match(parts[1], /Nov 2[\s\S]*Strong edges\.\nNext: Spirals/);
    assert.match(parts[2], /Nov 6[\s\S]*Focus: Axel\nSkills: Axel, Loop/);
    assert.equal(parts[3], "— Mia Carter, via SkatePod");
  });

  test("one lesson, an empty note and no coach name", () => {
    const message = shareNotesMessage([note("a", "2026-11-02T14:00:00")], "LK", " ");
    assert.match(message, /^Hi LK, here are your notes from our lesson:/);
    assert.match(message, /No notes for this lesson\./);
    assert.match(message, /— via SkatePod$/);
  });
});

describe("smsLink", () => {
  test("iPhone: number, then &body= with the message encoded", () => {
    assert.equal(smsLink("(678) 910-9157", "Hi Lucas, notes & more", "ios"), "sms:6789109157&body=Hi%20Lucas%2C%20notes%20%26%20more");
  });

  test("Android: ?body= instead", () => {
    assert.equal(smsLink("+1 678 910 9157", "Hi", "android"), "sms:+16789109157?body=Hi");
  });

  test("no number: the coach picks a contact", () => {
    assert.equal(smsLink(undefined, "Hi", "ios"), "sms:&body=Hi");
    assert.equal(smsLink("", "Hi", "android"), "sms:?body=Hi");
  });
});

describe("coach profile (Settings)", () => {
  const saved = coachProfileOf({ coachName: "Mia Carter", email: "mia@example.com", lessonLength: 45, reminders: true, sharedNotes: true });

  test("settings saved before the phone number existed get an empty phone", () => {
    assert.equal(saved.phone, "");
  });

  test("only real changes light up Save", () => {
    assert.equal(coachProfileHasChanges(saved, { ...saved }), false);
    assert.equal(coachProfileHasChanges(saved, { ...saved, coachName: " Mia Carter " }), false);
    assert.equal(coachProfileHasChanges(saved, { ...saved, phone: "555 010 9000" }), true);
    assert.equal(coachProfileHasChanges(saved, { ...saved, lessonLength: 60 }), true);
  });

  test("empty fields are fine, a bad phone or email is not", () => {
    assert.equal(coachProfileProblem({ coachName: "", email: "", phone: "", lessonLength: 45 }), null);
    assert.equal(coachProfileProblem({ ...saved, phone: "+1 (555) 010-9000" }), null);
    assert.match(coachProfileProblem({ ...saved, phone: "555-CALL" }) ?? "", /^Phone number: .*digits only/);
    assert.match(coachProfileProblem({ ...saved, email: "mia" }) ?? "", /email/);
  });
});

describe("lesson editor: lengths and summary", () => {
  test("30, 45 and 60 minutes, plus the lesson's own length when it's different", () => {
    assert.deepEqual(durationChoices(45), [30, 45, 60]);
    assert.deepEqual(durationChoices(75), [30, 45, 60, 75]);
    assert.deepEqual(durationChoices(20), [20, 30, 45, 60]);
  });

  test("one-time and weekly summaries (2026-11-10 is a Tuesday)", () => {
    assert.equal(lessonSummary({ isRepeating: false, date: "2026-11-10", start: 480 }), "One lesson on Tue, Nov 10 at 8:00 AM.");
    assert.equal(lessonSummary({ isRepeating: true, date: "2026-11-10", start: 480 }), "Every Tuesday at 8:00 AM, starting Tue, Nov 10.");
    assert.equal(
      lessonSummary({ isRepeating: true, date: "2026-11-10", start: 480, endDate: "2026-12-01" }),
      "Every Tuesday at 8:00 AM, starting Tue, Nov 10 until Tue, Dec 1 (4 lessons).",
    );
    assert.equal(lessonSummary({ isRepeating: true, date: "2026-11-10", start: 480, endDate: "2026-11-10" }).endsWith("(1 lesson)."), true);
  });

  test("an end date before the start says so", () => {
    assert.match(lessonSummary({ isRepeating: true, date: "2026-11-10", start: 480, endDate: "2026-11-01" }), /^No lessons fall/);
  });
});
