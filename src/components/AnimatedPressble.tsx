import { Dimensions, Pressable, StyleSheet } from "react-native";
import React, { Children } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { homeCardStyles } from "../styles/card-home.styles";
import { AnimatedPressbleProps } from "../interface/Types";

const AnimatedPressble = ({ children, onPress }: AnimatedPressbleProps) => {
  const { width } = Dimensions.get("window");
  const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
  const cardWidth = width * 0.47;

  const scale = useSharedValue(1);
  // Create animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.95, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={[
        homeCardStyles.cardContainer,
        { width: cardWidth },
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedTouchable>
  );
};

export default AnimatedPressble;

const styles = StyleSheet.create({});
