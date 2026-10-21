import { useRef, useState } from "react";
import { PanResponder, Pressable, Text, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { newId, type ProgramElement, type RinkPlacement, type RinkPoint } from "../data";
import { colors, radius } from "../theme";
import { Button, Label } from "./ui";

const VB_W = 720;
const VB_H = 390;

type Props = {
  elements: ProgramElement[];
  paths: RinkPoint[][];
  placements: RinkPlacement[];
  onPathsChange: (paths: RinkPoint[][]) => void;
  onPlacementsChange: (placements: RinkPlacement[]) => void;
  /** Lets the parent stop page scrolling while a finger is drawing. */
  onDrawingChange: (drawing: boolean) => void;
};

function pathData(points: RinkPoint[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

/**
 * Draw the skating path with a finger. To place an element, tap its chip
 * below the rink, then tap the ice. Tap a placed marker to remove it.
 */
export function RinkMap(props: Props) {
  const [drawing, setDrawing] = useState<RinkPoint[]>([]);
  const [placing, setPlacing] = useState<string | null>(null);
  const rinkRef = useRef<View>(null);
  const originRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const drawingRef = useRef<RinkPoint[]>([]);
  const latest = useRef({ ...props, placing });
  latest.current = { ...props, placing };

  const toPoint = (pageX: number, pageY: number): RinkPoint | null => {
    const origin = originRef.current;
    if (!origin || origin.w === 0 || origin.h === 0) return null;
    return {
      x: Math.max(0, Math.min(VB_W, ((pageX - origin.x) / origin.w) * VB_W)),
      y: Math.max(0, Math.min(VB_H, ((pageY - origin.y) / origin.h) * VB_H)),
    };
  };

  const finish = () => {
    const points = drawingRef.current;
    const { paths, placements, placing: placingCode, onPathsChange, onPlacementsChange, onDrawingChange } = latest.current;
    drawingRef.current = [];
    setDrawing([]);
    onDrawingChange(false);
    if (!points.length) return;

    const first = points[0];
    const last = points[points.length - 1];
    const isTap = points.length < 4 && Math.hypot(last.x - first.x, last.y - first.y) < 12;

    if (isTap) {
      const hit = placements.find((placement) => Math.hypot(placement.x - first.x, placement.y - first.y) < 26);
      if (hit) {
        onPlacementsChange(placements.filter((placement) => placement.id !== hit.id));
      } else if (placingCode) {
        onPlacementsChange([...placements, { ...first, code: placingCode, id: newId() }]);
        setPlacing(null);
      }
      return;
    }
    onPathsChange([...paths, points]);
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        latest.current.onDrawingChange(true);
        rinkRef.current?.measureInWindow((x, y, w, h) => {
          originRef.current = { x, y, w, h };
          const point = toPoint(pageX, pageY);
          if (point) {
            drawingRef.current = [point];
            setDrawing([point]);
          }
        });
      },
      onPanResponderMove: (event: GestureResponderEvent) => {
        const point = toPoint(event.nativeEvent.pageX, event.nativeEvent.pageY);
        if (!point) return;
        const previous = drawingRef.current[drawingRef.current.length - 1];
        if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 4) return;
        drawingRef.current = [...drawingRef.current, point];
        setDrawing(drawingRef.current);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    }),
  ).current;

  const allPaths = drawing.length ? [...props.paths, drawing] : props.paths;

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Button label="Undo path" onPress={() => props.onPathsChange(props.paths.slice(0, -1))} style={{ flex: 1 }} variant="secondary" />
        <Button
          label="Clear rink"
          onPress={() => {
            props.onPathsChange([]);
            props.onPlacementsChange([]);
          }}
          style={{ flex: 1 }}
          variant="danger"
        />
      </View>

      <View
        ref={rinkRef}
        style={{
          aspectRatio: VB_W / VB_H,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: "#b9d4d8",
          backgroundColor: "#f4fafb",
          overflow: "hidden",
        }}
        {...responder.panHandlers}
      >
        <View pointerEvents="none" style={{ flex: 1 }}>
          <Svg height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%">
            <Path d={`M${VB_W / 2} 0 L${VB_W / 2} ${VB_H}`} stroke="#d4e5e7" strokeWidth={2} />
            <Circle cx={VB_W / 2} cy={VB_H / 2} fill="none" r={52} stroke="#d4e5e7" strokeWidth={2} />
            {allPaths.map((path, index) => (
              <Path d={pathData(path)} fill="none" key={index} stroke="#4f9298" strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} />
            ))}
            {props.placements.map((placement) => (
              <G key={placement.id}>
                <Circle cx={placement.x} cy={placement.y} fill={colors.navy} r={20} />
                <SvgText fill="#ffffff" fontSize={11} fontWeight="700" textAnchor="middle" x={placement.x} y={placement.y + 4}>
                  {placement.code}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      </View>

      <View style={{ marginTop: 14, backgroundColor: "#fafbfc", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 }}>
        <Label>Place components on the rink</Label>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 17 }}>
          {placing
            ? `Now tap the ice where ${placing} happens.`
            : "Draw the path with your finger. Tap a component, then tap the ice to place it. Tap a marker to remove it."}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {props.elements.length ? (
            props.elements.map((element, index) => {
              const active = placing === element.code;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={`${element.code}-${index}`}
                  onPress={() => setPlacing(active ? null : element.code)}
                  style={{
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: active ? colors.navy : "#dbe4e7",
                    backgroundColor: active ? colors.navy : colors.white,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: active ? colors.white : colors.tealDark }}>
                    {index + 1}. {element.code}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ fontSize: 12, color: colors.muted }}>Add components on the Component sheet first.</Text>
          )}
        </View>
      </View>
    </View>
  );
}
