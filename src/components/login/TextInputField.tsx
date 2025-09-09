import { StyleSheet, TextInput } from "react-native";
import React from "react";
import { hp, wp } from "@/src/helper/Responsive";
import { colors } from "@/src/utils/colors";
import { FontPath } from "@/src/utils/FontPath";
import { TextInputFieldProps } from "@/src/interface/Types";

const TextInputField = ({
  value,
  onChangeText,
  editable,
  placeholder,
}: TextInputFieldProps) => {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.light_Gray}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      textContentType="oneTimeCode"
      autoComplete="off"
      autoCorrect={false}
      spellCheck={false}
    />
  );
};

export default TextInputField;

const styles = StyleSheet.create({
  input: {
    width: wp(85),
    height: hp(6),
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: wp(5),
    marginVertical: hp(0.5),
    borderColor: colors.light_Gray,
    borderWidth: 1,
    color: colors.black,
    fontFamily: FontPath.QuattrocentoRegular,
  },
});
