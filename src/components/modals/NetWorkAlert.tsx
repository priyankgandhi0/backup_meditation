import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from "react-native";
import { startActivityAsync, ActivityAction } from "expo-intent-launcher";
import { colors } from "@/src/utils/colors";
import { hp, wp } from "@/src/helper/Responsive";
import { AlertModalProps } from "@/src/interface/Types";


const NetWorkAlert = ({ visible, onClose }: AlertModalProps) => {
  const openWifiSettings = () => {
    if (Platform.OS === "android") {
      startActivityAsync(ActivityAction.WIFI_SETTINGS);
    } else {
      Linking.openURL("app-settings:");
    }
  };

  const openMobileDataSettings = () => {
    if (Platform.OS === "android") {
      startActivityAsync(ActivityAction.DATA_ROAMING_SETTINGS);
    } else {
      Linking.openURL("app-settings:");
    }
  };

  return (
    <Modal
      visible={!visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.modalTitle}>Network Connection Lost</Text>
          <Text style={modalStyles.modalItem}>
            It seems you are not connected to a network. Please choose one of
            the following options to restore your connection:
          </Text>

          <TouchableOpacity
            onPress={openWifiSettings}
            style={modalStyles.optionButton}
          >
            <Text style={modalStyles.optionButtonText}>Connect to Wi-Fi</Text>
            <Ionicons name="wifi-outline" color={colors.white} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openMobileDataSettings}
            style={modalStyles.optionButton}
          >
            <Text style={modalStyles.optionButtonText}>Enable Mobile Data</Text>
            <Ionicons name="cellular-outline" color={colors.white} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NetWorkAlert;

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:colors.black_900,
  },
  modalContainer: {
    backgroundColor: colors.light_white_1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: wp(4),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: hp(2),
    color: colors.dark_mauve_4,
  },
  modalItem: {
    fontSize: 14,
    color: colors.dark_mauve_4,
  },
  optionButton: {
    marginTop: hp(2),
    padding: wp(4),
    backgroundColor: colors.primary,
    borderRadius: 5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  optionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    marginRight: wp(2),
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: colors.dark_mauve_4,
    borderRadius: 5,
    alignItems: "center",
  },
});
