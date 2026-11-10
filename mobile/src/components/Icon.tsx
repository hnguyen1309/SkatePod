import type { ReactNode } from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

export type IconName =
  | "calendar"
  | "check"
  | "chevron"
  | "chevronLeft"
  | "clock"
  | "home"
  | "logo"
  | "music"
  | "notes"
  | "plus"
  | "minus"
  | "search"
  | "settings"
  | "share"
  | "students"
  | "trash"
  | "up"
  | "down"
  | "close"
  | "edit"
  | "phone"
  | "grip";

const paths: Record<IconName, ReactNode> = {
  calendar: (
    <>
      <Path d="M7 3v3M17 3v3M4 9h16" />
      <Rect x="4" y="5" width="16" height="16" rx="3" />
    </>
  ),
  check: <Path d="m5 12 5 5 9-10" />,
  chevron: <Path d="m9 18 6-6-6-6" />,
  chevronLeft: <Path d="m15 18-6-6 6-6" />,
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  home: (
    <>
      <Path d="m4 10 8-7 8 7v10H4Z" />
      <Path d="M9 20v-6h6v6" />
    </>
  ),
  logo: (
    <>
      {/* Skate boot (open at the ankle) above a blade with a toe pick. Traced from design/logo/skatepod-logo-navy.svg. */}
      <Path d="M17.75 3.13C15.54 8.05 13.38 10.34 10.7 11.43 7.19 12.75 5.53 14.78 5.6 17.85v.6h15.32v-1.87" />
      <Path d="M3.08 19.38c.39 1.1 1.15 1.41 1.95 1.51h15.89" />
    </>
  ),
  music: (
    <>
      <Path d="M9 18V6l10-2v12" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="16" cy="16" r="3" />
    </>
  ),
  notes: (
    <>
      <Path d="M6 3h9l3 3v15H6Z" />
      <Path d="M9 11h6M9 15h6M14 3v4h4" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m16 16 4 4" />
    </>
  ),
  settings: (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19 14.5l1.5 1.2-2 3.4-1.9-.8a7.6 7.6 0 0 1-2.1 1.2l-.3 2h-4l-.3-2a7.6 7.6 0 0 1-2.1-1.2l-1.9.8-2-3.4 1.5-1.2a8 8 0 0 1 0-2.5L4 10.8l2-3.4 1.8.8A7.6 7.6 0 0 1 10 7l.3-2h4l.3 2a7.6 7.6 0 0 1 2.1 1.2l1.8-.8 2 3.4-1.5 1.3a8 8 0 0 1 0 2.4Z" />
    </>
  ),
  share: (
    <>
      <Path d="M12 3v12M8 7l4-4 4 4" />
      <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </>
  ),
  students: (
    <>
      <Circle cx="9" cy="8" r="3" />
      <Path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6" />
      <Circle cx="17" cy="9" r="2.2" />
      <Path d="M15.5 14c3.3-.6 5.1 1.1 5.5 4" />
    </>
  ),
  trash: <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  up: <Path d="m6 15 6-6 6 6" />,
  down: <Path d="m6 9 6 6 6-6" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  edit: <Path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  phone: <Path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  // Six dots: the usual "drag me" handle.
  grip: (
    <>
      <Circle cx="9" cy="6" r="1" />
      <Circle cx="15" cy="6" r="1" />
      <Circle cx="9" cy="12" r="1" />
      <Circle cx="15" cy="12" r="1" />
      <Circle cx="9" cy="18" r="1" />
      <Circle cx="15" cy="18" r="1" />
    </>
  ),
};

export function Icon({ name, size = 20, color = "#53636f" }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {paths[name]}
      </G>
    </Svg>
  );
}
