import React, { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  WithTimingConfig,
} from "react-native-reanimated";
import {
  Svg,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Current progress value (0–100). */
  progress: number;
  /** Size of the circular progress in pixels. Default = 80. */
  size?: number;
  /** Stroke width for both outer and progress circles. Default = 5% of size. */
  strokeWidth?: number;
  /** Whether to show the numeric label in the center. Default = true. */
  showLabel?: boolean;
  /** Outer circle (track) color. */
  outerCircleColor?: string;
  /** Fallback color if no gradient is provided. */
  progressCircleColor?: string;
  /** Color of the text label. */
  labelColor?: string;
  /** Additional text styles for the label. */
  labelStyle?: StyleProp<TextStyle>;
  /** Font size for the label. Default = 30% of size. */
  labelSize?: number;
  /** Optional config for the `withTiming` animation (e.g. { duration: 500 }). */
  animationConfig?: WithTimingConfig;
  /** If you want a gradient stroke, specify start and end colors. */
  progressGradientFrom?: string;
  progressGradientTo?: string;
}

function CircularProgress(props: CircularProgressProps) {
  const {
    size = 80,
    strokeWidth = (5 * size) / 100,
    progress = 0,
    showLabel = true,
    labelSize = (36 * size) / 100,
    animationConfig,
    outerCircleColor = "white",
    progressCircleColor = "dodgerblue",
    labelColor = "white",
    labelStyle,
    progressGradientFrom,
    progressGradientTo,
  } = props;

  // Format progress to whole number
  const formatProgress = (value: number) => {
    return Math.round(value);
  };

  // Calculate circle dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Local state for label text
  const [labelValue, setLabelValue] = useState(0);

  // Derived progress value
  const derivedProgressValue = useDerivedValue(() => {
    // Clamp progress to [0, 100]
    const clamped = Math.max(0, Math.min(progress, 100));

    if (showLabel) {
      runOnJS(setLabelValue)(clamped);
    }
    return withTiming(clamped, animationConfig);
  }, [progress, showLabel]);

  // Animated props for the circle
  const circleAnimatedProps = useAnimatedProps(() => {
    // Interpolate from 0→100 progress to 100→0 strokeDashoffset
    const svgProgress = interpolate(
      derivedProgressValue.value,
      [0, 100],
      [100, 0],
      Extrapolate.CLAMP
    );
    return {
      strokeDashoffset: (circumference * svgProgress) / 100,
    };
  });

  // Label container style
  const labelViewContainerStyle: StyleProp<ViewStyle> = [
    styles.labelView,
    { width: size, height: size },
  ];

  // Label text style
  const labelTextStyles: StyleProp<TextStyle> = [
    { color: labelColor, fontSize: labelSize },
    labelStyle,
  ];

  // Decide if we're using a gradient stroke or a solid color
  const strokeToUse =
    progressGradientFrom && progressGradientTo
      ? "url(#progressGradient)"
      : progressCircleColor;

  return (
    <Svg width={size} height={size}>
      {/* Gradient Definition (only used if progressGradientFrom & progressGradientTo are provided) */}
      {progressGradientFrom && progressGradientTo && (
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={progressGradientFrom} />
            <Stop offset="100%" stopColor={progressGradientTo} />
          </SvgLinearGradient>
        </Defs>
      )}

      {/* Outer circle (track) */}
      <Circle
        stroke={outerCircleColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />

      {/* Progress circle (Animated) */}
      <AnimatedCircle
        stroke={strokeToUse}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        strokeWidth={strokeWidth}
        animatedProps={circleAnimatedProps}
      />

      {/* Center label */}
      {showLabel && (
        <View style={labelViewContainerStyle}>
          <Animated.Text style={labelTextStyles}>{`${formatProgress(
            labelValue
          )}%`}</Animated.Text>
        </View>
      )}
    </Svg>
  );
}

export default CircularProgress;

const styles = StyleSheet.create({
  labelView: {
    position: "absolute",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
