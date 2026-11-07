export type Tab = "Dashboard" | "Students" | "Calendar" | "Programs" | "Notes" | "Settings";

/** A one-time request for a screen, e.g. "open the add form" or "show this student". */
export type Intent =
  | { kind: "add" }
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
