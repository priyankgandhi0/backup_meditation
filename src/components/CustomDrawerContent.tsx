import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import { fullAccessMemberTags, limitedAccessTags } from "../utils/accessRules";
import Purchases from "react-native-purchases";
import { playerActions } from "../redux/slice/PlayerSlice";
import { useAppDispatch, useAppSelector } from "../redux/StateType";
import { useAudio } from "../context/AudioContext";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from "@react-navigation/native";
import { hp, isiPAD, RFValue, wp } from "../helper/Responsive";
import { ImagePath } from "../utils/ImagePath";
import ThemeText from "./shared/theme-text";
import FastImage from "react-native-fast-image";
import moment from "moment";
import { colors } from "../utils/colors";
import {
  useDeleteContacts,
  useDeleteUser,
  useUserTagSystemeIo,
} from "../api/query/AuthService";
import { authActions } from "../redux/slice/AuthSlice";
import { trackScreenView } from "../utils/analytics";

export default function CustomDrawerContent(props: any) {
  const { userData, contactId, membershipStatus } = useAppSelector(
    (state) => state.auth
  );
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const dispatch = useAppDispatch();
  const { stop } = useAudio();
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [expirationDate, setExpirationDate] = useState("");
  const [isShowNextRenewal, setIsShowNextRenewal] = useState(false);

  const deleteContacts = useDeleteContacts();
  const deleteUser = useDeleteUser();
  const userTagSystemeIo = useUserTagSystemeIo();

  useEffect(() => {
    trackScreenView("CustomDrawerContent", "CustomDrawerContent");
  }, []);

  useEffect(() => {
    // handleGetUserTag();
    getNextRenewalDate();
  }, [props]);

  const handleGetUserTag = async () => {
    try {
      dispatch(authActions.setIsMembershipLoading(true));
      if (!userData?.user?.email) {
        dispatch(authActions.setMembershipStatus("Basic Membership"));
        dispatch(authActions.setIsMembershipLoading(false));
        return;
      }
      userTagSystemeIo.mutateAsync({ contactsId: contactId });
      const userHasFullAccess = userTagSystemeIo.data?.some((tag: string) =>
        fullAccessMemberTags.includes(tag)
      );
      const userHasLimitedAccess = userTagSystemeIo.data?.some((tag: string) =>
        limitedAccessTags.includes(tag)
      );
      if (userHasFullAccess) {
        dispatch(authActions.setMembershipStatus("Premium Membership"));
      } else if (userHasLimitedAccess) {
        dispatch(authActions.setMembershipStatus("Limited Access"));
      } else if (userTagSystemeIo.data) {
        dispatch(authActions.setMembershipStatus("Basic Membership"));
      }
      dispatch(authActions.setIsMembershipLoading(false));
    } catch (error) {
      dispatch(authActions.setIsMembershipLoading(false));
      console.log("handleGetUserTag error:", error);
    }
  };

  const handleShare = async () => {
    try {
      const url =
        Platform.OS == "android"
          ? "https://play.google.com/store/apps/details?id=com.meditatewithabhi.theschoolofbreath"
          : "https://apps.apple.com/us/app/the-school-of-breath/id6736984340";
      const title = "The School Of Breath";
      const message =
        "Hey there! 🎉 I just discovered this amazing app, and I think you'd love it too! Download it now and explore it. Click the link to get started:";
      const shareText = `${message} ${url}`;
      if (await Sharing.isAvailableAsync()) {
        const fileUri = FileSystem.cacheDirectory + "share.txt";
        await FileSystem.writeAsStringAsync(fileUri, shareText);
        await Sharing.shareAsync(fileUri, {
          dialogTitle: title,
          mimeType: "text/plain",
          UTI: "public.plain-text",
        });
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } else {
        Alert.alert("Sharing is not available on this device.");
      }
    } catch (error) {
      console.log("handleShare==>", error);
    }
  };

  const handleWhatsAppShare = () => {
    Linking.openURL("whatsapp://send?phone=+919253392845");
  };

  const handleLogout = () => {
    logout();
    stop();
    dispatch(playerActions.setIsPlayerContinue(false));
    props.navigation.navigate("BottomTabNavigator", {
      screen: "Home",
    });
  };

  const logout = async () => {
    try {
      dispatch(authActions.setContactId(""));
      dispatch(authActions.setIsPlayerModal(false));
      dispatch(authActions.setMembershipStatus("Basic Membership"));
      dispatch(authActions.setIsBreathwork(false));
      dispatch(
        authActions.setUserData({
          token: "",
          user: {
            id: "",
            email: "",
            fullName: "",
          },
        })
      );
      await Purchases.logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    if (customerInfo.managementURL) {
      Alert.alert(
        "Cancel Subscription",
        "first cancel your subscription then delete account, then wait 5 min for cancel subscription",
        [
          {
            text: "No, cancel membership",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Yes, cancel membership",
            onPress: () => Linking.openURL(customerInfo.managementURL!),
            style: "destructive",
          },
        ]
      );
    } else {
      handleShowDeleteAlert();
    }
  };

  const handleShowDeleteAlert = () => {
    Alert.alert(
      "Confirm Account Deletion",
      "This action is irreversible. By deleting your account, your associated [Holistic Membership] will also be canceled, and you will lose access to any remaining benefits. Do you wish to proceed?",
      [
        {
          text: "No, keep my account active",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Yes, delete my account",
          onPress: () => handleDelete(),
          style: "destructive",
        },
      ]
    );
  };

  const handleDelete = async () => {
    try {
      await deleteContacts.mutateAsync({ contactsId: contactId });
      await deleteUser.mutateAsync({
        token: userData?.token,
      });
      logout();
      stop();
      dispatch(playerActions.setIsPlayerContinue(false));
      dispatch(authActions.setIsBreathwork(false));
      navigation.navigate("BottomTabNavigator", { screen: "Home" });
    } catch (error) {
      console.log("handleDelete", error);
    }
  };

  const getNextRenewalDate = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();

      if (customerInfo.entitlements.active.hasOwnProperty("pro")) {
        const entitlement = customerInfo.entitlements.active["pro"];

        // Get the expiration date
        const expirationDate = entitlement.expirationDate;
        if (expirationDate) {
          const expTs = new Date(expirationDate).getTime();
          let isShowDate = Date.now() >= expTs ? false : true;
          console.log("isShowDate");

          // setIsShowNextRenewal(isShowDate);
          setExpirationDate(moment(expirationDate).format("DD/MM/YYYY"));
        }
      }
    } catch (error) {
      console.error("Error fetching customer information:", error);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/CustomDrawerContentback.jpg")}
      style={styles.background}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.scrollContainer, { marginTop: hp(-2) }]}
      >
        <View
          style={{
            justifyContent: "center",
            width: "80%",
            alignItems: "center",
            paddingTop: top,
          }}
        >
          <FastImage
            source={ImagePath.profileImage}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.userInfo}>
            <ThemeText style={styles.userName}>
              {userData?.user?.fullName
                ? userData?.user?.fullName
                : "Hi! Guest User"}
            </ThemeText>
            <ThemeText
              style={[styles.userEmail]}
              size={
                userData?.user?.email.length! >= 25 ? RFValue(11) : RFValue(14)
              }
            >
              {userData?.user?.email
                ? userData?.user?.email
                : "guest@domain.com"}
            </ThemeText>
            {membershipStatus && (
              <>
                <Text style={[styles.membershipStatus]}>
                  {membershipStatus}
                </Text>
                {expirationDate && (
                  <Text style={styles.membershipDate}>
                    Next Renewal Date: {expirationDate}
                  </Text>
                )}

                {/* Conditionally Render the Upgrade Button */}
                {userData?.user?.email &&
                  membershipStatus != "Premium Membership" && (
                    <>
                      {(membershipStatus === "Basic Membership" ||
                        membershipStatus === "Limited Access") && (
                        <TouchableOpacity
                          onPress={() =>
                            props.navigation.navigate("BottomTabNavigator", {
                              screen: "Home",
                              params: {
                                screen: "Subscription",
                              },
                            })
                          } // Navigate to the upgrade screen
                          style={styles.upgradeButton}
                        >
                          <ThemeText style={styles.upgradeButtonText}>
                            Upgrade Membership
                          </ThemeText>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
              </>
            )}
          </View>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#d1bc94",
            marginTop: hp(2),
          }}
        >
          {/* Home Button */}
          <TouchableOpacity
            onPress={() =>
              props.navigation.navigate("BottomTabNavigator", {
                screen: "Home",
              })
            }
            style={{ ...styles.drawerButton, marginTop: hp(2) }}
          >
            <Ionicons
              name="home"
              size={isiPAD ? 35 : 20}
              color={colors.primary}
            />
            <ThemeText style={styles.drawerButtonText}>Home</ThemeText>
          </TouchableOpacity>

          {/* Login Button (conditionally rendered if user is not logged in) */}

          {/* Privacy Policy Button */}
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate("BottomTabNavigator", {
                screen: "Home",
                params: {
                  screen: "PrivacyPolicy",
                },
              });
            }}
            style={styles.drawerButton}
          >
            <Ionicons
              name="book"
              size={isiPAD ? 35 : 20}
              color={colors.primary}
            />
            <ThemeText style={styles.drawerButtonText}>
              Privacy Policy
            </ThemeText>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={() =>
                props.navigation.navigate("BottomTabNavigator", {
                  screen: "Home",
                  params: {
                    screen: "SubscriptionAgreementScreen",
                  },
                })
              }
              style={styles.drawerButton}
            >
              <Ionicons
                name="book"
                size={isiPAD ? 35 : 20}
                color={colors.primary}
              />
              <ThemeText style={styles.drawerButtonText}>
                Terms of Service
              </ThemeText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate("BottomTabNavigator", {
                screen: "Home",
                params: {
                  screen: "AboutUsScreen",
                },
              });
            }}
            style={styles.drawerButton}
          >
            <Ionicons
              name="book"
              size={isiPAD ? 35 : 20}
              color={colors.primary}
            />
            <ThemeText style={styles.drawerButtonText}>About us</ThemeText>
          </TouchableOpacity>
          {!userData?.user?.email && (
            <TouchableOpacity
              onPress={() =>
                props.navigation.navigate("BottomTabNavigator", {
                  screen: "Home",
                  params: {
                    screen: "Login",
                  },
                })
              }
              style={styles.drawerButton}
            >
              <Ionicons
                name="log-in"
                size={isiPAD ? 35 : 20}
                color={colors.primary}
              />
              <ThemeText style={styles.drawerButtonText}>Login</ThemeText>
            </TouchableOpacity>
          )}

          {/* Logout Button (conditionally rendered if user is logged in) */}
          {userData?.user?.email && (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.drawerButton}
            >
              <Ionicons
                name="log-out"
                size={isiPAD ? 35 : 20}
                color={colors.primary}
              />
              <ThemeText style={styles.drawerButtonText}>Logout</ThemeText>
            </TouchableOpacity>
          )}

          {userData?.user?.email && (
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={styles.drawerButton}
            >
              <Ionicons
                name="trash"
                size={isiPAD ? 35 : 20}
                color={colors.primary}
              />
              <ThemeText style={styles.drawerButtonText}>
                Delete Account
              </ThemeText>
            </TouchableOpacity>
          )}
        </View>
      </DrawerContentScrollView>

      {/* Floating Share and Chat Buttons */}
      <TouchableOpacity
        style={[styles.floatingButton, { zIndex: 100 }]}
        onPress={handleShare}
      >
        <Ionicons name="share-social" size={28} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.floatingChatButton,
          { right: isTablet ? 90 : 20, zIndex: 100 },
        ]}
        onPress={handleWhatsAppShare}
      >
        <Ionicons name="logo-whatsapp" size={28} color="white" />
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  scrollContainer: {
    flexGrow: 1,
    marginBottom: hp(13),
  },
  logo: {
    marginTop: hp(2.1),
    width: isiPAD ? wp(40) : wp(35),
    height: isiPAD ? wp(20) : wp(20),
    alignSelf: "flex-start",
    marginBottom: hp(2.1),
  },
  profileImage: {
    width: 120,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 55,
  },
  userInfo: {
    marginBottom: hp(1),
  },
  userName: {
    fontSize: RFValue(16),
    color: colors.black,
    textAlign: "left",
    fontWeight: "bold",
    marginLeft: wp(3),
  },
  userEmail: {
    color: colors.black,
    marginLeft: wp(3),
  },
  membershipStatus: {
    fontSize: RFValue(12),
    marginTop: hp(0.5),
    borderRadius: 10,
    color: colors.black,
    fontWeight: "bold",
    marginLeft: wp(3),
  },
  membershipDate: {
    fontSize: RFValue(12),
    marginTop: hp(0.5),
    color: colors.black,
    marginLeft: wp(3),
  },
  noMembershipStatus: {
    color: colors.black,
  },
  limitedAccessStatus: {
    color: colors.black,
    backgroundColor: colors.black,
    padding: wp(2),
    borderRadius: 10,
    overflow: "hidden",
    marginLeft: wp(3),
  },
  premiumMembershipStatus: {
    color: colors.black,
    backgroundColor: colors.black,
    padding: wp(2),
    borderRadius: 10,
    overflow: "hidden",
    marginLeft: wp(3),
  },
  drawerButton: {
    flexDirection: "row",
    alignItems: "center",
    height: hp(6.5),
    paddingHorizontal: wp(5),
    marginTop: hp(0.5),
    marginHorizontal: wp(2),
  },
  drawerButtonText: {
    fontSize: RFValue(12),
    color: colors.black,
    marginLeft: wp(2),
  },
  floatingButton: {
    position: "absolute",
    bottom: hp(3),
    left: wp(5),
    width: isiPAD ? wp(10) : wp(15),
    height: isiPAD ? wp(10) : wp(15),
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.light_yellow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 2,
    borderWidth: 3,
    borderColor: colors.light_white_1,
    zIndex: 100,
  },
  floatingChatButton: {
    position: "absolute",
    bottom: hp(3),
    width: isiPAD ? wp(10) : wp(15),
    height: isiPAD ? wp(10) : wp(15),
    borderRadius: 100,
    backgroundColor: colors.green_1,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.light_yellow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 2,
    borderWidth: 3,
    borderColor: colors.light_white_1,
    zIndex: 100,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.black_900,
  },
  modalContent: {
    width: "80%",
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "bold",
  },
  closeModalButton: {
    backgroundColor: colors.dark_mauve,
    padding: 10,
    borderRadius: 10,
  },
  closeModalText: {
    color: colors.white,
    fontWeight: "bold",
  },
  upgradeButton: {
    marginTop: hp(1),
    backgroundColor: colors.primary,
    paddingVertical: hp(1),
    width: wp(50),
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginLeft: wp(3),
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: RFValue(12),
    fontWeight: "bold",
  },
});
