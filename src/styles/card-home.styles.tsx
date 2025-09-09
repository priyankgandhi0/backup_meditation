import { FontPath } from "@/src/utils/FontPath";
import { Dimensions, StyleSheet } from "react-native";
import { colors } from "@/src/utils/colors";
import { hp, isiPAD, wp } from "../helper/Responsive";

// Detect if device is a tablet
const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export const homeCardStyles = StyleSheet.create({
  title: {
    fontSize: isTablet ? 27 : 20,
    color: colors.black,
    fontWeight: "400", // “light” can be replaced with numeric or standard weight
    fontFamily: FontPath.QuattrocentoRegular,
    textAlign: "left",
    // Remove marginLeft, marginRight, marginHorizontal if you're using container padding
    marginBottom: hp(1),
    marginLeft: wp(3),
  },
  seeAll: {
    fontSize: isTablet ? 27 : 18,
    color: colors.black,
    fontFamily: FontPath.QuattrocentoRegular,
    // Optionally underline and add spacing if desired
    textDecorationLine: "underline",
  },
  titleTextCard: {
    color: colors.white,
    fontSize: isTablet ? 27 : 15,
    textTransform: "capitalize",
    flex: 1,
    overflow: "hidden",
    textAlign: "center",
    fontFamily: FontPath.QuattrocentoRegular,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Title left, See All right
    paddingHorizontal: wp(5), 
    height:hp(5)
  },
  upgradeButton: {
    borderRadius: 100,
    width: wp(8),
    height: wp(8),
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: wp(1.5),
    top: hp(1),
    backgroundColor: colors.primary,
  },
  progressContainer: {
    position: "absolute",
    right: wp(1.5),
    top: hp(1),
    backgroundColor: colors.black_2,
    borderRadius: 100,
    padding: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContainer: {
    marginRight: wp(2),
    marginBottom: hp(1),
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  image: {
    height: isiPAD ? hp(18) : hp(15),
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
});
