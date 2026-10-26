import type { LessonColor } from "./theme";

export type Tone = { bg: string; fg: string };

export type DisciplineCategory =
  | "SINGLES"
  | "SKATING_SKILLS"
  | "ICE_DANCE"
  | "PAIRS"
  | "SYNCHRONIZED"
  | "SHOWCASE"
  | "THEATRE_ON_ICE";

export type DisciplineId =
  | "STANDARD_FREESKATE"
  | "ADULT_FREESKATE"
  | "STANDARD_SKILLS"
  | "ADULT_SKILLS"
  | "PATTERN_DANCE"
  | "FREE_DANCE"
  | "PAIRS"
  | "SYNCHRO"
  | "SHOWCASE"
  | "THEATRE_ON_ICE";

/** One discipline a student trains in, and their level in it. */
export type StudentDiscipline = { discipline: DisciplineId; level: string };

export type Student = {
  id: string;
  name: string;
  disciplines: StudentDiscipline[]; // can be empty
  focus: string; // the next lesson isn't stored here: it comes from the calendar (findNextLesson)
  progress: number;
  tone: Tone;
};

export type Lesson = {
  id: string;
  studentId: string;
  day: number; // 0 = Monday ... 6 = Sunday (weekly schedule)
  row: number; // index into TIMES
  type: string;
  duration: number; // minutes
  color: LessonColor;
};

export type Note = {
  id: string;
  studentId: string;
  date: string; // ISO date
  title: string;
  lessonType: string;
  duration: string;
  overall: string;
  focus: string;
  observations: string;
  nextSteps: string;
  skills: string[];
  shared: boolean;
};

export type ProgramElement = {
  code: string;
  title: string;
  category: "Jump" | "Spin" | "Sequence" | "Choreography";
};

export type RinkPoint = { x: number; y: number };
export type RinkPlacement = RinkPoint & { code: string; id: string };

export const TRACK_LEVELS = {
  Championship: [
    "Pre-Preliminary", "Preliminary", "Pre-Juvenile", "Juvenile",
    "Intermediate", "Novice", "Junior", "Senior",
  ],
  Aspire: ["Aspire 1", "Aspire 2", "Aspire 3", "Aspire 4"],
  Adult: [
    "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Adult Gold",
    "Masters Intermediate-Novice", "Masters Junior-Senior",
  ],
} as const;

export type Track = keyof typeof TRACK_LEVELS;
export const TRACKS = Object.keys(TRACK_LEVELS) as Track[];

export type ProgramData = {
  musicTitle: string;
  artist: string;
  duration: string;
  track: Track;
  level: string;
  elements: ProgramElement[];
  paths: RinkPoint[][];
  placements: RinkPlacement[];
};

export type Settings = {
  coachName: string;
  email: string;
  rink: string;
  lessonLength: number;
  reminders: boolean;
  sharedNotes: boolean;
};

export const TIMES = ["7 AM", "9 AM", "11 AM", "1 PM", "3 PM"];
export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const LESSON_TYPES = ["Public", "Freestyle", "Off-ice"];
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];
export const OVERALL = ["Strong progress", "Steady", "Tough session", "Breakthrough"];
export const DISCIPLINE_CATEGORIES: { id: DisciplineCategory; name: string }[] = [
  { id: "SINGLES", name: "Singles" },
  { id: "SKATING_SKILLS", name: "Skating Skills" },
  { id: "ICE_DANCE", name: "Ice Dance" },
  { id: "PAIRS", name: "Pairs" },
  { id: "SYNCHRONIZED", name: "Synchronized" },
  { id: "SHOWCASE", name: "Showcase" },
  { id: "THEATRE_ON_ICE", name: "Theatre On Ice" },
];

export type DisciplineInfo = {
  id: DisciplineId;
  name: string; // full name, used in dropdowns
  shortName: string; // used on the small colored badges
  category: DisciplineCategory;
  levels: readonly string[]; // lowest first
};

