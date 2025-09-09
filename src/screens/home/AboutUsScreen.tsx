import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "../../components/BackButton";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import ThemeText from "../../components/shared/theme-text";
import FastImage from "react-native-fast-image";
import { hp, wp } from "../../helper/Responsive";
import { ImagePath } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import { trackScreenView } from "@/src/utils/analytics";

const AboutUsScreen = () => {
  const { width, height } = Dimensions.get("window");
  const isTablet = width >= 768;
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    trackScreenView("AboutUs", "AboutUsScreen");
  } , []);

  return (
    <ImageBackground
      source={isTablet ? ImagePath.profileImagebg : ImagePath.loginbg}
      style={styles.background}
    >
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <BackButton buttonStyle={{ top: top }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(30) }}
      >
        <View style={styles.textContainer}>
          <FastImage source={ImagePath.Abhi} style={styles.abhi} />
          <ThemeText
            style={[
              styles.about,
              {
                fontSize: height > 850 && height < 900 ? 16 : 15,
              },
            ]}
          >
            Welcome to The School of Breath, a transformative platform created
            by Abhi Duggal, dedicated to improving your health, happiness, and
            overall well-being. Through the power of ancient breathing
            techniques, guided meditations, and soothing sleep music, we aim to
            help you unlock your potential, find inner peace, and cultivate a
            balanced life. Our approach combines the wisdom of traditional
            practices with modern wellness strategies, empowering you to reduce
            stress, enhance focus, and achieve emotional harmony. Whether you’re
            a beginner or experienced in meditation and yoga, our resources are
            thoughtfully designed to meet you where you are and guide you
            towards a healthier, more mindful way of living. Join us on a
            journey of self-discovery and holistic growth, and experience how
            simple practices can bring profound transformation.
          </ThemeText>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default AboutUsScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  abhi: {
    width: wp(50),
    height:wp(50),
    resizeMode: "contain",
    alignSelf: "center",
    marginTop:hp(10),
  },
  about: {
    color: colors.black_1,
    marginTop: hp(2),
    marginHorizontal: wp(2),
    fontFamily: FontPath.QuattrocentoRegular,
    textAlign: "justify",
  },
  textContainer: {
    flex: 1,
    backgroundColor: colors.light_gray_900,
    borderRadius: 10,
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
});
