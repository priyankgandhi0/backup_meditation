import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, Dimensions, View, Text, StyleSheet } from "react-native";
import React from "react";
import FastImage from "react-native-fast-image";
import { useAudio } from "../../../context/AudioContext";
import ThemeText from "../../shared/theme-text";
import CircularProgress from "../../CircularProgress";
import { CardCourseHomeProps, Course } from "@/src/interface/Types";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { wp, hp, isTablet } from "../../../helper/Responsive";
import AnimatedPressble from "../../AnimatedPressble";
import { coureseActions } from "@/src/redux/slice/CoureseSlice";
import { useAppDispatch } from "@/src/redux/StateType";

const CardCourseHome = ({ item, isAuthenticated }: CardCourseHomeProps) => {
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const { stop } = useAudio();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const handleUpgradeNow = (
    navigation: any,
    isAuthenticated: boolean,
    course: Course
  ) => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
    } else if (item?.hasAccess) {
      dispatch(coureseActions.setCouresSection([]));
      navigation.navigate("CourseDetail", { course });
      stop();
    } else {
      navigation.navigate("Subscription");
    }
  };

  return (
    <AnimatedPressble
      onPress={() => handleUpgradeNow(navigation, isAuthenticated, item)}
    >
      {/* Left side image */}
      <FastImage
        source={{ uri: item.image, priority: FastImage.priority.normal }}
        style={homeCardStyles.image}
      />

      {/* Title container (bottom overlay) */}
      <View style={homeCardStyles.titleContainer}>
        <ThemeText
          style={homeCardStyles.titleTextCard}
          size={isTablet ? 15 : 13}
          numberOfLines={2}
          color="white"
        >
          {item.title}
        </ThemeText>
      </View>

      {/* ---- TOP-RIGHT CORNER: Lock or Circular Progress inside a circle container ---- */}
      {item.hasAccess ? (
        <View style={styles.circleContainer}>
          <CircularProgress
            progress={Math.round(item?.progress) || 0}
            size={isTablet ? wp(9.5) : wp(10.5)} // circle diameter
            strokeWidth={isTablet ? 6 : 4} // ring thickness
            progressCircleColor={colors.white} // ring color
            outerCircleColor={"rgba(255,255,255,0.3)"}
            labelColor={colors.white}
            labelSize={isTablet ? 24 : 12} // bigger label on tablet, smaller on phone
            showLabel={true}
          />
        </View>
      ) : (
        <View style={styles.circleContainer}>
          <Ionicons
            name="lock-closed"
            size={isTablet ? 30 : 18} // bigger lock on tablet, smaller on phone
            color={colors.white}
          />
        </View>
      )}
    </AnimatedPressble>
  );
};

export default CardCourseHome;

/* You can keep your existing homeCardStyles 
   and add or modify styles for the circle container. 
   Example: 
*/
const styles = StyleSheet.create({
  circleContainer: {
    position: "absolute",
    top: hp(1),
    right: hp(1),
    width: isTablet ? wp(10) : wp(10.8),
    height: isTablet ? wp(10) : wp(10.8),
    borderRadius: isTablet ? wp(6) : wp(10),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
