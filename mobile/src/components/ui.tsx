import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LESSON_TYPES, colorForType, disciplineInfo, sortDisciplines, type StudentDiscipline, type Tone } from "../data";
import { categoryColors, colors, lessonColors, radius, shadow } from "../theme";
import { Icon, type IconName } from "./Icon";

export function Screen({
  children,
  scrollEnabled = true,
}: {
  children: ReactNode;
  scrollEnabled?: boolean;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {children}
    </ScrollView>
  );
}

export function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "link";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const textColor =
    variant === "primary" ? colors.white : variant === "danger" ? colors.danger : variant === "link" ? colors.teal : colors.subtle;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && { backgroundColor: colors.navy },
        variant === "secondary" && { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.input },
        variant === "danger" && { backgroundColor: colors.white, borderWidth: 1, borderColor: "#e4d8d8" },
        variant === "link" && { paddingHorizontal: 0, minHeight: 0, paddingVertical: 4 },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Icon color={textColor} name={icon} size={16} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.subtle,
  background = "#f1f4f5",
  size = 34,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: background },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon color={color} name={icon} size={Math.round(size * 0.5)} />
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  rows = 3,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      {/* accessibilityLabel names the box for VoiceOver, and lets the Maestro UI tests (mobile/.maestro) find it. */}
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={[styles.input, multiline && { minHeight: rows * 24 + 20, textAlignVertical: "top", paddingTop: 10 }]}
        value={value}
      />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Icon color={colors.muted} name="search" size={17} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 }}
        value={value}
      />
    </View>
  );
}

/** A row of tappable pills for choosing one option. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
}) {
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={option}
              onPress={() => onChange(option)}
              style={[styles.chip, active && { backgroundColor: colors.navy, borderColor: colors.navy }]}
            >
              <Text style={[styles.chipText, active && { color: colors.white }]}>{renderLabel ? renderLabel(option) : option}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function PickerField<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <Chips onChange={onChange} options={options} renderLabel={renderLabel} value={value} />
    </View>
  );
}

/**
 * The round tick box at the start of a lesson row: empty until tapped, then teal with a check.
 * The circle is 24 points, and hitSlop makes the tappable area about 44, Apple's comfortable minimum.
 */
export function TickCircle({ ticked, onPress, label }: { ticked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ticked }}
      hitSlop={10}
      onPress={onPress}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: ticked ? colors.teal : colors.border,
        backgroundColor: ticked ? colors.teal : colors.white,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ticked ? <Icon color={colors.white} name="check" size={13} /> : null}
    </Pressable>
  );
}

/**
 * Shows up above a list once at least one row is ticked: a "Select all" tick box (ticked when every row
 * is, empty otherwise), how many are ticked, and "Clear" to untick everything.
 */
export function SelectAllBar({ count, total, onSelectAll, onClear }: { count: number; total: number; onSelectAll: () => void; onClear: () => void }) {
  const all = count === total;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, marginBottom: 8 }}>
      {/* Empty until every row is ticked, then a check (no dash for "some"). */}
      <TickCircle label="Select all" onPress={all ? onClear : onSelectAll} ticked={all} />
      <Pressable accessibilityElementsHidden importantForAccessibility="no" onPress={all ? onClear : onSelectAll} style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Select all</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{count} of {total} selected</Text>
      </Pressable>
      <Button label="Clear" onPress={onClear} variant="link" />
    </View>
  );
}

/**
 * The bar pinned to the bottom while lesson rows are ticked: Select all / Clear on top, then the action
 * buttons (`children`, e.g. Share and Text) in a row. It sits outside the scrolling list, so it stays put
 * while the notes scroll. In a Sheet, pass it as the `footer` (the sheet already draws the frame);
 * on a tab screen, use `framed` to get the same top border, background and padding.
 */
