import type { LessonColor } from "./theme";

export type Tone = { bg: string; fg: string };

export type DisciplineCategory =
  | "LEARN_TO_SKATE"
  | "SINGLES"
  | "SKATING_SKILLS"
  | "ICE_DANCE"
  | "PAIRS"
  | "SYNCHRONIZED"
  | "SHOWCASE"
  | "THEATRE_ON_ICE";

export type DisciplineId =
  | "LEARN_TO_SKATE"
  | "ADULT_LEARN_TO_SKATE"
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
  start: number; // minutes after midnight, e.g. 9:30 AM = 570 (any minute, e.g. 6:32 AM = 392)
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

// Singles competition tracks and levels, named as in U.S. Figure Skating's 2026-27 charts.
// (Aspire is a synchronized skating level, not a singles track, so it isn't here.)
export const TRACK_LEVELS = {
  // The main competitive pathway. Juvenile and up can qualify for nationals.
  Championship: [
    "Pre-Preliminary", "Preliminary", "Pre-Juvenile", "Juvenile",
    "Intermediate", "Novice", "Junior", "Senior",
  ],
  // Excel is for skaters who compete for fun and growth with simpler rules. The "Plus"
  // levels sit between two regular levels and allow a few more difficult elements.
  Excel: [
    "Excel Pre-Preliminary", "Excel Preliminary Plus", "Excel Pre-Juvenile Plus",
    "Excel Juvenile", "Excel Juvenile Plus", "Excel Intermediate", "Excel Intermediate Plus",
    "Excel Novice", "Excel Junior", "Excel Senior",
  ],
  // Adults have their own levels. The "Championship" ones are the qualifying events
  // (sectionals and adult nationals), and they use the same chart as the level without it.
  Adult: [
    "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Championship Adult Silver",
    "Adult Gold", "Championship Adult Gold",
    "Masters Intermediate-Novice", "Championship Masters Intermediate-Novice",
    "Masters Junior-Senior", "Championship Masters Junior-Senior",
  ],
} as const;

export type Track = keyof typeof TRACK_LEVELS;
export const TRACKS = Object.keys(TRACK_LEVELS) as Track[];

/**
 * Programs saved on the phone before Excel replaced Aspire can have a track or level
 * that no longer exists. This swaps them for the first valid one so the screen can't break.
 */
export function validTrackAndLevel(track: string, level: string): { track: Track; level: string } {
  const safeTrack = (TRACKS as string[]).includes(track) ? (track as Track) : TRACKS[0];
  const levels = TRACK_LEVELS[safeTrack] as readonly string[];
  return { track: safeTrack, level: levels.includes(level) ? level : levels[0] };
}

// Official U.S. Figure Skating links. We link to their charts instead of copying the rules,
// because the rules change during the season. Check these links and update the date below
// whenever the charts change (each new season at the latest).
export const REQUIREMENTS_SEASON = "2026-27";
export const REQUIREMENTS_CHECKED = "Nov 5, 2026";
export const REQUIREMENTS_PAGE_URL = "https://usfigureskating.org/sports/2025/8/12/competition-program-requirements.aspx";

const SINGLES_SHORT_PROGRAM_URL = "https://usfigureskating.org/documents/2025/12/19/2026-27_Singles_SP_Chart.pdf";
const SINGLES_FREE_SKATE_URL = "https://usfigureskating.org/documents/2026/6/2/2026-27_Singles_FS_Chart.pdf";
const ADULT_SINGLES_URL = "https://usfigureskating.org/documents/2026/7/7/2026-2027_Adult_Singles_WBP.pdf";
// Excel runs on the calendar year, so the 2027 chart covers Jan 1 to Dec 31, 2027.
const EXCEL_FREE_SKATE_URL = "https://usfigureskating.org/documents/2026/10/6/2027_Excel_Free_Skate_Requirements.pdf";

export type RequirementLink = { label: string; url: string };

/** The official charts for a track and level. */
export function requirementLinks(track: Track, level: string): RequirementLink[] {
  if (track === "Adult") return [{ label: "Adult requirements", url: ADULT_SINGLES_URL }];
  if (track === "Excel") return [{ label: "Excel requirements (2027)", url: EXCEL_FREE_SKATE_URL }];
  const freeSkate = { label: "Free Skate requirements", url: SINGLES_FREE_SKATE_URL };
  // The short program starts at Juvenile, so lower levels only have a free skate.
  const hasShortProgram = ["Juvenile", "Intermediate", "Novice", "Junior", "Senior"].includes(level);
  return hasShortProgram ? [{ label: "Short Program requirements", url: SINGLES_SHORT_PROGRAM_URL }, freeSkate] : [freeSkate];
}

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

