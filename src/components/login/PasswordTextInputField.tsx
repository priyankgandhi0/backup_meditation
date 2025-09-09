import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import React from "react";
import { hp, wp } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { Ionicons } from "@expo/vector-icons";
import { FontPath } from "@/src/utils/FontPath";
import { PasswordTextInputFieldProps } from "@/src/interface/Types";

const PasswordTextInputField = ({
  onPress,
  secureTextEntry,
  value,
  editable,
  onChangeText,
  isVisible,
  placeholder,
}: PasswordTextInputFieldProps) => {
  return (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor={colors.light_Gray}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
      <TouchableOpacity onPress={onPress} style={styles.eyeIcon}>
        <Ionicons
          name={isVisible ? "eye-off" : "eye"}
          size={24}
          color={colors.light_Gray}
        />
      </TouchableOpacity>
    </View>
  );
};

export default PasswordTextInputField;

const styles = StyleSheet.create({
  passwordContainer: {
    width: wp(85),
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(0.5),
  },
  passwordInput: {
    flex: 1,
    height: hp(6),
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: wp(5),
    borderColor: colors.light_Gray,
    borderWidth: 1,
    color: colors.black,
    paddingRight: wp(5),
    fontFamily: FontPath.QuattrocentoRegular,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
});
