import type { LessonColor } from "./theme";

export type Tone = { bg: string; fg: string };

export type Student = {
  id: string;
  name: string;
  level: string;
  discipline: string;
  nextLesson: string;
  focus: string;
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
export const LEVEL_FILTERS = ["All levels", "Preliminary", "Pre-Gold", "Juvenile", "Intermediate", "Adult Gold"];

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
  { id: "s1", name: "Emma Miller", level: "Pre-Gold", discipline: "Freestyle", nextLesson: "Today, 9:00 AM", focus: "Double loop", progress: 74, tone: TONES[0] },
  { id: "s2", name: "Lily Kim", level: "Juvenile", discipline: "Freestyle", nextLesson: "Today, 11:30 AM", focus: "Flying camel", progress: 61, tone: TONES[1] },
  { id: "s3", name: "Jonah Reed", level: "Preliminary", discipline: "Moves", nextLesson: "Tomorrow, 7:00 AM", focus: "Power pulls", progress: 82, tone: TONES[2] },
  { id: "s4", name: "Sofia Chen", level: "Intermediate", discipline: "Freestyle", nextLesson: "Friday, 4:30 PM", focus: "Double axel", progress: 57, tone: TONES[3] },
  { id: "s5", name: "Noah Bennett", level: "Adult Gold", discipline: "Freestyle", nextLesson: "Saturday, 8:00 AM", focus: "Combination spin", progress: 69, tone: TONES[4] },
  { id: "s6", name: "Amelia Park", level: "Preliminary", discipline: "Freestyle", nextLesson: "Saturday, 10:30 AM", focus: "Axel", progress: 46, tone: TONES[5] },
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
