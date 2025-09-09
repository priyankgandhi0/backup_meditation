import { hp } from "@/src/helper/Responsive";
import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, { AnimateStyle, SharedValue, useAnimatedStyle, interpolate, interpolateColor } from "react-native-reanimated";
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

// New dynamic sizing based on screen width and device type
const MAIN_DIAMETER_FACTOR_IPAD = 0.33;
const MAIN_DIAMETER_FACTOR_PHONE = 0.44;
const GLOW_EFFECT_FACTOR = 1.44; // Factor to determine canvas size relative to main circle

const MAIN_CIRCLE_DIAMETER = width * (isiPAD ? MAIN_DIAMETER_FACTOR_IPAD : MAIN_DIAMETER_FACTOR_PHONE);
const CANVAS_DIAMETER = MAIN_CIRCLE_DIAMETER * GLOW_EFFECT_FACTOR;
const MAIN_CIRCLE_RADIUS = MAIN_CIRCLE_DIAMETER / 2;

// Updated outer ring properties - now just a stroke/circumference
const OUTER_RING_STROKE_WIDTH = 6; // Thickness of the ring stroke
const OUTER_RING_RADIUS = MAIN_CIRCLE_RADIUS + 30; // Position of the ring center line

// Subtle glow rings around the outer ring (optional)
const GLOW_RING_FACTORS = [1.02, 1.05]; // Smaller, more subtle glow
const GLOW_RADII = GLOW_RING_FACTORS.map(factor => ({
  r: OUTER_RING_RADIUS * factor,
  color: "#FFFFFF", // White glow
  opacity: 0.15,    // Very subtle opacity
}));

const TICK_LENGTH = 9;
const TICK_THICKNESS = 6;
const TICK_COLOR = colors.gray_3; // White color for ticks
const TICK_OPACITY = 0.96;
// OUTER_RADIUS for ticks is the radius of the ring where ticks are positioned
const TICK_OUTER_RADIUS = OUTER_RING_RADIUS + (OUTER_RING_STROKE_WIDTH / 2); // Ticks are on the outer edge of the ring
const TICK_INNER_RADIUS = OUTER_RING_RADIUS - (OUTER_RING_STROKE_WIDTH / 2); // Inner edge of the ring
const TICK_MARGIN = -3; // Margin from the ring edge
const TICK_R1 = TICK_INNER_RADIUS - TICK_LENGTH - TICK_MARGIN;
const TICK_R2 = TICK_OUTER_RADIUS + TICK_MARGIN;

const totalDuration = 19;
const marks = [{ time: 0 }, { time: 4 }, { time: 11 }];

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

interface ModernBreathworkCircleProps {
  phase?: string;
  count?: number;
  onStart?: () => void;
  isRunning: boolean;
  animationProgress: SharedValue<number>;
  inhaleDuration: number;
  holdDuration: number;
  exhaleDuration: number;
}

// Helper function to get instruction text based on phase
function getInstructionText(phase: string) {
  switch (phase) {
    case "Inhale":
      return "breathe in";
    case "Hold":
      return "hold";
    case "Exhale":
      return "breathe out";
    default:
      return ""; // Or some default text if needed
  }
}