/**
 * An optional "I'm available to coach" block on the weekly calendar, e.g. Tuesday 3–6 PM at North Rink.
 * Coaches don't have to set any: the calendar works fine empty. Coaches who teach at several rinks
 * add one block per rink, so there's no single "home rink" any more.
 */
export type AvailabilityBlock = {
  id: string;
  day: number; // 0 = Monday ... 6 = Sunday
  start: number; // minutes after midnight
  end: number; // minutes after midnight, after start
  place?: string; // optional free text, e.g. "North Rink" or "Off-ice studio"
};

export type Settings = {
  coachName: string;
  email: string;
  lessonLength: number;
  reminders: boolean;
  sharedNotes: boolean;
};

// The calendar shows these hours; lessons can start at any minute in between.
export const FIRST_HOUR = 6; // 6 AM
export const LAST_HOUR = 22; // 10 PM (the calendar ends here)

/** 570 → "9:30 AM", 780 → "1:00 PM". */
export function formatTime(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes % 60).padStart(2, "0")} ${hour24 < 12 ? "AM" : "PM"}`;
}

/** 9 → "9 AM", 13 → "1 PM" (for the hour labels down the side of the calendar). */
export function formatHour(hour24: number) {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${hour24 < 12 ? "AM" : "PM"}`;
}

// Before Nov 2026 lessons could only start at 7, 9, 11 AM, 1 or 3 PM and were saved as a `row`
// (0–4) instead of `start`. This turns those old saved lessons into the new shape so none are lost.
const OLD_ROW_HOURS = [7, 9, 11, 13, 15];
export function upgradeLesson(lesson: Lesson & { row?: number }): Lesson {
  if (typeof lesson.start === "number") return lesson;
  const { row, ...rest } = lesson;
  return { ...rest, start: (OLD_ROW_HOURS[row ?? 0] ?? 9) * 60 };
}

/** The place of the availability block a lesson falls in, if any (e.g. "North Rink"). */
export function placeFor(lesson: Pick<Lesson, "day" | "start">, blocks: AvailabilityBlock[]) {
  const block = blocks.find((item) => item.day === lesson.day && item.start <= lesson.start && lesson.start < item.end);
  return block?.place || undefined;
}

/** The block already in the way of `block` on the same day, or undefined if there's room. */
export function findBlockOverlap(block: Pick<AvailabilityBlock, "id" | "day" | "start" | "end">, blocks: AvailabilityBlock[]) {
  return blocks.find((other) => other.id !== block.id && other.day === block.day && block.start < other.end && other.start < block.end);
}
export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const LESSON_TYPES = ["Public", "Freestyle", "Off-ice"];
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];
export const OVERALL = ["Strong progress", "Steady", "Tough session", "Breakthrough"];
export const DISCIPLINE_CATEGORIES: { id: DisciplineCategory; name: string }[] = [
  { id: "LEARN_TO_SKATE", name: "Learn to Skate" },
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
    id: "LEARN_TO_SKATE", name: "Learn to Skate", shortName: "Learn to Skate", category: "LEARN_TO_SKATE",
    levels: ["Snowplow Sam 1", "Snowplow Sam 2", "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
  },
  {
    id: "ADULT_LEARN_TO_SKATE", name: "Adult Learn to Skate", shortName: "Adult Learn to Skate", category: "LEARN_TO_SKATE",
    levels: ["Adult Beginner 1", "Adult Beginner 2", "Adult Beginner 3", "Adult Beginner 4", "Adult Beginner 5", "Adult Beginner 6"],
  },
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

/** Puts disciplines in catalog order (Learn to Skate first, then Singles, and so on). */
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
  { id: "l1", studentId: "s3", day: 0, start: 660, type: "Public", duration: 45, color: "sand" },
  { id: "l2", studentId: "s2", day: 1, start: 540, type: "Freestyle", duration: 60, color: "teal" },
  { id: "l3", studentId: "s1", day: 2, start: 900, type: "Off-ice", duration: 30, color: "purple" },
  { id: "l4", studentId: "s1", day: 3, start: 420, type: "Freestyle", duration: 60, color: "teal" },
  { id: "l5", studentId: "s2", day: 3, start: 780, type: "Freestyle", duration: 45, color: "teal" },
  { id: "l6", studentId: "s3", day: 4, start: 660, type: "Off-ice", duration: 45, color: "purple" },
  { id: "l7", studentId: "s1", day: 5, start: 540, type: "Public", duration: 60, color: "sand" },
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
  lessonLength: 45,
  reminders: true,
  sharedNotes: true,
};

