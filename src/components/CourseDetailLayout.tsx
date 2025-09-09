import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { web_app_url } from "../utils/api.config";
import { RootStackParamList } from "../navigation/NavigationType";
import BackButton from "./BackButton";

import { useAudio } from "../context/AudioContext";
import FastImage from "react-native-fast-image";
import { convertMusicTrackToTrack } from "../utils/trackConverter";
import { playerActions } from "../redux/slice/PlayerSlice";
import { colors } from "../utils/colors";
import {
  CourseDetailLayoutProps,
  Lesson,
  Section,
  Subsection,
  ThemeColors,
} from "../interface/Types";
import { hp, wp } from "../helper/Responsive";
import { useGetThemes } from "../api/query/ThemeService";
import { useCoursesComplete } from "../api/query/CouresService";
import { useAppSelector, useAppDispatch } from "../redux/StateType";
import { courseUIActions } from "../redux/slice/CourseUISlice";
import { FocusAwareStatusBar } from "./FocusAwareStatusBar";
import { FlashList } from "@shopify/flash-list";

export const CourseDetailLayout = ({
  courseTitle,
  courseImage,
  sections,
  author,
  courseTheme = "default",
  customTheme,
  courseId,
  handlRefresh,
  onSectionToggle,
  onLessonStart,
  onLessonComplete,
  onClickBack,
}: CourseDetailLayoutProps) => {
  const dispatch = useAppDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const {
    expandedSection,
    expandedSubsection,
    lastViewedSectionId,
    lastViewedLessonId,
  } = useAppSelector((state) => state.courseUI);
  const getThemes = useGetThemes();
  const { stop, loadTrack } = useAudio();
  const [selectedTab, setSelectedTab] = useState<
    "Playlist" | "Review" | "Author"
  >("Playlist");
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "VideoPlayer">>();
  const [sectionId, setSectionId] = useState("");
  const coursesComplete = useCoursesComplete();

  useEffect(() => {
    if (lastViewedSectionId && sections) {
      const section = sections.find((s) => s._id === lastViewedSectionId);
      if (section) {
        dispatch(courseUIActions.setExpandedSection(section.section));
        setSectionId(lastViewedSectionId);
      }
    }
  }, [lastViewedSectionId, sections]);

  const toggleSection = (sectionTitle: string, id: string) => {
    setSectionId(id);
    const newExpandedSection =
      expandedSection === sectionTitle ? null : sectionTitle;
    dispatch(courseUIActions.setExpandedSection(newExpandedSection));
    onSectionToggle?.(sectionTitle, id);
    if (!newExpandedSection) {
      dispatch(
        courseUIActions.setLastViewedIds({
          sectionId: null,
          lessonId: null,
        })
      );
    }
  };

  const toggleSubsection = (subsection: string) => {
    const newExpandedSubsection =
      expandedSubsection === subsection ? null : subsection;
    dispatch(courseUIActions.setExpandedSubsection(newExpandedSubsection));
  };

  const _handlePressButtonAsync = async (link: string) => {
    await WebBrowser.openBrowserAsync(link);
    handlRefresh();
  };

  const handleLessonPress = async (lesson: Lesson) => {
    onLessonStart?.(lesson, sectionId);

    if (lesson.type === "file" && lesson.file) {
      // Open PDF link in browser
      const pdfUrl = encodeURIComponent(lesson.file);
      const webAppUrl = `${web_app_url}/pdfViewer?pdfUrl=${pdfUrl}`;
      await _handlePressButtonAsync(lesson.file);
      handleCoursesComplete(lesson?._id);
      onLessonComplete?.(lesson, sectionId);
    } else if (lesson.videoUrl) {
      stop();

      setSectionId(sectionId);
      dispatch(
        courseUIActions.setLastViewedIds({
          sectionId: sectionId,
          lessonId: lesson._id,
        })
      );

      if (lesson.isFromYoutube) {
        navigation.navigate("VideoPlayer", {
          videoUrl: lesson.videoUrl,
          fromYoutube: true,
          sectionId: sectionId,
          courseId: courseId,
          lessonsId: lesson?._id,
          completed: lesson?.completed,
          onComplete: () => {
            handleCoursesComplete(lesson?._id);
            onLessonComplete?.(lesson, sectionId);
          },
        });
      } else {
        navigation.navigate("VideoPlayer", {
          videoUrl: lesson.videoUrl,
          fromYoutube: false,
          title: lesson.title,
          sectionId: sectionId,
          courseId: courseId,
          lessonsId: lesson?._id,
          completed: lesson?.completed,
          onComplete: () => {
            handleCoursesComplete(lesson?._id);
            onLessonComplete?.(lesson, sectionId);
          },
        });
      }
    } else if (lesson.type === "audio") {
      const convertedTrack = convertMusicTrackToTrack({
        _id: lesson?._id,
        audioFilename: lesson?.audioUrl,
        name: lesson?.title,
        description: "",
        imageFilename: "",
        isPremium: false,
        favorites: [],
      });
      loadTrack(convertedTrack, "SleepMusic");
      dispatch(
        playerActions.setMusic({
          isBack: true,
          isFrequency: true,
          root: "BaseHome",
          screen: "Home",
          track: convertedTrack,
        })
      );
      dispatch(playerActions.setIsPlayerContinue(true));
      handleCoursesComplete(lesson?._id);
      onLessonComplete?.(lesson, sectionId);
    } else {
      console.log(`Lesson ${lesson.id} pressed`);
    }
  };

  const handleCoursesComplete = async (lessonsId: string | undefined) => {
    try {
      await coursesComplete.mutateAsync({
        coursesId: courseId,
        lessonsId: lessonsId,
        sectionsId: sectionId,
        token: userData?.token,
      });
      handlRefresh();
    } catch (error) {
      console.log("handleUpdateProgresss===>", error);
    }
  };

  // Handle tab switching
  const handleTabPress = (tab: "Playlist" | "Review" | "Author") => {
    setSelectedTab(tab);
  };

  const theme =
    getThemes?.data?.find(
      (theme: { _id: string | number }) => theme._id === courseTheme
    )?.colors || customTheme;

  const styles = theme && createCourseStyles(theme);

  if (getThemes?.isPending) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const renderLesson = ({ item }: { item: Lesson }) => {
    return (
      <TouchableOpacity
        onPress={() => handleLessonPress(item)}
        style={styles.lessonContainer}
      >
        {item?.completed ? (
          <AntDesign name="checkcircle" size={21} color={colors.blue} />
        ) : (
          <Ionicons name="radio-button-off" size={24} color={colors.blue} />
        )}
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubsection = (subsection: Subsection) => {
    return (
      <View key={subsection.title}>
        {subsection.title ? (
          <TouchableOpacity
            style={styles.subsectionContainer}
            onPress={() => toggleSubsection(subsection.title)}
          >
            <Text style={styles.subsectionText}>
              {expandedSubsection === subsection.title ? "ᐁ" : "ᐅ"}{" "}
              {subsection.title}
            </Text>
          </TouchableOpacity>
        ) : null}
        {(expandedSubsection === subsection.title || !subsection.title) && (
          <FlashList
            data={subsection.lessons}
            renderItem={renderLesson}
            estimatedItemSize={200}
          />
        )}
      </View>
    );
  };

  const renderSection = ({ item }: { item: Section }) => {
    return (
      <View key={item.section}>
        <TouchableOpacity
          style={styles.sectionContainer}
          onPress={() => toggleSection(item.section, item?._id)}
        >
          <Text style={styles.sectionText}>
            {expandedSection === item.section ? "ᐁ" : "ᐅ"} {item.section}
          </Text>
          <AntDesign
            name="checkcircle"
            size={21}
            color={item.isCompleted ? colors.blue : colors.gray}
          />
        </TouchableOpacity>
        {expandedSection === item.section && item.subsections && (
          <View>
            {item.subsections.map((subsection) => renderSubsection(subsection))}
          </View>
        )}
        {expandedSection === item.section && item.lessons && (
          <FlashList
            data={item.lessons}
            renderItem={renderLesson}
            estimatedItemSize={200}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <FocusAwareStatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ImageBackground src={courseImage} style={styles.courseInfoBackground}>
        <BackButton
          buttonStyle={{ alignSelf: "flex-start" }}
          onClick={onClickBack}
        />
        <View style={styles.courseInfoOverlay}>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
        </View>
      </ImageBackground>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => handleTabPress("Playlist")}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "Playlist" && styles.activeTabText,
            ]}
          >
            Playlist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabPress("Author")}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "Author" && styles.activeTabText,
            ]}
          >
            Author
          </Text>
        </TouchableOpacity>
      </View>

      {/* Playlist Tab */}
      {selectedTab === "Playlist" && sections && (
        <FlashList
          data={sections}
          renderItem={renderSection}
          contentContainerStyle={styles.listContainer}
          estimatedItemSize={200}
          scrollEnabled={false}
          scrollEventThrottle={16}
          extraData={{ expandedSection, expandedSubsection }}
        />
      )}

      {/* Author Tab */}
      {selectedTab === "Author" && (
        <View style={styles.authorContainer}>
          <FastImage
            source={{ uri: author.profileImage }}
            style={styles.authorImage}
          />
          <Text style={styles.authorName}>{author.name}</Text>
          <Text style={styles.authorBio}>{author.bio}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const createCourseStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    courseInfoBackground: {
      width: wp(100),
      height: hp(50),
      justifyContent: "flex-end",
      alignItems: "center",
    },
    courseInfoOverlay: {
      backgroundColor: colors.black_900,
      width: wp(100),
      height: hp(6),
      justifyContent: "center",
      alignItems: "center",
    },
    courseTitle: {
      fontSize: 21,
      fontWeight: "bold",
      color: theme.courseTitleColor,
    },
    tabContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: hp(1.5),
      backgroundColor: theme.tabBackgroundColor,
    },
    tabText: {
      fontSize: 16,
      color: theme.primaryColor,
    },
    activeTabText: {
      fontWeight: "bold",
      textDecorationLine: "underline",
    },
    listContainer: {
      padding: wp(5),
    },
    sectionContainer: {
      marginBottom: hp(1.5),
      padding: wp(4),
      backgroundColor: theme.sectionBackgroundColor,
      borderRadius: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textColor,
    },
    subsectionContainer: {
      marginBottom: 10,
      padding: 10,
      backgroundColor: theme.subsectionBackgroundColor,
      borderRadius: 10,
    },
    subsectionText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.textColor,
    },
    lessonContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: hp(1.5),
      padding: wp(3),
      backgroundColor: theme.lessonBackgroundColor,
      borderRadius: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    lessonInfo: {
      marginLeft: wp(2),
      flex: 1,
    },
    lessonTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.textColor,
    },
    lessonDescription: {
      fontSize: 14,
      color: theme.descriptionColor,
    },
    reviewContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      padding: 15,
      backgroundColor: theme.reviewBackgroundColor,
      borderRadius: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    authorContainer: {
      alignItems: "center",
      padding: wp(5),
    },
    authorImage: {
      width: wp(50),
      height: wp(50),
      marginBottom: hp(2),
    },
    authorName: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textColor,
    },
    authorBio: {
      fontSize: 14,
      color: theme.descriptionColor,
      textAlign: "center",
      marginTop: hp(2),
    },
  });
