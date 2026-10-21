export const colors = {
  navy: "#173d52",
  bg: "#f6f8fb",
  card: "#ffffff",
  border: "#e3e8ee",
  borderSoft: "#edf0f3",
  input: "#dfe5ea",
  text: "#172536",
  body: "#465765",
  subtle: "#53636f",
  muted: "#84909c",
  faint: "#9ba5ae",
  teal: "#3f7880",
  tealDark: "#3d7479",
  tealSoft: "#edf5f5",
  tealFill: "#5d9da1",
  tealPanel: "#f0f6f6",
  danger: "#a85656",
  dangerSoft: "#f8eeee",
  white: "#ffffff",
  track: "#e9edef",
};

export type LessonColor = "teal" | "sand" | "purple";

export const lessonColors: Record<LessonColor, { border: string; bg: string; text: string; dot: string }> = {
  teal: { border: "#72a7aa", bg: "#e6f1f1", text: "#315f64", dot: "#75aeb0" },
  sand: { border: "#bba17d", bg: "#f3eee7", text: "#6e5940", dot: "#b79b73" },
  purple: { border: "#9b8db0", bg: "#efebf3", text: "#625675", dot: "#8e80a7" },
};

export const radius = { sm: 8, md: 12, lg: 16 };

export const shadow = {
  shadowColor: "#172536",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
};
