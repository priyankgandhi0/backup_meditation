import { hp } from "@/src/helper/Responsive";
import React from "react";
import { View, StyleSheet, Dimensions, Platform, Text } from "react-native";
import Animated, { SharedValue, useAnimatedStyle, interpolate, interpolateColor } from "react-native-reanimated";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle as SvgCircle,
  Line,
} from "react-native-svg";
import { colors } from "@/src/utils/colors";

const { width, height } = Dimensions.get("window");
const BALL_SIZE = hp(4);
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);

const MAIN_DIAMETER_FACTOR_IPAD = 0.33;
const MAIN_DIAMETER_FACTOR_PHONE = 0.44;
const GLOW_EFFECT_FACTOR = 1.44;

const MAIN_CIRCLE_DIAMETER = width * (isiPAD ? MAIN_DIAMETER_FACTOR_IPAD : MAIN_DIAMETER_FACTOR_PHONE);
const CANVAS_DIAMETER = MAIN_CIRCLE_DIAMETER * GLOW_EFFECT_FACTOR;
const MAIN_CIRCLE_RADIUS = MAIN_CIRCLE_DIAMETER / 2;

const OUTER_RING_STROKE_WIDTH = 6;
const OUTER_RING_RADIUS = MAIN_CIRCLE_RADIUS + 30;

const GLOW_RING_FACTORS = [1.02, 1.05];
const GLOW_RADII = GLOW_RING_FACTORS.map(factor => ({
  r: OUTER_RING_RADIUS * factor,
  color: "#E6B800",
  opacity: 0.15,
}));

const TICK_LENGTH = 9;
const TICK_THICKNESS = 6;
const TICK_COLOR = "#B8860B";
const TICK_OPACITY = 0.96;
const TICK_OUTER_RADIUS = OUTER_RING_RADIUS + (OUTER_RING_STROKE_WIDTH / 2);
const TICK_INNER_RADIUS = OUTER_RING_RADIUS - (OUTER_RING_STROKE_WIDTH / 2);
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

interface BreathBellyCircleProps { 
  phase?: string;
  count?: number;
  isRunning: boolean;
  animationProgress: SharedValue<number>;
  inhaleBellyDuration: number; 
  inhaleChestDuration: number; 
  holdDuration: number;
  exhaleDuration: number;
}

