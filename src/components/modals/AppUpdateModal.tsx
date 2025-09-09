import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { hp, RFValue, wp } from "../../helper/Responsive";
import { colors } from "@/src/utils/colors";
import { AppUpdateModalProps } from "@/src/interface/Types";

const AppUpdateModal = ({ isVisible, onPress }: AppUpdateModalProps) => {
  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.mainView}>
        <View style={styles.secondBoxView}>
          <Text style={styles.title}>APP UPDATE</Text>
          <Text style={styles.des}>
            Things are changing around here! please update the app to get the
            best experience
          </Text>
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.updateNow}>Update now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AppUpdateModal;

const styles = StyleSheet.create({
  mainView: {
    height:hp(100),
    width:wp(100),
    backgroundColor: colors.black_4,
    justifyContent: "center",
    alignItems: "center",
  },
  secondBoxView: {
    backgroundColor: colors.white,
    width: wp(90),
    alignItems: "center",
    paddingVertical: hp(2),
    borderRadius: 12,
  },
  title: {
    fontWeight: "bold",
    color: "red",
    fontSize: RFValue(18),
  },
  des: {
    textAlign: "center",
    paddingVertical: hp(1),
    width: wp(70),
    fontSize: RFValue(13),
  },
  button: {
    backgroundColor: colors.light_white_1,
    justifyContent: "center",
    alignItems: "center",
    width: wp(60),
    height: hp(5),
    borderRadius: 50,
    marginTop: hp(1),
  },
  updateNow: {
    color: colors.white,
    fontWeight: "600",
    fontSize: RFValue(14),
  },
});
