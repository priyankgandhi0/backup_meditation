import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Linking,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CustomAlert } from "../../components/login/CustomFeedback";
import { RootStackParamList } from "../../navigation/NavigationType";
import BackButton from "../../components/BackButton";
import ThemeText from "../../components/shared/theme-text";
import ThemeTextTitle from "../../components/shared/theme-title";
import { hp, isX, wp } from "../../helper/Responsive";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import { useAppDispatch, useAppSelector } from "../../redux/StateType";
import { ImagePath } from "@/src/utils/ImagePath";
import { colors } from "@/src/utils/colors";
import TextInputField from "@/src/components/login/TextInputField";
import PasswordTextInputField from "@/src/components/login/PasswordTextInputField";
import AuthButton from "@/src/components/login/AuthButton";
import { FontPath } from "@/src/utils/FontPath";
import {
  useCreateContacts,
  useGetTag,
  useRegister,
  useTagSetContactsId,
} from "@/src/api/query/AuthService";
import Purchases, { STOREKIT_VERSION } from "react-native-purchases";
import { authActions } from "@/src/redux/slice/AuthSlice";
import { trackScreenView } from "@/src/utils/analytics";

export default function RegisterEmailScreen() {
  const { contactId } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const navigation =
    useNavigation<
      StackNavigationProp<RootStackParamList, "RegisterEmailScreen">
    >();
  const { isPlayerContinue } = useAppSelector((state) => state.player);
  const register = useRegister();
  const createContacts = useCreateContacts();
  const getTag = useGetTag();
  const tagSetContactsId = useTagSetContactsId();
  const dispatch = useAppDispatch();

  useEffect(() => {
    trackScreenView("RegisterEmail", "RegisterEmailScreen");
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleInputChange = async (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const onRegister = async () => {
    const { fullName, email, password } = formData;
    if (!fullName || !email || !password) {
      showAlert("Input Error", "Please fill out all fields");
      return;
    }
    setIsLoading(true);
    try {
      const systmeres = await createContacts.mutateAsync({
        email: email,
        fields: [
          { slug: "first_name", value: fullName },
          { slug: "country", value: "US" },
          { slug: "phone_number", value: "null" },
        ],
      });
      console.log("systmeres?.id==>", systmeres?.id);
      if (systmeres?.id) {
        dispatch(authActions.setContactId(systmeres?.id));

        const res = await register.mutateAsync({
          fullName,
          email,
          password,
        });

        console.log("Register Success");
        Purchases.configure({
          apiKey:
            Platform.OS == "android"
              ? "goog_wNTSZMkCWJQRPLPpxjtSoaNegNE"
              : "appl_gsThKQfpGrSRCrkYDPSgDQKTtKv",
          storeKitVersion: STOREKIT_VERSION.DEFAULT,
          appUserID: email,
        });
        dispatch(authActions.setUserData(res));
        console.log("User Data set Success");
        const existingTagResponse = await getTag.mutateAsync();
        const tag = existingTagResponse?.items.find(
          (t: { name: string }) => t.name === "new_app_user"
        );
        console.log("get Tag Success");
        if (tag.id) {
          await tagSetContactsId.mutateAsync({
            tagId: tag.id,
            contactId: systmeres?.id,
          });
        }
        console.log("new Tag assign Success");
        setTimeout(() => {
          showAlert(
            "Registration Successful",
            "You have been successfully registered."
          );
        }, 3000);
        navigation.navigate("BaseHome");
      }
    } catch (error: any) {
      console.log("error---->", JSON.stringify(error));
      const errorMessage =
        error.response.data?.info === "Email is already registered"
          ? "This email is already registered. Please use a different email."
          : "Registration failed. Please try again.";
      if (error.response.data?.violations?.[0]?.message) {
        showAlert(
          "Registration Failed",
          error.response.data?.violations?.[0]?.message
        );
      } else {
        showAlert("Registration Failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginPress = () => {
    navigation.navigate("Login");
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
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <ThemeTextTitle style={styles.headingText}>
              REGISTER EMAIL
            </ThemeTextTitle>
            <View style={{ flexDirection: "row" }}>
              <ThemeText style={styles.newUserText}>Existing User? </ThemeText>
              <ThemeText style={styles.newUser} onPress={() => onLoginPress()}>
                Login
              </ThemeText>
            </View>
            <TextInputField
              value={formData.fullName}
              onChangeText={(value) => handleInputChange("fullName", value)}
              editable={!isLoading}
              placeholder="Full Name"
            />
            <TextInputField
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              editable={!isLoading}
              placeholder="Email"
            />
            <PasswordTextInputField
              secureTextEntry={!isVisible}
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              editable={!isLoading}
              placeholder="Password"
              onPress={toggleVisibility}
              isVisible={isVisible}
            />
            <ThemeText style={styles.agreementText}>
              I agree to receive updates on WhatsApp, accept the{" "}
              <ThemeText
                style={styles.linkText}
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                Privacy Policy
              </ThemeText>
              ,{" "}
              <ThemeText
                style={styles.linkText}
                onPress={() =>
                  Linking.openURL(
                    "https://www.meditatewithabhi.com/termsandconditions"
                  )
                }
              >
                Terms & Conditions
              </ThemeText>{" "}
              and{" "}
              <ThemeText
                style={styles.linkText}
                onPress={() =>
                  navigation.navigate("SubscriptionAgreementScreen")
                }
              >
                User Agreement
              </ThemeText>
              .
            </ThemeText>
            <AuthButton
              isLoading={isLoading}
              onPress={onRegister}
              buttonName="Register"
              buttonStyle={{
                marginBottom: isPlayerContinue ? (isX ? hp(4) : hp(5)) : 0,
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
  header: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(5),
    alignItems: "center",
    paddingVertical: hp(5),
    backgroundColor: colors.light_white,
    borderTopRightRadius: 110,
    borderTopLeftRadius: 110,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.primary,
  },
  headingText: {
    fontSize: 24,
    color: colors.black,
    marginBottom: hp(1),
    textAlign: "center",
  },
  agreementText: {
    textAlign: "center",
    color: colors.black,
    fontSize: 13,
    marginVertical: hp(1),
  },
  linkText: {
    color: colors.black,
    textDecorationLine: "underline",
    fontSize: 13,
    fontFamily: FontPath.QuattrocentoRegular,
  },
  newUser: {
    fontSize: 15,
    color: colors.black,
    fontWeight: "light",
    textDecorationLine: "underline",
    marginBottom: hp(2),
    textAlign: "center",
  },
  newUserTablet: {
    fontSize: 13,
    marginBottom: 8,
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
