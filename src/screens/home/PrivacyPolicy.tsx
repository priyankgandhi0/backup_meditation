import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
  Linking,
} from "react-native";
import BackButton from "../../components/BackButton";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import ThemeTextTitle from "../../components/shared/theme-title";
import ThemeText from "../../components/shared/theme-text";
import { ImagePath } from "@/src/utils/ImagePath";
import { hp, wp } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import { trackScreenView } from "@/src/utils/analytics";

export default function PrivacyPolicy() {
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;

  useEffect(() => {
    trackScreenView("PrivacyPolicy", "PrivacyPolicyScreen");
  }, []);

  return (
    <ImageBackground
      source={isTablet ? ImagePath.profileImageBackIpad : ImagePath.loginbg}
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
          <ThemeTextTitle style={styles.heading}>Privacy Policy</ThemeTextTitle>
          <ThemeText style={styles.text}>
            At The School of Breath, operated by PossibilityAI Inc, your privacy
            is important to us. This privacy policy explains what personal data
            we collect, how we use it, and your rights regarding your data.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Personal Data We Collect
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            We collect the following data to provide and improve our services:
            {"\n"}- Name, Email, and Password: For account creation and secure
            login.
            {"\n"}- Microphone and Camera Access: To record and submit audio or
            video feedback about our courses.
            {"\n"}- Video Storage Access: To allow you to upload video-based
            feedback.
            {"\n"}- User Feedback (Text Input): Any feedback you provide via
            text, which is emailed to us and not shared with any third party.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Purpose of Data Collection
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            We use your data for the following purposes:
            {"\n"}- To provide and maintain our services.
            {"\n"}- To collect and address feedback for improving our courses.
            {"\n"}- To manage your account and provide customer support.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>Permissions</ThemeTextTitle>
          <ThemeText style={styles.text}>
            We request your consent to access the microphone, camera, and video
            storage, which will only be used for course feedback purposes. You
            have the full right to deny or revoke these permissions at any time.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Your Rights Under GDPR (EU)
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            If you are located in the European Union, you have the following
            rights under the General Data Protection Regulation (GDPR):
            {"\n"}- Access: Request details about the data we collect and
            process.
            {"\n"}- Rectification: Correct inaccuracies in your personal data.
            {"\n"}- Erasure: Request deletion of your data under certain
            conditions.
            {"\n"}- Data Portability: Request a copy of your data in a
            structured, commonly used format.
            {"\n"}- Restrict Processing: Opt-out of specific types of data
            processing or restrict how we process your data.
            {"\n"}- Withdraw Consent: Revoke consent at any time where
            applicable.
            {"\n"}- Necessity of Data Collection: We are committed to collecting
            only the data that is strictly necessary to enable app functionality
            and provide our services. To exercise these rights, contact us at
            connect@meditatewithabhi.com.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Your Rights Under CCPA (California)
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            If you are a California resident, you have rights under the
            California Consumer Privacy Act (CCPA):
            {"\n"}- Right to Know: You can request information on the categories
            and specific pieces of personal data we have collected about you.
            {"\n"}- Right to Delete: You can request the deletion of your
            personal data, subject to legal and contractual obligations.
            {"\n"}- Right to Opt-Out: You can opt-out of the sale of your
            personal data.
            {"\n"}- Non-Discrimination: You will not be discriminated against
            for exercising these rights. To exercise these rights, contact us at
            connect@meditatewithabhi.com
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Data Security
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            We employ commercially reasonable measures to secure your data.
            However, no system is completely secure, and we cannot guarantee
            absolute security.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Data Retention and Deletion
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            We retain your data for as long as necessary to fulfill the purposes
            outlined in this policy. You can request the deletion of your data
            by contacting us at connect@meditatewithabhi.com.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Children's Privacy
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            Our service is not intended for anyone under the age of 13. We do
            not knowingly collect personal data from children under 13.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>
            Changes to This Policy
          </ThemeTextTitle>
          <ThemeText style={styles.text}>
            We may update this privacy policy from time to time. You will be
            notified of any significant changes via email and/or a prominent
            notice on our platform.
          </ThemeText>

          <ThemeTextTitle style={styles.subheading}>Contact Us</ThemeTextTitle>
          <ThemeText style={styles.text}>
            If you have any questions about this privacy policy, please contact
            us at:
            {"\n"}By email:{" "}
            <ThemeText
              style={{
                color: "#72616d",
                fontWeight: "bold",
                textDecorationLine: "underline",
              }}
              onPress={() =>
                Linking.openURL("mailto:connect@meditatewithabhi.com")
              }
            >
              connect@meditatewithabhi.com
            </ThemeText>
            <ThemeText style={styles.text}>
              {"\n"}Mail: PossibilityAI Inc, 6244 Lansdowne Circle, Boynton
              Beach, FL 33472, USA
            </ThemeText>
          </ThemeText>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

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
    fontWeight: "bold",
    color: colors.black,
    marginTop: hp(10),
    marginBottom: hp(5),
    textAlign: "center",
    fontFamily: FontPath.QuattrocentoRegular,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.black,
    fontFamily: FontPath.QuattrocentoRegular,
    marginBottom: hp(1),
  },
  text: {
    fontSize: 16,
    color: colors.black_1,
    marginBottom: hp(2),
    lineHeight: 22,
    fontFamily: FontPath.QuattrocentoRegular,
    textAlign: "justify",
  },
  backButton: {
    position: "relative",
    alignSelf: "flex-start",
  },
});
