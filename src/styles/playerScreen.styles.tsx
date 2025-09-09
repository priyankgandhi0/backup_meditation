import { Dimensions, StyleSheet } from "react-native";
import { hp, isiPAD, isX, RFValue, wp } from "../helper/Responsive";
const { width } = Dimensions.get("window");

// Define breakpoints for phone and tablet
const isTablet = width >= 768;

export const MAIN_COLOR = "#EEDFFE";
export const DARK_COLOR = "#060005";
export const PURPLE_COLOR = "#571CB3";
export const PURPLE_COLOR_SOFT = "#8C66C8";
export const BG_COLOR = MAIN_COLOR;
export const BUTTON_COLOR = DARK_COLOR;

export const playerStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "transparent", // Ensures the background image is visible
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "110%",
    resizeMode: "cover",
  },
  header: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
  },
  trackImageContainer: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  trackImage: {
    width: isiPAD ? wp(35) : isX ? wp(40) : wp(50),
    height: isiPAD ? wp(35) : isX ? wp(40) : wp(50),
    resizeMode: "contain", // Base style for track image
  },
  title: {
    // Separate top margin for phone and tablet
    marginVertical: hp(3),
    fontSize: RFValue(16),
    alignSelf: "center",
    fontWeight: "bold",
    color: DARK_COLOR,
  },
  controlsContainer: {
    marginVertical: hp(2),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf:'center',
    justifyContent: "space-between",
    width: wp(50),
    marginTop:hp(3)
  },
  playPauseButton: {
    backgroundColor: "#72616d50",
    borderRadius: 50,
    padding: wp(2),
    // elevation: 5,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(1),
  },
  volumeLabel: {
    marginRight: 10,
    color: DARK_COLOR,
  },
  stopButton: {
    marginTop: 20,
    color: "RED",
  },
  optionsContainer: {
    width: wp(80),
    marginTop: hp(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    alignItems: "center",
  },
  optionText: {
    textAlign: "center",
    color: DARK_COLOR,
    marginTop: 8,
  },
  logo: {
    width: wp(100),
    height: wp(32),
    resizeMode: "stretch",
  },
});

export default playerStyles;
