import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import {
  NavigationProp,
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import BackButton from "../../components/BackButton";
import ThemeText from "../../components/shared/theme-text";
import ThemeTextTitle from "../../components/shared/theme-title";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import FastImage from "react-native-fast-image";
import CircularProgress from "@/src/components/CircularProgress";

import { ImagePath } from "@/src/utils/ImagePath";
import { colors, pastelColors } from "@/src/utils/colors";
import { hp, wp } from "@/src/helper/Responsive";
import { FontPath } from "@/src/utils/FontPath";

import { RootStackParamList } from "../../navigation/NavigationType";
import { useAppDispatch, useAppSelector } from "@/src/redux/StateType";
import { useGetCourses } from "@/src/api/query/CouresService";
import { coureseActions } from "@/src/redux/slice/CoureseSlice";
import { Course } from "@/src/interface/Types";
import { FlashList } from "@shopify/flash-list";
import { trackScreenView } from "@/src/utils/analytics";

// Detect if device is a tablet
const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const CourseListHomeScreen = () => {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "CourseDetail">>();
  const routes =
    useRoute<RouteProp<RootStackParamList, "CourseListHomeScreen">>();
  const isFoused = useIsFocused();

  const { userData } = useAppSelector((state) => state.auth);
  const { courese } = useAppSelector((state) => state.courese);
  const getCourses = useGetCourses();
  const dispatch = useAppDispatch();

  useEffect(() => {
    trackScreenView("CourseListHome", "CourseListHomeScreen");
    if (isFoused) {
      handlGetCourses();
    }
  }, [isFoused]);

  const handlGetCourses = async () => {
    try {
      const res = await getCourses.mutateAsync({
        email: userData?.user?.email || "",
      });
      if (courese.length > 0) {
        const updatedCourses = courese.map((courseItem: any) => {
          const updatedCourse = res?.courses.find(
            (item: { _id: any; progress: number }) =>
              item._id === courseItem._id && item.progress !== 0
          );
          return updatedCourse
            ? { ...courseItem, progress: updatedCourse.progress }
            : courseItem;
        });
        dispatch(coureseActions.setCoures(updatedCourses));
      } else {
        dispatch(coureseActions.setCoures(res?.courses));
      }
    } catch (error) {
      console.log("handlGetCourses==>", error);
    }
  };

  // Navigate to Subscription or Login if locked
  const handleUpgradeNow = (navigation: any, isAuthenticated: boolean) => {
    navigation.navigate("BottomTabNavigator", {
      screen: "Home",
      params: {
        screen: isAuthenticated ? "Subscription" : "Login",
      },
    });
  };

  // Navigate to Course Detail if unlocked
  const handleDetailCoursePress = (course: Course) => {
    dispatch(coureseActions.setCouresSection([]));
    navigation.navigate("CourseDetail", { course });
  };

  // Renders each course tile
  const renderCourse = ({ item, index }: { item: Course; index: number }) => {
    const isLocked = userData?.token && item.hasAccess === false;
    const isUnlocked = userData?.token && item.hasAccess === true;

    return (
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: pastelColors[index % pastelColors?.length] },
        ]}
        key={item._id}
        entering={FadeIn.delay(index * 100)}
        exiting={FadeOut}
      >
        {/* 
          TOP-RIGHT CORNER: 
          - If user is logged in: Show lock icon (locked) OR circular progress (unlocked)
          - Both are inside a circle container with the same color & size for consistency
        */}
        {userData?.token && (
          <View style={styles.iconContainer}>
            {isLocked ? (
              <View style={styles.circleContainer}>
                <Ionicons
                  name="lock-closed"
                  size={isTablet ? 33 : 21}
                  color={colors.white}
                />
              </View>
            ) : isUnlocked ? (
              <View style={styles.circleContainer}>
                <CircularProgress
                  progress={Math.round(item?.progress) || 0}
                  size={isTablet ? wp(9.5) : wp(10.5)}
                  // Make stroke smaller on phones
                  strokeWidth={isTablet ? 6 : 3}
                  progressCircleColor={colors.white}
                  outerCircleColor={"rgba(255,255,255,0.3)"}
                  labelColor={colors.white}
                  // Condition for smaller label on phones
                  labelSize={isTablet ? 24 : 15}
                  showLabel={true}
                />
              </View>
            ) : null}
          </View>
        )}

        {/* Left side image */}
        <FastImage source={{ uri: item.image }} style={styles.cardImage} />

        {/* Right side content */}
        <View style={styles.cardContent}>
          <ThemeTextTitle style={styles.cardTitle}>{item.title}</ThemeTextTitle>
          <ThemeText style={styles.cardSubtitle}>
            {item.type} • {item.days}
          </ThemeText>
          <ThemeText style={styles.cardTime}>{item.time}</ThemeText>

          {item.description ? (
            <ThemeText style={styles.cardDescription}>
              {item.description}
            </ThemeText>
          ) : null}

          {/* 
            Unified styling for both locked & unlocked states:
            - Same gradient background
            - Same text style
            - Centered in the card
          */}
          <View style={styles.buttonContainer}>
            {userData?.token ? (
              item.hasAccess ? (
                <LinearGradient
                  colors={["transparent", colors.dark_pink]}
                  style={styles.upgradeButtonContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleDetailCoursePress(item)}
                  >
                    <Text style={styles.upgradeButtonText}>Access Now</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={["transparent", colors.dark_pink]}
                  style={styles.upgradeButtonContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      { backgroundColor: colors.dark_gray },
                    ]}
                    onPress={() =>
                      handleUpgradeNow(navigation, userData?.token != "")
                    }
                  >
                    <Text style={styles.upgradeButtonText}>
                      Premium Members Only
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              )
            ) : (
              <LinearGradient
                colors={["transparent", colors.dark_pink]}
                style={styles.upgradeButtonContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleUpgradeNow(navigation, false)}
                >
                  <Text style={styles.upgradeButtonText}>Login to Access</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* ---- SEMI-TRANSPARENT OVERLAY for locked tiles ---- */}
        {isLocked && <Pressable style={styles.lockedOverlay} onPress={() =>
                      handleUpgradeNow(navigation, userData?.token != "")
                    } />}
      </Animated.View>
    );
  };

  // Header
  const renderHeader = () => (
    <ImageBackground source={ImagePath.CourseListScreen} style={styles.header}>
      {routes.params?.isBack && (
        <BackButton buttonStyle={{ alignSelf: "flex-start" }} />
      )}
      <View style={styles.courseInfoOverlay}>
        <ThemeTextTitle style={styles.courseTitle}>
          Courses Designed To Help You Grow
        </ThemeTextTitle>
      </View>
    </ImageBackground>
  );

  // Footer floating button
  const renderFooter = () => (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => navigation.navigate("VideoAskScreen")}
    >
      <Ionicons
        name="megaphone"
        size={isTablet ? 36 : 28}
        color={colors.white}
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      {renderHeader()}
      <>
        <FlashList
          data={courese}
          renderItem={renderCourse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          estimatedItemSize={200}
          scrollEventThrottle={16}
        />
      </>
      {renderFooter()}
    </ScrollView>
  );
};

