import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import BackButton from "../../components/BackButton";
import { hp, isTablet, wp } from "../../helper/Responsive";
import { ImagePath } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import { trackScreenView } from "@/src/utils/analytics";

const AboutChakraScreen = () => {

  useEffect(() => {
    trackScreenView("AboutChakra", "AboutChakraScreen");
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
      <BackButton buttonStyle={styles.backButton} />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.textContainer}>
          <Text style={styles.heading}>About Chakra</Text>
          <Text style={styles.subheading}>Understanding Chakras:</Text>
          <Text style={styles.text}>
            Chakras are more than just abstract concepts — they are the
            energetic centers in our bodies that directly impact our physical,
            mental, and emotional well-being. Think of them as the energetic
            wheels or hubs that influence everything from how we feel on a daily
            basis to the clarity of our thoughts and our overall health. These
            energy centers align along the spine and play a key role in keeping
            us balanced, centered, and connected to ourselves and others.
          </Text>
          <Text style={styles.subheading}>The Vital Role of Chakras:</Text>
          <Text style={styles.text}>
            The chakras govern not only our physical health but also our
            emotional balance. When one or more of our chakras are out of sync,
            we can experience stress, emotional turmoil, and even physical
            discomfort. That’s where practices like yoga, meditation, and
            mindful breathing come in — they help realign these energy centers,
            restoring the flow of energy throughout the body.
          </Text>
          <Text style={styles.subheading}>The Healing Power of Music:</Text>
          <Text style={styles.text}>
            An often overlooked yet deeply powerful tool in chakra healing is
            music. When listening to chakra healing music, you can deeply
            resonate with specific frequencies that correspond to each energy
            center, promoting healing and restoring balance. These soothing
            sounds work by stimulating the chakras, which can help release
            blockages and encourage the free flow of energy, or "prana," in the
            body.
          </Text>
          <Text style={styles.text}>
            Meditate With Abhi Chakra Music is designed to help tune each chakra
            to its optimal frequency, aligning your energies and bringing your
            body, mind, and spirit into harmony. Whether you're looking to
            relieve stress, promote inner peace, or enhance spiritual growth,
            listening to chakra healing music regularly can make a profound
            difference in your overall well-being.
          </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default AboutChakraScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    paddingVertical: hp(5),
  },
  textContainer: {
    backgroundColor: colors.light_gray_900,
    padding: wp(5),
    borderRadius: 10,
    marginHorizontal: wp(3),
  },
  heading: {
    fontSize: 24,
    fontFamily: FontPath.Quattrocento,
    color: colors.dark_mauve,
    marginTop: hp(5),
    marginBottom: hp(5),
    textAlign: "center",
  },
  subheading: {
    fontSize: 18,
    fontFamily: FontPath.Quattrocento,
    color: colors.dark_mauve,
    marginBottom: hp(2),
  },
  text: {
    fontSize: 16,
    color: colors.black_1,
    marginBottom: hp(2),
    lineHeight: 22,
    fontFamily: FontPath.Quattrocento,
    textAlign: "justify",
  },
  backButton: {
    position: "relative",
    alignSelf: "flex-start",
  },
});
