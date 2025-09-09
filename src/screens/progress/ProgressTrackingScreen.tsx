import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  NavigationProp,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../utils/colors";
import { hp, wp } from "../../helper/Responsive";
import ThemeText from "../../components/shared/theme-text";
import ThemeTextTitle from "../../components/shared/theme-title";
import { useAppSelector } from "@/src/redux/StateType";
import { useGetCourses, useGetMyProgress } from "@/src/api/query/CouresService";
import { Course } from "@/src/interface/Types";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { useDispatch } from "react-redux";
import { progressActions } from "@/src/redux/slice/ProgressSlice";
import { coureseActions } from "@/src/redux/slice/CoureseSlice";
import { FocusAwareStatusBar } from "@/src/components/FocusAwareStatusBar";
import { trackScreenView } from "@/src/utils/analytics";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const ProgressTrackingScreen: React.FC = () => {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "CourseDetail">>();
  const { userData } = useAppSelector((state) => state.auth);
  const { progressStats, progressCourse } = useAppSelector(
    (state) => state.progress
  );
  const getCourses = useGetCourses();
  const isFoused = useIsFocused();
  const getMyProgress = useGetMyProgress();
  const dispatch = useDispatch();

  useEffect(() => {
    trackScreenView("MyProgress", "ProgressTrackingScreen");
    if (isFoused) {
      handlGetCourses();
      handleGetProgress();
    }
  }, [isFoused]);

  const handlGetCourses = async () => {
    try {
      const courses = await getCourses.mutateAsync({
        email: userData?.user?.email || "",
      });
      dispatch(progressActions.setProgressCourse(courses?.courses));
    } catch (error) {
      console.log("handlGetCourses==>", error);
    }
  };

  const handleGetProgress = async () => {
    try {
      const res = await getMyProgress.mutateAsync({
        token: userData?.token,
      });
      console.log("===>", res);
      dispatch(progressActions.setProgressStats(res));
    } catch (error) {
      console.log("handlGetCourses==>", error);
    }
  };

  const renderProgressBar = (percentage: number) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
    </View>
  );

  const renderCourseProgressSection = () => {
    const courseProgressMap = new Map(
      progressStats?.courseProgress?.map((progress: { courseId: any }) => [
        progress.courseId,
        progress,
      ]) || []
    );

    return (
      <View style={styles.coursesContainer}>
        <FocusAwareStatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <ThemeTextTitle style={styles.sectionTitle}>
          Course Progress
        </ThemeTextTitle>
        <ThemeText style={styles.overallProgressText}>
          Overall: {progressStats?.completedPercentage}%
        </ThemeText>
        {progressCourse?.map((course: Course) => {
          const progress: any = courseProgressMap.get(course._id);
          const isLocked = !course.hasAccess;

          return (
            <TouchableOpacity
              key={course._id}
              style={[styles.courseCard, isLocked && styles.lockedCourseCard]}
              onPress={() => {
                if (isLocked) {
                  if (!userData?.user?.email) {
                    navigation.navigate("Login");
                  } else {
                    navigation.navigate("Subscription");
                  }
                } else {
                  dispatch(coureseActions.setCouresSection([]));
                  navigation.navigate("CourseDetail", { course: course });
                }
              }}
            >
              <View style={styles.courseHeader}>
                <ThemeTextTitle
                  style={[styles.courseTitle, isLocked && styles.lockedText]}
                >
                  {course.title}
                </ThemeTextTitle>
                {isLocked ? (
                  <Ionicons
                    name="lock-closed"
                    size={24}
                    color={colors.dark_gray}
                  />
                ) : (
                  <Ionicons
                    name="chevron-down-outline"
                    size={24}
                    color={colors.dark_gray}
                  />
                )}
              </View>
              <ThemeText
                style={[
                  styles.progressPercentage,
                  isLocked && styles.lockedText,
                ]}
              >
                {isLocked
                  ? "Premium Course"
                  : `${
                      progress?.completionPercentage?.toFixed(1) || "0"
                    }% Complete`}
              </ThemeText>
              {!isLocked &&
                renderProgressBar(progress?.completionPercentage || 0)}
              {!isLocked && (
                <View style={styles.courseStats}>
                  <ThemeText style={styles.statsText}>
                    Lessons: {progress?.completedLessons || 0} /{" "}
                    {progress?.totalLessons || 0}
                  </ThemeText>
                  <ThemeText style={styles.statsText}>
                    Sections: {progress?.completedSections || 0} /{" "}
                    {progress?.totalSections || 0}
                  </ThemeText>
                  {progress?.lastAccessDate && (
                    <ThemeText style={styles.lastAccessed}>
                      Last accessed:{" "}
                      {new Date(progress.lastAccessDate).toLocaleDateString()}
                    </ThemeText>
                  )}
                </View>
              )}
              {isLocked && (
                <ThemeText style={styles.lockedMessage}>
                  Upgrade to access this course
                </ThemeText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSummaryStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="book-outline" size={24} color={colors.primary} />
        <ThemeText style={styles.statNumber}>
          {progressStats?.totalCourses || 0}
        </ThemeText>
        <ThemeText style={styles.statLabel}>Total Courses</ThemeText>
      </View>
      <View style={styles.statCard}>
        <Ionicons
          name="checkmark-circle-outline"
          size={27}
          color={colors.primary}
        />
        <ThemeText style={styles.statNumber}>
          {progressStats?.completedCourses || 0}
        </ThemeText>
        <ThemeText style={styles.statLabel}>Completed</ThemeText>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={24} color={colors.primary} />
        <ThemeText style={styles.statNumber}>
          {progressStats?.inProgressCourses || 0}
        </ThemeText>
        <ThemeText style={styles.statLabel}>In Progress</ThemeText>
      </View>
    </View>
  );

  if (!userData?.user) {
    return (
      <View style={styles.centerContainer}>
        <ThemeText style={styles.messageText}>
          Please log in to view your progress
        </ThemeText>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F7F7F7"]}
      style={styles.gradientBackground}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={getMyProgress?.isPending || getCourses?.isPending}
            onRefresh={() => {
              handleGetProgress();
              handlGetCourses();
            }}
          />
        }
      >
        {renderSummaryStats()}
        {renderCourseProgressSection()}
      </ScrollView>
    </LinearGradient>
  );
};

export default ProgressTrackingScreen;

// ------------------------- STYLES ------------------------- //

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
  },
  messageText: {
    fontSize: isTablet ? 20 : 16,
    textAlign: "center",
    color: colors.dark_gray,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: hp(3),
    paddingHorizontal: wp(2),
  },
  statCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    marginHorizontal: wp(1),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: wp(25),
  },
  statNumber: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "bold",
    marginVertical: hp(1),
    color: colors.primary,
  },
  statLabel: {
    color: colors.dark_gray,
    fontSize: isTablet ? 21 : 14,
    textAlign: "center",
  },
  coursesContainer: {
    padding: wp(5),
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : 20,
    marginBottom: hp(2),
    fontWeight: "600",
    color: colors.primary,
  },
  overallProgressText: {
    color: colors.dark_gray,
    marginBottom: hp(2),
    fontStyle: "italic",
    fontSize: isTablet ? 21 : 14,
  },
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  lockedCourseCard: {
    backgroundColor: "#f1f1f1",
    borderColor: colors.dark_gray,
    borderWidth: 0.3,
    borderStyle: "solid",
    opacity: 0.9,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  courseTitle: {
    fontSize: isTablet ? 27 : 16,
    fontWeight: "bold",
    flex: 1,
    color: colors.dark_gray,
  },
  progressPercentage: {
    fontSize: isTablet ? 21 : 14,
    color: colors.dark_gray,
    marginBottom: hp(1),
  },
  progressBarContainer: {
    height: hp(1.5),
    backgroundColor: colors.gray_2,
    borderRadius: hp(0.75),
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: hp(0.75),
  },
  courseStats: {
    marginTop: hp(1),
  },
  statsText: {
    color: colors.dark_gray,
    fontSize: isTablet ? 18 : 14,
    marginBottom: hp(0.5),
  },
  lastAccessed: {
    color: colors.dark_gray,
    fontSize: isTablet ? 18 : 12,
    fontStyle: "italic",
    marginTop: hp(1),
  },
  lockedText: {
    color: colors.dark_gray,
  },
  lockedMessage: {
    color: colors.dark_gray,
    fontSize: isTablet ? 18 : 14,
    fontStyle: "italic",
    marginTop: hp(1),
    textAlign: "center",
  },
});