// Every discipline and its levels (US Figure Skating test structure), lowest level first.
// Same list as backend/.../student/Discipline.java. Change both together.
export const DISCIPLINES: DisciplineInfo[] = [
  {
    id: "STANDARD_FREESKATE", name: "Standard Track (Freeskate)", shortName: "Freeskate", category: "SINGLES",
    levels: ["Pre-Preliminary", "Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold"],
  },
  {
    id: "ADULT_FREESKATE", name: "Adult Track (Freeskate)", shortName: "Adult Freeskate", category: "SINGLES",
    levels: ["Adult Beginner", "Adult High Beginner", "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Adult Gold"],
  },
  {
    id: "STANDARD_SKILLS", name: "Standard Track (Skills)", shortName: "Skills", category: "SKATING_SKILLS",
    levels: ["Pre-Preliminary", "Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold"],
  },
  {
    id: "ADULT_SKILLS", name: "Adult Track (Skills)", shortName: "Adult Skills", category: "SKATING_SKILLS",
    levels: ["Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Adult Gold"],
  },
  {
    id: "PATTERN_DANCE", name: "Pattern Dance (Solo/Partnered)", shortName: "Pattern Dance", category: "ICE_DANCE",
    levels: ["Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold", "International"],
  },
  {
    id: "FREE_DANCE", name: "Free Dance (Solo/Partnered)", shortName: "Free Dance", category: "ICE_DANCE",
    levels: ["Juvenile", "Intermediate", "Novice", "Junior", "Senior"],
  },
  {
    id: "PAIRS", name: "Pair Track", shortName: "Pairs", category: "PAIRS",
    levels: ["Centennial", "Juvenile", "Intermediate", "Novice", "Junior", "Senior"],
  },
  {
    id: "SYNCHRO", name: "Synchro Team", shortName: "Synchro", category: "SYNCHRONIZED",
    levels: ["Aspire", "Preliminary", "Open Juvenile", "Juvenile", "Intermediate", "Novice", "Junior", "Senior"],
  },
  {
    id: "SHOWCASE", name: "Individual / Duet", shortName: "Showcase", category: "SHOWCASE",
    levels: ["Preliminary", "Pre-Bronze", "Bronze", "Silver", "Gold"],
  },
  {
    id: "THEATRE_ON_ICE", name: "TOI Team Production", shortName: "Theatre On Ice", category: "THEATRE_ON_ICE",
    levels: ["Intro to TOI", "Open", "Preliminary", "Intermediate", "Novice", "Junior", "Senior"],
  },
];

export function disciplineInfo(id: DisciplineId) {
  return DISCIPLINES.find((item) => item.id === id) ?? DISCIPLINES[0];
}

export function categoryName(id: DisciplineCategory) {
  return DISCIPLINE_CATEGORIES.find((item) => item.id === id)?.name ?? id;
}

/** Puts disciplines in catalog order (Singles first, then Skating Skills, and so on). */
export function sortDisciplines(list: StudentDiscipline[]) {
  const position = (item: StudentDiscipline) => DISCIPLINES.findIndex((info) => info.id === item.discipline);
  return [...list].sort((a, b) => position(a) - position(b));
}

/** One line like "Pre-Gold Freeskate · Gold Skills", also used for search. */
export function disciplineSummary(student: Student) {
  if (!student.disciplines.length) return "No disciplines yet";
  return sortDisciplines(student.disciplines)
    .map((item) => `${item.level} ${disciplineInfo(item.discipline).shortName}`)
    .join(" · ");
}

export const TONES: Tone[] = [
  { bg: "#dcebee", fg: "#396972" },
  { bg: "#ede5dc", fg: "#755c44" },
  { bg: "#e7e2ef", fg: "#685a7e" },
  { bg: "#f0dfdf", fg: "#805555" },
  { bg: "#e4eadc", fg: "#596a43" },
  { bg: "#dde8f1", fg: "#4d687e" },
];

