import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect } from "react";
import BackButton from "../../components/BackButton";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { ImagePath } from "@/src/utils/ImagePath";
import { hp, wp } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { trackScreenView } from "@/src/utils/analytics";

const SubscriptionTCScreen = () => {
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;

  useEffect(() => {
    trackScreenView("SubscriptionTC", "SubscriptionTCScreen");
  }, []);

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
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Subscription Terms & Conditions</Text>
          <Text style={styles.text}>
            i) Subscription Options: Our application offers Monthly and Yearly
            subscription plans.
          </Text>
          <Text style={styles.text}>
            ii) Payment Confirmation: Payment will be charged to your iTunes or
            Google Play account upon purchase confirmation.
          </Text>
          <Text style={styles.text}>
            ili) Auto-Renewal Policy: Subscriptions are auto-renewed based on
            the validity of the selected plan. To avoid being charged for the
            next billing cycle, you must cancel your subscription at least 24
            hours prior to the renewal date.
          </Text>
          <Text style={styles.text}>
            iv) Managing Subscriptions: You may manage your subscription and
            turn off auto-renewal by navigating to your device’s subscription
            settings.
          </Text>
          <Text style={styles.text}>
            v) Cancellation Policy: We follow a transparent cancellation policy:
            Reach out to us if you wish to cancel your subscription at any time
            and Cancellation will take effect at the end of the current billing
            period, and no further charges will be made.
          </Text>
          <Text style={styles.text}>
            vi) Updates to Terms: These terms may be updated periodically. Users
            are encouraged to review the subscription terms regularly on the
            app.
          </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default SubscriptionTCScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    paddingVertical: hp(8),
  },
  textContainer: {
    backgroundColor: colors.light_gray_900,
    padding: wp(5),
    borderRadius: 10,
    marginHorizontal: wp(4),
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.black,
    marginTop: hp(5),
    marginBottom: hp(5),
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "justify",
    color: colors.black_1,
    marginBottom: hp(2),
    lineHeight: 22,
  },
  backButton: {
    position: "relative",
    alignSelf: "flex-start",
  },
});
