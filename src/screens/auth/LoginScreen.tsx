import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CustomAlert } from "../../components/login/CustomFeedback";
import { RootStackParamList } from "../../navigation/NavigationType";
import BackButton from "../../components/BackButton";
import ThemeTextTitle from "../../components/shared/theme-title";
import ThemeText from "../../components/shared/theme-text";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { hp, isX, RFValue, wp } from "../../helper/Responsive";
import { useAppDispatch, useAppSelector } from "../../redux/StateType";
import { ImagePath } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import TextInputField from "@/src/components/login/TextInputField";
import PasswordTextInputField from "@/src/components/login/PasswordTextInputField";
import AuthButton from "@/src/components/login/AuthButton";
import { useGetContactId, useLogin, useUserTagSystemeIo } from "@/src/api/query/AuthService";
import { authActions } from "@/src/redux/slice/AuthSlice";
import {
  clearGuestEmail,
  clearCurrentSessionId,
} from "@/src/redux/slice/ChatSlice";
import Purchases, { STOREKIT_VERSION } from "react-native-purchases";
import { fullAccessMemberTags, limitedAccessTags } from "@/src/utils/accessRules";
import { trackScreenView } from "@/src/utils/analytics";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Login">>();
  const { isPlayerContinue } = useAppSelector((state) => state.player);
  const login = useLogin();
  const getContactId = useGetContactId();
  const dispatch = useAppDispatch();
  const [isLoading, setLoading] = useState(false);
  const userTagSystemeIo = useUserTagSystemeIo();

  useEffect(() => {
    trackScreenView("Login", "LoginScreen");
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const onLogin = async () => {
    const trimmedEmail = email.trim();
    const lowercasedEmail = trimmedEmail.toLowerCase();

    if (!trimmedEmail || !password) {
      showAlert("Login Failed", "Invalid email or password. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await login.mutateAsync({
        email: lowercasedEmail,
        password,
      });
      if (response) {
        try {
          dispatch(authActions.setUserData(response));

          try {
            Purchases.configure({
              apiKey:
                Platform.OS == "android"
                  ? "goog_wNTSZMkCWJQRPLPpxjtSoaNegNE"
                  : "appl_gsThKQfpGrSRCrkYDPSgDQKTtKv",
              storeKitVersion: STOREKIT_VERSION.DEFAULT,
              appUserID: lowercasedEmail,
            });
          } catch (purchasesError) {
            console.error(
              "Error configuring RevenueCat Purchases:",
              purchasesError
            );
          }

          try {
            const systmeres = await getContactId.mutateAsync({
              email: lowercasedEmail,
            });
            if (systmeres && systmeres.items && systmeres.items.length > 0) {
              dispatch(authActions.setContactId(systmeres.items[0].id));
             const userResTag = await  userTagSystemeIo.mutateAsync({ contactsId: systmeres.items[0].id });
              const userHasFullAccess = userResTag?.some((tag: string) =>
                fullAccessMemberTags.includes(tag)
              );
              const userHasLimitedAccess = userResTag?.some((tag: string) =>
                limitedAccessTags.includes(tag)
              );
              if (userHasFullAccess) {
                dispatch(authActions.setMembershipStatus("Premium Membership"));
              } else if (userHasLimitedAccess) {
                dispatch(authActions.setMembershipStatus("Limited Access"));
              } else if (userTagSystemeIo.data) {
                dispatch(authActions.setMembershipStatus("Basic Membership"));
              }
              console.log(
                "Login successful: Attempting to clear guest chat state..."
              );
              dispatch(clearGuestEmail());
              dispatch(clearCurrentSessionId());
              console.log(
                "Login successful: Guest chat state clear actions dispatched."
              );
            } else {
              console.warn(
                "Login successful, but no contact ID found for email:",
                lowercasedEmail
              );
            }
          } catch (contactError) {
            console.error(
              "Error retrieving contact details after successful login:",
              contactError
            );
          }

          setLoading(false);
          navigation.navigate("BaseHome");
          return;
        } catch (postLoginError) {
          console.error(
            "An error occurred after successful primary login:",
            postLoginError
          );
          setLoading(false);
          navigation.navigate("BaseHome");
          return;
        }
      } else {
        setLoading(false);
        showAlert(
          "Login Failed",
          "Invalid response from server. Please try again."
        );
      }
    } catch (error: any) {
      setLoading(false);
      showAlert(
        "Login Error",
        error?.response?.data?.info ||
        "Authentication failed. Please check your credentials."
      );
    }
  };

  return (
    <ImageBackground source={ImagePath.homeScreenBudha} style={styles.header}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <BackButton buttonStyle={{ backgroundColor: "transparent" }} />
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
            <ThemeTextTitle style={styles.welcomeText}>WELCOME</ThemeTextTitle>
            <View style={{ flexDirection: "row" }}>
              <ThemeText style={styles.newUserText}>
                Are you a new user?
              </ThemeText>
              <ThemeText
                style={styles.forgotPassword}
                onPress={() => navigation.navigate("RegisterEmailScreen")}
              >
                Sign up
              </ThemeText>
            </View>
            <TextInputField
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              placeholder="Email"
            />
            <PasswordTextInputField
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              placeholder="Password"
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              isVisible={isPasswordVisible}
            />
            <ThemeText
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              Forgot Password?
            </ThemeText>
            <AuthButton
              isLoading={isLoading}
              onPress={onLogin}
              buttonName="Submit"
              buttonStyle={{
                marginBottom: !isPlayerContinue
                  ? isX
                    ? hp(10)
                    : hp(2)
                  : hp(8),
              }}
            />
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
  content: {
    paddingHorizontal: wp(5),
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
  welcomeText: {
    fontSize: RFValue(20),
    color: colors.black,
    marginBottom: hp(1),
    textAlign: "center",
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
  newUserText: {
    marginRight: wp(1),
    fontSize: 15,
    color: colors.black,
    fontWeight: "light",
  },
});
