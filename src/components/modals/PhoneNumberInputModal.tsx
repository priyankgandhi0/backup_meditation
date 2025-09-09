import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import CountryPicker, { Country } from "react-native-country-picker-modal";
import { hp, RFValue, wp } from "../../helper/Responsive";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { colors } from "@/src/utils/colors";
import { PhoneNumberInputModalProps } from "@/src/interface/Types";

const PhoneNumberInputModal = ({
  isVisible,
  onPhoneNumber,
  onRequestClose,
}: PhoneNumberInputModalProps) => {
  const [countryCode, setCountryCode] = useState<any>("IN");
  const [country, setCountry] = useState<any>({ callingCode: ["91"] });
  const [isCountrycodeModal, setCountrycodeModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState("");

  const validatePhoneNumber = (input: string) => {
    setPhoneNumber(input);

    const phoneNumber = parsePhoneNumberFromString(input, countryCode);
    const valid = phoneNumber?.isValid() || false;
    setIsValid(valid ? "" : "✕ Invalid number");
  };

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCountry(country);
  };

  const handleNext = async () => {
    try {
      if (phoneNumber.length === 0) {
        setIsValid("Please enter a valid phone number");
        return;
      }
      if (isValid === "") {
        // Parse the number with default country (India = "IN")
        const phone = parsePhoneNumberFromString(phoneNumber, countryCode);
        if (phone && phone?.number) {
          // Format into international with spaces // +91 85110 45454
          onPhoneNumber(phone.formatInternational());
        }
      }
    } catch (error) {
      console.log("handleNext error", error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onRequestClose}
      onDismiss={onRequestClose}
    >
      <KeyboardAvoidingView style={styles.modalContainer} behavior="height">
        <View>
          <View style={styles.mainView}>
            <View style={styles.textInputView}>
              <Pressable
                style={styles.countryCodeButton}
                onPress={() => setCountrycodeModal(true)}
              >
                <CountryPicker
                  {...{
                    countryCode,
                    withFilter: true,
                    withAlphaFilter: true,
                    withCallingCode: true,
                    onSelect,
                    onOpen: () => setCountrycodeModal(true),
                  }}
                  onClose={() => setCountrycodeModal(false)}
                  modalProps={{
                    visible: isCountrycodeModal,
                  }}
                />
                <Text
                  style={{
                    marginRight: wp(2),
                  }}
                >
                  + {country?.callingCode[0]}
                </Text>
              </Pressable>
              <TextInput
                placeholder="enter your phone number"
                placeholderTextColor={"gray"}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={validatePhoneNumber}
              />
            </View>
            {isValid && <Text style={styles.message}>{isValid}</Text>}
            <TouchableOpacity
              style={styles.confirmButton}
              disabled={false}
              onPress={handleNext}
            >
              {false ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PhoneNumberInputModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: colors.black_900,
  },
  confirmButton: {
    marginTop: hp(2),
    backgroundColor: colors.primary,
    height: hp(6),
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: RFValue(14),
    fontWeight: "bold",
  },
  mainView: {
    backgroundColor: colors.dark_pink_1,
    width: wp(100),
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  textInputView: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 12,
    paddingHorizontal: wp(3),
    height: hp(6),
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    marginTop: hp(1),
    color: "red",
  },
});
