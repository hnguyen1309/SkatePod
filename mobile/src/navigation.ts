export type Tab = "Dashboard" | "Students" | "Calendar" | "Programs" | "Lessons" | "Settings";

/** A one-time request for a screen, e.g. "open the add form" or "show this student". */
export type Intent =
  // studentId: on the Calendar, the lesson editor opens with this student picked (from a student's profile)
  | { kind: "add"; studentId?: string }
  // The Calendar shows this lesson's week and day and opens its preview (a profile's "Go to Calendar").
  | { kind: "showLesson"; lessonId: string }
  | { kind: "openStudent"; studentId: string }
  // returnTo: the tab to go back to when the note editor closes (e.g. the Calendar's lesson preview)
  | { kind: "newNote"; studentId?: string; lesson?: { id: string; date: string; type: string; duration: number }; returnTo?: Tab }
  | { kind: "openNote"; noteId: string; returnTo?: Tab }
  | { kind: "filterNotes"; studentId: string };

export type ScreenProps = {
  intent: Intent | null;
  onIntentHandled: () => void;
  navigate: (tab: Tab, intent?: Intent) => void;
};