const BreathBellyCircle: React.FC<BreathBellyCircleProps> = ({ 
  phase = "Hold",
  count = 7,
  isRunning,
  animationProgress,
  inhaleBellyDuration, 
  inhaleChestDuration, 
  holdDuration,
  exhaleDuration,
}) => {
  const totalCycleDuration = inhaleBellyDuration + inhaleChestDuration + holdDuration + exhaleDuration; 

  const marks = [
    { time: 0 }, 
    { time: inhaleBellyDuration }, 
    { time: inhaleBellyDuration + inhaleChestDuration }, 
    { time: inhaleBellyDuration + inhaleChestDuration + holdDuration }, 
  ];

  const internalCirclePulsingStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const timeInCycle = progressInCycle * totalCycleDuration;
    const scale = interpolate(
      timeInCycle,
      [
        0, 
        inhaleBellyDuration, 
        inhaleBellyDuration + inhaleChestDuration, 
        inhaleBellyDuration + inhaleChestDuration + holdDuration, 
        totalCycleDuration, 
      ],
      [0.9, 1.05, 1.2, 1.2, 0.9], 
      'clamp'
    );
    return {
      transform: [{ scale }],
    };
  });

  const internalBallAnimatedStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const angle = interpolate(progressInCycle, [0, 1], [0, 2 * Math.PI]);
    
    const ballPositionRadius = OUTER_RING_RADIUS - 16;
    
    const translateX = Math.cos(angle - Math.PI / 2) * ballPositionRadius;
    const translateY = Math.sin(angle - Math.PI / 2) * ballPositionRadius;

    return {
      transform: [{ translateX }, { translateY }],
      opacity: 0.95, 
    };
  });

  // Animated laser beam that follows the ball
  // const laserBeamAnimatedStyle = useAnimatedStyle(() => {
  //   const progressInCycle = (animationProgress.value % 1);
  //   const angle = interpolate(progressInCycle, [0, 1], [0, 2 * Math.PI]);
  //   const rotationDegrees = ((angle - Math.PI / 2) * 180) / Math.PI;
    
  //   return {
  //     transform: [{ rotate: `${rotationDegrees}deg` }],
  //   };
  // });

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
              <Stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
              <Stop offset="70%" stopColor="#B8860B" stopOpacity="1" />
              <Stop offset="100%" stopColor="#8B7355" stopOpacity="1" />
            </RadialGradient>
            
            {/* <LinearGradient
              id="laserBeamGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop offset="0%" stopColor="#F4D03F" stopOpacity="0.3" />
              <Stop offset="30%" stopColor="#E6B800" stopOpacity="0.25" />
              <Stop offset="70%" stopColor="#D4AF37" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#B8860B" stopOpacity="0.05" />
            </LinearGradient> */}
          </Defs>

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

          <SvgCircle
            cx={CANVAS_DIAMETER / 2}
            cy={CANVAS_DIAMETER / 2}
            r={OUTER_RING_RADIUS}
            fill="none"
            stroke="url(#outerRingGradient)"
            strokeWidth={OUTER_RING_STROKE_WIDTH}
            opacity={0.9}
          />

          {marks.map((mark, idx) => {
            const angle = (mark.time / totalCycleDuration) * 2 * Math.PI - Math.PI / 2;
            const centerX = CANVAS_DIAMETER / 2;
            const centerY = CANVAS_DIAMETER / 2;
            const p1 = polarToCartesian(
              centerX,
              centerY,
              TICK_R1,
              angle
            );
            const p2 = polarToCartesian(
              centerX,
              centerY,
              TICK_R2,
              angle
            );
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

        {/* Subtle laser beam that follows the ball */}
        {/* <Animated.View style={[styles.laserBeamContainer, laserBeamAnimatedStyle]}>
          <Svg
            width={OUTER_RING_RADIUS - 16}
            height={6}
            style={styles.laserBeam}
          >
            <Defs>
              <LinearGradient
                id="subtleLaser"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor="#F4D03F" stopOpacity="0.1" />
                <Stop offset="40%" stopColor="#E6B800" stopOpacity="0.3" />
                <Stop offset="80%" stopColor="#D4AF37" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#B8860B" stopOpacity="0.08" />
              </LinearGradient>
            </Defs>
            <Line
              x1="0"
              y1="3"
              x2={OUTER_RING_RADIUS - 16}
              y2="3"
              stroke="url(#subtleLaser)"
              strokeWidth="292"
              opacity={0.9}
            />
          </Svg>
        </Animated.View> */}

        <Animated.View style={[styles.innerCircleContainer, internalCirclePulsingStyle]}>
          <Svg
            width={MAIN_CIRCLE_DIAMETER * 1.2}
            height={MAIN_CIRCLE_DIAMETER * 1.2}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
            <RadialGradient
              id="breathGlow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="35%"
              fy="35%"
            >
              <Stop offset="0%" stopColor="#FFF8DC" stopOpacity="1" />     
              <Stop offset="30%" stopColor="#F4D03F" stopOpacity="0.95" /> 
              <Stop offset="60%" stopColor="#E6B800" stopOpacity="0.92" /> 
              <Stop offset="85%" stopColor="#D4AF37" stopOpacity="0.90" /> 
              <Stop offset="100%" stopColor="#B8860B" stopOpacity="0.88" />
            </RadialGradient>
            </Defs>
            <SvgCircle
              cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              r={MAIN_CIRCLE_RADIUS * 0.85}
              fill="url(#breathGlow)"
              opacity={0.95}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.ball, internalBallAnimatedStyle]}>
          <Svg width={BALL_SIZE} height={BALL_SIZE}>
            <Defs>
              <RadialGradient id="goldenBall" cx="38%" cy="26%" rx="62%" ry="62%">
                <Stop offset="0%" stopColor="#FFFACD" stopOpacity="1" />
                <Stop offset="22%" stopColor="#F4D03F" stopOpacity="1" />
                <Stop offset="50%" stopColor="#E6B800" stopOpacity="1" />
                <Stop offset="78%" stopColor="#D4AF37" stopOpacity="1" />
                <Stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
              </RadialGradient>
              <RadialGradient id="ballHighlight" cx="34%" cy="29%" rx="18%" ry="18%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <SvgCircle cx={BALL_SIZE / 2} cy={BALL_SIZE / 2} r={(BALL_SIZE / 2) - 1} fill="url(#goldenBall)" />
            <SvgCircle cx={BALL_SIZE * 0.38} cy={BALL_SIZE * 0.32} r={BALL_SIZE * 0.13} fill="url(#ballHighlight)" />
          </Svg>
        </Animated.View>
        {/* <View style={styles.centerContent}>
          {isRunning ? (
            <Text style={styles.countText}>{count}</Text>
          ) : (
            <Text style={styles.readyText}></Text> 
          )}
        </View> */}
      </View>
    </View>
    {/* Re-introduce phase text rendering, styled like BreathBoxCircle's phase text */}
    <Text style={[
      styles.phaseText,
      { color: (!isRunning && phase === "Ready") ? "transparent" : colors.primary } // Or another appropriate color from your theme
    ]}>
      {(!isRunning && phase === "Ready")
        ? "placeholder" // Placeholder to maintain space, will be transparent
        : (isRunning && phase !== "Complete")
          ? getInstructionText(phase) // Use the helper from the screen or define one here
          : ""}
    </Text>
  </View>
  );
};

// Add getInstructionText helper if not already present or imported, 
// or ensure it's consistent with the one in BreathBellyScreen
function getInstructionText(phase: string) {
  switch (phase) {
    case "Inhale Belly":
      return "breathe in belly";
    case "Inhale Chest":
      return "breathe in chest";
    case "Hold":
      return "hold";
    case "Exhale":
      return "breathe out";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  laserBeamContainer: {
    position: "absolute",
    width: OUTER_RING_RADIUS - 16,
    height: 6,
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 1,
  },
  laserBeam: {
    position: "absolute",
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    position: "absolute",
    shadowColor: "rgba(212, 175, 55, 0.6)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  centerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    fontSize: isiPAD ? 38 : 26,
    color: colors.black_900,
    opacity: 0.95,
    letterSpacing: 1,
    fontFamily: "Quattrocento",
    textAlign: 'center',
    marginTop: hp(3),
  },
  countText: {
    fontSize: isiPAD ? 64 : 42,
    color: "#2C1810",
    opacity: 0.84,
    fontFamily: "Quattrocento",
    letterSpacing: 2,
    textShadowColor: "#E6B800",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  readyText: { 
    fontSize: isiPAD ? 45 : 32,
    color: "#2C1810",
    opacity: 0.97,
    letterSpacing: 1,
    textShadowColor: "#F4D03F",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontFamily: "Quattrocento",
  },
});

export default BreathBellyCircle;