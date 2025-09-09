import { hp } from "@/src/helper/Responsive";
import React, { useEffect } from "react"; // Added useEffect
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  useDerivedValue,
  useAnimatedProps,
  useSharedValue, // Added
  withTiming, // Added
  Easing, // Added
} from "react-native-reanimated";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle as SvgCircle,
  Line,
  ClipPath,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { colors as appColors } from "@/src/utils/colors";

const { width, height } = Dimensions.get("window");
const BALL_SIZE = hp(4);
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);

// Circle sizing
const MAIN_DIAMETER_FACTOR_IPAD = 0.33;
const MAIN_DIAMETER_FACTOR_PHONE = 0.44;
const GLOW_EFFECT_FACTOR = 1.44;
const MAIN_CIRCLE_DIAMETER =
  width * (isiPAD ? MAIN_DIAMETER_FACTOR_IPAD : MAIN_DIAMETER_FACTOR_PHONE);
const CANVAS_DIAMETER = MAIN_CIRCLE_DIAMETER * GLOW_EFFECT_FACTOR;
const MAIN_CIRCLE_RADIUS = MAIN_CIRCLE_DIAMETER / 2;

const OUTER_RING_STROKE_WIDTH = 6;
const OUTER_RING_RADIUS = MAIN_CIRCLE_RADIUS + 30;

// Colors
const GOLD_PRIMARY = appColors.yellow || "#FFD700";
const GOLD_SECONDARY = "#E6B800";
const GOLD_TERTIARY = "#B8860B";
const PURPLE_PRIMARY = appColors.dark_mauve_3 || "#695786";
const PURPLE_SECONDARY = "#8A7CA8";
const PURPLE_TERTIARY = "#A68CC8";
const WHITE_ISH = appColors.white_1 || "#f1f1f1";
const BLUE_TERTIARY = "#4A90E2";
const BLUE_SECONDARY = "#6FB1F5";
const BLUE_PRIMARY = "#A0CFFF";

// Angle constants for path calculations (radians)
const ANGLE_12 = -Math.PI / 2; // 12 o'clock
const ANGLE_6_ACW = (-3 * Math.PI) / 2; // 6 o'clock (after 180 deg anti-clockwise from 12)
const ANGLE_12_ACW_FULL = (-5 * Math.PI) / 2; // 12 o'clock (after 360 deg anti-clockwise from 12)
const ANGLE_6_CW = Math.PI / 2; // 6 o'clock (after 180 deg clockwise from 12)
const ANGLE_12_FROM_6_LEFT = (3 * Math.PI) / 2; // 12 o'clock (path from 6 o'clock up left side)

const GLOW_RING_FACTORS = [1.02, 1.05];
const GLOW_RADII = GLOW_RING_FACTORS.map((factor) => ({
  r: OUTER_RING_RADIUS * factor,
  color: PURPLE_SECONDARY,
  opacity: 0.15,
}));

const TICK_LENGTH = 9;
const TICK_THICKNESS = 6;
const TICK_COLOR = BLUE_SECONDARY;
const TICK_OPACITY = 0.96;
const TICK_OUTER_RADIUS = OUTER_RING_RADIUS + OUTER_RING_STROKE_WIDTH / 2;
const TICK_INNER_RADIUS = OUTER_RING_RADIUS - OUTER_RING_STROKE_WIDTH / 2;
const TICK_MARGIN = -3;
const TICK_R1 = TICK_INNER_RADIUS - TICK_LENGTH - TICK_MARGIN;
const TICK_R2 = TICK_OUTER_RADIUS + TICK_MARGIN;

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleRad: number
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

interface BreathAlternateNostrilCircleProps {
  phase: string;
  count?: number;
  isRunning: boolean;
  animationProgress: SharedValue<number>;
  inhaleLeftDuration: number;
  hold1Duration: number;
  exhaleRightDuration: number;
  inhaleRightDuration: number;
  hold2Duration: number;
  exhaleLeftDuration: number;
}