// Every jump from single to quad: 1T, 1S, 1Lo, 1F, 1Lz, 1A, then 2T ... up to 4A.
// Built in a loop so the list can't miss one. Names are written the way EMS shows them.
const JUMP_KINDS = [
  ["T", "Toe Loop"], ["S", "Salchow"], ["Lo", "Loop"], ["F", "Flip"], ["Lz", "Lutz"], ["A", "Axel"],
] as const;
const ROTATIONS = ["Single", "Double", "Triple", "Quad"] as const;
const JUMPS: ProgramElement[] = ROTATIONS.flatMap((rotation, index) =>
  JUMP_KINDS.map(([code, name]) => ({
    code: `${index + 1}${code}`,
    title: `${rotation} ${name}`,
    category: "Jump" as const,
  })),
);

// Spins in the same order and wording as U.S. Figure Skating's PPC form (EMS), with their ISU codes.
const SPINS: ProgramElement[] = [
  { code: "USp", title: "Upright Spin" },
  { code: "LSp", title: "Layback Spin" },
  { code: "CSp", title: "Camel Spin" },
  { code: "SSp", title: "Sit Spin" },
  { code: "FUSp", title: "Flying Upright Spin" },
  { code: "FLSp", title: "Flying Layback Spin" },
  { code: "FCSp", title: "Flying Camel Spin" },
  { code: "FSSp", title: "Flying Sit Spin" },
  { code: "CUSp", title: "Change Foot Upright Spin" },
  { code: "CLSp", title: "Change Foot Layback Spin" },
  { code: "CCSp", title: "Change Foot Camel Spin" },
  { code: "CSSp", title: "Change Foot Sit Spin" },
  { code: "CoSp", title: "Spin Combo with change of position and no change of foot" },
  { code: "CCoSp", title: "Spin Combo with change of position and change of foot" },
  { code: "FCoSp", title: "Spin Combo with change of position, no change of foot and flying entry" },
  { code: "FCCoSp", title: "Spin Combo with change of position and change of foot and flying entry" },
  { code: "FCCSp", title: "Change Foot Camel Spin with Flying Entry" },
  { code: "FCSSp", title: "Change Foot Sit Spin with Flying Entry" },
  { code: "FCUSp", title: "Change Foot Upright Spin with Flying Entry" },
  { code: "FCLSp", title: "Change Foot Layback Spin with Flying Entry" },
  { code: "2FtUSp", title: "Two-Foot Upright Spin" },
].map((spin) => ({ ...spin, category: "Spin" as const }));

// Every element is available at every level: requirements change by season and have exceptions.
export const ELEMENT_CATALOG: ProgramElement[] = [
  ...JUMPS,
  ...SPINS,
  // Steps & Spirals, in the same order as EMS. The choreographic step sequence (ChSt) was
  // dropped: the 2026-27 U.S. Figure Skating charts no longer use it.
  { code: "ChSq", title: "Choreographic Sequence", category: "Choreography" },
  { code: "StSq", title: "Step Sequence", category: "Sequence" },
];

export const STARTER_ELEMENTS: ProgramElement[] = [
  { code: "1A", title: "Single Axel", category: "Jump" },
  { code: "2S", title: "Double Salchow", category: "Jump" },
  { code: "CCoSp", title: "Spin Combo with change of position and change of foot", category: "Spin" },
  { code: "StSq", title: "Step Sequence", category: "Sequence" },
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
    if (daysAhead === 0 && lesson.start < nowMinutes) daysAhead = 7;
    const sooner = !best || daysAhead < best.daysAhead || (daysAhead === best.daysAhead && lesson.start < best.lesson.start);
    if (sooner) best = { lesson, daysAhead };
  }
  if (!best) return null;

  const { lesson, daysAhead } = best;
  const day =
    daysAhead === 0 ? "Today" : daysAhead === 1 ? "Tomorrow" : daysAhead === 7 ? `Next ${FULL_WEEKDAYS[lesson.day]}` : FULL_WEEKDAYS[lesson.day];
  return { lesson, label: `${day}, ${formatTime(lesson.start)}` };
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
export function findClash(lesson: Pick<Lesson, "id" | "day" | "start" | "duration">, lessons: Lesson[]) {
  const end = lesson.start + lesson.duration;
  return lessons.find((other) => {
    if (other.id === lesson.id || other.day !== lesson.day) return false;
    return lesson.start < other.start + other.duration && other.start < end;
  });
}
