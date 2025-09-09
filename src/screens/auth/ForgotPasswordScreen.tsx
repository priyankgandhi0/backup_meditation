import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/NavigationType";
import BackButton from "../../components/BackButton";
import { ImagePath } from "../../utils/ImagePath";
import { wp, hp } from "../../helper/Responsive";
import { CustomAlert } from "../../components/login/CustomFeedback";
import ThemeText from "../../components/shared/theme-text";
import ThemeTextTitle from "../../components/shared/theme-title";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import TextInputField from "@/src/components/login/TextInputField";
import { colors } from "@/src/utils/colors";
import AuthButton from "@/src/components/login/AuthButton";
import { useForgotPassword } from "@/src/api/query/AuthService";
import { trackScreenView } from "@/src/utils/analytics";

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "ForgotPassword">>();
  const forgotPassword = useForgotPassword();

  useEffect(() => {
    trackScreenView("ForgotPassword", "ForgotPasswordScreen");
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setAlertMessage("");

    if (!email) {
      setIsLoading(false);
      showAlert("Error", "Please enter your email.");
      return;
    }

    try {
      const res = await forgotPassword.mutateAsync({email})
      if (res) {
        showAlert("Success", "Check your email for further instructions.");
      }
    } catch (error: any) {
      let errorMessage = "Something went wrong, please try again.";

      showAlert("Error", error.response?.data?.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={ImagePath.homeScreenBudha} style={styles.header}>
      <BackButton buttonStyle={{ backgroundColor: "transparent" }} />
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <ThemeTextTitle style={styles.textTitle}>
              Forgot Password?
            </ThemeTextTitle>
            <ThemeText style={styles.enterYourEmail}>
              Enter Your Email
            </ThemeText>
            <TextInputField
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              placeholder="Email"
            />
            <AuthButton
              isLoading={isLoading}
              onPress={handleSubmit}
              buttonName="Send Reset Link"
            />
            <ThemeText
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("Login")}
            >
              Login
            </ThemeText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  textTitle: {
    fontSize: 24,
    color: colors.black,
    marginBottom: hp(1),
    textAlign: "center",
    textTransform: "uppercase",
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
    alignItems: "center",
    backgroundColor: colors.light_white,
    borderTopRightRadius: 110,
    borderTopLeftRadius: 110,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.primary,
    paddingTop: hp(5),
  },
  forgotPassword: {
    fontSize: 15,
    color: colors.black,
    fontWeight: "light",
    textDecorationLine: "underline",
    marginBottom: hp(1),
    textAlign: "center",
  },
  header: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  enterYourEmail: {
    fontSize: 15,
    color: colors.black,
    fontWeight: "light",
  },
  alertMessageText: {
    fontWeight: "bold",
    marginBottom: hp(1),
  },
});
