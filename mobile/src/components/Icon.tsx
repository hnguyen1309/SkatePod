import type { ReactNode } from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

export type IconName =
  | "calendar"
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
  | "close";

const paths: Record<IconName, ReactNode> = {
  calendar: (
    <>
      <Path d="M7 3v3M17 3v3M4 9h16" />
      <Rect x="4" y="5" width="16" height="16" rx="3" />
    </>
  ),
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
      <Path d="M5 16c4.5-1 6.5-4.5 7.5-10 1.7 4 3.8 6.7 6.5 8" />
      <Path d="M5 16c3.2 1.8 7.8 2.4 14 .2M8 20h8" />
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