export default CourseListHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    width: wp(100),
    height: hp(isTablet ? 50 : 35),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  courseInfoOverlay: {
    position: "absolute",
    bottom: 0,
    backgroundColor: colors.black_900,
    width: wp(100),
    height: hp(5),
    justifyContent: "center",
    alignItems: "center",
  },
  courseTitle: {
    color: colors.white,
    textAlign: "center",
  },
  listContainer: {
    paddingTop: hp(2),
  },
  card: {
    borderRadius: 10,
    marginBottom: hp(1),
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
    position: "relative",
    width: wp(95),
    marginHorizontal: "auto",
    borderWidth: 1,
    borderColor: colors.gray,
  },
  iconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  circleContainer: {
    width: isTablet ? wp(10) : wp(10.8),
    height: isTablet ? wp(10) : wp(10.8),
    borderRadius: wp(10),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: wp(30),
    height: wp(38),
    borderRadius: 10,
    marginHorizontal: wp(2),
    resizeMode: "cover",
    marginVertical: "auto",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center", // center the text vertically
    paddingVertical: wp(2), // Keep vertical padding
    paddingLeft: wp(2), // Keep left padding
    paddingRight: wp(12), // Add right padding to avoid overlap with icon
  },
  cardTitle: {
    fontSize: isTablet ? 27 : 14,
    color: colors.black,
    textTransform: "capitalize",
    textAlign: "left",
    marginBottom: hp(0.5),
  },
  cardSubtitle: {
    fontSize: isTablet ? 21 : 14,
    color: colors.dark_gray_1,
    marginBottom: hp(0.3),
    textAlign: "left",
  },
  cardTime: {
    fontSize: isTablet ? 16 : 12,
    color: colors.dark_gray_1,
    textAlign: "left",
  },
  cardDescription: {
    fontSize: isTablet ? 18 : 14,
    color: colors.dark_gray_1,
    marginVertical: hp(1),
    textAlign: "left",
  },
  buttonContainer: {
    marginTop: hp(2),
    alignItems: "left",
    justifyContent: "center",
  },
  upgradeButtonContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  upgradeButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    borderRadius: 10,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: isTablet ? 21 : 14,
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    top: hp(3),
    right: wp(5),
    width: wp(15),
    height: wp(15),
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    zIndex: 1,
  },
});