const ModernBreathworkCircle: React.FC<ModernBreathworkCircleProps> = ({
  phase = "Hold",
  count = 7,
  isRunning,
  animationProgress,
  inhaleDuration,
  holdDuration,
  exhaleDuration,
}: ModernBreathworkCircleProps) => {
  const totalCycleDuration = inhaleDuration + holdDuration + exhaleDuration;

  // Internal animated style for the circle's pulsing effect
  const internalCirclePulsingStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const timeInCycle = progressInCycle * totalCycleDuration;
    const scale = interpolate(
      timeInCycle,
      [0, inhaleDuration, inhaleDuration + holdDuration, totalCycleDuration],
      [0.9, 1.2, 1.2, 0.9],
      'clamp'
    );
    return {
      transform: [{ scale }],
    };
  });

  // Updated ball animated style - now follows the outer ring
  const internalBallAnimatedStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const angle = interpolate(progressInCycle, [0, 1], [0, 2 * Math.PI]);
    
    // Ball now follows the outer ring circumference
    // Use OUTER_RING_RADIUS for the ball's orbital path
    const ballPositionRadius = OUTER_RING_RADIUS - 16;
    
    const translateX = Math.cos(angle - Math.PI / 2) * ballPositionRadius;
    const translateY = Math.sin(angle - Math.PI / 2) * ballPositionRadius;
    
    const timeInCycle = progressInCycle * totalCycleDuration;
    const ballBgColor = interpolateColor(
      timeInCycle,
      [0, inhaleDuration, inhaleDuration + holdDuration, totalCycleDuration],
      ["#00FFD0", "#E040FB", "#FF8000", "yellow"]
    );
    
    const shadowColor = interpolateColor(
      timeInCycle,
      [0, inhaleDuration, inhaleDuration + holdDuration, totalCycleDuration],
      [
        "rgba(255,255,255,0.5)",
        "rgba(255,255,0,0.8)",
        "rgba(255,215,0,0.8)",
        "rgba(255,255,255,0.5)",
      ]
    );

    return {
      transform: [{ translateX }, { translateY }],
      backgroundColor: ballBgColor,
      shadowColor: shadowColor,
      opacity: 0.85, 
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
      {/* Fixed outer container - does NOT animate */}
      <View style={styles.outerContainer}>
        {/* Fixed SVG layer for outer ring and glow effects */}
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
              <Stop offset="0%" stopColor="#59859C" stopOpacity="1" />
              <Stop offset="70%" stopColor="#59859C" stopOpacity="1" />
              <Stop offset="100%" stopColor="#53b9e5" stopOpacity="1" />
            </RadialGradient>
            
            {/* <LinearGradient
              id="laserBeamGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.3" />
              <Stop offset="30%" stopColor="#90CAF9" stopOpacity="0.25" />
              <Stop offset="70%" stopColor="#42A5F5" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#1E88E5" stopOpacity="0.05" />
            </LinearGradient> */}
          </Defs>

          {/* Subtle outer glow rings */}
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

          {/* Fixed outer ring - NOW JUST A STROKE/CIRCUMFERENCE */}
          <SvgCircle
            cx={CANVAS_DIAMETER / 2}
            cy={CANVAS_DIAMETER / 2}
            r={OUTER_RING_RADIUS}
            fill="none"
            stroke="url(#outerRingGradient)"
            strokeWidth={OUTER_RING_STROKE_WIDTH}
            opacity={0.9}
          />

          {/* Fixed tick marks on the outer ring */}
          {marks.map((mark, idx) => {
            const angle =
              (mark.time / totalDuration) * 2 * Math.PI - Math.PI / 2;
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
    height={3}
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
        <Stop offset="0%" stopColor="#09A6F3" stopOpacity="0.1" />
        <Stop offset="40%" stopColor="#09A6F3" stopOpacity="0.3" />
        <Stop offset="80%" stopColor="#09A6F3" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#09A6F3" stopOpacity="0.08" />
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


        {/* Animated inner circle - this WILL animate with breathing */}
        <Animated.View style={[styles.innerCircleContainer, internalCirclePulsingStyle]}>
          <Svg
            width={MAIN_CIRCLE_DIAMETER * 1.2} // Slightly larger to accommodate scaling
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
              fx="35%"  // Slightly offset highlight for more natural look
              fy="35%"
            >
              <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="1" />     
              <Stop offset="30%" stopColor="#90CAF9" stopOpacity="0.95" /> 
              <Stop offset="60%" stopColor="#42A5F5" stopOpacity="0.92" /> 
              <Stop offset="85%" stopColor="#1E88E5" stopOpacity="0.90" /> 
              <Stop offset="100%" stopColor="#1565C0" stopOpacity="0.88" />
            </RadialGradient>
            </Defs>

            {/* Animated inner circle with breathing gradient */}
            <SvgCircle
              cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              r={MAIN_CIRCLE_RADIUS * 0.85} // Slightly smaller to fit within outer ring
              fill="url(#breathGlow)"
              opacity={0.95}
            />
          </Svg>
        </Animated.View>

        {/* Ball - animated to follow outer ring */}
        <Animated.View style={[styles.ball, internalBallAnimatedStyle]}>
  <Svg width={BALL_SIZE} height={BALL_SIZE}>
    <Defs>
      {/* Use the same gradient as the inner circle */}
      <RadialGradient
        id="ballBlueGlow"
        cx="50%"
        cy="50%"
        rx="50%"
        ry="50%"
        fx="35%"
        fy="35%"
      >
        <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="1" />
        <Stop offset="30%" stopColor="#90CAF9" stopOpacity="0.95" />
        <Stop offset="60%" stopColor="#42A5F5" stopOpacity="0.92" />
        <Stop offset="85%" stopColor="#1E88E5" stopOpacity="0.90" />
        <Stop offset="100%" stopColor="#1565C0" stopOpacity="0.88" />
      </RadialGradient>
      {/* (Optional) keep the highlight for a shiny look */}
      <RadialGradient
        id="ballHighlight"
        cx="34%"
        cy="29%"
        rx="18%"
        ry="18%"
      >
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    {/* Main blue ball */}
    <SvgCircle
      cx={BALL_SIZE / 2}
      cy={BALL_SIZE / 2}
      r={(BALL_SIZE / 2) - 1}
      fill="url(#ballBlueGlow)"
    />
    {/* Soft highlight (optional) */}
    <SvgCircle
      cx={BALL_SIZE * 0.38}
      cy={BALL_SIZE * 0.32}
      r={BALL_SIZE * 0.13}
      fill="url(#ballHighlight)"
    />
  </Svg>
</Animated.View>

        
        {/* Center text */}
        {/* <View style={styles.centerContent}>
          {isRunning ? (
            <Text style={styles.countText}>{count}</Text>
          ) : (
            <Text style={styles.readyText}></Text>
          )}
        </View> */}
      </View>
    </View>
    {/* Phase text below the circle, styled like BreathBoxCircle's phase text */}
    <Text style={[
        styles.phaseText,
        { color: (!isRunning && phase === "Ready") ? "transparent" : colors.primary } // Match color logic if needed
      ]}>
        {(!isRunning && phase === "Ready")
          ? "placeholder" // Placeholder to maintain space, will be transparent
          : (isRunning && phase !== "Complete")
            ? getInstructionText(phase)
            : ""}
      </Text>
  </View>
  );
};

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
  // laserBeamContainer: {
  //   position: "absolute",
  //   width: OUTER_RING_RADIUS - 16,
  //   height: 10,
  //   alignItems: "flex-start",
  //   justifyContent: "center",
  //   zIndex: 1,
  // },
  // laserBeam: {
  //   position: "absolute",
  // },
  circle: {
    width: CANVAS_DIAMETER,
    height: CANVAS_DIAMETER,
    borderRadius: CANVAS_DIAMETER / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: "#ffe600",
    position: "absolute",
    shadowColor: "#6bd5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 1,
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
    fontSize: isiPAD ? 38 : 26, // Match BreathBoxCircle
    // color: colors.primary, // Set dynamically as above or use a consistent color from your theme
    opacity: 0.95,
    letterSpacing: 1,
    fontFamily: "Quattrocento",
    textAlign: 'center',
    marginTop: hp(3), // Crucial for positioning like BreathBoxCircle
  },
  countText: {
    fontSize: isiPAD ? 64 : 42,
    color: "#fff",
    opacity: 0.84,
    fontFamily: "Quattrocento",
    letterSpacing: 2,
    textShadowColor: "#3ec5ff44",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6
  },
  readyText: {
    fontSize: isiPAD ? 45 : 32,
    color: "#fff",
    opacity: 0.97,
    letterSpacing: 1,
    textShadowColor: "#b3eaff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontFamily: "Quattrocento",
  },
});

export default ModernBreathworkCircle;