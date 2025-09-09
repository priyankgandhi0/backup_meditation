import { hp } from "@/src/helper/Responsive";
import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, { SharedValue, useAnimatedStyle, interpolate } from "react-native-reanimated";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle as SvgCircle,
  Line,
} from "react-native-svg";

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

// Updated Color Theme: Exact match to attached image
const THEME_COLORS = {
  turquoiseStart: '#5DD3D0',   // Turquoise left side of gradient
  turquoiseMid: '#7BD6C5',     // Mid turquoise
  amberMid: '#E6C078',         // Mid amber transition
  amberEnd: '#F5B041',         // Golden amber right side
  ballTurquoise: '#5DD3D0',    // Ball color
  outerRing: '#2C3E50',        // Dark gray outer ring
  textPrimary: '#00695C',      // Darker turquoise for text
  textSecondary: '#E65100',    // Darker amber for text
  glowRing: '#5DD3D0',         // Turquoise for glow
  tick: '#F5B041',            // Amber for ticks
};

const GLOW_RADII = [1.02, 1.05].map(factor => ({
  r: OUTER_RING_RADIUS * factor,
  color: THEME_COLORS.glowRing, 
  opacity: 0.15,
}));

const TICK_LENGTH = 9;
const TICK_THICKNESS = 6;
const TICK_COLOR = THEME_COLORS.tick;
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

interface BreathBoxCircleProps { 
  phase?: string;
  count?: number;
  isRunning: boolean;
  animationProgress: SharedValue<number>;
  inhaleDuration: number;
  hold1Duration: number;
  exhaleDuration: number;
  hold2Duration: number;
}

