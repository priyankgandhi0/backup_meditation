import { StyleSheet } from "react-native";
import { colors } from "../utils/colors";
import { hp, wp } from "../helper/Responsive";

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:colors.black_900,
  },
  modalContainer: {
    backgroundColor: colors.dark_pink_1,
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
    marginBottom: hp(1.5),
  },
});
