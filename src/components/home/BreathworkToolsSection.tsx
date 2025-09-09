// BreathworkToolsSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import { wp, hp, isiPAD } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { homeCardStyles } from "@/src/styles/card-home.styles";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "@/src/navigation/NavigationType";
import { useAppSelector } from "@/src/redux/StateType";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import ProgressBar from "../loaders/ProgressBar";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const breathCardStyles = StyleSheet.create({
  image: {
    // a slightly shorter image‐height than homeCardStyles.image
    height: isiPAD ? hp(24) : hp(20),
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
});

const tools = [
  {
    id: "478",
    title: "Unwind",
    image: require("@/src/assets/breathwork/1.jpeg"),
    screen: "BreathRelaxScreen",
    locked: false,
  },
  {
    id: "belly",
    title: "Ground",
    image: require("@/src/assets/breathwork/2.jpeg"),
    screen: "BreathBellyScreen",
    locked: true,
  },
  {
    id: "focus",
    title: "Focus",
    image: require("@/src/assets/breathwork/3.jpg"),
    screen: "BreathBoxScreen",
    locked: true,
  },
  {
    id: "balance",
    title: "Balance",
    image: require("@/src/assets/breathwork/4.jpg"),
    screen: "BreathAlternateNostrilScreen",
    locked: true,
  },
];

const BreathworkToolsSection = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // Correctly destructure userData and membershipStatus from the auth slice
  const { userData, membershipStatus } = useAppSelector((state) => state.auth);

  const handlePress = (tool: (typeof tools)[0], canInteract: boolean) => {
    const isToolPremium = tool.title !== "Breath to Unwind";

    if (!userData?.token && isToolPremium && !canInteract) {
      // Guest user, premium tool, cannot interact
      navigation.navigate("Login");
    } else if (canInteract) {
      // Can interact (either free tool, or premium user with premium tool)
      if (tool.screen) {
        navigation.navigate(tool.screen as any);
      } else {
        Alert.alert("Coming Soon", "More breathing tools are on the way!");
      }
    } else {
      // Logged in, but not premium (e.g. basic membership), and tool is premium
      navigation.navigate("Subscription");
    }
  };

  const progress = useSharedValue(0);
  const [visibleWidth, setVisibleWidth] = useState(0);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Breathe with me</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: hp(2),
          paddingHorizontal: wp(2),
        }}
        onScroll={(event) => {
          const { contentSize, contentOffset } = event.nativeEvent;
          const contentWidth = contentSize.width;
          const offsetX = contentOffset.x;
          const maxOffset = contentWidth - visibleWidth; // dynamically computed

          const progressPercentage =
            maxOffset > 0 ? Math.max(0, Math.min(offsetX / maxOffset, 1)) : 0;

          progress.value = withTiming(progressPercentage, { duration: 100 });
        }}
        scrollEventThrottle={16}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
      >
        {tools.map((tool, index) => {
          const isToolPremium = tool.title !== "Breath to Unwind"; // Identifies inherently premium content
          const isFirstCard = index === 0;
          const isUserPremium = !!(
            userData?.token && membershipStatus === "Premium Membership"
          );
          const canInteract = isFirstCard || isUserPremium; // Only show lock if not premium

          return (
            <TouchableOpacity
              key={tool.id}
              onPress={() => handlePress(tool, canInteract)}
              activeOpacity={0.8}
              style={[
                homeCardStyles.cardContainer,
                {
                  width: isTablet ? wp(46.4) : wp(47),
                },
              ]}
            >
              <FastImage
                source={tool.image}
                style={[breathCardStyles.image, { width: "100%" }]}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={homeCardStyles.titleContainer}>
                <Text
                  style={[
                    homeCardStyles.titleTextCard,
                    { textAlign: "center" },
                  ]}
                  numberOfLines={2}
                >
                  {tool.title}
                </Text>
              </View>

              {isToolPremium &&
                !canInteract && ( // Show lock if tool is premium and user cannot interact
                  <View style={styles.lockIconContainer}>
                    <Ionicons
                      name="lock-closed"
                      size={isTablet ? 30 : 18}
                      color={colors.white}
                    />
                  </View>
                )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ alignSelf: "center" }}>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
};

export default BreathworkToolsSection;

/** Finally, any additional "section" styles: */
const styles = StyleSheet.create({
  sectionContainer: {
    width: wp(100),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: isiPAD ? 27 : 20,
    fontWeight: "400",
    color: colors.black,
    fontFamily: "Quattrocento-Regular",
    marginBottom: hp(-2),
    marginLeft: wp(-2), // Added to match homeCardStyles.title
  },
  lockIconContainer: {
    position: "absolute",
    top: hp(0.1),
    right: hp(1),
    width: isiPAD ? wp(10) : wp(10.8),
    height: isiPAD ? wp(10) : wp(10.8),
    borderRadius: isiPAD ? wp(6) : wp(10),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
