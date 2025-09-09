import { StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { hp, wp } from "../helper/Responsive";
import { colors } from "../utils/colors";
import { BackButtonProps } from "../interface/Types";

const BackButton = ({ buttonStyle, onClick, disabled }: BackButtonProps) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[styles.backButton, buttonStyle]}
      onPress={
        disabled ? undefined : onClick ? onClick : () => navigation.goBack()
      }
    >
      <MaterialCommunityIcons
        name="keyboard-backspace"
        size={28}
        color="black"
      />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: hp(2),
    zIndex: 1,
    backgroundColor: colors.white,
    marginHorizontal: 10,
    padding: wp(0.5),
    borderRadius: 50,
  },
});
