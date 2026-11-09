// Talks to the SkatePod backend (backend/ in this repo).
//
// The backend's address comes from EXPO_PUBLIC_API_URL in mobile/.env, for example
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:8080/api
// An iPhone can't reach "localhost" on your Mac, so use the Mac's Wi-Fi address (System Settings →
// Wi-Fi → Details) and keep the phone on the same Wi-Fi. The iOS Simulator can use localhost.
// Without the setting, the app keeps everything on the phone like before.
//
// Every call prints one line in the Expo terminal while developing, e.g. "→ POST /students 201 (14 ms)",
// to match the line the backend prints when it receives it.
import {
  lessonFromApi,
  lessonToApi,
  noteFromApi,
  noteToApi,
  programFromApi,
  programToApi,
  studentFromApi,
  studentToApi,
  type ApiLesson,
  type ApiNote,
  type ApiProgram,
  type MusicFile,
  type ApiStudent,
  type Lesson,
  type Note,
  type Program,
  type Student,
} from "./data";

export const API_URL: string | null = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || null;

// How long to wait for the backend before giving up. Without this, a phone on the wrong Wi-Fi waits a minute.
const TIMEOUT_MS = 8000;

/** A failed call. `status` is the HTTP status, or 0 when the backend couldn't be reached at all. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function log(line: string) {
  if (__DEV__) console.log(line);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_URL) throw new ApiError(0, "No backend is set up. Add EXPO_PUBLIC_API_URL to mobile/.env.");
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    log(`→ ${method} ${path} failed: no answer from ${API_URL} (${Date.now() - started} ms)`);
    throw new ApiError(0, `Can't reach the backend at ${API_URL}. Is it running, and is this phone on the same Wi-Fi as your Mac?`);
  } finally {
    clearTimeout(timer);
  }
  log(`→ ${method} ${path} ${response.status} (${Date.now() - started} ms)`);
  if (!response.ok) {
    // The backend explains errors in a JSON "problem detail", e.g. {"detail": "Juvenile is not a level in ..."}.
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(response.status, problem?.detail ?? `The backend answered ${response.status}.`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function listStudents(): Promise<Student[]> {
  const students = await request<ApiStudent[]>("GET", "/students");
  return students.map(studentFromApi);
}

export async function createStudent(student: Student): Promise<Student> {
  return studentFromApi(await request<ApiStudent>("POST", "/students", studentToApi(student)));
}

export async function updateStudent(student: Student): Promise<Student> {
  return studentFromApi(await request<ApiStudent>("PUT", `/students/${student.id}`, studentToApi(student)));
}

export async function deleteStudent(id: string): Promise<void> {
  await request<void>("DELETE", `/students/${id}`);
}

export async function listLessons(): Promise<Lesson[]> {
  const lessons = await request<ApiLesson[]>("GET", "/lessons");
  return lessons.map(lessonFromApi);
}

// The backend checks double booking (409) and that a new lesson starts today at the earliest (400),
// the same rules the lesson editor checks; its message ends up in the alert if it says no.
export async function createLesson(lesson: Lesson): Promise<Lesson> {
  return lessonFromApi(await request<ApiLesson>("POST", "/lessons", lessonToApi(lesson)));
}

export async function updateLesson(lesson: Lesson): Promise<Lesson> {
  return lessonFromApi(await request<ApiLesson>("PUT", `/lessons/${lesson.id}`, lessonToApi(lesson)));
}

export async function deleteLesson(id: string): Promise<void> {
  await request<void>("DELETE", `/lessons/${id}`);
}

// The training history. Each GET also brings it up to date on the backend: every lesson that has
// started since the last check gets an empty note (NoteService.catchUpHistory), so the app doesn't
// work that out itself when it's on the backend.
export async function listNotes(): Promise<Note[]> {
  const notes = await request<ApiNote[]>("GET", "/notes");
  return notes.map(noteFromApi);
}

export async function createNote(note: Note): Promise<Note> {
  return noteFromApi(await request<ApiNote>("POST", "/notes", noteToApi(note)));
}

export async function updateNote(note: Note): Promise<Note> {
  return noteFromApi(await request<ApiNote>("PUT", `/notes/${note.id}`, noteToApi(note)));
}

export async function deleteNote(id: string): Promise<void> {
  await request<void>("DELETE", `/notes/${id}`);
}

// Programs: a student can have several. One GET loads everyone's.
export async function listPrograms(): Promise<Program[]> {
  const programs = await request<ApiProgram[]>("GET", "/programs");
  return programs.map(programFromApi);
}

export async function createProgram(program: Program): Promise<Program> {
  return programFromApi(await request<ApiProgram>("POST", "/programs", programToApi(program)));
}

export async function updateProgram(program: Program): Promise<Program> {
  return programFromApi(await request<ApiProgram>("PUT", `/programs/${program.id}`, programToApi(program)));
}

/** Also deletes the program's music file on the backend, unless another program uses it. */
export async function deleteProgram(id: string): Promise<void> {
  await request<void>("DELETE", `/programs/${id}`);
}

/** Where the backend serves an uploaded music file, to play it. */
export function musicFileUrl(id: string) {
  return `${API_URL}/music/${id}`;
}

// Uploading a music file can take a while on a phone connection, so it gets longer than other calls.
const UPLOAD_TIMEOUT_MS = 120_000;

/**
 * Uploads a music file picked on the phone (`uri` is where the picker put it). Resolves once the
 * backend has the whole file; the program then refers to it by id when it's saved.
 */
export async function uploadMusic(file: { uri: string; name: string; mimeType?: string }): Promise<MusicFile> {
  if (!API_URL) throw new ApiError(0, "Uploading music needs the backend. Add EXPO_PUBLIC_API_URL to mobile/.env.");
  const form = new FormData();
  // React Native sends a { uri, name, type } object as the file's contents.
  form.append("file", { uri: file.uri, name: file.name, type: file.mimeType ?? "audio/mpeg" } as unknown as Blob);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/music`, { method: "POST", body: form, signal: controller.signal });
  } catch {
    log(`→ POST /music failed: no answer from ${API_URL} (${Date.now() - started} ms)`);
    throw new ApiError(0, `Couldn't upload the file to ${API_URL}. Is the backend running, and is this phone on the same Wi-Fi as your Mac?`);
  } finally {
    clearTimeout(timer);
  }
  log(`→ POST /music ${response.status} (${Date.now() - started} ms)`);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    const detail = response.status === 413 ? "Music files can be up to 20 MB." : problem?.detail;
    throw new ApiError(response.status, detail ?? `The backend answered ${response.status}.`);
  }
  return (await response.json()) as MusicFile;
}

/** For the Test connection button: how many students the backend has, and how long it took. */
export async function checkConnection(): Promise<{ students: number; millis: number }> {
  const started = Date.now();
  const students = await request<ApiStudent[]>("GET", "/students");
  return { students: students.length, millis: Date.now() - started };
}
