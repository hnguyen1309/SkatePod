export type Tab = "Dashboard" | "Students" | "Calendar" | "Programs" | "Notes" | "Settings";

/** A one-time request for a screen, e.g. "open the add form" or "show this student". */
export type Intent =
  | { kind: "add" }
  | { kind: "openStudent"; studentId: string }
  | { kind: "newNote"; studentId?: string; lesson?: { id: string; date: string; type: string; duration: number } }
  | { kind: "openNote"; noteId: string }
  | { kind: "filterNotes"; studentId: string };

export type ScreenProps = {
  intent: Intent | null;
  onIntentHandled: () => void;
  navigate: (tab: Tab, intent?: Intent) => void;
};
