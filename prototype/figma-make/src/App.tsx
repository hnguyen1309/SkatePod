import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type IconName =
  | "calendar"
  | "chevron"
  | "chevronLeft"
  | "clock"
  | "home"
  | "logo"
  | "menu"
  | "music"
  | "notes"
  | "play"
  | "plus"
  | "search"
  | "settings"
  | "students";

const iconPaths: Record<IconName, ReactNode> = {
  calendar: (
    <>
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  home: (
    <>
      <path d="m4 10 8-7 8 7v10H4Z" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  logo: (
    <>
      <path d="M5 16c4.5-1 6.5-4.5 7.5-10 1.7 4 3.8 6.7 6.5 8" />
      <path d="M5 16c3.2 1.8 7.8 2.4 14 .2M8 20h8" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  notes: (
    <>
      <path d="M6 3h9l3 3v15H6Z" />
      <path d="M9 11h6M9 15h6M14 3v4h4" />
    </>
  ),
  play: <path d="m9 7 8 5-8 5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 14.5l1.5 1.2-2 3.4-1.9-.8a7.6 7.6 0 0 1-2.1 1.2l-.3 2h-4l-.3-2a7.6 7.6 0 0 1-2.1-1.2l-1.9.8-2-3.4 1.5-1.2a8 8 0 0 1 0-2.5L4 10.8l2-3.4 1.8.8A7.6 7.6 0 0 1 10 7l.3-2h4l.3 2a7.6 7.6 0 0 1 2.1 1.2l1.8-.8 2 3.4-1.5 1.3a8 8 0 0 1 0 2.4Z" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M15.5 14c3.3-.6 5.1 1.1 5.5 4" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      >
        {iconPaths[name]}
      </g>
    </svg>
  );
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#172536]/40 p-4 backdrop-blur-[2px]">
      <button aria-label="Close dialog" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e8edf1] bg-white px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg bg-[#f1f4f5] text-lg text-[#63727e]"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const students = [
  {
    initials: "EM",
    name: "Emma Miller",
    level: "Pre-Gold · Freestyle",
    lesson: "Today, 9:00 AM",
    focus: "Double loop",
    progress: 74,
    tone: "bg-[#dcebee] text-[#396972]",
  },
  {
    initials: "LK",
    name: "Lily Kim",
    level: "Juvenile · Freestyle",
    lesson: "Today, 11:30 AM",
    focus: "Flying camel",
    progress: 61,
    tone: "bg-[#ede5dc] text-[#755c44]",
  },
  {
    initials: "JR",
    name: "Jonah Reed",
    level: "Preliminary · Moves",
    lesson: "Tomorrow, 7:00 AM",
    focus: "Power pulls",
    progress: 82,
    tone: "bg-[#e7e2ef] text-[#685a7e]",
  },
];

const navItems: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Dashboard" },
  { icon: "students", label: "Students" },
  { icon: "calendar", label: "Calendar" },
  { icon: "music", label: "Programs" },
  { icon: "notes", label: "Lesson notes" },
];

const days = [
  { day: "MON", date: "13" },
  { day: "TUE", date: "14" },
  { day: "WED", date: "15" },
  { day: "THU", date: "16", today: true },
  { day: "FRI", date: "17" },
  { day: "SAT", date: "18" },
  { day: "SUN", date: "19" },
];

const calendarEvents = [
  { day: 0, row: 2, name: "Jonah", detail: "Moves · 45m", color: "teal" },
  { day: 1, row: 1, name: "Lily", detail: "Freestyle · 60m", color: "sand" },
  { day: 2, row: 4, name: "Emma", detail: "Off-ice · 30m", color: "purple" },
  { day: 3, row: 0, name: "Emma", detail: "Freestyle · 60m", color: "teal" },
  { day: 3, row: 3, name: "Lily", detail: "Freestyle · 45m", color: "sand" },
  { day: 4, row: 2, name: "Jonah", detail: "Moves · 45m", color: "purple" },
  { day: 5, row: 1, name: "Emma", detail: "Program · 60m", color: "teal" },
];

const times = ["7 AM", "9 AM", "11 AM", "1 PM", "3 PM"];

export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const actionLabels: Record<string, string> = {
    Programs: "New program",
    Students: "Add student",
    Calendar: "Add lesson",
    "Lesson notes": "New note",
  };

  const filteredStudents = useMemo(
    () => {
      let dashboardStudents = students;
      try {
        dashboardStudents =
          (JSON.parse(localStorage.getItem("skatepod-students") ?? "null") as typeof students) ??
          students;
      } catch {
        dashboardStudents = students;
      }
      return dashboardStudents.filter((student) =>
        `${student.name} ${student.level}`.toLowerCase().includes(query.toLowerCase()),
      );
    },
    [query, activeNav],
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172536]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#e5eaf0] bg-white px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#173d52] text-white">
            <Icon name="logo" size={24} />
          </span>
          <div>
            <p className="text-[21px] font-bold leading-none tracking-[-0.04em]">SkatePod</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#6d8990]">
              Coach workspace
            </p>
          </div>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                activeNav === item.label
                  ? "bg-[#edf5f6] text-[#173d52]"
                  : "text-[#657383] hover:bg-[#f6f8fb] hover:text-[#273849]"
              }`}
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-[#dfeaec] bg-[#f0f6f6] p-4">
            <p className="text-xs font-bold text-[#315d64]">Today’s schedule</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">4 lessons</p>
            <p className="mt-1 text-xs leading-5 text-[#71858a]">3 hours 30 minutes on ice</p>
          </div>
          <button
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold text-[#657383]"
            onClick={() => {
              setActiveNav("Settings");
              setMenuOpen(false);
            }}
          >
            <Icon name="settings" />
            Settings
          </button>
          <div className="mt-4 flex items-center gap-3 border-t border-[#edf0f3] px-2 pt-5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#173d52] text-sm font-bold text-white">
              CM
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Coach Mia</p>
              <p className="text-xs text-[#8a96a3]">Figure skating coach</p>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[#172536]/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="min-h-screen lg:ml-[252px]">
        <header className="flex h-[78px] items-center justify-between border-b border-[#e6eaf0] bg-white px-5 md:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="rounded-lg p-2 text-[#506170] hover:bg-[#f4f6f8] lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div>
              <p className="text-sm font-semibold">Thursday, October 16</p>
              <p className="hidden text-xs text-[#84909e] sm:block">Week 42 · Fall training season</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-[#173d52] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#204e63]"
            onClick={() => {
              if (activeNav === "Dashboard") setActiveNav("Calendar");
            }}
          >
            <Icon name="plus" size={17} />
            <span className="hidden sm:inline">{actionLabels[activeNav] ?? "Add lesson"}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        {activeNav === "Programs" ? (
          <ProgramWorkspace />
        ) : activeNav === "Students" ? (
          <StudentsWorkspace />
        ) : activeNav === "Calendar" ? (
          <CalendarWorkspace />
        ) : activeNav === "Lesson notes" ? (
          <LessonNotesWorkspace />
        ) : activeNav === "Settings" ? (
          <SettingsWorkspace />
        ) : (
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
          <section className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#47828a]">
                Coach dashboard
              </p>
              <h1 className="text-[30px] font-bold tracking-[-0.04em] md:text-[36px]">
                Good morning, Mia
              </h1>
              <p className="mt-2 text-sm text-[#71808f]">
                Everything you need to guide your skaters today.
              </p>
            </div>
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-[#dfe5ea] bg-white px-4 shadow-sm transition focus-within:border-[#72a7ab] focus-within:ring-2 focus-within:ring-[#dceced] xl:w-[340px]">
              <span className="text-[#82909c]">
                <Icon name="search" size={18} />
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba5ae]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students..."
                value={query}
              />
              <kbd className="hidden rounded border border-[#e1e5e9] bg-[#f7f8f9] px-1.5 py-0.5 text-[9px] font-bold text-[#89949e] sm:block">
                ⌘ K
              </kbd>
            </label>
          </section>

          <section className="mb-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold tracking-[-0.02em]">Your students</h2>
                <span className="text-xs text-[#8a96a2]">{students.length} active</span>
              </div>
              <button className="text-xs font-bold text-[#3f7880]" onClick={() => setActiveNav("Students")}>
                View all students
              </button>
            </div>

            {filteredStudents.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.name}
                    onClick={() => setActiveNav("Students")}
                    student={student}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#ccd6dc] bg-white py-10 text-center text-sm text-[#7d8995]">
                No students match “{query}”.
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e8edf1] p-5 sm:flex-row sm:items-center md:px-6">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.02em]">Coaching calendar</h2>
                <p className="mt-1 text-sm text-[#7c8996]">October 13–19, 2025</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-xl border border-[#dfe5ea]">
                  <button
                    aria-label="Previous week"
                    className="flex size-9 items-center justify-center border-r border-[#dfe5ea] text-[#627280] transition hover:bg-[#f4f7f8]"
                    onClick={() => setActiveNav("Calendar")}
                  >
                    <Icon name="chevronLeft" size={16} />
                  </button>
                  <button
                    aria-label="Next week"
                    className="flex size-9 items-center justify-center text-[#627280] transition hover:bg-[#f4f7f8]"
                    onClick={() => setActiveNav("Calendar")}
                  >
                    <Icon name="chevron" size={16} />
                  </button>
                </div>
                <button
                  className="h-9 rounded-xl border border-[#dfe5ea] px-3 text-xs font-bold text-[#566673] transition hover:bg-[#f4f7f8]"
                  onClick={() => setActiveNav("Calendar")}
                >
                  Today
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[58px_repeat(7,minmax(105px,1fr))] border-b border-[#e8edf1]">
                  <div />
                  {days.map((day) => (
                    <div
                      className={`border-l border-[#edf0f3] px-2 py-3 text-center ${
                        day.today ? "bg-[#f2f8f8]" : ""
                      }`}
                      key={day.day}
                    >
                      <p className="text-[9px] font-bold tracking-[0.12em] text-[#8a96a2]">{day.day}</p>
                      <span
                        className={`mt-1 inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                          day.today ? "bg-[#173d52] text-white" : "text-[#40515f]"
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative grid grid-cols-[58px_repeat(7,minmax(105px,1fr))]">
                  <div className="grid grid-rows-5">
                    {times.map((time) => (
                      <div
                        className="flex h-[74px] items-start justify-center pt-2 text-[9px] font-semibold text-[#929da7]"
                        key={time}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                  {days.map((day, dayIndex) => (
                    <div
                      className={`relative grid grid-rows-5 border-l border-[#edf0f3] ${
                        day.today ? "bg-[#f8fbfb]" : ""
                      }`}
                      key={day.day}
                    >
                      {times.map((time) => (
                        <div className="h-[74px] border-b border-[#edf0f3]" key={time} />
                      ))}
                      {calendarEvents
                        .filter((event) => event.day === dayIndex)
                        .map((event) => (
                          <CalendarEvent
                            color={event.color}
                            detail={event.detail}
                            key={`${event.name}-${event.row}`}
                            name={event.name}
                            row={event.row}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e8edf1] px-5 py-4 text-[10px] font-semibold text-[#75828e] md:px-6">
              <span className="mr-1 text-[#9aa4ad]">Lesson types</span>
              <Legend color="bg-[#75aeb0]" label="Freestyle" />
              <Legend color="bg-[#b79b73]" label="Moves" />
              <Legend color="bg-[#8e80a7]" label="Off-ice / program" />
            </div>
          </section>
        </div>
        )}
      </main>
    </div>
  );
}

const extendedStudents = [
  ...students,
  {
    initials: "SC",
    name: "Sofia Chen",
    level: "Intermediate · Freestyle",
    lesson: "Friday, 4:30 PM",
    focus: "Double axel",
    progress: 57,
    tone: "bg-[#f0dfdf] text-[#805555]",
  },
  {
    initials: "NB",
    name: "Noah Bennett",
    level: "Adult Gold · Freestyle",
    lesson: "Saturday, 8:00 AM",
    focus: "Combination spin",
    progress: 69,
    tone: "bg-[#e4eadc] text-[#596a43]",
  },
  {
    initials: "AP",
    name: "Amelia Park",
    level: "Preliminary · Freestyle",
    lesson: "Saturday, 10:30 AM",
    focus: "Axel",
    progress: 46,
    tone: "bg-[#dde8f1] text-[#4d687e]",
  },
];

function SettingsWorkspace() {
  const [settings, setSettings] = usePersistentState("skatepod-settings", {
    coachName: "Mia Carter",
    email: "mia@skatepod.co",
    rink: "North Rink",
    lessonLength: "45",
    reminders: true,
    sharedNotes: true,
  });
  const [saved, setSaved] = useState(false);

  function exportData() {
    const data: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("skatepod-")) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skatepod-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <WorkspaceHeading
        description="Manage your coach profile, defaults, sharing, and local data."
        eyebrow="Workspace preferences"
        title="Settings"
      />
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="border-b border-[#edf0f3] px-5 py-4 md:px-6">
            <h2 className="text-sm font-bold">Coach profile</h2>
            <p className="mt-1 text-xs text-[#84909c]">Shown on schedules and shared training histories.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
              Coach name
              <input
                className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#72a7ab]"
                onChange={(event) => setSettings((current) => ({ ...current, coachName: event.target.value }))}
                value={settings.coachName}
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
              Email
              <input
                className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#72a7ab]"
                onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))}
                type="email"
                value={settings.email}
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
              Home rink
              <input
                className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#72a7ab]"
                onChange={(event) => setSettings((current) => ({ ...current, rink: event.target.value }))}
                value={settings.rink}
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
              Default lesson length
              <select
                className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none"
                onChange={(event) => setSettings((current) => ({ ...current, lessonLength: event.target.value }))}
                value={settings.lessonLength}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,54,0.04)] md:p-6">
          <h2 className="text-sm font-bold">Workflow</h2>
          <div className="mt-5 divide-y divide-[#edf0f3]">
            <SettingToggle
              checked={settings.reminders}
              description="Show reminders before scheduled lessons."
              label="Lesson reminders"
              onChange={(checked) => setSettings((current) => ({ ...current, reminders: checked }))}
            />
            <SettingToggle
              checked={settings.sharedNotes}
              description="Include new lesson notes in read-only histories by default."
              label="Share notes by default"
              onChange={(checked) => setSettings((current) => ({ ...current, sharedNotes: checked }))}
            />
          </div>
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,54,0.04)] sm:flex-row sm:items-center md:p-6">
          <div>
            <h2 className="text-sm font-bold">Your data</h2>
            <p className="mt-1 text-xs text-[#84909c]">Download a JSON backup of students, lessons, notes, and programs.</p>
          </div>
          <button
            className="rounded-xl border border-[#dfe5ea] px-4 py-2.5 text-xs font-bold text-[#52636f]"
            onClick={exportData}
          >
            Export backup
          </button>
        </section>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-xs font-semibold text-[#4d8589]">Changes saved</span>}
          <button
            className="rounded-xl bg-[#173d52] px-5 py-3 text-xs font-bold text-white"
            onClick={() => {
              setSaved(true);
              window.setTimeout(() => setSaved(false), 2000);
            }}
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span>
        <span className="block text-xs font-bold">{label}</span>
        <span className="mt-1 block text-[10px] text-[#84909c]">{description}</span>
      </span>
      <input
        checked={checked}
        className="size-4 accent-[#4d9297]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function StudentsWorkspace() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [records, setRecords] = usePersistentState("skatepod-students", extendedStudents);
  const [selected, setSelected] = useState(records[0] ?? extendedStudents[0]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const filtered = records.filter((student) => {
    const matchesQuery = `${student.name} ${student.level}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesLevel =
      level === "All levels" || student.level.toLowerCase().includes(level.toLowerCase());
    return matchesQuery && matchesLevel;
  });

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <WorkspaceHeading
        eyebrow="Student management"
        title="Students"
        description="Keep every skater’s training, goals, and upcoming work in one place."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e3e8ee] bg-white p-4 shadow-[0_5px_24px_rgba(23,37,54,0.035)] sm:flex-row">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#dfe5ea] px-3 focus-within:border-[#72a7ab]">
          <span className="text-[#82909c]">
            <Icon name="search" size={17} />
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba5ae]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by student or level..."
            value={query}
          />
        </label>
        <select
          className="h-10 rounded-xl border border-[#dfe5ea] bg-white px-3 text-xs font-semibold text-[#53636f] outline-none"
          onChange={(event) => setLevel(event.target.value)}
          value={level}
        >
          <option>All levels</option>
          <option>Preliminary</option>
          <option>Pre-Gold</option>
          <option>Juvenile</option>
          <option>Intermediate</option>
          <option>Adult Gold</option>
        </select>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173d52] px-4 text-xs font-bold text-white"
          onClick={() => {
            setEditing(false);
            setEditorOpen(true);
          }}
        >
          <Icon name="plus" size={15} />
          Add student
        </button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="hidden grid-cols-[minmax(180px,1.4fr)_1fr_1fr_90px_32px] gap-4 border-b border-[#e8edf1] bg-[#f8fafb] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a96a1] md:grid">
            <span>Student</span>
            <span>Current focus</span>
            <span>Next lesson</span>
            <span>Progress</span>
            <span />
          </div>
          <div className="divide-y divide-[#edf0f3]">
            {filtered.map((student) => (
              <button
                className={`grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#fafcfc] md:grid-cols-[minmax(180px,1.4fr)_1fr_1fr_90px_32px] md:items-center md:gap-4 ${
                  selected.name === student.name ? "bg-[#f3f8f8]" : ""
                }`}
                key={student.name}
                onClick={() => setSelected(student)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${student.tone}`}>
                    {student.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{student.name}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[#84909c]">
                      {student.level}
                    </span>
                  </span>
                </span>
                <span className="pl-[52px] text-xs font-semibold text-[#53636f] md:pl-0">
                  {student.focus}
                </span>
                <span className="pl-[52px] text-xs text-[#73808c] md:pl-0">{student.lesson}</span>
                <span className="hidden md:block">
                  <span className="mb-1 block text-[10px] font-bold text-[#52636f]">
                    {student.progress}%
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-[#e9edef]">
                    <span
                      className="block h-full rounded-full bg-[#5d9da1]"
                      style={{ width: `${student.progress}%` }}
                    />
                  </span>
                </span>
                <span className="hidden text-[#8a96a1] md:block">
                  <Icon name="chevron" size={16} />
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="px-5 py-12 text-center text-sm text-[#84909c]">
                No students match those filters.
              </p>
            )}
          </div>
        </section>

        <aside className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="bg-[#173d52] p-5 text-white">
            <div className={`flex size-12 items-center justify-center rounded-full text-xs font-bold ${selected.tone}`}>
              {selected.initials}
            </div>
            <h2 className="mt-4 text-xl font-bold">{selected.name}</h2>
            <p className="mt-1 text-xs text-white/60">{selected.level}</p>
          </div>
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a96a1]">
              Training snapshot
            </p>
            <dl className="mt-4 space-y-4">
              <Detail label="Current focus" value={selected.focus} />
              <Detail label="Lessons this month" value="6" />
              <Detail label="Practice completion" value={`${selected.progress}%`} />
              <Detail label="Active programs" value="2" />
            </dl>
            <div className="my-5 border-t border-[#edf0f3]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a96a1]">
              Next lesson
            </p>
            <div className="mt-3 rounded-xl bg-[#f3f7f8] p-3">
              <p className="text-xs font-bold text-[#355e64]">{selected.lesson}</p>
              <p className="mt-1 text-[10px] text-[#728387]">North Rink · 45 minutes</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl border border-[#dfe5ea] py-2.5 text-[10px] font-bold text-[#52636f]">
                View notes
              </button>
              <button
                className="rounded-xl bg-[#173d52] py-2.5 text-[10px] font-bold text-white"
                onClick={() => {
                  setEditing(true);
                  setEditorOpen(true);
                }}
              >
                Edit profile
              </button>
            </div>
          </div>
        </aside>
      </div>
      {editorOpen && (
        <StudentEditor
          onClose={() => setEditorOpen(false)}
          onDelete={
            editing
              ? () => {
                  const next = records.filter((item) => item.name !== selected.name);
                  setRecords(next);
                  setSelected(next[0] ?? extendedStudents[0]);
                  setEditorOpen(false);
                }
              : undefined
          }
          onSave={(record) => {
            if (editing) {
              setRecords((current) =>
                current.map((item) => (item.name === selected.name ? record : item)),
              );
            } else {
              setRecords((current) => [...current, record]);
            }
            setSelected(record);
            setEditorOpen(false);
          }}
          student={editing ? selected : undefined}
        />
      )}
    </div>
  );
}

function StudentEditor({
  onClose,
  onDelete,
  onSave,
  student,
}: {
  onClose: () => void;
  onDelete?: () => void;
  onSave: (student: (typeof extendedStudents)[number]) => void;
  student?: (typeof extendedStudents)[number];
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    if (!name) return;
    onSave({
      initials: name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      name,
      level: `${data.get("level")} · ${data.get("discipline")}`,
      lesson: String(data.get("lesson")),
      focus: String(data.get("focus")),
      progress: Number(data.get("progress")),
      tone: student?.tone ?? "bg-[#dcebee] text-[#396972]",
    });
  }

  return (
    <Modal onClose={onClose} title={student ? "Edit student" : "Add student"}>
      <form className="space-y-4 p-5" onSubmit={submit}>
        <EditorInput defaultValue={student?.name} label="Student name" name="name" required />
        <div className="grid grid-cols-2 gap-3">
          <EditorInput
            defaultValue={student?.level.split(" · ")[0] ?? "Preliminary"}
            label="Level"
            name="level"
            required
          />
          <EditorInput
            defaultValue={student?.level.split(" · ")[1] ?? "Freestyle"}
            label="Discipline"
            name="discipline"
            required
          />
        </div>
        <EditorInput
          defaultValue={student?.lesson ?? "Not scheduled"}
          label="Next lesson"
          name="lesson"
          required
        />
        <EditorInput
          defaultValue={student?.focus ?? ""}
          label="Current focus"
          name="focus"
          required
        />
        <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
          Progress: {student?.progress ?? 50}%
          <input
            className="mt-3 w-full accent-[#4d9297]"
            defaultValue={student?.progress ?? 50}
            max="100"
            min="0"
            name="progress"
            type="range"
          />
        </label>
        <div className="flex items-center justify-between border-t border-[#edf0f3] pt-4">
          {onDelete ? (
            <button className="text-xs font-bold text-[#a85656]" onClick={onDelete} type="button">
              Delete student
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="rounded-xl border border-[#dfe5ea] px-4 py-2.5 text-xs font-bold" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-xl bg-[#173d52] px-4 py-2.5 text-xs font-bold text-white" type="submit">
              Save student
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function EditorInput({
  defaultValue,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-normal normal-case tracking-normal text-[#465765] outline-none focus:border-[#72a7ab]"
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function CalendarWorkspace() {
  const [mode, setMode] = useState("Week");
  const [selectedLesson, setSelectedLesson] = useState("Emma · Freestyle");
  const [weekOffset, setWeekOffset] = useState(0);
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [events, setEvents] = usePersistentState("skatepod-lessons", calendarEvents);
  const visibleDays = mode === "Day" ? days.filter((day) => day.today) : days;
  const selectedName = selectedLesson.split(" · ")[0];

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <WorkspaceHeading
          eyebrow="Schedule"
          title="Calendar"
          description="Plan lessons, rink time, and off-ice sessions across your roster."
          compact
        />
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-[#e9edef] p-1">
            {["Day", "Week", "Month"].map((item) => (
              <button
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  mode === item ? "bg-white text-[#263746] shadow-sm" : "text-[#7c8996]"
                }`}
                key={item}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-[#173d52] px-4 text-xs font-bold text-white"
            onClick={() => setLessonEditorOpen(true)}
          >
            <Icon name="plus" size={15} />
            Add lesson
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="flex items-center justify-between border-b border-[#e8edf1] px-5 py-4">
            <div className="flex items-center gap-2">
              <button
                className="flex size-8 items-center justify-center rounded-lg border border-[#dfe5ea] text-[#627280]"
                onClick={() => setWeekOffset((current) => current - 1)}
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              <button
                className="flex size-8 items-center justify-center rounded-lg border border-[#dfe5ea] text-[#627280]"
                onClick={() => setWeekOffset((current) => current + 1)}
              >
                <Icon name="chevron" size={15} />
              </button>
              <h2 className="ml-2 text-sm font-bold">
                {weekOffset === 0
                  ? "October 13–19, 2025"
                  : weekOffset > 0
                    ? `${weekOffset} week${weekOffset > 1 ? "s" : ""} ahead`
                    : `${Math.abs(weekOffset)} week${weekOffset < -1 ? "s" : ""} ago`}
              </h2>
            </div>
            <button
              className="rounded-lg border border-[#dfe5ea] px-3 py-2 text-[10px] font-bold text-[#566673]"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[790px]">
              <div
                className="grid border-b border-[#e8edf1]"
                style={{ gridTemplateColumns: `54px repeat(${visibleDays.length}, minmax(100px, 1fr))` }}
              >
                <div />
                {visibleDays.map((day) => (
                  <div
                    className={`border-l border-[#edf0f3] py-3 text-center ${
                      day.today ? "bg-[#f2f8f8]" : ""
                    }`}
                    key={day.day}
                  >
                    <p className="text-[9px] font-bold tracking-wider text-[#8a96a2]">{day.day}</p>
                    <span className={`mt-1 inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                      day.today ? "bg-[#173d52] text-white" : ""
                    }`}>
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="grid"
                style={{ gridTemplateColumns: `54px repeat(${visibleDays.length}, minmax(100px, 1fr))` }}
              >
                <div className="grid grid-rows-5">
                  {times.map((time) => (
                    <div className="h-[86px] pt-2 text-center text-[9px] font-semibold text-[#929da7]" key={time}>
                      {time}
                    </div>
                  ))}
                </div>
                {visibleDays.map((day) => {
                  const dayIndex = days.findIndex((item) => item.day === day.day);
                  return (
                  <div className={`relative grid grid-rows-5 border-l border-[#edf0f3] ${
                    day.today ? "bg-[#f8fbfb]" : ""
                  }`} key={day.day}>
                    {times.map((time) => (
                      <div className="h-[86px] border-b border-[#edf0f3]" key={time} />
                    ))}
                    {events.filter((event) => event.day === dayIndex).map((event) => {
                      const colors: Record<string, string> = {
                        teal: "border-[#72a7aa] bg-[#e6f1f1] text-[#315f64]",
                        sand: "border-[#bba17d] bg-[#f3eee7] text-[#6e5940]",
                        purple: "border-[#9b8db0] bg-[#efebf3] text-[#625675]",
                      };
                      return (
                        <button
                          className={`absolute left-1.5 right-1.5 z-10 rounded-lg border-l-[3px] px-2 py-2 text-left shadow-sm transition hover:brightness-95 ${colors[event.color]}`}
                          key={`${event.name}-${event.row}`}
                          onClick={() => setSelectedLesson(`${event.name} · ${event.detail.split(" · ")[0]}`)}
                          style={{ top: `${event.row * 86 + 8}px` }}
                        >
                          <span className="block truncate text-[11px] font-bold">{event.name}</span>
                          <span className="mt-0.5 block truncate text-[9px] opacity-70">{event.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a96a1]">
              Selected lesson
            </p>
            <h2 className="mt-3 text-base font-bold">{selectedLesson}</h2>
            <div className="mt-4 space-y-3 border-y border-[#edf0f3] py-4">
              <ScheduleMeta icon="clock" text="9:00–10:00 AM" />
              <ScheduleMeta icon="calendar" text="North Rink · Sheet A" />
              <ScheduleMeta icon="notes" text="Double loop & spins" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-[#dfe5ea] py-2.5 text-[10px] font-bold text-[#a85656]"
                onClick={() => {
                  setEvents((current) => current.filter((event) => event.name !== selectedName));
                  setSelectedLesson("Select a lesson");
                }}
              >
                Delete
              </button>
              <button className="rounded-xl bg-[#173d52] py-2.5 text-[10px] font-bold text-white">
                Add notes
              </button>
            </div>
          </section>
          <section className="rounded-2xl bg-[#173d52] p-5 text-white">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a9dfe1]">
              This week
            </p>
            <p className="mt-3 text-3xl font-bold tracking-[-0.05em]">7 lessons</p>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-white/55">On-ice time</span>
              <span className="font-bold">6h 15m</span>
            </div>
          </section>
        </aside>
      </div>
      {lessonEditorOpen && (
        <LessonEditor
          onClose={() => setLessonEditorOpen(false)}
          onSave={(event) => {
            setEvents((current) => [...current, event]);
            setSelectedLesson(`${event.name} · ${event.detail.split(" · ")[0]}`);
            setLessonEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LessonEditor({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: (typeof calendarEvents)[number]) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      day: Number(data.get("day")),
      row: Number(data.get("time")),
      name: String(data.get("student")),
      detail: `${data.get("type")} · ${data.get("duration")}m`,
      color: String(data.get("color")),
    });
  }

  return (
    <Modal onClose={onClose} title="Schedule lesson">
      <form className="space-y-4 p-5" onSubmit={submit}>
        <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
          Student
          <select className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm normal-case tracking-normal" name="student">
            {extendedStudents.map((student) => <option key={student.name}>{student.name.split(" ")[0]}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
            Day
            <select className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm normal-case tracking-normal" name="day">
              {days.map((day, index) => <option key={day.day} value={index}>{day.day} {day.date}</option>)}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
            Start time
            <select className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm normal-case tracking-normal" name="time">
              {times.map((time, index) => <option key={time} value={index}>{time}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <EditorInput defaultValue="Freestyle" label="Lesson type" name="type" required />
          <EditorInput defaultValue="45" label="Duration (minutes)" name="duration" required type="number" />
        </div>
        <input name="color" type="hidden" value="teal" />
        <div className="flex justify-end gap-2 border-t border-[#edf0f3] pt-4">
          <button className="rounded-xl border border-[#dfe5ea] px-4 py-2.5 text-xs font-bold" onClick={onClose} type="button">Cancel</button>
          <button className="rounded-xl bg-[#173d52] px-4 py-2.5 text-xs font-bold text-white" type="submit">Schedule lesson</button>
        </div>
      </form>
    </Modal>
  );
}

const previousNotes = [
  { student: "Emma Miller", date: "Oct 16", title: "Freestyle lesson", preview: "Much stronger check on the double loop today.", focus: "Double loop, flying camel spin", observations: "Much stronger check on the double loop today. Landing was controlled on 4 of 6 attempts. Keep the free leg extended longer through the exit.", nextSteps: "Start next lesson with loop entrance drills, then connect the jump into the opening program section.", skills: ["Double loop", "Flying camel", "Program transitions"] },
  { student: "Lily Kim", date: "Oct 14", title: "Spin session", preview: "Flying camel entry is more consistent from speed.", focus: "Flying camel, spin combinations", observations: "Flying camel entry is more consistent from speed. Centering improved when the entry edge stayed patient.", nextSteps: "Practice three controlled entries before adding the change-foot combination.", skills: ["Flying camel", "Combination spin"] },
  { student: "Jonah Reed", date: "Oct 13", title: "Moves in the field", preview: "Continue working on knee action through power pulls.", focus: "Power pulls and edge quality", observations: "Continue working on knee action through power pulls. Stronger flow on the right side.", nextSteps: "Complete two sets on each foot with emphasis on rhythm.", skills: ["Power pulls", "Outside edges"] },
  { student: "Sofia Chen", date: "Oct 10", title: "Program run-through", preview: "Great musical timing. Rework the final jump entrance.", focus: "Free skate run-through", observations: "Great musical timing. Rework the final jump entrance to preserve speed into the last section.", nextSteps: "Mark the revised entrance twice, then complete one full run-through.", skills: ["Program transitions", "Double axel"] },
];

function LessonNotesWorkspace() {
  const [notes, setNotes] = usePersistentState("skatepod-notes", previousNotes);
  const [selectedNote, setSelectedNote] = useState(notes[0] ?? previousNotes[0]);
  const [saved, setSaved] = useState(false);
  const [focus, setFocus] = useState(selectedNote.focus);
  const [observations, setObservations] = useState(selectedNote.observations);
  const [nextSteps, setNextSteps] = useState(selectedNote.nextSteps);
  const [skills, setSkills] = useState(selectedNote.skills);
  const [search, setSearch] = useState("");

  function chooseNote(note: (typeof previousNotes)[number]) {
    setSelectedNote(note);
    setFocus(note.focus);
    setObservations(note.observations);
    setNextSteps(note.nextSteps);
    setSkills(note.skills);
    setSaved(false);
  }

  function saveNote() {
    const updated = {
      ...selectedNote,
      focus,
      observations,
      nextSteps,
      skills,
      preview: observations.slice(0, 80),
    };
    setNotes((current) =>
      current.some((note) => note.student === selectedNote.student && note.date === selectedNote.date)
        ? current.map((note) =>
            note.student === selectedNote.student && note.date === selectedNote.date ? updated : note,
          )
        : [updated, ...current],
    );
    setSelectedNote(updated);
    setSaved(true);
  }

  function newNote() {
    const blank = {
      student: extendedStudents[0].name,
      date: "Today",
      title: "New lesson note",
      preview: "Draft lesson note",
      focus: "",
      observations: "",
      nextSteps: "",
      skills: [] as string[],
    };
    chooseNote(blank);
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <WorkspaceHeading
        eyebrow="Training history"
        title="Lesson notes"
        description="Capture useful feedback, next steps, and progress after every session."
      />

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="border-b border-[#e8edf1] p-4">
            <label className="flex h-9 items-center gap-2 rounded-xl border border-[#dfe5ea] px-3">
              <span className="text-[#82909c]"><Icon name="search" size={15} /></span>
              <input
                className="min-w-0 flex-1 text-xs outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                value={search}
              />
            </label>
          </div>
          <div className="divide-y divide-[#edf0f3]">
            {notes.filter((note) => `${note.student} ${note.title} ${note.preview}`.toLowerCase().includes(search.toLowerCase())).map((note) => (
              <button
                className={`w-full p-4 text-left transition hover:bg-[#fafcfc] ${
                  selectedNote.student === note.student ? "bg-[#f1f7f7]" : ""
                }`}
                key={`${note.student}-${note.date}`}
                onClick={() => {
                  chooseNote(note);
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">{note.student}</span>
                  <span className="text-[9px] font-semibold text-[#8a96a1]">{note.date}</span>
                </span>
                <span className="mt-1.5 block text-[11px] font-semibold text-[#596976]">{note.title}</span>
                <span className="mt-1.5 line-clamp-2 block text-[10px] leading-4 text-[#8a96a1]">
                  {note.preview}
                </span>
              </button>
            ))}
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 border-t border-[#e8edf1] py-3.5 text-xs font-bold text-[#3f7880]"
            onClick={newNote}
          >
            <Icon name="plus" size={14} />
            New lesson note
          </button>
        </aside>

        <section className="rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#e8edf1] p-5 sm:flex-row sm:items-center md:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{selectedNote.student}</h2>
                <span className="rounded-full bg-[#edf5f5] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#39747a]">
                  {saved ? "Saved" : "Draft"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#84909c]">Thursday, October 16 · 9:00 AM · North Rink</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl border border-[#dfe5ea] px-3 py-2.5 text-[10px] font-bold text-[#52636f]">
                Share preview
              </button>
              <button
                className="rounded-xl bg-[#173d52] px-4 py-2.5 text-[10px] font-bold text-white"
                onClick={saveNote}
              >
                Save note
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldSelect label="Lesson type" value="Freestyle" />
              <FieldSelect label="Duration" value="60 minutes" />
              <FieldSelect label="Overall session" value="Strong progress" />
            </div>
            <NoteField
              label="Session focus"
              onChange={setFocus}
              placeholder="Skills, program sections, or goals covered..."
              value={focus}
            />
            <NoteField
              label="Coach observations"
              onChange={setObservations}
              placeholder="What improved? What needs more attention?"
              rows={5}
              value={observations}
            />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
                  Skills worked on
                </label>
                <button
                  className="text-[10px] font-bold text-[#3f7880]"
                  onClick={() => {
                    const skill = window.prompt("Skill name");
                    if (skill?.trim()) setSkills((current) => [...current, skill.trim()]);
                  }}
                >
                  Add skill
                </button>
              </div>
              <div className="flex flex-wrap gap-2 rounded-xl border border-[#dfe5ea] p-3">
                {skills.map((skill) => (
                  <span className="rounded-lg bg-[#edf5f5] px-3 py-2 text-[10px] font-bold text-[#3f6f74]" key={skill}>
                    {skill}{" "}
                    <button
                      aria-label={`Remove ${skill}`}
                      className="ml-2 opacity-50"
                      onClick={() => setSkills((current) => current.filter((item) => item !== skill))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <NoteField
              label="Next steps & practice assignment"
              onChange={setNextSteps}
              placeholder="What should the student work on before the next lesson?"
              rows={4}
              value={nextSteps}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dfe5ea] bg-[#fafbfc] p-4">
              <input className="mt-0.5 accent-[#4d9297]" defaultChecked type="checkbox" />
              <span>
                <span className="block text-xs font-bold">Include in student’s shared training history</span>
                <span className="mt-1 block text-[10px] text-[#84909c]">
                  This note will appear in their read-only progress link.
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkspaceHeading({
  compact = false,
  description,
  eyebrow,
  title,
}: {
  compact?: boolean;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className={compact ? "" : "mb-7"}>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#47828a]">{eyebrow}</p>
      <h1 className="text-[30px] font-bold tracking-[-0.04em] md:text-[36px]">{title}</h1>
      <p className="mt-2 text-sm text-[#71808f]">{description}</p>
    </section>
  );
}

function ScheduleMeta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-[#667581]">
      <span className="text-[#5f9195]"><Icon name={icon} size={15} /></span>
      {text}
    </div>
  );
}

function FieldSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-xs font-semibold normal-case tracking-normal text-[#465765] outline-none focus:border-[#72a7ab]"
        defaultValue={value}
      >
        <option>{value}</option>
        <option>Other</option>
      </select>
    </label>
  );
}

function NoteField({
  label,
  onChange,
  placeholder,
  rows = 2,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7e8a95]">
      {label}
      <textarea
        className="mt-2 w-full resize-none rounded-xl border border-[#dfe5ea] p-3 text-sm font-normal leading-6 normal-case tracking-normal text-[#465765] outline-none transition placeholder:text-[#a1aab4] focus:border-[#72a7ab] focus:ring-2 focus:ring-[#dceced]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </label>
  );
}

type ProgramElement = {
  code: string;
  title: string;
  category: "Jump" | "Spin" | "Sequence" | "Choreography";
};

type RinkPoint = { x: number; y: number };
type RinkPlacement = RinkPoint & { code: string; id: number };
type ProgramData = {
  musicTitle: string;
  artist: string;
  duration: string;
  track: keyof typeof trackLevels;
  level: string;
  elements: ProgramElement[];
  paths: RinkPoint[][];
  placements: RinkPlacement[];
};

const trackLevels = {
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

const elementCatalog: (ProgramElement & { minimum: Record<keyof typeof trackLevels, number> })[] = [
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

const starterElements: ProgramElement[] = [
  { code: "1A", title: "Axel", category: "Jump" },
  { code: "2S", title: "Double salchow", category: "Jump" },
  { code: "CCoSp", title: "Change-foot combination spin", category: "Spin" },
  { code: "StSq", title: "Step sequence", category: "Sequence" },
];

function ProgramWorkspace() {
  const [student, setStudent] = useState("Emma Miller");
  const [view, setView] = useState<"components" | "rink">("components");
  const [programs, setPrograms] = usePersistentState<Record<string, ProgramData>>("skatepod-programs-v2", {});
  const defaults: ProgramData = {
    musicTitle: "Untitled program", artist: "", duration: "2:10",
    track: "Championship", level: "Preliminary", elements: starterElements,
    paths: [], placements: [],
  };
  const currentProgram = { ...defaults, ...programs[student] };
  const levelIndex = trackLevels[currentProgram.track].indexOf(currentProgram.level as never);
  const allowedElements = elementCatalog
    .filter((element) => element.minimum[currentProgram.track] <= Math.max(0, levelIndex))
    .map(({ minimum: _minimum, ...element }) => element);

  function updateProgram(updates: Partial<ProgramData>) {
    setPrograms((current) => ({
      ...current,
      [student]: { ...currentProgram, ...updates },
    }));
  }

  function changeTrack(track: keyof typeof trackLevels) {
    updateProgram({ track, level: trackLevels[track][0], elements: [] });
  }

  const counts = currentProgram.elements.reduce<Record<string, number>>((result, element) => {
    result[element.category] = (result[element.category] ?? 0) + 1;
    return result;
  }, {});

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#47828a]">Program builder</p>
          <h1 className="text-[30px] font-bold tracking-[-0.04em] md:text-[36px]">Program components</h1>
          <p className="mt-2 text-sm text-[#71808f]">Select eligible elements, set their skating order, and map the program on the rink.</p>
        </div>
        <label className="flex w-full flex-col gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c] sm:w-[280px]">
          Student
          <select className="h-11 rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#263746] outline-none" onChange={(event) => setStudent(event.target.value)} value={student}>
            {extendedStudents.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </label>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,54,0.04)] md:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c]">Track
                <select className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm font-semibold normal-case tracking-normal" onChange={(event) => changeTrack(event.target.value as keyof typeof trackLevels)} value={currentProgram.track}>
                  {Object.keys(trackLevels).map((track) => <option key={track}>{track}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c]">Level
                <select className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] bg-white px-3 text-sm font-semibold normal-case tracking-normal" onChange={(event) => updateProgram({ level: event.target.value, elements: [] })} value={currentProgram.level}>
                  {trackLevels[currentProgram.track].map((level) => <option key={level}>{level}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c]">Music
                <input className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-semibold normal-case tracking-normal" onChange={(event) => updateProgram({ musicTitle: event.target.value })} value={currentProgram.musicTitle} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c]">Artist
                <input className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-semibold normal-case tracking-normal" onChange={(event) => updateProgram({ artist: event.target.value })} value={currentProgram.artist} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#84909c]">Duration
                <input className="mt-2 h-10 w-full rounded-xl border border-[#dfe5ea] px-3 text-sm font-semibold normal-case tracking-normal" onChange={(event) => updateProgram({ duration: event.target.value })} value={currentProgram.duration} />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_5px_24px_rgba(23,37,54,0.04)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e8edf1] p-5 sm:flex-row sm:items-center md:px-6">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.02em]">{currentProgram.musicTitle}</h2>
                <p className="mt-1 text-sm text-[#7c8996]">{student} · {currentProgram.track} · {currentProgram.level}</p>
              </div>
              <div className="flex rounded-xl bg-[#f1f4f5] p-1">
                <button className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "components" ? "bg-white shadow-sm" : "text-[#7c8996]"}`} onClick={() => setView("components")}>Component sheet</button>
                <button className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "rink" ? "bg-white shadow-sm" : "text-[#7c8996]"}`} onClick={() => setView("rink")}>Rink map</button>
              </div>
            </div>
            {view === "components" ? (
              <ProgramComponentsSheet allowed={allowedElements} elements={currentProgram.elements} onChange={(elements) => updateProgram({ elements })} />
            ) : (
              <DrawableRink elements={currentProgram.elements} paths={currentProgram.paths} placements={currentProgram.placements} onPathsChange={(paths) => updateProgram({ paths })} onPlacementsChange={(placements) => updateProgram({ placements })} />
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#dce7e9] bg-[#edf5f5] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e8589]">Selected classification</p>
            <h2 className="mt-2 text-lg font-bold">{currentProgram.level}</h2>
            <p className="mt-1 text-xs text-[#6c8285]">{currentProgram.track} track · {allowedElements.length} catalog elements</p>
            <div className="mt-5 space-y-3 border-t border-[#d6e5e6] pt-4">
              <Requirement label="Jump elements" used={`${counts.Jump ?? 0} selected`} percent={Math.min(100, (counts.Jump ?? 0) * 20)} />
              <Requirement label="Spin elements" used={`${counts.Spin ?? 0} selected`} percent={Math.min(100, (counts.Spin ?? 0) * 34)} />
              <Requirement label="Sequences" used={`${(counts.Sequence ?? 0) + (counts.Choreography ?? 0)} selected`} percent={Math.min(100, ((counts.Sequence ?? 0) + (counts.Choreography ?? 0)) * 50)} />
            </div>
          </section>
          <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 text-xs leading-5 text-[#71808f]">
            <p className="font-bold text-[#354654]">Catalog note</p>
            <p className="mt-2">Element availability follows the selected Championship, Aspire, or Adult progression. Competition requirements can change by season; verify the final sheet against the current governing-body rulebook.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProgramComponentsSheet({ allowed, elements, onChange }: { allowed: ProgramElement[]; elements: ProgramElement[]; onChange: (elements: ProgramElement[]) => void }) {
  const [category, setCategory] = useState<ProgramElement["category"] | "All">("All");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const categories: (ProgramElement["category"] | "All")[] = ["All", "Jump", "Spin", "Sequence", "Choreography"];
  const visible = category === "All" ? allowed : allowed.filter((element) => element.category === category);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= elements.length) return;
    const next = [...elements];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function dropAt(index: number) {
    if (draggedIndex === null || draggedIndex === index) return;
    const next = [...elements];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDraggedIndex(null);
  }

  return (
    <div className="grid min-h-[520px] lg:grid-cols-[310px_1fr]">
      <div className="border-b border-[#e8edf1] bg-[#fafbfc] p-5 lg:border-b-0 lg:border-r">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7e8a95]">Eligible elements</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((item) => <button className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold ${category === item ? "bg-[#173d52] text-white" : "bg-white text-[#6d7b87]"}`} key={item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="mt-4 space-y-2">
          {visible.map((element) => (
            <button className="flex w-full items-center gap-3 rounded-xl border border-[#e0e6ea] bg-white p-3 text-left transition hover:border-[#84afb2] hover:bg-[#f5fafa]" key={element.code} onClick={() => onChange([...elements, element])}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5f5] text-[10px] font-extrabold text-[#3d7479]">{element.code}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{element.title}</span><span className="text-[9px] text-[#8a96a1]">{element.category}</span></span>
              <Icon name="plus" size={14} />
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7e8a95]">Program components sheet</p><p className="mt-1 text-xs text-[#8a96a1]">Drag rows or use arrows to set skating order.</p></div>
          <span className="rounded-full bg-[#edf5f5] px-3 py-1.5 text-[10px] font-bold text-[#3f7479]">{elements.length} elements</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e1e7eb]">
          <div className="grid grid-cols-[44px_62px_1fr_86px] bg-[#f4f7f8] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#8a96a1]"><span>Order</span><span>Code</span><span>Component</span><span className="text-right">Actions</span></div>
          {elements.length ? elements.map((element, index) => (
            <div className="grid cursor-grab grid-cols-[44px_62px_1fr_86px] items-center border-t border-[#e8edf1] px-3 py-3 text-xs active:cursor-grabbing" draggable key={`${element.code}-${index}`} onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropAt(index)}>
              <span className="font-bold text-[#84909c]">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-extrabold text-[#3f7479]">{element.code}</span>
              <span><span className="block font-bold">{element.title}</span><span className="mt-0.5 block text-[9px] text-[#8a96a1]">{element.category}</span></span>
              <span className="flex justify-end gap-1">
                <button aria-label="Move up" className="flex size-6 items-center justify-center rounded bg-[#f1f4f5]" onClick={() => move(index, -1)}>↑</button>
                <button aria-label="Move down" className="flex size-6 items-center justify-center rounded bg-[#f1f4f5]" onClick={() => move(index, 1)}>↓</button>
                <button aria-label="Remove" className="flex size-6 items-center justify-center rounded bg-[#f8eeee] text-[#a85656]" onClick={() => onChange(elements.filter((_, itemIndex) => itemIndex !== index))}>×</button>
              </span>
            </div>
          )) : <div className="px-5 py-14 text-center text-xs text-[#8a96a1]">Select eligible elements to begin the component sheet.</div>}
        </div>
      </div>
    </div>
  );
}

function DrawableRink({ elements, paths, placements, onPathsChange, onPlacementsChange }: { elements: ProgramElement[]; paths: RinkPoint[][]; placements: RinkPlacement[]; onPathsChange: (paths: RinkPoint[][]) => void; onPlacementsChange: (placements: RinkPlacement[]) => void }) {
  const [drawing, setDrawing] = useState<RinkPoint[]>([]);
  const pointFromEvent = (element: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * 720, y: ((clientY - rect.top) / rect.height) * 390 };
  };
  const pathData = (points: RinkPoint[]) => points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold">Draw the skating path</p><p className="mt-1 text-[10px] text-[#84909c]">Draw directly on the ice, then drag selected components onto their locations.</p></div>
        <div className="flex gap-2"><button className="rounded-lg border border-[#dfe5ea] px-3 py-2 text-[10px] font-bold" onClick={() => onPathsChange(paths.slice(0, -1))}>Undo path</button><button className="rounded-lg border border-[#e4d8d8] px-3 py-2 text-[10px] font-bold text-[#a85656]" onClick={() => { onPathsChange([]); onPlacementsChange([]); }}>Clear rink</button></div>
      </div>
      <div className="relative mx-auto aspect-[1.85/1] max-w-[780px] overflow-hidden rounded-[42px] border-2 border-[#b9d4d8] bg-[#f4fafb]">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-[#d4e5e7]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d4e5e7]" />
        <svg className="absolute inset-0 h-full w-full touch-none cursor-crosshair" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const code = event.dataTransfer.getData("text/plain"); if (!code) return; const point = pointFromEvent(event.currentTarget, event.clientX, event.clientY); onPlacementsChange([...placements, { ...point, code, id: Date.now() }]); }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDrawing([pointFromEvent(event.currentTarget, event.clientX, event.clientY)]); }} onPointerMove={(event) => { if (!drawing.length) return; setDrawing((current) => [...current, pointFromEvent(event.currentTarget, event.clientX, event.clientY)]); }} onPointerUp={() => { if (drawing.length > 1) onPathsChange([...paths, drawing]); setDrawing([]); }} viewBox="0 0 720 390">
          {[...paths, ...(drawing.length ? [drawing] : [])].map((path, index) => <path d={pathData(path)} fill="none" key={index} stroke="#4f9298" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />)}
          {placements.map((placement) => <g className="cursor-pointer" key={placement.id} onClick={() => onPlacementsChange(placements.filter((item) => item.id !== placement.id))}><circle cx={placement.x} cy={placement.y} fill="#173d52" r="17" /><text fill="white" fontSize="9" fontWeight="700" textAnchor="middle" x={placement.x} y={placement.y + 3}>{placement.code}</text></g>)}
        </svg>
      </div>
      <div className="mt-5 rounded-xl border border-[#e3e8ee] bg-[#fafbfc] p-4">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7e8a95]">Drag components onto the rink</p>
        <div className="flex flex-wrap gap-2">{elements.map((element, index) => <button className="cursor-grab rounded-lg border border-[#dbe4e7] bg-white px-3 py-2 text-[10px] font-bold text-[#3f7479] active:cursor-grabbing" draggable key={`${element.code}-${index}`} onDragStart={(event) => event.dataTransfer.setData("text/plain", element.code)}>{index + 1}. {element.code}</button>)}</div>
      </div>
    </div>
  );
}

function Requirement({ label, percent, used }: { label: string; percent: number; used: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="font-semibold text-[#637b7e]">{label}</span>
        <span className="font-bold text-[#365f64]">{used}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/80">
        <div className="h-full rounded-full bg-[#5d9da1]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <dt className="text-[#8a96a1]">{label}</dt>
      <dd className="font-semibold text-[#465765]">{value}</dd>
    </div>
  );
}

function StudentCard({
  onClick,
  student,
}: {
  onClick?: () => void;
  student: (typeof students)[number];
}) {
  return (
    <article className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,54,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_28px_rgba(23,37,54,0.08)]">
      <div className="flex items-start gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${student.tone}`}>
          {student.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">{student.name}</h3>
          <p className="mt-0.5 truncate text-xs text-[#84909c]">{student.level}</p>
        </div>
        <button
          aria-label={`View ${student.name}`}
          className="flex size-8 items-center justify-center rounded-lg text-[#8a96a1] transition hover:bg-[#f3f6f7] hover:text-[#3f7880]"
          onClick={onClick}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f7f9fa] px-3 py-2.5 text-xs">
        <span className="text-[#5f9195]">
          <Icon name="clock" size={15} />
        </span>
        <span className="font-semibold text-[#53636f]">{student.lesson}</span>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold text-[#7f8b96]">Focus: {student.focus}</span>
          <span className="font-bold text-[#52636f]">{student.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f3]">
          <div
            className="h-full rounded-full bg-[#5d9da1]"
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function CalendarEvent({
  color,
  detail,
  name,
  row,
}: {
  color: string;
  detail: string;
  name: string;
  row: number;
}) {
  const colors: Record<string, string> = {
    teal: "border-[#72a7aa] bg-[#e6f1f1] text-[#315f64]",
    sand: "border-[#bba17d] bg-[#f3eee7] text-[#6e5940]",
    purple: "border-[#9b8db0] bg-[#efebf3] text-[#625675]",
  };

  return (
    <button
      className={`absolute left-1.5 right-1.5 z-10 rounded-lg border-l-[3px] px-2 py-1.5 text-left shadow-sm transition hover:brightness-95 ${colors[color]}`}
      style={{ top: `${row * 74 + 7}px` }}
    >
      <span className="block truncate text-[11px] font-bold">{name}</span>
      <span className="mt-0.5 block truncate text-[9px] opacity-70">{detail}</span>
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