export function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// All sample people below are made up.
export const SAMPLE_STUDENTS: Student[] = [
  { id: "s1", name: "Emma Miller", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Pre-Gold" }, { discipline: "STANDARD_SKILLS", level: "Gold" }], focus: "Double loop", progress: 74, tone: TONES[0] },
  { id: "s2", name: "Lily Kim", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Silver" }, { discipline: "PATTERN_DANCE", level: "Bronze" }], focus: "Flying camel", progress: 61, tone: TONES[1] },
  { id: "s3", name: "Jonah Reed", disciplines: [{ discipline: "STANDARD_SKILLS", level: "Preliminary" }], focus: "Power pulls", progress: 82, tone: TONES[2] },
  { id: "s4", name: "Sofia Chen", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Gold" }, { discipline: "FREE_DANCE", level: "Juvenile" }], focus: "Double axel", progress: 57, tone: TONES[3] },
  { id: "s5", name: "Noah Bennett", disciplines: [{ discipline: "ADULT_FREESKATE", level: "Adult Gold" }, { discipline: "ADULT_SKILLS", level: "Adult Silver" }], focus: "Combination spin", progress: 69, tone: TONES[4] },
  { id: "s6", name: "Amelia Park", disciplines: [], focus: "Axel", progress: 46, tone: TONES[5] },
];

export const SAMPLE_LESSONS: Lesson[] = [
  { id: "l1", studentId: "s3", day: 0, row: 2, type: "Public", duration: 45, color: "sand" },
  { id: "l2", studentId: "s2", day: 1, row: 1, type: "Freestyle", duration: 60, color: "teal" },
  { id: "l3", studentId: "s1", day: 2, row: 4, type: "Off-ice", duration: 30, color: "purple" },
  { id: "l4", studentId: "s1", day: 3, row: 0, type: "Freestyle", duration: 60, color: "teal" },
  { id: "l5", studentId: "s2", day: 3, row: 3, type: "Freestyle", duration: 45, color: "teal" },
  { id: "l6", studentId: "s3", day: 4, row: 2, type: "Off-ice", duration: 45, color: "purple" },
  { id: "l7", studentId: "s1", day: 5, row: 1, type: "Public", duration: 60, color: "sand" },
];

export const SAMPLE_NOTES: Note[] = [
  { id: "n1", studentId: "s1", date: daysAgo(0), title: "Freestyle lesson", lessonType: "Freestyle", duration: "60 minutes", overall: "Strong progress", focus: "Double loop, flying camel spin", observations: "Much stronger check on the double loop today. Landing was controlled on 4 of 6 attempts. Keep the free leg extended longer through the exit.", nextSteps: "Start next lesson with loop entrance drills, then connect the jump into the opening program section.", skills: ["Double loop", "Flying camel", "Program transitions"], shared: true },
  { id: "n2", studentId: "s2", date: daysAgo(2), title: "Spin session", lessonType: "Public", duration: "45 minutes", overall: "Steady", focus: "Flying camel, spin combinations", observations: "Flying camel entry is more consistent from speed. Centering improved when the entry edge stayed patient.", nextSteps: "Practice three controlled entries before adding the change-foot combination.", skills: ["Flying camel", "Combination spin"], shared: true },
  { id: "n3", studentId: "s3", date: daysAgo(3), title: "Moves in the field", lessonType: "Public", duration: "45 minutes", overall: "Steady", focus: "Power pulls and edge quality", observations: "Continue working on knee action through power pulls. Stronger flow on the right side.", nextSteps: "Complete two sets on each foot with emphasis on rhythm.", skills: ["Power pulls", "Outside edges"], shared: true },
  { id: "n4", studentId: "s4", date: daysAgo(6), title: "Program run-through", lessonType: "Freestyle", duration: "60 minutes", overall: "Strong progress", focus: "Free skate run-through", observations: "Great musical timing. Rework the final jump entrance to preserve speed into the last section.", nextSteps: "Mark the revised entrance twice, then complete one full run-through.", skills: ["Program transitions", "Double axel"], shared: true },
];

export const SAMPLE_SETTINGS: Settings = {
  coachName: "Mia Carter",
  email: "mia@example.com",
  rink: "North Rink",
  lessonLength: 45,
  reminders: true,
  sharedNotes: true,
};

type CatalogItem = ProgramElement & { minimum: Record<Track, number> };

export const ELEMENT_CATALOG: CatalogItem[] = [
  { code: "1T", title: "Single toe loop", category: "Jump", minimum: { Championship: 0, Aspire: 0, Adult: 0 } },
  { code: "1S", title: "Single salchow", category: "Jump", minimum: { Championship: 0, Aspire: 0, Adult: 0 } },
  { code: "1Lo", title: "Single loop", category: "Jump", minimum: { Championship: 0, Aspire: 1, Adult: 0 } },
  { code: "1F", title: "Single flip", category: "Jump", minimum: { Championship: 0, Aspire: 1, Adult: 1 } },
  { code: "1Lz", title: "Single lutz", category: "Jump", minimum: { Championship: 0, Aspire: 2, Adult: 1 } },
  { code: "1A", title: "Axel", category: "Jump", minimum: { Championship: 1, Aspire: 3, Adult: 2 } },
  { code: "2S", title: "Double salchow", category: "Jump", minimum: { Championship: 2, Aspire: 4, Adult: 3 } },
  { code: "2T", title: "Double toe loop", category: "Jump", minimum: { Championship: 2, Aspire: 4, Adult: 3 } },
  { code: "2Lo", title: "Double loop", category: "Jump", minimum: { Championship: 3, Aspire: 4, Adult: 4 } },
  { code: "2F", title: "Double flip", category: "Jump", minimum: { Championship: 4, Aspire: 4, Adult: 4 } },
  { code: "2Lz", title: "Double lutz", category: "Jump", minimum: { Championship: 4, Aspire: 4, Adult: 4 } },
  { code: "2A", title: "Double axel", category: "Jump", minimum: { Championship: 5, Aspire: 4, Adult: 5 } },
  { code: "USp", title: "Upright spin", category: "Spin", minimum: { Championship: 0, Aspire: 0, Adult: 0 } },
  { code: "SSp", title: "Sit spin", category: "Spin", minimum: { Championship: 0, Aspire: 1, Adult: 0 } },
  { code: "CSp", title: "Camel spin", category: "Spin", minimum: { Championship: 1, Aspire: 2, Adult: 1 } },
  { code: "CCoSp", title: "Change-foot combination spin", category: "Spin", minimum: { Championship: 2, Aspire: 3, Adult: 2 } },
  { code: "FCSp", title: "Flying camel spin", category: "Spin", minimum: { Championship: 3, Aspire: 4, Adult: 3 } },
  { code: "StSq", title: "Step sequence", category: "Sequence", minimum: { Championship: 0, Aspire: 0, Adult: 0 } },
  { code: "ChSq", title: "Choreographic sequence", category: "Choreography", minimum: { Championship: 1, Aspire: 1, Adult: 1 } },
  { code: "SpSq", title: "Spiral sequence", category: "Choreography", minimum: { Championship: 0, Aspire: 0, Adult: 0 } },
];

export const STARTER_ELEMENTS: ProgramElement[] = [
  { code: "1A", title: "Axel", category: "Jump" },
  { code: "2S", title: "Double salchow", category: "Jump" },
  { code: "CCoSp", title: "Change-foot combination spin", category: "Spin" },
  { code: "StSq", title: "Step sequence", category: "Sequence" },
];

export const DEFAULT_PROGRAM: ProgramData = {
  musicTitle: "Untitled program",
  artist: "",
  duration: "2:10",
  track: "Championship",
  level: "Preliminary",
  elements: STARTER_ELEMENTS,
  paths: [],
  placements: [],
};

export function eligibleElements(track: Track, level: string): ProgramElement[] {
  const levels = TRACK_LEVELS[track] as readonly string[];
  const levelIndex = Math.max(0, levels.indexOf(level));
  return ELEMENT_CATALOG.filter((item) => item.minimum[track] <= levelIndex).map(
    ({ code, title, category }) => ({ code, title, category }),
  );
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function weekDates(offset: number) {
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - todayIndex + offset * 7);
  return WEEKDAYS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label, date, isToday: offset === 0 && index === todayIndex };
  });
}

