import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import BackButton from "../../components/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases from "react-native-purchases";
import { API_SYSTEME_KEY, SEND_GRID, SYSTEME_API_URL } from "@env";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationProp,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { hp, RFValue, wp } from "../../helper/Responsive";
import { ImagePath } from "../../utils/ImagePath";
import { FocusAwareStatusBar } from "../../components/FocusAwareStatusBar";
import FastImage from "react-native-fast-image";
import PhoneNumberInputModal from "../../components/modals/PhoneNumberInputModal";
import { RootStackParamList } from "@/src/navigation/NavigationType";
import { colors } from "@/src/utils/colors";
import { useAppSelector } from "@/src/redux/StateType";
import { trackScreenView } from "@/src/utils/analytics";
import { authActions } from "@/src/redux/slice/AuthSlice";
import { useDispatch } from "react-redux";
import { useUserTagSystemeIo } from "@/src/api/query/AuthService";

const SubscriptionScreen = () => {
  const { userData, contactId } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedOption, setSelectedOption] = useState("Monthly");
  const { top } = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [monthPrice, setMonthPrice] = useState("");
  const [yearPrice, setYearPrice] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const isFoused = useIsFocused();
  const dispatch = useDispatch();
  const phoneNumberRef = React.useRef("");
  const userTagSystemeIo = useUserTagSystemeIo();

  useEffect(() => {
    trackScreenView("Subscription", "SubscriptionScreen");
    if (isFoused) {
      handlePrice();
    }
  }, [isFoused]);

  const handlePrice = async () => {
    try {
      const products: any = await Purchases.getOfferings();
      setMonthPrice(products.current?.monthly.product.pricePerMonthString);
      setYearPrice(products.current?.annual?.product?.pricePerYearString);
    } catch (error) {
      console.log("errpr", error);
    }
  };

  const handleSubscribe = async () => {
    setIsOpenModal(true);
  };

  const registerPhoneNumber = async () => {
    try {
      const payload = {
        fields: [
          {
            slug: "phone_number",
            value: `${phoneNumberRef.current}`,
          },
        ],
      };
      console.log("payload", payload);

      console.log(
        "`${SYSTEME_API_URL}/contacts/${contactId}`",
        `${SYSTEME_API_URL}/contacts/${contactId}`
      );

      const response = await axios
        .patch(`${SYSTEME_API_URL}/contacts/${contactId}`, payload, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/merge-patch+json",
            "X-API-Key": API_SYSTEME_KEY,
          },
        })
        .catch((err) => {
          console.log("------->>>>", JSON.stringify(err));
        });
      console.log(
        "Contact updated successfully:",
        JSON.stringify(response?.data)
      );
    } catch (error) {
      console.log("registerPhoneNumber errpr", error);
    }
  };

  const assignTags = async () => {
    try {
      // Fetch existing tags
      const existingTagResponse = await axios
        .get(`${SYSTEME_API_URL}/tags?limit=100`, {
          headers: {
            "X-API-Key": API_SYSTEME_KEY,
            Accept: "application/json",
          },
        })
        .catch((error) => {
          console.error("Error fetching existing tags:", error);
        });

      const tagsToAssign = [
        selectedOption === "Monthly"
          ? "monthly_app_subscription"
          : "yearly_app_subscription",
        "Enrolled_Holistic Membership",
        "Enrolled_to_Membership",
      ];

      const tagsToRemove = [
        "Canceled Holistic Membership",
        "Canceled Holistic Membership App",
        "CanceledHolisticMembershipAppInitiated",
      ];

      const tagObjects = tagsToAssign?.map((tagName) =>
        existingTagResponse?.data?.items?.find(
          (t: { name: string }) => t.name === tagName
        )
      );

      // const id = await AsyncStorage.getItem("contactId");
      const id = contactId;

      const userResTag = await userTagSystemeIo.mutateAsync({
        contactsId: contactId,
      });
      console.log("userResTag", userResTag);
      if (userResTag) {
        for (const tagName of userResTag) {
          if (tagsToRemove.includes(tagName)) {
            // Find tagId from allTags
            const tagObj = existingTagResponse?.data?.items?.find(
              (t: { name: string }) => t.name === tagName
            );
            if (tagObj) {
              // await removeTagIfPresent(contactId, tagObj?.id);
              await axios
                .delete(
                  `${SYSTEME_API_URL}/contacts/${contactId}/tags/${tagObj?.id}`,
                  {
                    headers: {
                      "X-API-Key": API_SYSTEME_KEY,
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                  }
                )
                .catch((error) => {
                  console.error("Error removing tag->>:", error);
                });
            } else {
              console.warn(`⚠️ Tag not found in allTags list: ${tagName}`);
            }
          }
        }
      }
      for (const tag of tagObjects) {
        if (tag) {
          await axios
            .post(
              `${SYSTEME_API_URL}/contacts/${id}/tags`,
              { tagId: tag.id },
              {
                headers: {
                  "X-API-Key": API_SYSTEME_KEY,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            )
            .catch((error) => {
              console.error("Error assigning tag->>:", error);
            });
          console.log(`Tag ${tag.name} assigned successfully.`);
        } else {
          console.warn(`Tag not found for one of the names: ${tagsToAssign}`);
        }
      }
      registerPhoneNumber();
      sendEmail();
      console.log("All tags assigned successfully.");
      navigation.navigate("BaseHome");
    } catch (error) {
      console.error("Error assigning tags:", error);
      // alert("Please try again.");
    }
  };

  const sendEmail = async () => {
    const url = "https://api.sendgrid.com/v3/mail/send";
    const apiKey = SEND_GRID;
    const payload = {
      from: {
        email: "connect@meditatewithabhi.com",
        name: "The School Of Breath",
      },
      template_id: "d-04148f8a5490495191c747fea2c7cb07",
      personalizations: [
        {
          to: [
            {
              email: userData?.user?.email,
              name: userData?.user?.fullName,
            },
          ],
          subject:
            "Your Holistic Membership for The School of Breath App is Confirmed!",
        },
      ],
    };

    try {
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("sendEmail", error);
    }
  };

  const handlePhoneNumber = async (number: string) => {
    if (selectedOption) {
      phoneNumberRef.current = number;
      setPhoneNumber(number);
      setIsLoading(true);
      setIsOpenModal(false);
      try {
        const products: any = await Purchases.getOfferings();
        const selectedPackage =
          selectedOption === "Monthly"
            ? products.current?.monthly
            : products.current?.annual;
        await Purchases.purchasePackage(selectedPackage);
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active) {
          if (customerInfo.entitlements.active?.pro?.periodType) {
            dispatch(authActions.setMembershipStatus("Premium Membership"));
            assignTags();
          }
        }
        setIsLoading(false);
      } catch (e) {
        setIsOpenModal(false);
        setIsLoading(false);
        console.log("====>", e);
      }
    } else {
      alert("Please select a subscription option");
    }
  };

  // Helper function to format the price with currency initials
  function formatPriceWithCurrency(price: string): string {
    if (!price) return "";
    // Capture any leading non-digit (symbols or 3-letter codes) and the amount
    const match = price.match(/([\p{Sc}\p{L} ]+)?([\d,\.]+)/u);
    if (!match) return price;

    const raw = (match[1] || "").trim();
    const amount = match[2];

    // Mapping of symbols or 3-letter codes to their ISO codes
    const currencyMap: Record<string, string> = {
      $: "USD",
      "₹": "INR",
      "€": "EUR",
      "£": "GBP",
      AED: "AED",
      AUD: "AUD",
      BDT: "BDT",
      BGN: "BGN",
      BOB: "BOB",
      BRL: "BRL",
      CAD: "CAD",
      CHF: "CHF",
      CLP: "CLP",
      COP: "COP",
      CRC: "CRC",
      CZK: "CZK",
      DKK: "DKK",
      DZD: "DZD",
      EGP: "EGP",
      EUR: "EUR",
      GEL: "GEL",
      GHS: "GHS",
      HKD: "HKD",
      HUF: "HUF",
      IDR: "IDR",
      ILS: "ILS",
      INR: "INR",
      IQD: "IQD",
      JPY: "JPY",
      JOD: "JOD",
      KES: "KES",
      KRW: "KRW",
      KZT: "KZT",
      LKR: "LKR",
      MAD: "MAD",
      MMK: "MMK",
      MOP: "MOP",
      MYR: "MYR",
      MXN: "MXN",
      NGN: "NGN",
      NOK: "NOK",
      NZD: "NZD",
      PKR: "PKR",
      PEN: "PEN",
      PHP: "PHP",
      PLN: "PLN",
      PYG: "PYG",
      QAR: "QAR",
      RON: "RON",
      RSD: "RSD",
      RUB: "RUB",
      SAR: "SAR",
      SEK: "SEK",
      SGD: "SGD",
      THB: "THB",
      TJS: "UAH",
      TZS: "TZS",
      TRY: "TRY",
      TWD: "TWD",
      UAH: "UAH",
      USD: "USD",
      VND: "VND",
      XAF: "XAF",
      XOF: "XOF",
      ZAR: "ZAR",
    };

    const code = currencyMap[raw] || "";

    // If it's a known 3-letter code, just return "CODE amount"
    if (code && /^[A-Z]{3}$/.test(raw)) {
      return `${code} ${amount}`;
    }
    // If it's a known symbol, return "symbol (CODE)amount"
    if (code) {
      return `${raw} (${code})${amount}`;
    }

    // Fallback to the original string
    return price;
  }

  return (
    <ImageBackground source={ImagePath.loginbg} style={styles.background}>
      <FocusAwareStatusBar
        barStyle={"light-content"}
        translucent
        backgroundColor={"transparent"}
      />
      <BackButton buttonStyle={{ marginTop: top }} disabled={isLoading} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <FastImage
          source={ImagePath.logowithPurpleBack}
          style={styles.topHeader}
        />
        <Text style={styles.title}>Choose Your Plan</Text>
        <TouchableOpacity
          disabled={isLoading}
          style={[
            styles.optionTile,
            selectedOption === "Monthly" && styles.selectedOption,
          ]}
          onPress={() => {
            if (!isLoading) {
              setSelectedOption("Monthly");
            }
          }}
        >
          <Text style={styles.optionTitle}>Monthly Membership</Text>
          <Text style={styles.optionDescription}>
            Price: {formatPriceWithCurrency(monthPrice)}/month
          </Text>
          <Text style={styles.optionDescription}>Duration : 1 month</Text>
          <Text style={styles.benefits}>Benefits</Text>
          <Text style={styles.benfitsDes}>
            ✔️ Instant Access to Current Courses
          </Text>
          <Text style={styles.benfitsDes}>✔️ Regularly Updated Content </Text>
          <Text style={styles.benfitsDes}>✔️ Personalised Sleep Music</Text>
          <Text style={styles.benfitsDes}>
            ✔️ Sleep Music added twice a month
          </Text>
          <Text style={styles.benfitsDes}>✔️ Active Community 1-1 Support</Text>
          <Text style={styles.benfitsDes}>✔️ Freedom to Cancel Anytime</Text>
        </TouchableOpacity>

        {/* Yearly Membership */}
        <TouchableOpacity
          disabled={isLoading}
          style={[
            styles.optionTile,
            selectedOption === "Yearly" && styles.selectedOption,
          ]}
          onPress={() => {
            if (!isLoading) {
              setSelectedOption("Yearly");
            }
          }}
        >
          <Text style={styles.optionTitle}>Yearly Membership</Text>
          <Text style={styles.optionDescription}>
            Price: {formatPriceWithCurrency(yearPrice)}/year
          </Text>
          <Text style={styles.optionDescription}>Duration : 1 year</Text>
          <Text style={styles.benefits}>Benefits</Text>
          <Text style={styles.benfitsDes}>
            ✔️ Instant Access to Current Courses
          </Text>
          <Text style={styles.benfitsDes}>✔️ Regularly Updated Content </Text>
          <Text style={styles.benfitsDes}>✔️ Personalised Sleep Music</Text>
          <Text style={styles.benfitsDes}>
            ✔️ Sleep Music added twice a month
          </Text>
          <Text style={styles.benfitsDes}>✔️ Active Community 1-1 Support</Text>
          <Text style={styles.benfitsDes}>✔️ Freedom to Cancel Anytime</Text>
          <Text style={styles.benfitsDes}>✔️ Save more with yearly plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          disabled={isLoading}
          onPress={() => {
            if (!isLoading) {
              handleSubscribe();
            }
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
        <View style={styles.policyRow}>
          {Platform.OS === "ios" && (
            <Pressable
              disabled={isLoading}
              onPress={() => navigation.navigate("SubscriptionAgreementScreen")}
            >
              <Text style={styles.subscriber}>Subscriber Agreement</Text>
            </Pressable>
          )}
          <Pressable
            disabled={isLoading}
            onPress={() => navigation.navigate("SubscriptionTCScreen")}
          >
            <Text style={styles.subscriber}>Subscription T&C</Text>
          </Pressable>
          <Pressable
            disabled={isLoading}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          >
            <Text style={styles.subscriber}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
      {isOpenModal && (
        <PhoneNumberInputModal
          isVisible={isOpenModal}
          onPhoneNumber={handlePhoneNumber}
          onRequestClose={() => setIsOpenModal(false)}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: "bold",
    marginBottom: hp(2),
    textAlign: "center",
  },
  optionTile: {
    width: wp(90),
    padding: wp(4),
    backgroundColor: colors.white_1,
    borderRadius: 10,
    marginVertical: hp(0.5),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.light_sky,
    borderWidth: 2,
  },
  optionTitle: {
    fontSize: RFValue(15),
    fontWeight: "bold",
    marginBottom: hp(0.5),
  },
  optionDescription: {
    fontSize: RFValue(11),
    color: colors.dark_gray_2,
  },
  benefitText: {
    fontSize: RFValue(11),
  },
  confirmButton: {
    marginTop: hp(2),
    backgroundColor: colors.primary,
    height: hp(6),
    justifyContent: "center",
    borderRadius: 10,
    width: wp(90),
    alignItems: "center",
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: RFValue(14),
    fontWeight: "bold",
  },
  subscriber: {
    fontSize: RFValue(9),
    fontWeight: "500",
  },
  policyRow: {
    flexDirection: "row",
    width: wp(90),
    justifyContent: "space-between",
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  benefits: {
    marginVertical: hp(1),
    fontSize: RFValue(13),
    fontWeight: "800",
  },
  benfitsDes: {
    marginBottom: hp(0.5),
    fontSize: RFValue(8),
    fontWeight: "300",
  },
  topHeader: {
    resizeMode: "contain",
    height: hp(14.5),
  },
});

export default SubscriptionScreen;
