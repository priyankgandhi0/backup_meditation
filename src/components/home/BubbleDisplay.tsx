import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { hp, wp } from "@/src/helper/Responsive";
import { FontPath } from "@/src/utils/FontPath";

interface BubbleDisplayProps {
  handleBubblePress: () => void;
  showHint: boolean;
}

const BubbleDisplay = ({ handleBubblePress, showHint }: BubbleDisplayProps) => {
  const bubbleOpacity = useSharedValue(0.5);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    bubbleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );

    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500 }),
        withTiming(5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.floatingBubble, bubbleAnimatedStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleBubblePress}
        >
          <View style={styles.thoughtBubbleContainer}>
            <Svg width="100%" height="100%" viewBox="0 0 300 200">
              <Defs>
                {/* Small bubble gradient + glow */}
                <RadialGradient
                  id="smallBubbleGradient"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                  <Stop offset="40%" stopColor="#FFD700" stopOpacity="0.3" />
                  <Stop offset="90%" stopColor="#FFB700" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#4b7f9b" stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id="innerGlowSmall" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>

                {/* Medium bubble gradient + glow */}
                <RadialGradient
                  id="mediumBubbleGradient"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                  <Stop offset="40%" stopColor="#FFD700" stopOpacity="0.6" />
                  <Stop offset="90%" stopColor="#FFB700" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#4b7f9b" stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id="innerGlowMedium" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>

                {/* Large bubble (ellipse) gradient + glow */}
                <RadialGradient
                  id="largeBubbleGradient"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="40%" stopColor="#FFD700" stopOpacity="1" />
                  <Stop offset="90%" stopColor="#FFB700" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor="#4b7f9b" stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id="innerGlowLarge" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
              </Defs>

              {/* Small bubble (left) */}
              <Circle
                cx="20"
                cy="120"
                r="15"
                fill="url(#smallBubbleGradient)"
                stroke="#FFD700"
                strokeWidth={1}
              />
              {/* Small bubble inner glow */}
              <Circle cx="20" cy="120" r="10" fill="url(#innerGlowSmall)" />

              {/* Medium bubble (middle) */}
              <Circle
                cx="65"
                cy="110"
                r="21"
                fill="url(#mediumBubbleGradient)"
                stroke="#FFD700"
                strokeWidth={1.5}
              />
              {/* Medium bubble inner glow */}
              <Circle cx="65" cy="110" r="16" fill="url(#innerGlowMedium)" />

              {/* Large ellipse (right) */}
              <Ellipse
                cx="150"
                cy="90"
                rx="54"
                ry="47"
                fill="url(#largeBubbleGradient)"
                stroke="#FFD700"
                strokeWidth={2}
              />
              {/* Large ellipse inner glow */}
              <Circle cx="150" cy="90" r="40" fill="url(#innerGlowLarge)" />
            </Svg>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {showHint && (
        <View style={styles.hintContainer}>
          <View style={styles.hintArrow} />
          <Text style={styles.hintText}>Tap Here!</Text>
        </View>
      )}
    </View>
  );
};

export default BubbleDisplay;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: hp(-3),
    right: wp(-6),
    width: wp(45),
    alignItems: "center",
    zIndex: 999,
  },
  floatingBubble: {
    width: wp(45),
    height: wp(45),
    shadowColor: "#607B8B",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 18,
  },
  thoughtBubbleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#eef4f7",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 18,
  },
  hintContainer: {
    marginTop: hp(-7),
    alignItems: "center",
  },
  hintText: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 13,
    fontFamily: FontPath.QuattrocentoRegular,
    overflow: "hidden",
  },
  hintArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(0,0,0,0.5)",
    marginTop: -1,
  },
});