const BreathBoxCircle: React.FC<BreathBoxCircleProps> = ({ 
  phase = "Hold",
  count = 4,
  isRunning,
  animationProgress,
  inhaleDuration,
  hold1Duration,
  exhaleDuration,
  hold2Duration,
}) => {
  const totalCycleDuration = inhaleDuration + hold1Duration + exhaleDuration + hold2Duration; 

  // Marks for 4 phases of Box Breathing
  const marks = [
    { time: 0 }, // Start of Inhale
    { time: inhaleDuration }, // Start of Hold 1
    { time: inhaleDuration + hold1Duration }, // Start of Exhale
    { time: inhaleDuration + hold1Duration + exhaleDuration }, // Start of Hold 2
  ];

  const internalCirclePulsingStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const timeInCycle = progressInCycle * totalCycleDuration;
    const scale = interpolate(
      timeInCycle,
      [
        0,
        inhaleDuration,
        inhaleDuration + hold1Duration,
        inhaleDuration + hold1Duration + exhaleDuration,
        totalCycleDuration,
      ],
      [0.9, 1.15, 1.15, 0.9, 0.9],
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

  const laserBeamAnimatedStyle = useAnimatedStyle(() => {
    const progressInCycle = (animationProgress.value % 1);
    const angle = interpolate(progressInCycle, [0, 1], [0, 2 * Math.PI]);
    const rotationDegrees = ((angle - Math.PI / 2) * 180) / Math.PI;
    
    return {
      transform: [{ rotate: `${rotationDegrees}deg` }],
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
            {/* Outer Ring - Dark gray like in image */}
            <RadialGradient
              id="outerRingGradient"
              cx="50%" cy="50%" rx="50%" ry="50%"
            >
              <Stop offset="0%" stopColor={THEME_COLORS.outerRing} stopOpacity="1" />
              <Stop offset="100%" stopColor={THEME_COLORS.outerRing} stopOpacity="0.8" />
            </RadialGradient>
            
            {/* Laser Beam - Subtle amber */}
            <LinearGradient
              id="laserBeamGradient"
              x1="0%" y1="0%" x2="100%" y2="0%"
            >
              <Stop offset="0%" stopColor={THEME_COLORS.amberEnd} stopOpacity="0.2" />
              <Stop offset="50%" stopColor={THEME_COLORS.amberMid} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={THEME_COLORS.amberEnd} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Glow rings */}
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

          {/* Outer Ring */}
          <SvgCircle
            cx={CANVAS_DIAMETER / 2}
            cy={CANVAS_DIAMETER / 2}
            r={OUTER_RING_RADIUS}
            fill="none"
            stroke="url(#outerRingGradient)"
            strokeWidth={OUTER_RING_STROKE_WIDTH}
            opacity={0.7}
          />

          {/* Tick marks */}
          {marks.map((mark, idx) => {
            const angle = (mark.time / totalCycleDuration) * 2 * Math.PI - Math.PI / 2;
            const centerX = CANVAS_DIAMETER / 2;
            const centerY = CANVAS_DIAMETER / 2;
            const p1 = polarToCartesian(centerX, centerY, TICK_R1, angle);
            const p2 = polarToCartesian(centerX, centerY, TICK_R2, angle);
            return (
              <Line
                key={`tick-${idx}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={TICK_COLOR}
                strokeWidth={TICK_THICKNESS}
                strokeLinecap="round"
                opacity={TICK_OPACITY}
              />
            );
          })}
        </Svg>

        {/* Laser beam */}
        <Animated.View style={[styles.laserBeamContainer, laserBeamAnimatedStyle]}>
          <Svg
            width={OUTER_RING_RADIUS - 16}
            height={6}
            style={styles.laserBeam}
          >
            <Defs>
              <LinearGradient
                id="subtleLaser"
                x1="0%" y1="0%" x2="100%" y2="0%"
              >
                <Stop offset="0%" stopColor={THEME_COLORS.amberEnd} stopOpacity="0.08" />
                <Stop offset="50%" stopColor={THEME_COLORS.amberMid} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={THEME_COLORS.amberEnd} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>
            <Line
              x1="0" y1="3" x2={OUTER_RING_RADIUS - 16} y2="3"
              stroke="url(#subtleLaser)"
              strokeWidth="6"
              opacity={0.8}
            />
          </Svg>
        </Animated.View>

        {/* Main pulsing circle with turquoise-to-amber gradient */}
        <Animated.View style={[styles.innerCircleContainer, internalCirclePulsingStyle]}>
          <Svg
            width={MAIN_CIRCLE_DIAMETER * 1.2}
            height={MAIN_CIRCLE_DIAMETER * 1.2}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
            {/* Linear gradient from left (turquoise) to right (amber) - exact replica of image */}
            <LinearGradient
              id="breathGlow"
              x1="0%" y1="50%" x2="100%" y2="50%"
            >
              <Stop offset="0%" stopColor={THEME_COLORS.turquoiseStart} stopOpacity="1" />     
              <Stop offset="25%" stopColor={THEME_COLORS.turquoiseMid} stopOpacity="1" /> 
              <Stop offset="60%" stopColor={THEME_COLORS.turquoiseMid} stopOpacity="1" /> 
              <Stop offset="100%" stopColor={THEME_COLORS.amberEnd} stopOpacity="1" />
            </LinearGradient>
            {/* Subtle highlight effect */}
            <RadialGradient
              id="circleHighlight"
              cx="35%" cy="30%" rx="40%" ry="40%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            </Defs>
            {/* Main circle with linear gradient */}
            <SvgCircle
              cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              r={MAIN_CIRCLE_RADIUS * 0.85}
              fill="url(#breathGlow)"
              opacity={1}
            />
            {/* Highlight overlay */}
            <SvgCircle
              cx={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              cy={(MAIN_CIRCLE_DIAMETER * 1.2) / 2}
              r={MAIN_CIRCLE_RADIUS * 0.85}
              fill="url(#circleHighlight)"
              opacity={1}
            />
          </Svg>
        </Animated.View>

        {/* Ball with turquoise color matching the image */}
        <Animated.View style={[styles.ball, internalBallAnimatedStyle]}>
          <Svg width={BALL_SIZE} height={BALL_SIZE}>
            <Defs>
              <RadialGradient id="turquoiseBall" cx="40%" cy="30%" rx="70%" ry="70%"> 
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="30%" stopColor={THEME_COLORS.turquoiseMid} stopOpacity="1" />
                <Stop offset="100%" stopColor={THEME_COLORS.turquoiseStart} stopOpacity="0.9" />
              </RadialGradient>
              <RadialGradient id="ballHighlight" cx="35%" cy="25%" rx="20%" ry="20%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <SvgCircle cx={BALL_SIZE / 2} cy={BALL_SIZE / 2} r={(BALL_SIZE / 2) - 1} fill="url(#turquoiseBall)" />
            <SvgCircle cx={BALL_SIZE * 0.35} cy={BALL_SIZE * 0.25} r={BALL_SIZE * 0.15} fill="url(#ballHighlight)" />
          </Svg>
        </Animated.View>
        
        {/* Center content */}
        {/* <View style={styles.centerContent}>
          {isRunning ? (
            <Text style={styles.countText}>{count}</Text>
          ) : (
            <Text style={styles.readyText}></Text> 
          )}
        </View> */}
      </View>
    </View>
    {/* Phase text below the circle */}
    <Text style={[
      styles.phaseText,
      { color: (!isRunning && phase === "Ready") ? "transparent" : styles.phaseText.color }
    ]}>
      {(!isRunning && phase === "Ready")
        ? "inhale" // Invisible placeholder text
        : (isRunning && phase !== "Complete")
          ? (phase === "Inhale"
            ? "breathe in"
            : phase === "Hold" 
            ? "hold"
            : phase === "Exhale"
            ? "breathe out"
            : phase) // Fallback to the phase name if it's an unexpected running phase
          : ""} {/* Empty string for other states like "Complete" or if not running and not Ready */}
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
    shadowColor: THEME_COLORS.ballTurquoise,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  centerContent: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    fontSize: isiPAD ? 38 : 26,
    color: THEME_COLORS.textPrimary,
    opacity: 0.95,
    letterSpacing: 1,
    fontFamily: "Quattrocento",
    textAlign: 'center',
    marginTop: hp(3),
  },
  countText: {
    fontSize: isiPAD ? 64 : 42,
    color: THEME_COLORS.textSecondary,
    opacity: 0.84,
    fontFamily: "Quattrocento",
    letterSpacing: 2,
    textShadowColor: THEME_COLORS.amberMid, // Was amberLight
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  readyText: { 
    fontSize: isiPAD ? 45 : 32,
    color: THEME_COLORS.textPrimary,
    opacity: 0.97,
    letterSpacing: 1,
    textShadowColor: THEME_COLORS.turquoiseStart, // Was turquoiseLight
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontFamily: "Quattrocento",
  },
});

export default BreathBoxCircle;