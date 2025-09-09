import React, { useEffect, useRef } from "react";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  View,
  Animated,
  StatusBar,
  StyleSheet,
  Dimensions,
} from "react-native";
import { CourseDetailLayout } from "../../components/CourseDetailLayout";
import { Course } from "@/src/interface/Types";
import { useGetCoursesSections } from "@/src/api/query/CouresService";
import { useAppDispatch, useAppSelector } from "@/src/redux/StateType";
import Loader from "@/src/components/Loader";
import { coureseActions } from "@/src/redux/slice/CoureseSlice";
import { trackScreenView } from "@/src/utils/analytics";

const { width, height } = Dimensions.get("window");

const CourseDetailScreen = () => {
  const route = useRoute();
  const { course } = route.params as { course: Course };
  const { userData } = useAppSelector((state) => state.auth);
  const { section } = useAppSelector((state) => state.courese);
  const getCoursesSections = useGetCoursesSections();
  const isFoused = useIsFocused();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let screenName = `CourseDetail - ${course?.title}`;
    trackScreenView(screenName, "CourseDetailScreen", {
      CourseName: course?.title,
    });
    if (isFoused && course?._id) {
      handleGetSection();
      // Trigger entrance animations
      startEntranceAnimations();
    }
  }, [course?._id, isFoused, course?.title]);

  const startEntranceAnimations = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.95);
    backgroundAnim.setValue(0);

    // Staggered entrance animations
    Animated.parallel([
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  const handleGetSection = async () => {
    try {
      const res = await getCoursesSections.mutateAsync({
        id: course._id,
        email: userData?.user?.email,
        token: userData?.token,
      });
      if (section?.length > 0) {
        const updatedCourses = section.map((courseItem: any) => {
          const updatedCourse = res?.sections.find(
            (item: { _id: string }) => item._id === courseItem._id
          );
          return updatedCourse
            ? {
                ...courseItem,
                isCompleted: updatedCourse.isCompleted,
                lessons: courseItem.lessons.map(
                  (lesson: any, index: number) => ({
                    ...lesson,
                    completed:
                      updatedCourse.lessons?.[index]?.completed ??
                      lesson.completed,
                  })
                ),
              }
            : courseItem;
        });
        dispatch(coureseActions.setCouresSection(updatedCourses));
      } else {
        dispatch(coureseActions.setCouresSection(res?.sections));
      }
    } catch (error) {
      console.log("handleGetSection==>", error);
    }
  };

  const handleBack = () => {
    // Exit animation before navigation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const refreshWithAnimation = () => {
    // Subtle refresh animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    handleGetSection();
  };

  // Dynamic background gradient interpolation
  const backgroundOpacity = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const backgroundScale = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.1, 1],
  });

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Glassmorphic Container */}
      <Animated.View
        style={[
          styles.glassContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Glass overlay for blur effect */}
        <View style={styles.glassOverlay} />

        {/* Content Container */}
        <View style={[styles.contentContainer]}>
          <CourseDetailLayout
            courseTitle={course.title}
            courseImage={course.image}
            sections={section.length > 0 ? section : course?.sections}
            lessons={course.lessons}
            reviews={course.reviews}
            author={course.author}
            courseTheme={course.courseTheme ?? ""}
            courseId={course?._id}
            handlRefresh={refreshWithAnimation}
            onClickBack={handleBack}
          />
        </View>
      </Animated.View>

      {/* Modern Loader with Glassmorphism */}
    </>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientBackground: {
    flex: 1,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundColor: "#667eea", // Fallback for React Native
  },

  glassContainer: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    // For React Native, you might need to use a library like react-native-blur
    // or implement platform-specific blur effects
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loaderGlass: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(15px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  particle: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  particle1: {
    width: 4,
    height: 4,
    top: "20%",
    left: "80%",
    animationName: "float1",
    animationDuration: "6s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  particle2: {
    width: 6,
    height: 6,
    top: "60%",
    left: "10%",
    animationName: "float2",
    animationDuration: "8s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  particle3: {
    width: 3,
    height: 3,
    top: "80%",
    left: "70%",
    animationName: "float3",
    animationDuration: "7s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  particle4: {
    width: 5,
    height: 5,
    top: "30%",
    left: "30%",
    animationName: "float4",
    animationDuration: "9s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
});

export default CourseDetailScreen;