const BreathAlternateNostrilCircle: React.FC<
  BreathAlternateNostrilCircleProps
> = ({
  phase,
  isRunning,
  animationProgress,
  inhaleLeftDuration,
  hold1Duration,
  exhaleRightDuration,
  inhaleRightDuration,
  hold2Duration,
  exhaleLeftDuration,
}) => {
  const animatedScale = useSharedValue(NEUTRAL_SCALE);

  // Calculate totalCycleDuration from props
  const totalCycleDuration = React.useMemo(() => {
    return (
      inhaleLeftDuration +
      hold1Duration +
      exhaleRightDuration +
      inhaleRightDuration +
      hold2Duration +
      exhaleLeftDuration
    );
  }, [
    inhaleLeftDuration,
    hold1Duration,
    exhaleRightDuration,
    inhaleRightDuration,
    hold2Duration,
    exhaleLeftDuration,
  ]);

  const phaseStartAngles = React.useMemo(() => {
    const angles = [];
    // P1: Inhale Left Start
    angles.push(ANGLE_12);

    // P2: Hold 1 Start
    const s1Dur = inhaleLeftDuration + hold1Duration;
    const progressAtHold1Start = s1Dur === 0 ? 0 : inhaleLeftDuration / s1Dur;
    angles.push(ANGLE_12 + (ANGLE_6_ACW - ANGLE_12) * progressAtHold1Start);

    // P3: Exhale Right Start (End of Hold 1 / Segment 1)
    angles.push(ANGLE_6_ACW);

    // P4: Inhale Right Start (End of Exhale Right / Segment 2)
    angles.push(ANGLE_12_ACW_FULL); // Effectively ANGLE_12

    // P5: Hold 2 Start
    const s3Dur = inhaleRightDuration + hold2Duration;
    const progressAtHold2Start = s3Dur === 0 ? 0 : inhaleRightDuration / s3Dur;
    angles.push(ANGLE_12 + (ANGLE_6_CW - ANGLE_12) * progressAtHold2Start);

    // P6: Exhale Left Start (End of Hold 2 / Segment 3)
    angles.push(ANGLE_6_CW);

    return angles;
  }, [
    inhaleLeftDuration,
    hold1Duration,
    exhaleRightDuration,
    inhaleRightDuration,
    hold2Duration,
    // ANGLE_12, ANGLE_6_ACW, ANGLE_6_CW, ANGLE_12_ACW_FULL are constants, no need to list
  ]);

  const marks = [0, 1, 2, 3, 4, 5]; // For iterating 6 tick marks

  useEffect(() => {
    if (!isRunning) {
      animatedScale.value = withTiming(NEUTRAL_SCALE, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      return;
    }

    switch (phase) {
      case "Inhale Left":
        animatedScale.value = withTiming(INHALE_TARGET_SCALE, {
          duration: inhaleLeftDuration * 1000,
          easing: Easing.inOut(Easing.quad),
        });
        break;
      case "Hold 1":
        animatedScale.value = withTiming(INHALE_TARGET_SCALE, {
          duration: 50, // Quick snap or maintain
          easing: Easing.linear,
        });
        break;
      case "Exhale Right":
        animatedScale.value = withTiming(EXHALE_TARGET_SCALE, {
          duration: exhaleRightDuration * 1000,
          easing: Easing.inOut(Easing.quad),
        });
        break;
      case "Inhale Right":
        animatedScale.value = withTiming(INHALE_TARGET_SCALE, {
          duration: inhaleRightDuration * 1000,
          easing: Easing.inOut(Easing.quad),
        });
        break;
      case "Hold 2": // Corresponds to HOLD_3_DURATION from screen, passed as hold2Duration prop
        animatedScale.value = withTiming(INHALE_TARGET_SCALE, {
          duration: 50, // Quick snap or maintain
          easing: Easing.linear,
        });
        break;
      case "Exhale Left":
        animatedScale.value = withTiming(EXHALE_TARGET_SCALE, {
          duration: exhaleLeftDuration * 1000,
          easing: Easing.inOut(Easing.quad),
        });
        break;
      case "Ready":
      case "Complete":
        animatedScale.value = withTiming(NEUTRAL_SCALE, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        break;
      default:
        // Optional: handle any other phases or do nothing
        break;
    }
  }, [
    phase,
    isRunning,
    inhaleLeftDuration,
    hold1Duration,
    exhaleRightDuration,
    inhaleRightDuration,
    hold2Duration,
    exhaleLeftDuration,
    // animatedScale is not needed in deps here as we are setting its .value
  ]);

  const internalCirclePulsingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: animatedScale.value }],
    };
  });

  // Compute time within current 32s cycle
  const timeWithinCycle = useDerivedValue(() => {
    if (!isRunning || totalCycleDuration === 0) return 0;
    const overallSec = animationProgress.value * totalCycleDuration;
    return overallSec % totalCycleDuration;
  });

  // Ball animation: Follows 4 phases with durations defined by props.
  // Phase 1 (Inhale Left + Hold): 12->6 (ACW left: -PI/2 to -3PI/2).
  // Phase 2 (Exhale Right): 6->12 (ACW right/back: -3PI/2 to -5PI/2), completes full CCW loop.
  // Phase 3 (Inhale Right + Hold): 12->6 (CW right: -PI/2 to PI/2). Duration set by inhaleRightDuration + hold2Duration.
  // Phase 4 (Exhale Left): 6->12 (Path: left side, ACW motion PI/2 to 3PI/2. Combined with seg 3, achieves full CW angular displacement).
  const internalBallAnimatedStyle = useAnimatedStyle(() => {
    if (totalCycleDuration === 0) return { opacity: 0 };

    const t = timeWithinCycle.value;

    // Define segment durations based on props
    const s1Dur = inhaleLeftDuration + hold1Duration;
    const s2Dur = exhaleRightDuration;
    const s3Dur = inhaleRightDuration + hold2Duration; // Inhale Right (6s, clockwise) + Hold (2s, clockwise) = 8s: From 12 o'clock down right to 6 o'clock
    const s4Dur = exhaleLeftDuration;

    // Define segment end times (cumulative durations)
    const s1End = s1Dur;
    const s2End = s1End + s2Dur;
    const s3End = s2End + s3Dur;
    // s4End is totalCycleDuration, implicitly handled by the final else block

    let angle;

    if (t < s1End) {
      const progressInSegment = s1Dur === 0 ? 0 : t / s1Dur;
      angle = interpolate(progressInSegment, [0, 1], [ANGLE_12, ANGLE_6_ACW]);
    } else if (t < s2End) {
      const progressInSegment = s2Dur === 0 ? 0 : (t - s1End) / s2Dur;
      angle = interpolate(
        progressInSegment,
        [0, 1],
        [ANGLE_6_ACW, ANGLE_12_ACW_FULL]
      );
    } else if (t < s3End) {
      const progressInSegment = s3Dur === 0 ? 0 : (t - s2End) / s3Dur;
      angle = interpolate(progressInSegment, [0, 1], [ANGLE_12, ANGLE_6_CW]);
    } else {
      // Segment 4: covers up to totalCycleDuration
      const progressInSegment = s4Dur === 0 ? 0 : (t - s3End) / s4Dur;
      angle = interpolate(
        progressInSegment,
        [0, 1],
        [ANGLE_6_CW, ANGLE_12_FROM_6_LEFT]
      );
    }

    const r = OUTER_RING_RADIUS - 16;
    const cx = CANVAS_DIAMETER / 2;
    const cy = CANVAS_DIAMETER / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    return {
      transform: [{ translateX: x - cx }, { translateY: y - cy }],
      opacity: 0.95,
    };
  });

  const ballColor = useDerivedValue(() => {
    if (!isRunning && phase !== "Complete") return BLUE_TERTIARY;
    return BLUE_TERTIARY;
  });

  const animatedBallProps = useAnimatedProps(() => {
    return {
      fill: ballColor.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerWrapper}>
        <View style={styles.outerContainer}>
          <Svg
            width={CANVAS_DIAMETER}
            height={CANVAS_DIAMETER}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <RadialGradient
                id="outerRingGradient"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor={BLUE_PRIMARY} stopOpacity="1" />
                <Stop offset="70%" stopColor={BLUE_SECONDARY} stopOpacity="1" />
                <Stop offset="100%" stopColor={BLUE_TERTIARY} stopOpacity="1" />
              </RadialGradient>
              <RadialGradient
                id="ballHighlight"
                cx="34%"
                cy="29%"
                rx="18%"
                ry="18%"
              >
                <Stop offset="0%" stopColor={WHITE_ISH} stopOpacity="0.9" />
                <Stop offset="100%" stopColor={WHITE_ISH} stopOpacity="0" />
              </RadialGradient>
              <ClipPath id="clip-left-inner">
                <Rect
                  x="0"
                  y="0"
                  width={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                  height={MAIN_CIRCLE_DIAMETER * 1.2}
                />
              </ClipPath>
              <ClipPath id="clip-right-inner">
                <Rect
                  x={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                  y="0"
                  width={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                  height={MAIN_CIRCLE_DIAMETER * 1.2}
                />
              </ClipPath>
              <RadialGradient
                id="innerOuterGlow"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                <Stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
              </RadialGradient>
              <RadialGradient
                id="innerHighlight"
                cx="40%"
                cy="35%"
                rx="30%"
                ry="30%"
              >
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                <Stop offset="30%" stopColor="#ffffff" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </RadialGradient>
            </Defs>

            {/* Outer glow rings */}
            {GLOW_RADII.map((g, idx) => (
              <SvgCircle
                key={`outer-glow-${idx}`}
                cx={CANVAS_DIAMETER / 2}
                cy={CANVAS_DIAMETER / 2}
                r={g.r}
                fill="none"
                stroke={g.color}
                strokeWidth="1"
                opacity={g.opacity}
              />
            ))}

            {/* Main outer ring */}
            <SvgCircle
              cx={CANVAS_DIAMETER / 2}
              cy={CANVAS_DIAMETER / 2}
              r={OUTER_RING_RADIUS}
              fill="none"
              stroke="url(#outerRingGradient)"
              strokeWidth={OUTER_RING_STROKE_WIDTH}
              opacity={0.9}
            />

            {/* Tick marks at phase boundaries */}
            {marks.map((_, idx) => {
              const angle = phaseStartAngles[idx];
              if (typeof angle !== "number" || isNaN(angle)) return null;

              // Hide Hold 1 demarkation (idx === 1) during Exhale Right and Exhale Left
              if (
                idx === 1 &&
                ["Exhale Right", "Exhale Left"].includes(phase)
              ) {
                return null;
              }
              // Hide Hold 2 demarkation (idx === 4) during Exhale Right and Exhale Left
              if (
                idx === 4 &&
                ["Exhale Right", "Exhale Left"].includes(phase)
              ) {
                return null;
              }
              // Hide both Hold demarkation lines (idx === 1 and idx === 4) before start
              if (!isRunning && (idx === 1 || idx === 4)) {
                return null;
              }
              // After start: Show Hold 1 demarkation (idx === 1) only during Inhale Left or Hold 1
              if (
                isRunning &&
                idx === 1 &&
                !["Inhale Left", "Hold 1"].includes(phase)
              ) {
                return null;
              }
              // After start: Show Hold 2 demarkation (idx === 4) only during Inhale Right or Hold 2
              if (
                isRunning &&
                idx === 4 &&
                !["Inhale Right", "Hold 2"].includes(phase)
              ) {
                return null;
              }

              const centerX = CANVAS_DIAMETER / 2;
              const centerY = CANVAS_DIAMETER / 2;
              const p1 = polarToCartesian(centerX, centerY, TICK_R1, angle);
              const p2 = polarToCartesian(centerX, centerY, TICK_R2, angle);
              return (
                <Line
                  key={`tick-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={TICK_COLOR}
                  strokeWidth={TICK_THICKNESS}
                  strokeLinecap="round"
                  opacity={TICK_OPACITY}
                />
              );
            })}
          </Svg>

          {/* Inner circle halves + highlight */}
          <Animated.View
            style={[styles.innerCircleContainer, internalCirclePulsingStyle]}
          >
            <Svg
              width={MAIN_CIRCLE_DIAMETER * 1.2}
              height={MAIN_CIRCLE_DIAMETER * 1.2}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                {/** ClipPaths to split the circle left/right **/}
                <ClipPath id="clip-left-inner">
                  <Rect
                    x="0"
                    y="0"
                    width={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                    height={MAIN_CIRCLE_DIAMETER * 1.2}
                  />
                </ClipPath>
                <ClipPath id="clip-right-inner">
                  <Rect
                    x={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                    y="0"
                    width={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                    height={MAIN_CIRCLE_DIAMETER * 1.2}
                  />
                </ClipPath>

                {/** 1) Soft outer glow behind everything **/}
                <RadialGradient
                  id="innerOuterGlow"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                  <Stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
                </RadialGradient>

                {/** 2) Glassy highlight on upper‐left quadrant **/}
                <RadialGradient
                  id="innerHighlight"
                  cx="40%"
                  cy="35%"
                  rx="30%"
                  ry="30%"
                  fx="40%"
                  fy="35%"
                >
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                  <Stop offset="30%" stopColor="#ffffff" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </RadialGradient>
              </Defs>

              {/** Base halves: left = blue (#b8d8d7), right = yellow (#eee0a6) **/}
              <SvgCircle
                cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                r={MAIN_CIRCLE_RADIUS * 0.85}
                fill="#b8d8d7"
                clipPath="url(#clip-left-inner)"
                opacity={1}
              />
              <SvgCircle
                cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                r={MAIN_CIRCLE_RADIUS * 0.85}
                fill="#eee0a6"
                clipPath="url(#clip-right-inner)"
                opacity={1}
              />

              {/** Outer glow overlay (makes edges pop) **/}
              <SvgCircle
                cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                r={MAIN_CIRCLE_RADIUS * 0.85}
                fill="url(#innerOuterGlow)"
                opacity={1}
              />

              {/** Glassy highlight overlay **/}
              <SvgCircle
                cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
                r={MAIN_CIRCLE_RADIUS * 0.85}
                fill="url(#innerHighlight)"
                opacity={1}
              />

              {/**
               * 3) Add "L" on left‐blue half and "R" on right‐yellow half
               *    positioned roughly at center‐height (Y), and 25%/75% width (X).
               **/}
              <SvgText
                x={MAIN_CIRCLE_DIAMETER * 1.2 * 0.25}
                y={(MAIN_CIRCLE_DIAMETER * 1.2) / 2 + MAIN_CIRCLE_RADIUS * 0.1}
                fill="#ffffff"
                fontSize={MAIN_CIRCLE_DIAMETER * 0.15}
                fontWeight="bold"
                textAnchor="middle"
              >
                L
              </SvgText>

              <SvgText
                x={MAIN_CIRCLE_DIAMETER * 1.2 * 0.75}
                y={(MAIN_CIRCLE_DIAMETER * 1.2) / 2 + MAIN_CIRCLE_RADIUS * 0.1}
                fill="#ffffff"
                fontSize={MAIN_CIRCLE_DIAMETER * 0.15}
                fontWeight="bold"
                textAnchor="middle"
              >
                R
              </SvgText>
            </Svg>
          </Animated.View>

          {/* The moving "ball" with enhanced styling */}
          <Animated.View style={[styles.ball, internalBallAnimatedStyle]}>
            <Svg width={BALL_SIZE} height={BALL_SIZE}>
              <Defs>
                {/* Blue glow gradient for the main ball */}
                <RadialGradient
                  id="ballBlueGlow"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                  fx="35%"
                  fy="30%"
                >
                  <Stop offset="0%" stopColor="#E6F3FF" stopOpacity="1" />
                  <Stop
                    offset="30%"
                    stopColor={BLUE_PRIMARY}
                    stopOpacity="0.9"
                  />
                  <Stop
                    offset="70%"
                    stopColor={BLUE_SECONDARY}
                    stopOpacity="0.8"
                  />
                  <Stop
                    offset="100%"
                    stopColor={BLUE_TERTIARY}
                    stopOpacity="0.9"
                  />
                </RadialGradient>

                {/* White highlight gradient for the inner highlight */}
                <RadialGradient
                  id="ballHighlight"
                  cx="50%"
                  cy="50%"
                  rx="60%"
                  ry="60%"
                  fx="30%"
                  fy="25%"
                >
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <Stop offset="40%" stopColor="#ffffff" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* Main ball circle with blue glow */}
              <SvgCircle
                cx={BALL_SIZE / 2}
                cy={BALL_SIZE / 2}
                r={BALL_SIZE / 2 - 1}
                fill="url(#ballBlueGlow)"
              />

              {/* Soft white highlight circle for reflective surface effect */}
              <SvgCircle
                cx={BALL_SIZE / 2 - BALL_SIZE * 0.1}
                cy={BALL_SIZE / 2 - BALL_SIZE * 0.15}
                r={BALL_SIZE * 0.25}
                fill="url(#ballHighlight)"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>

      {/* Phase text below the circle */}
      <Text
        style={[
          styles.phaseText,
          {
            color:
              !isRunning && phase === "Ready"
                ? "transparent"
                : appColors.primary,
          },
        ]}
      >
        {!isRunning && phase === "Ready"
          ? "Inhale Left" // Invisible placeholder text
          : isRunning && phase !== "Complete"
          ? phase === "Hold 1" || phase === "Hold 2"
            ? "Hold"
            : // Removed Hold 3 and Hold 4 as they are not actual phases in this context
              phase // Display the actual phase name
          : ""}{" "}
        {/* Empty string for other states like "Complete" or if not running and not Ready */}
      </Text>
    </View>
  );
};

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

// Define scale constants
const NEUTRAL_SCALE = 1.0;
const INHALE_TARGET_SCALE = 1.1; // Expanded scale
const EXHALE_TARGET_SCALE = 0.9; // Contracted scale

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerWrapper: { justifyContent: "center", alignItems: "center" },
  outerContainer: {
    width: CANVAS_DIAMETER,
    height: CANVAS_DIAMETER,
    borderRadius: CANVAS_DIAMETER / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  innerCircleContainer: {
    width: MAIN_CIRCLE_DIAMETER * 1.2,
    height: MAIN_CIRCLE_DIAMETER * 1.2,
    borderRadius: (MAIN_CIRCLE_DIAMETER * 1.2) / 2,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  // laserBeamContainer: {
  //   position: "absolute",
  //   width: OUTER_RING_RADIUS - 16,
  //   height: 6,
  //   alignItems: "flex-start",
  //   justifyContent: "center",
  //   zIndex: 1,
  // },
  // laserBeam: { position: "absolute" },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    position: "absolute",
    shadowColor: PURPLE_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  phaseText: {
    fontSize: isiPAD ? 32 : 22,
    opacity: 0.95,
    letterSpacing: 1,
    fontFamily: "Quattrocento",
    textAlign: "center",
    marginTop: hp(3),
    fontWeight: "bold",
  },
});

export default BreathAlternateNostrilCircle;
