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

/**
 * The track a student follows in one discipline, as the backend names it. It isn't shown on the
 * profile; the backend uses it to start a new program on the student's own track.
 */
export type ApiTrack = "CHAMPIONSHIP" | "EXCEL" | "ADULT";

/**
 * One discipline a student trains in, and their level in it. `track` only comes from the backend
 * (hidden on the profile); when it's missing, defaultTrackFor fills it in before saving.
 */
export type StudentDiscipline = { discipline: DisciplineId; level: string; track?: ApiTrack };

export type Student = {
  id: string;
  name: string;
  phone?: string; // optional, kept as typed ("+1 (555) 010-2030"); checked with phoneProblem
  disciplines: StudentDiscipline[]; // can be empty
  // The next lesson isn't stored here: it comes from the calendar (findNextLesson). "Current focus"
  // and a hand-set progress % were removed (Nov 2026): nobody kept them up to date.
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
  createdAt?: string; // when the lesson was added to the calendar (lessons from before start/end dates)
  // The weekly lesson runs from startDate (today or later when it's created) until endDate, if any.
  // Both are calendar days like "2026-11-12". Lessons saved before these existed have neither: always on.
  startDate?: string;
  endDate?: string;
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
  lessonId?: string; // the calendar lesson this note was written for (notes from before Nov 2026 don't have one)
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

// Calendar zoom. The coach pinches (or taps − / +) to change how tall an hour is; the day columns get
// wider and narrower along with it. Fully zoomed out, 12 hours and all 7 days fit in the calendar box.
export const MIN_ZOOM_HOURS = 12; // hours that fit top to bottom when fully zoomed out
export const DEFAULT_HOUR_HEIGHT = 64; // pixels per hour when the calendar first opens
export const MAX_HOUR_HEIGHT = 96; // fully zoomed in (1.5 × the default)
export const MAX_DAY_WIDTH = 156; // a day column's width when fully zoomed in

/**
 * The size of one hour (height) and one day (width) on the calendar grid, in pixels, for a wished-for
 * hour height and the box the grid is shown in (`viewport`: the space for the day columns, without the
 * hour labels or the day names). The hour height is kept between "12 hours fit" and MAX_HOUR_HEIGHT,
 * and the day width moves with it: 7 days fit the width when fully zoomed out, MAX_DAY_WIDTH when fully in.
 */
export function calendarScale(hourHeight: number, viewport: { width: number; height: number }) {
  const minHour = viewport.height / MIN_ZOOM_HOURS;
  const minDay = viewport.width / 7;
  // On a very big screen (iPad) "fully zoomed out" can already be bigger than the usual maximum.
  const maxHour = Math.max(minHour, MAX_HOUR_HEIGHT);
  const maxDay = Math.max(minDay, MAX_DAY_WIDTH);
  const hour = Math.min(maxHour, Math.max(minHour, hourHeight));
  const zoom = maxHour === minHour ? 1 : (hour - minHour) / (maxHour - minHour); // 0 = fully out, 1 = fully in
  return {
    hourHeight: hour,
    dayWidth: minDay + zoom * (maxDay - minDay),
    canZoomOut: hour > minHour + 0.5,
    canZoomIn: hour < maxHour - 0.5,
  };
}

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
// Also fixes lessons saved when the color could be picked separately, so the color always matches the type.
export function upgradeLesson(lesson: Lesson & { row?: number }): Lesson {
  const color = colorForType(lesson.type);
  if (typeof lesson.start === "number") return lesson.color === color ? lesson : { ...lesson, color };
  const { row, ...rest } = lesson;
  return { ...rest, color, start: (OLD_ROW_HOURS[row ?? 0] ?? 9) * 60 };
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

/**
 * The stretches of one day (inside the calendar's 6 AM–10 PM) that fall outside every availability block,
 * so the calendar can grey them out a little. It's only a visual hint: lessons can still go there.
 *
 * A day with no blocks returns nothing (no grey at all). Availability is optional and coaches often fill
 * in only some days, so "no blocks on Monday" means "not set", not "not available". That also means a
 * coach who never sets availability sees a plain calendar.
 *
 * Example: Tuesday 3–6 PM → [6 AM–3 PM, 6 PM–10 PM].
 */
export function unavailableStretches(day: number, blocks: Pick<AvailabilityBlock, "day" | "start" | "end">[]) {
  const dayStart = FIRST_HOUR * 60;
  const dayEnd = LAST_HOUR * 60;
  const today = blocks.filter((block) => block.day === day).sort((a, b) => a.start - b.start);
  if (!today.length) return [];
  const stretches: { start: number; end: number }[] = [];
  let free = dayStart; // the earliest time not yet covered by a block
  for (const block of today) {
    if (block.start > free) stretches.push({ start: free, end: Math.min(block.start, dayEnd) });
    free = Math.max(free, block.end);
    if (free >= dayEnd) break;
  }
  if (free < dayEnd) stretches.push({ start: free, end: dayEnd });
  return stretches.filter((stretch) => stretch.end > stretch.start);
}
export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const LESSON_TYPES = ["Public", "Freestyle", "Off-ice"];

// Each lesson type has its own color on the calendar (the legend under it): the color isn't picked by hand.
const TYPE_COLORS: Record<string, LessonColor> = { Freestyle: "teal", Public: "sand", "Off-ice": "purple" };
export function colorForType(type: string): LessonColor {
  return TYPE_COLORS[type] ?? "teal";
}
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

// ---------------------------------------------------------------------------------------------
// Students on the backend (when EXPO_PUBLIC_API_URL is set, see api.ts). These turn the backend's
// student JSON into the app's Student and back, so the screens don't need to know where data lives.

/** A student as the backend sends it (GET /api/students). Only the fields the app uses. */
export type ApiStudent = {
  id: string;
  name: string;
  phone?: string | null;
  disciplines: { discipline: DisciplineId; track: ApiTrack; level: string }[];
};

/** What the backend expects for POST and PUT /api/students. */
export type ApiStudentRequest = {
  name: string;
  phone: string | null;
  disciplines: { discipline: DisciplineId; track: ApiTrack; level: string }[];
};

/**
 * What's wrong with a phone number, or null if it's fine. It's optional (blank is fine); otherwise only
 * digits, spaces and + ( ) - . and 7 to 15 digits. Same rule as StudentService.checkPhone on the backend.
 */
export function phoneProblem(phone: string): string | null {
  const value = phone.trim();
  if (!value) return null;
  if (!/^[0-9+()\-. ]+$/.test(value)) return "Use digits only (spaces and + ( ) - . are fine).";
  const digits = value.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) return "A phone number needs 7 to 15 digits.";
  if (value.length > 30) return "That phone number is too long.";
  return null;
}

/** The link that starts a call on the phone ("tel:+15550102030"). */
export function phoneLink(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/** The track a new discipline gets: Adult for the adult disciplines, Championship for the rest. */
export function defaultTrackFor(discipline: DisciplineId): ApiTrack {
  return discipline.startsWith("ADULT_") ? "ADULT" : "CHAMPIONSHIP";
}

/**
 * The avatar color for a student. The backend doesn't store one, so it's worked out from the id:
 * the same student always gets the same color.
 */
export function toneFor(id: string): Tone {
  let sum = 0;
  for (const char of id) sum = (sum * 31 + char.charCodeAt(0)) % 9973;
  return TONES[sum % TONES.length];
}

export function studentFromApi(student: ApiStudent): Student {
  return {
    id: student.id,
    name: student.name,
    ...(student.phone ? { phone: student.phone } : {}),
    disciplines: student.disciplines.map(({ discipline, track, level }) => ({ discipline, track, level })),
    tone: toneFor(student.id),
  };
}

/** The body for POST/PUT /api/students. Keeps each discipline's track, or gives it the default one. */
export function studentToApi(student: Pick<Student, "name" | "disciplines" | "phone">): ApiStudentRequest {
  return {
    name: student.name,
    phone: student.phone?.trim() || null,
    disciplines: student.disciplines.map(({ discipline, track, level }) => ({
      discipline,
      track: track ?? defaultTrackFor(discipline),
      level,
    })),
  };
}

// ---------------------------------------------------------------------------------------------
// Weekly lessons on the backend. The backend counts days by name ("MONDAY") and times as "09:30",
// the app counts days from 0 (Monday) and times in minutes after midnight (570), so these convert.

export const API_WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type ApiWeekday = (typeof API_WEEKDAYS)[number];

/** A lesson as the backend sends it (GET /api/lessons). Only the fields the app uses. */
export type ApiLesson = {
  id: string;
  studentId: string;
  dayOfWeek: ApiWeekday;
  startTime: string; // "09:30" (the backend may add seconds: "09:30:00")
  durationMinutes: number;
  type: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
};

/** What the backend expects for POST and PUT /api/lessons. */
export type ApiLessonRequest = {
  studentId: string;
  dayOfWeek: ApiWeekday;
  startTime: string;
  durationMinutes: number;
  type: string;
  startDate: string | null;
  endDate: string | null;
};

/** "09:30" or "09:30:00" → 570. */
export function minutesFromApiTime(time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + (minutes || 0);
}

/** 570 → "09:30". */
export function apiTimeFromMinutes(minutes: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function lessonFromApi(lesson: ApiLesson): Lesson {
  return {
    id: lesson.id,
    studentId: lesson.studentId,
    day: API_WEEKDAYS.indexOf(lesson.dayOfWeek),
    start: minutesFromApiTime(lesson.startTime),
    duration: lesson.durationMinutes,
    type: lesson.type,
    // The backend sends the color too ("TEAL"), but it always follows the type, so the app works it out.
    color: colorForType(lesson.type),
    createdAt: lesson.createdAt ?? undefined,
    startDate: lesson.startDate ?? undefined,
    endDate: lesson.endDate ?? undefined,
  };
}

/** The body for POST/PUT /api/lessons. The color isn't sent: the backend picks it from the type. */
export function lessonToApi(lesson: Lesson): ApiLessonRequest {
  return {
    studentId: lesson.studentId,
    dayOfWeek: API_WEEKDAYS[lesson.day],
    startTime: apiTimeFromMinutes(lesson.start),
    durationMinutes: lesson.duration,
    type: lesson.type,
    startDate: lesson.startDate ?? null,
    endDate: lesson.endDate ?? null,
  };
}

// ---------------------------------------------------------------------------------------------
// Training history notes on the backend. The backend keeps the length as a number of minutes (60)
// where the app shows text ("60 minutes"), and sends null for fields nobody filled in.

/** A note as the backend sends it (GET /api/notes). Only the fields the app uses. */
export type ApiNote = {
  id: string;
  studentId: string;
  lessonId: string | null;
  date: string; // an instant, e.g. "2026-11-07T15:00:00Z"
  title: string;
  lessonType: string;
  durationMinutes: number;
  overall: string | null;
  focus: string | null;
  observations: string | null;
  nextSteps: string | null;
  skills: string[] | null;
  shared: boolean;
};

/** What the backend expects for POST and PUT /api/notes. */
export type ApiNoteRequest = Omit<ApiNote, "id">;

/** "60 minutes" → 60. Falls back to 60 if there's no number in it. */
export function minutesFromDuration(duration: string) {
  const minutes = Number.parseInt(duration, 10);
  return minutes > 0 ? minutes : 60;
}

export function noteFromApi(note: ApiNote): Note {
  return {
    id: note.id,
    studentId: note.studentId,
    lessonId: note.lessonId ?? undefined,
    // Written the same way as the app's own dates ("...T15:00:00.000Z"), so sorting by text still works.
    date: new Date(note.date).toISOString(),
    title: note.title,
    lessonType: note.lessonType,
    duration: `${note.durationMinutes} minutes`,
    overall: note.overall ?? "",
    focus: note.focus ?? "",
    observations: note.observations ?? "",
    nextSteps: note.nextSteps ?? "",
    skills: note.skills ?? [],
    shared: note.shared,
  };
}

/** The body for POST/PUT /api/notes. */
export function noteToApi(note: Note): ApiNoteRequest {
  return {
    studentId: note.studentId,
    lessonId: note.lessonId ?? null,
    date: note.date,
    title: note.title,
    lessonType: note.lessonType,
    durationMinutes: minutesFromDuration(note.duration),
    overall: note.overall,
    focus: note.focus,
    observations: note.observations,
    nextSteps: note.nextSteps,
    skills: note.skills,
    shared: note.shared,
  };
}

// ---------------------------------------------------------------------------------------------
// Programs. A student can have several (Nov 2026), each with a name the coach types. The music can
// be a link (YouTube, Apple Music, Spotify...) and/or an audio file uploaded to the backend.

/** A music file uploaded to the backend (POST /api/music). It's played from GET /api/music/{id}. */
export type MusicFile = { id: string; fileName: string; contentType: string; sizeBytes: number };

/** One of a student's programs: the layout (ProgramData) plus who it's for, its name and its music. */
export type Program = ProgramData & {
  id: string;
  studentId: string;
  name: string; // what the coach calls it, like "Free skate 2026-27"
  musicLink: string; // a web link to the music, or ""
  musicFile: MusicFile | null;
  createdAt?: string;
};

/** The biggest music file the backend takes (MusicFileService.MAX_BYTES). */
export const MAX_MUSIC_BYTES = 20 * 1024 * 1024;

/** A program as the backend sends it (GET /api/programs). Only the fields the app uses. */
export type ApiProgram = {
  id: string;
  studentId: string;
  name: string;
  musicTitle: string;
  artist: string | null;
  duration: string;
  track: ApiTrack;
  level: string;
  musicLink: string | null;
  musicFile: MusicFile | null;
  elements: { code: string; title: string; category: string }[];
  paths: RinkPoint[][];
  placements: RinkPlacement[];
  createdAt: string | null;
};

/** What the backend expects for POST /api/programs and PUT /api/programs/{id}. */
export type ApiProgramRequest = {
  studentId: string;
  name: string;
  musicTitle: string;
  artist: string;
  duration: string;
  track: ApiTrack;
  level: string;
  musicLink: string;
  musicFileId: string | null;
  elements: string[]; // codes, e.g. ["1A", "2S", "1S+1T", "StSq"]
  paths: RinkPoint[][];
  placements: RinkPlacement[];
};

const API_TRACKS: Record<Track, ApiTrack> = { Championship: "CHAMPIONSHIP", Excel: "EXCEL", Adult: "ADULT" };

export function trackFromApi(track: ApiTrack): Track {
  return (Object.keys(API_TRACKS) as Track[]).find((name) => API_TRACKS[name] === track) ?? "Championship";
}

export function programFromApi(program: ApiProgram): Program {
  return {
    id: program.id,
    studentId: program.studentId,
    name: program.name,
    musicTitle: program.musicTitle,
    artist: program.artist ?? "",
    duration: program.duration,
    track: trackFromApi(program.track),
    level: program.level,
    musicLink: program.musicLink ?? "",
    musicFile: program.musicFile,
    // Titles come from the app's own catalog when it knows the code, so they read the same as before.
    elements: program.elements.map(
      (element) =>
        ELEMENT_CATALOG.find((item) => item.code === element.code) ?? {
          code: element.code,
          title: element.title,
          category: element.category as ProgramElement["category"],
        },
    ),
    paths: program.paths,
    placements: program.placements,
    createdAt: program.createdAt ?? undefined,
  };
}

/** The body for POST/PUT /api/programs. A track and level that don't go together are fixed first. */
export function programToApi(program: Program): ApiProgramRequest {
  const { track, level } = validTrackAndLevel(program.track, program.level);
  return {
    studentId: program.studentId,
    name: program.name.trim(),
    musicTitle: program.musicTitle.trim(),
    artist: program.artist.trim(),
    duration: program.duration.trim(),
    track: API_TRACKS[track],
    level,
    musicLink: program.musicLink.trim(),
    musicFileId: program.musicFile?.id ?? null,
    elements: program.elements.map((element) => element.code),
    paths: program.paths,
    placements: program.placements,
  };
}

/**
 * A new, unsaved program for a student: the starting layout (DEFAULT_PROGRAM) on the student's own
 * track, so the coach rarely has to change it:
 *  - Track: from their Standard Freeskate discipline, else Adult Freeskate, else their first discipline,
 *    else Championship. (Students from the backend carry their track; others get defaultTrackFor.)
 *  - Level: their level in that discipline if the track has it, else Preliminary on Championship,
 *    else the track's first level.
 * The name starts empty: the coach types it before saving.
 */
export function newProgramFor(student: Pick<Student, "id" | "disciplines">, id: string): Program {
  const rank = (discipline: DisciplineId) =>
    discipline === "STANDARD_FREESKATE" ? -2 : discipline === "ADULT_FREESKATE" ? -1 : DISCIPLINES.findIndex((item) => item.id === discipline);
  const singles = [...student.disciplines].sort((a, b) => rank(a.discipline) - rank(b.discipline))[0];
  const track = singles ? trackFromApi(singles.track ?? defaultTrackFor(singles.discipline)) : "Championship";
  const levels = TRACK_LEVELS[track] as readonly string[];
  const level = singles && levels.includes(singles.level) ? singles.level : track === "Championship" ? "Preliminary" : levels[0];
  return { ...DEFAULT_PROGRAM, id, studentId: student.id, name: "", musicLink: "", musicFile: null, track, level };
}

/** "YouTube" for a YouTube link, and so on: shown next to the link so the coach sees where it opens. */
export function musicServiceName(link: string): string | null {
  const match = /^https?:\/\/([^/?#]+)/i.exec(link.trim());
  if (!match) return null;
  const host = match[1].toLowerCase().replace(/^www\./, "");
  const services: [RegExp, string][] = [
    [/^music\.youtube\.com$/, "YouTube Music"],
    [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
    [/(^|\.)spotify\.com$/, "Spotify"],
    [/^music\.apple\.com$/, "Apple Music"],
    [/(^|\.)soundcloud\.com$/, "SoundCloud"],
    [/^music\.amazon\./, "Amazon Music"],
    [/(^|\.)drive\.google\.com$/, "Google Drive"],
    [/(^|\.)dropbox\.com$/, "Dropbox"],
  ];
  return services.find(([pattern]) => pattern.test(host))?.[1] ?? host;
}

/**
 * Why a program can't be saved yet, or null if it can. Checked when the coach taps Save, with the same
 * rules the backend uses (ProgramRequest), so the coach gets a clear message instead of a 400.
 */
export function programNotReady(program: Pick<Program, "name" | "musicTitle" | "duration" | "musicLink">): string | null {
  if (!program.name.trim()) return "Give the program a name, like “Free skate 2026-27”.";
  if (!program.musicTitle.trim()) return "Give the music a title.";
  if (!/^\d{1,2}:[0-5]\d$/.test(program.duration.trim())) return "Write the duration like 2:10.";
  const link = program.musicLink.trim();
  if (link && !/^https?:\/\/\S+$/i.test(link)) return "The music link needs to be a web link starting with https://.";
  return null;
}

/** True when the program in the editor differs from the saved one, so Save turns on (and closing asks first). */
export function programHasChanges(saved: Program, draft: Program) {
  return JSON.stringify(programToApi(saved)) !== JSON.stringify(programToApi(draft)) || saved.name !== draft.name;
}

/** 4812345 → "4.6 MB", 300000 → "293 KB". */
export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Programs saved on a phone before Nov 2026 were one per student ({ studentId: program }). This turns
 * them into the new list so none are lost. Their id is fixed, so upgrading twice gives the same ids.
 */
export function upgradeOldPrograms(old: Record<string, ProgramData>): Program[] {
  return Object.entries(old).map(([studentId, program]) => ({
    ...DEFAULT_PROGRAM,
    ...program,
    id: `old-${studentId}`,
    studentId,
    name: "Program",
    musicLink: "",
    musicFile: null,
  }));
}

/**
 * Students A to Z, ignoring upper/lower case and accents ("élodie" sits with the E's), like the backend's
 * list (GET /api/students is ordered by name). Used after adding or renaming a student on the backend,
 * so the list doesn't change order when the app next reloads it.
 */
export function sortStudentsByName<T extends Pick<Student, "name">>(students: T[]): T[] {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

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
  { id: "s1", name: "Emma Miller", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Pre-Gold" }, { discipline: "STANDARD_SKILLS", level: "Gold" }], tone: TONES[0] },
  { id: "s2", name: "Lily Kim", phone: "(555) 010-2030", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Silver" }, { discipline: "PATTERN_DANCE", level: "Bronze" }], tone: TONES[1] },
  { id: "s3", name: "Jonah Reed", disciplines: [{ discipline: "STANDARD_SKILLS", level: "Preliminary" }], tone: TONES[2] },
  { id: "s4", name: "Sofia Chen", disciplines: [{ discipline: "STANDARD_FREESKATE", level: "Gold" }, { discipline: "FREE_DANCE", level: "Juvenile" }], tone: TONES[3] },
  { id: "s5", name: "Noah Bennett", disciplines: [{ discipline: "ADULT_FREESKATE", level: "Adult Gold" }, { discipline: "ADULT_SKILLS", level: "Adult Silver" }], tone: TONES[4] },
  { id: "s6", name: "Amelia Park", disciplines: [], tone: TONES[5] },
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

/**
 * The note already written for this lesson on this date, if there is one. A coach who forgot something
 * reopens that note instead of starting a second one. Older notes have no lessonId, so for those any
 * note for the same student on the same day counts.
 */
export function findLessonNote(notes: Note[], lesson: Pick<Lesson, "id" | "studentId">, date: Date) {
  const sameDay = notes.filter(
    (note) => note.studentId === lesson.studentId && new Date(note.date).toDateString() === date.toDateString(),
  );
  return sameDay.find((note) => note.lessonId === lesson.id) ?? sameDay.find((note) => !note.lessonId);
}

/**
 * After a lesson is edited, moved or resized, the note written for it (that week) follows the change:
 * new student, type, length, date and time. The title changes too, but only if it's the one the app made up
 * ("Freestyle lesson"); a title the coach typed is kept. Returns the notes unchanged if there's no note.
 * `beforeDate`/`afterDate` are when the lesson falls in the week on screen, before and after the change.
 */
export function syncLessonNote(notes: Note[], before: Lesson, after: Lesson, beforeDate: Date, afterDate: Date): Note[] {
  const note = findLessonNote(notes, before, beforeDate);
  if (!note) return notes;
  const autoTitle = note.title === `${note.lessonType} lesson`;
  return notes.map((item) =>
    item.id === note.id
      ? {
          ...item,
          studentId: after.studentId, // the student is changed on the lesson, never on the note
          lessonId: after.id,
          date: afterDate.toISOString(),
          lessonType: after.type,
          duration: `${after.duration} minutes`,
          title: autoTitle ? `${after.type} lesson` : item.title,
        }
      : item,
  );
}

/** Monday 00:00 of the week `date` is in. */
export function startOfWeek(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

/** Every time a weekly lesson started after `from` and up to `to` (both included only at `to`). */
export function lessonTimesBetween(lesson: Pick<Lesson, "day" | "start">, from: Date, to: Date): Date[] {
  const times: Date[] = [];
  const time = startOfWeek(from);
  time.setDate(time.getDate() + lesson.day);
  time.setHours(Math.floor(lesson.start / 60), lesson.start % 60, 0, 0);
  while (time <= to) {
    if (time > from) times.push(new Date(time));
    time.setDate(time.getDate() + 7);
  }
  return times;
}

/** A training-history entry for a lesson that happened: a note with nothing written in it yet. */
export function emptyLessonNote(lesson: Lesson, date: Date, id: string): Note {
  return {
    id,
    studentId: lesson.studentId,
    date: date.toISOString(),
    title: `${lesson.type} lesson`,
    lessonType: lesson.type,
    duration: `${lesson.duration} minutes`,
    overall: "",
    focus: "",
    observations: "",
    nextSteps: "",
    skills: [],
    shared: false,
    lessonId: lesson.id,
  };
}

/** True when the coach hasn't written anything in the note yet. */
export function isEmptyNote(note: Note) {
  return !note.observations.trim() && !note.focus.trim() && !note.nextSteps.trim() && note.skills.length === 0;
}

/**
 * True when the note in the editor (`draft`) differs from the note it was opened with (`original`).
 * The editor uses this to ask "Discard changes?" when the coach closes it with the X,
 * and to close straight away when nothing was changed.
 */
export function noteHasChanges(original: Note, draft: Note) {
  const fields: (keyof Note)[] = ["studentId", "date", "title", "lessonType", "duration", "overall", "focus", "observations", "nextSteps", "shared", "lessonId"];
  if (fields.some((field) => original[field] !== draft[field])) return true;
  // Skills are a list, so compare them one by one (same skills in the same order).
  return original.skills.length !== draft.skills.length || original.skills.some((skill, i) => skill !== draft.skills[i]);
}

/**
 * The Lessons tab is the training history: every calendar lesson that has already started gets an
 * entry, with or without notes. This finds the entries to add for lessons that started after `since`
 * (the last time we checked) and up to `now`. A lesson's history begins when it was added to the calendar,
 * and a lesson that already has a note for that day isn't added twice.
 */
export function lessonHistoryToAdd(lessons: Lesson[], notes: Note[], since: Date, now: Date, newId: () => string): Note[] {
  const added: Note[] = [];
  for (const lesson of lessons) {
    // History starts on the lesson's start date (or when it was added, for older lessons) and ends on its end date.
    const begins = lesson.startDate ? fromDateKey(lesson.startDate) : lesson.createdAt ? new Date(lesson.createdAt) : since;
    const from = begins > since ? begins : since;
    for (const time of lessonTimesBetween(lesson, from, now)) {
      if (lesson.endDate && toDateKey(time) > lesson.endDate) break;
      if (!findLessonNote([...notes, ...added], lesson, time)) added.push(emptyLessonNote(lesson, time, newId()));
    }
  }
  return added;
}

export type HistoryRange = "This week" | "Last 30 days" | "All";
export const HISTORY_RANGES: HistoryRange[] = ["This week", "Last 30 days", "All"];

/** Filters for the Lessons tab: student name, how far back, and level (any of the student's disciplines). */
export function matchesHistoryFilter(
  note: Note,
  student: Pick<Student, "name" | "disciplines"> | undefined,
  filter: { name: string; range: HistoryRange; level: string | null },
  now: Date,
) {
  if (filter.name.trim() && !(student?.name ?? "").toLowerCase().includes(filter.name.trim().toLowerCase())) return false;
  const date = new Date(note.date);
  if (filter.range === "This week" && date < startOfWeek(now)) return false;
  if (filter.range === "Last 30 days" && now.getTime() - date.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
  if (filter.level && !(student?.disciplines ?? []).some((item) => item.level === filter.level)) return false;
  return true;
}

/** A student's lesson notes, newest first (for the note cards on the student's profile). */
export function notesForStudent(notes: Note[], studentId: string): Note[] {
  return notes.filter((note) => note.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
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

/**
 * A student's next lesson, worked out from the weekly calendar (the calendar is the source of truth,
 * like NextLessonCalculator in the backend). A lesson that already started today counts as next week's.
 * Returns null when the student has no lessons on the calendar.
 */
export function findNextLesson(studentId: string, lessons: Lesson[], now = new Date()) {
  let best: { lesson: Lesson; time: Date } | null = null;
  for (const lesson of lessons) {
    if (lesson.studentId !== studentId) continue;
    const time = nextLessonTime(lesson, now);
    if (time && (!best || time < best.time)) best = { lesson, time };
  }
  if (!best) return null;

  const { lesson, time } = best;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const lessonDay = new Date(time);
  lessonDay.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((lessonDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const day =
    daysAhead === 0
      ? "Today"
      : daysAhead === 1
        ? "Tomorrow"
        : daysAhead < 7
          ? FULL_WEEKDAYS[lesson.day]
          : daysAhead < 14
            ? `Next ${FULL_WEEKDAYS[lesson.day]}`
            : time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { lesson, time, label: `${day}, ${formatTime(lesson.start)}` };
}

/** One row of the "Coming up" list on Home: a student and their lesson (null when nothing is scheduled). */
export type DashboardRow = { key: string; studentId: string; lesson: Lesson | null; time: Date | null };

/** How many lessons Home shows when the coach isn't searching. */
export const DASHBOARD_UPCOMING = 6;

/**
 * The rows of the "Coming up" list on Home.
 * - No search: the next few lessons, soonest first (a student can show up more than once).
 * - Searching by name or level: one row per matching student with their next lesson, soonest first,
 *   then the students with nothing scheduled (A to Z), so the search still finds every student.
 */
export function dashboardRows(students: Student[], lessons: Lesson[], query: string, now = new Date()): DashboardRow[] {
  const search = query.trim().toLowerCase();
  if (!search) {
    return lessons
      .map((lesson) => ({ lesson, time: nextLessonTime(lesson, now) }))
      .filter((item): item is { lesson: Lesson; time: Date } => item.time !== null)
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .slice(0, DASHBOARD_UPCOMING)
      .map(({ lesson, time }) => ({ key: lesson.id, studentId: lesson.studentId, lesson, time }));
  }
  const rows = students
    .filter((student) => `${student.name} ${disciplineSummary(student)}`.toLowerCase().includes(search))
    .map((student) => {
      const next = findNextLesson(student.id, lessons, now);
      return { key: student.id, studentId: student.id, lesson: next?.lesson ?? null, time: next?.time ?? null, name: student.name };
    });
  rows.sort((a, b) => {
    if (a.time && b.time) return a.time.getTime() - b.time.getTime();
    if (a.time) return -1;
    if (b.time) return 1;
    return a.name.localeCompare(b.name);
  });
  return rows.map(({ name: _name, ...row }) => row);
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
export function findClash(
  lesson: Pick<Lesson, "id" | "day" | "start" | "duration" | "startDate" | "endDate">,
  lessons: Lesson[],
) {
  const end = lesson.start + lesson.duration;
  return lessons.find((other) => {
    if (other.id === lesson.id || other.day !== lesson.day || !datesOverlap(lesson, other)) return false;
    return lesson.start < other.start + other.duration && other.start < end;
  });
}

/** Do two weekly lessons ever run in the same week? (A missing start or end means "no limit".) */
export function datesOverlap(a: Pick<Lesson, "startDate" | "endDate">, b: Pick<Lesson, "startDate" | "endDate">) {
  // "YYYY-MM-DD" strings sort the same way as the dates they stand for.
  return (a.startDate ?? "") <= (b.endDate ?? "9999") && (b.startDate ?? "") <= (a.endDate ?? "9999");
}

/** A day as "2026-11-12" (local time), the format startDate and endDate use. */
export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** "2026-11-12" → midnight that day, local time. */
export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Is the weekly lesson running on this calendar day (between its start and end dates)? */
/** How many weeks from this week `date` falls in: 0 = this week, 1 = next week, -1 = last week. */
export function weekOffsetOf(date: Date, today = new Date()) {
  return Math.round((startOfWeek(date).getTime() - startOfWeek(today).getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * " (starting Sat, Nov 14)" for a weekly lesson that hasn't happened yet, "" otherwise. A lesson booked
 * today for a day that has already passed this week only starts next week, so it isn't on this week's
 * calendar, yet it still makes that time taken: the clash alert says when it starts, so that makes sense.
 */
export function startsLaterNote(lesson: Pick<Lesson, "day" | "start" | "startDate" | "endDate">, now = new Date()) {
  if (!lesson.startDate) return ""; // lessons without dates have always been on
  const first = nextLessonTime(lesson, fromDateKey(lesson.startDate));
  if (!first || first <= now) return "";
  return ` (starting ${first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})`;
}

export function isLessonActiveOn(lesson: Pick<Lesson, "startDate" | "endDate">, date: Date) {
  const key = toDateKey(date);
  return (!lesson.startDate || key >= lesson.startDate) && (!lesson.endDate || key <= lesson.endDate);
}

/** When the lesson next starts at or after `now`, or null if it has ended. */
export function nextLessonTime(lesson: Pick<Lesson, "day" | "start" | "startDate" | "endDate">, now = new Date()) {
  const time = startOfWeek(now);
  time.setDate(time.getDate() + lesson.day);
  time.setHours(Math.floor(lesson.start / 60), lesson.start % 60, 0, 0);
  if (time < now) time.setDate(time.getDate() + 7); // already started this week, so next week's
  if (lesson.startDate) {
    const first = fromDateKey(lesson.startDate);
    while (time < first) time.setDate(time.getDate() + 7);
  }
  if (lesson.endDate && toDateKey(time) > lesson.endDate) return null;
  return time;
}

// --- One-time and repeating lessons ---
// Every lesson is stored the same way (a weekday plus optional start and end dates). A one-time lesson
// is just one whose end date is its start date, so there's no new field and nothing to upgrade.

/** "2026-11-12" plus a number of days (negative goes back) → another day key. */
export function addDaysToKey(key: string, days: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** The weekday of a day key, 0 = Monday ... 6 = Sunday (the same numbering as Lesson.day). */
export function weekdayOfKey(key: string) {
  return (fromDateKey(key).getDay() + 6) % 7;
}

/** The first day on or after `key` that falls on `day` (0 = Monday). */
export function nextDateOnWeekday(key: string, day: number) {
  return addDaysToKey(key, (day - weekdayOfKey(key) + 7) % 7);
}

/** Does the lesson happen at most once? (It has both dates and they're less than a week apart.) */
export function isOneTimeLesson(lesson: Pick<Lesson, "startDate" | "endDate">) {
  return Boolean(lesson.startDate && lesson.endDate && lesson.endDate < addDaysToKey(lesson.startDate, 7));
}

/** The end date for a weekly lesson that stops after `count` lessons, the first one on `firstDate`. */
export function endDateAfterLessons(firstDate: string, count: number) {
  return addDaysToKey(firstDate, 7 * (Math.max(1, Math.floor(count)) - 1));
}

/** How many weekly lessons fall from `firstDate` to `endDate`, both included (0 if the end is earlier). */
export function countWeeklyLessons(firstDate: string, endDate: string) {
  const days = Math.round((fromDateKey(endDate).getTime() - fromDateKey(firstDate).getTime()) / 86_400_000);
  return days < 0 ? 0 : Math.floor(days / 7) + 1;
}

/**
 * Moving a lesson to another weekday. A one-time lesson moves to that weekday in the same week, so it
 * doesn't fall outside its own dates and vanish. A repeating lesson keeps its dates.
 */
export function moveToWeekday<T extends Pick<Lesson, "day" | "startDate" | "endDate">>(lesson: T, day: number): T {
  if (day === lesson.day || !isOneTimeLesson(lesson) || !lesson.startDate) return { ...lesson, day };
  const date = addDaysToKey(lesson.startDate, day - weekdayOfKey(lesson.startDate));
  return { ...lesson, day, startDate: date, endDate: date };
}
