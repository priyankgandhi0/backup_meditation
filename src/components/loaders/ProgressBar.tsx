import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { hp, wp } from "../../helper/Responsive";
import { colors } from "@/src/utils/colors";
import { ProgressBarProps } from "@/src/interface/Types";

const ProgressBar = ({ progress }: ProgressBarProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(progress.value, [0, 1], [5, 100])}%`,
    };
  });

  return (
    <View style={style.mainView}>
      <Animated.View style={[style.progessBar, animatedStyle]} />
    </View>
  );
};

export default ProgressBar;

const style = StyleSheet.create({
  mainView: {
    height: hp(0.5),
    width: wp(25),
    backgroundColor: colors.gray,
    marginTop: hp(2),
    borderRadius: 50,
    marginBottom: hp(2),
    overflow: "hidden",
  },
  progessBar: {
    height: hp(0.5),
    backgroundColor: colors.dark_gray_3,
    borderRadius: 10,
  },
});