export function SelectionFooter({
  count,
  total,
  onSelectAll,
  onClear,
  framed,
  children,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  framed?: boolean;
  children: ReactNode;
}) {
  // `flex: 1` here only sets the width (the footer around it is a row). Its height comes from what's
  // inside: a flex: 1 box inside a column would shrink to the smallest height and hide the buttons.
  const content = (
    <View style={{ flex: 1 }}>
      <SelectAllBar count={count} onClear={onClear} onSelectAll={onSelectAll} total={total} />
      <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>
    </View>
  );
  return framed ? <View style={[styles.sheetFooter, styles.pinnedBar]}>{content}</View> : content;
}

/**
 * The lesson type buttons (Public, Freestyle, Off-ice), in the same colors as the lesson cards on the
 * calendar (colorForType + lessonColors), so the coach learns which color means which type.
 * Each button has a colored dot; the picked one fills with its color.
 */
export function LessonTypePicker({ value, onChange }: { value: string; onChange: (type: string) => void }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Label>Lesson type</Label>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {LESSON_TYPES.map((type) => {
          const active = type === value;
          const tone = lessonColors[colorForType(type)];
          return (
            <Pressable
              accessibilityLabel={type}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={type}
              onPress={() => onChange(type)}
              style={[
                styles.chip,
                { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
                active && { backgroundColor: tone.bg, borderColor: tone.border, borderWidth: 1.5 },
              ]}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone.dot }} />
              <Text style={[styles.chipText, active && { color: tone.text, fontWeight: "700" }]}>{type}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * A field that opens its list of options right below it. Only listed options can be picked,
 * so there's nothing to mistype. The list opens inline (not as a pop-up) because forms are
 * already inside a Sheet, and iOS can't show a second pop-up on top of it.
 */
export function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
  placeholder = "Choose…",
}: {
  label?: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const show = (option: T) => (renderLabel ? renderLabel(option) : option);

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable
        accessibilityLabel={label ?? placeholder}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={[styles.input, styles.dropdown, open && { borderColor: colors.teal }]}
      >
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: value ? colors.body : colors.faint }}>
          {value ? show(value) : placeholder}
        </Text>
        <Icon color={colors.muted} name={open ? "up" : "down"} size={16} />
      </Pressable>
      {open ? (
        <View style={styles.dropdownList}>
          {options.map((option, index) => {
            const selected = option === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => {
                  setOpen(false);
                  onChange(option);
                }}
                style={({ pressed }) => [
                  styles.dropdownOption,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSoft },
                  pressed && { backgroundColor: "#f3f8f8" },
                ]}
              >
                <Text style={{ flex: 1, fontSize: 14, color: selected ? colors.navy : colors.body, fontWeight: selected ? "700" : "500" }}>
                  {show(option)}
                </Text>
                {selected ? <Icon color={colors.navy} name="check" size={16} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, active && { backgroundColor: colors.white, ...shadow }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.text }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ initials, tone, size = 40 }: { initials: string; tone: Tone; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: tone.fg, fontWeight: "700", fontSize: Math.round(size * 0.3) }}>{initials}</Text>
    </View>
  );
}

/** Small pills like "Pre-Gold · Freeskate", colored by discipline category. */
export function DisciplineBadges({ disciplines, emptyColor = colors.muted }: { disciplines: StudentDiscipline[]; emptyColor?: string }) {
  if (!disciplines.length) {
    return <Text style={{ fontSize: 12, color: emptyColor }}>No disciplines yet</Text>;
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {sortDisciplines(disciplines).map((item) => {
        const info = disciplineInfo(item.discipline);
        const tone = categoryColors[info.category];
        return (
          <View key={item.discipline} style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: tone.fg }}>
              {item.level} · {info.shortName}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProgressBar({ percent, trackColor = colors.track }: { percent: number; trackColor?: string }) {
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: trackColor, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height: "100%", borderRadius: 3, backgroundColor: colors.tealFill }} />
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.body, fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{label}</Text>
        {description ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>{description}</Text> : null}
      </View>
      <Switch onValueChange={onChange} trackColor={{ true: colors.tealFill }} value={value} />
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

/** A slide-up sheet, used for add and edit forms. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  top,
  hideHeader,
  pushed = null,
}: {
  visible: boolean;
  title: string;
  // No title row: `top` goes right to the top of the sheet and must bring its own Close button
  // (e.g. the student profile, whose navy card already shows the name).
  hideHeader?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  // Shown under the title and above the scrolling part, so it stays still while the rest scrolls.
  top?: ReactNode;
  // A second page shown over this one inside the same sheet (e.g. a note opened from a student's profile).
  // It slides in from the right when set and back out when it goes back to null, instead of opening a new sheet.
  pushed?: ReactNode | null;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        {/* While a page is pushed on top, hide this one from screen readers (and Maestro) so they only see the top page. */}
        <View accessibilityElementsHidden={Boolean(pushed)} importantForAccessibility={pushed ? "no-hide-descendants" : "auto"} style={{ flex: 1 }}>
          <SheetFrame>
            <SheetPage footer={footer} hideHeader={hideHeader} onClose={onClose} title={title} top={top}>
              {children}
            </SheetPage>
          </SheetFrame>
        </View>
        <PushedPage page={pushed} />
      </View>
    </Modal>
  );
}

// Keeps a sheet page clear of the home indicator and moves its footer up with the keyboard.
function SheetFrame({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** The inside of a sheet (header, scrolling body, optional footer) without the Modal around it. */
export function SheetPage({
  title,
  onClose,
  onBack,
  children,
  footer,
  top,
  hideHeader,
}: {
  title: string;
  onClose: () => void;
  top?: ReactNode;
  hideHeader?: boolean; // see Sheet
  // With onBack, the header shows a back arrow instead of the X (for a page pushed inside a sheet).
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  visible?: boolean; // unused; lets callers swap Sheet and SheetPage with the same props
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {hideHeader ? null : (
      <View style={styles.sheetHeader}>
        {onBack ? (
          <View style={{ marginRight: 10 }}>
            <IconButton icon="chevronLeft" label="Back" onPress={onBack} />
          </View>
        ) : null}
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>{title}</Text>
        {onBack ? null : <IconButton icon="close" label="Close" onPress={onClose} />}
      </View>
      )}
      {top ? <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>{top}</View> : null}
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
    </View>
  );
}

/**
 * Slides `page` in from the right over the sheet when it's set, and back out when it goes back to null,
 * like going one screen deeper in an iPhone app. It keeps showing the last page while sliding out.
 */
function PushedPage({ page }: { page: ReactNode | null }) {
  const width = Dimensions.get("window").width;
  const offset = useRef(new Animated.Value(width)).current;
  const [shown, setShown] = useState<ReactNode | null>(page);

  useEffect(() => {
    if (page) {
      setShown(page);
      Animated.timing(offset, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(offset, { toValue: width, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
  }, [page, offset, width]);

  if (!shown) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: offset }], shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12 }]}>
      <SheetFrame>{page ?? shown}</SheetFrame>
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8, textTransform: "uppercase", color: "#47828a", marginBottom: 6 },
  title: { fontSize: 30, fontWeight: "700", letterSpacing: -1, color: colors.text },
  description: { fontSize: 14, color: "#71808f", marginTop: 6, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadow },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.3, textTransform: "uppercase", color: "#7e8a95", marginBottom: 8 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
  },
  buttonText: { fontSize: 14, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.body,
    backgroundColor: colors.white,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  dropdown: { flexDirection: "row", alignItems: "center", gap: 8 },
  dropdownList: { marginTop: 6, borderWidth: 1, borderColor: colors.input, borderRadius: radius.md, backgroundColor: colors.white, overflow: "hidden" },
  dropdownOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  chip: { borderRadius: 10, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.subtle },
  segmented: { flexDirection: "row", backgroundColor: colors.track, borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9 },
  segmentText: { fontSize: 13, fontWeight: "700", color: "#7c8996" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#ccd6dc", borderRadius: radius.lg, backgroundColor: colors.white, padding: 28 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf1",
  },
  sheetFooter: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  // A footer under a tab screen's scrolling content (white, with a soft shadow so the list slides under it).
  pinnedBar: { backgroundColor: colors.white, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
});