export function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export const FULL_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The hour a calendar row starts, e.g. row 3 ("1 PM") → 13. */
function rowHour(row: number) {
  const [hour, half] = TIMES[row].split(" ");
  return (Number(hour) % 12) + (half === "PM" ? 12 : 0);
}

/**
 * A student's next lesson, worked out from the weekly calendar (the calendar is the source of truth,
 * like NextLessonCalculator in the backend). A lesson that already started today counts as next week's.
 * Returns null when the student has no lessons on the calendar.
 */
export function findNextLesson(studentId: string, lessons: Lesson[], now = new Date()) {
  const today = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let best: { lesson: Lesson; daysAhead: number } | null = null;

  for (const lesson of lessons) {
    if (lesson.studentId !== studentId) continue;
    let daysAhead = (lesson.day - today + 7) % 7;
    if (daysAhead === 0 && rowHour(lesson.row) * 60 < nowMinutes) daysAhead = 7;
    const sooner = !best || daysAhead < best.daysAhead || (daysAhead === best.daysAhead && lesson.row < best.lesson.row);
    if (sooner) best = { lesson, daysAhead };
  }
  if (!best) return null;

  const { lesson, daysAhead } = best;
  const day =
    daysAhead === 0 ? "Today" : daysAhead === 1 ? "Tomorrow" : daysAhead === 7 ? `Next ${FULL_WEEKDAYS[lesson.day]}` : FULL_WEEKDAYS[lesson.day];
  return { lesson, label: `${day}, ${TIMES[lesson.row].replace(" ", ":00 ")}` };
}

/** Like findNextLesson, but just the text, e.g. "Tomorrow, 7:00 AM" or "Not scheduled". */
export function nextLessonLabel(studentId: string, lessons: Lesson[]) {
  return findNextLesson(studentId, lessons)?.label ?? "Not scheduled";
}

/**
 * The lesson that's already in the way of `lesson`, or undefined if the time is free.
 * A coach teaches one lesson at a time, so this checks every student's lessons on the same day.
 * Two lessons clash when each one starts before the other ends (back-to-back is fine).
 * Same rule as LessonService.checkTimeIsFree in the backend.
 */
export function findClash(lesson: Pick<Lesson, "id" | "day" | "row" | "duration">, lessons: Lesson[]) {
  const start = rowHour(lesson.row) * 60;
  const end = start + lesson.duration;
  return lessons.find((other) => {
    if (other.id === lesson.id || other.day !== lesson.day) return false;
    const otherStart = rowHour(other.row) * 60;
    return start < otherStart + other.duration && otherStart < end;
  });
}
