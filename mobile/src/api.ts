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
import { lessonFromApi, lessonToApi, studentFromApi, studentToApi, type ApiLesson, type ApiStudent, type Lesson, type Student } from "./data";

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

/** For the Test connection button: how many students the backend has, and how long it took. */
export async function checkConnection(): Promise<{ students: number; millis: number }> {
  const started = Date.now();
  const students = await request<ApiStudent[]>("GET", "/students");
  return { students: students.length, millis: Date.now() - started };
}
