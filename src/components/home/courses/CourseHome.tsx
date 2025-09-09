import React, { useEffect, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  Text,
} from "react-native";
import CardCourseHome from "./Card";
import SkeletonList from "../../loaders/CardLoader";
import { useNavigation } from "@react-navigation/native";
import ProgressBar from "../../loaders/ProgressBar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../navigation/NavigationType";
import TitleHome from "../title";
import { useAppDispatch, useAppSelector } from "../../../redux/StateType";
import { hp, wp } from "../../../helper/Responsive";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useGetCourses } from "@/src/api/query/CouresService";
import { coureseActions } from "@/src/redux/slice/CoureseSlice";
import { FlashList } from "@shopify/flash-list";

const CourseListHome = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "BaseHome">>();
  const { userData } = useAppSelector((state) => state.auth);
  const { courese } = useAppSelector((state) => state.courese);
  const progress = useSharedValue(0);
  const getCourses = useGetCourses();
  const dispatch = useAppDispatch();
  const [visibleWidth, setVisibleWidth] = useState(0);
  const isBreathwork = useAppSelector((state) => state.auth.isBreathwork);

  useEffect(() => {
    if (!isBreathwork) {
      handlGetCourses();
    }
  }, [userData?.user?.email, isBreathwork]);

  const handlGetCourses = async () => {
    try {
      const res = await getCourses.mutateAsync({
        email: userData?.user?.email || "",
      });
      if (res?.courses) {
        dispatch(coureseActions.setCoures(res?.courses));
      }
    } catch (error) {
      console.log("handlGetCourses==>", error);
    }
  };

  if (getCourses.isPending) return <SkeletonList />;

  const onSeAllView = () => {
    navigation.navigate("Courses");
  };

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    progress: Animated.SharedValue<number>
  ) => {
    const { contentSize, contentOffset } = event.nativeEvent;
    const contentWidth = contentSize.width;
    const offsetX = contentOffset.x;
    const maxOffset = contentWidth - visibleWidth; // dynamically computed

    const progressPercentage =
      maxOffset > 0 ? Math.max(0, Math.min(offsetX / maxOffset, 1)) : 0;

    progress.value = withTiming(progressPercentage, { duration: 100 });
  };

  const renderItem = ({ item, index }: any) => {
    return (
      <CardCourseHome
        key={index}
        item={item}
        isAuthenticated={userData?.token != ""}
      />
    );
  };

  return (
    <View style={{ marginTop: hp(2) }}>
      <TitleHome onClickSeeAll={onSeAllView} title="Courses" />
      {courese.length === 0 && (
        <Text style={{ textAlign: "center", color: "red", marginVertical: 20 }}>
          No courses found.{" "}
          {userData.token
            ? "Try again later or check your network."
            : "Please log in to see your courses."}
        </Text>
      )}
      <FlashList
        data={courese}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
        renderItem={renderItem}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => handleScroll(event, progress)}
        contentContainerStyle={{
          paddingVertical: hp(2),
          paddingHorizontal: wp(2),
        }}
        estimatedItemSize={200}
        scrollEventThrottle={16}
      />
      <View style={{ alignSelf: "center" }}>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
};

export default CourseListHome;
