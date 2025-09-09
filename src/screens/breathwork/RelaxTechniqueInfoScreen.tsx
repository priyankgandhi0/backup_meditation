import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trackScreenView } from "@/src/utils/analytics";

const { width, height } = Dimensions.get("window");
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);

const INHALE = 4;
const HOLD = 7;
const EXHALE = 8;

const DemoBreath = ({ visible, onClose }) => {
  const [step, setStep] = useState(0); // 0: inhale, 1: hold, 2: exhale
  const [running, setRunning] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [instruction, setInstruction] = useState("Tap Start to Begin");

  useEffect(() => {
    trackScreenView("RelaxTechniqueInfo", "RelaxTechniqueInfoScreen");
  }, []);

  // Reset state when modal is opened
  React.useEffect(() => {
    if (visible) {
      setRunning(false);
      setInstruction("Tap Start to Begin");
      setStep(0);
      scaleAnim.setValue(1);
    }
  }, [visible]);

  // Helper for timing
  const runStep = (toValue, duration, instruction, nextStep) => {
    setInstruction(instruction);
    Animated.timing(scaleAnim, {
      toValue,
      duration: duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (nextStep) nextStep();
      else setRunning(false);
    });
  };

  const startCycle = () => {
    setRunning(true);
    setStep(0);
    // Inhale
    runStep(1.35, INHALE, "Inhale… (4s)", () => {
      setStep(1);
      // Hold (just glow)
      runStep(1.35, HOLD, "Hold… (7s)", () => {
        setStep(2);
        // Exhale
        runStep(1, EXHALE, "Exhale… (8s)", () => {
          setInstruction("Cycle Complete! Tap Close or Start Again.");
          setRunning(false);
        });
      });
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.demoOverlay}>
        <View style={styles.demoCard}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color="#53b9e5" />
          </TouchableOpacity>
          <Text style={styles.demoStepTitle}>4-7-8 Breathing Demo</Text>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: "#b4eaff", // Always the same color
                  shadowOpacity: 0.65,
                },
              ]}
            />
            <Text style={styles.breathInstruction}>{instruction}</Text>
          </View>
          {running ? (
            <TouchableOpacity
              style={styles.demoButton}
              onPress={onClose}
            >
              <Text style={[styles.demoButtonText, { color: "#53b9e5" }]}>Close</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.demoButton}
              onPress={startCycle}
            >
              <Ionicons
                name="play-circle-outline"
                size={isiPAD ? 42 : 32}
                color="#53b9e5"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.demoButtonText}>Start Demo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const TechniqueInfoScreen = ({ navigation }) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={isiPAD ? 32 : 26} color="#59859C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Technique Details</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.sectionTitle}>
          The Technique: Extended Exhale (4-7-8)
        </Text>
        <Text style={styles.sectionText}>
          1. <Text style={{ fontWeight: "bold" }}>Inhale</Text> deeply through your
          nose for a count of{" "}
          <Text style={{ fontWeight: "bold" }}>4</Text> seconds, filling your
          belly with air.
          {"\n\n"}
          2. <Text style={{ fontWeight: "bold" }}>Hold</Text> your breath for a
          count of{" "}
          <Text style={{ fontWeight: "bold" }}>7</Text> seconds. Let your body
          relax and absorb the oxygen.
          {"\n\n"}
          3. <Text style={{ fontWeight: "bold" }}>Exhale</Text> slowly through
          your mouth for a count of{" "}
          <Text style={{ fontWeight: "bold" }}>8</Text> seconds, with your lips
          pursed as if blowing out a candle. Listen for the gentle “whooshing”
          sound as you release the air.
          {"\n\n"}
          Repeat this cycle for several rounds, letting each breath guide you
          deeper into relaxation.
        </Text>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setShowDemo(true)}
        >
          <Ionicons name="play-circle-outline" size={28} color="#53b9e5" style={{ marginRight: 8 }} />
          <Text style={styles.demoButtonText}>Interactive 4-7-8 Demo</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionText}>
          Taking a big breath in followed by a longer, slower breath out signals a
          state of relaxation to the body and reduces stress. The longer exhales
          compared to the inhales help to slow down heart rate and relax the
          nerves.
        </Text>

        <View style={styles.diagramWrapper}>
          <Text style={styles.diagramLabel}>4-7-8 Visual:</Text>
          <View style={styles.diagramRow}>
            <View style={styles.diagramCircle}>
              <Text style={styles.diagramStep}>4</Text>
              <Text style={styles.diagramDesc}>Inhale</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#b4eaff" }]}>
              <Text style={styles.diagramStep}>7</Text>
              <Text style={styles.diagramDesc}>Hold</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#d3f9e6" }]}>
              <Text style={styles.diagramStep}>8</Text>
              <Text style={styles.diagramDesc}>Exhale</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <DemoBreath visible={showDemo} onClose={() => setShowDemo(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fbfd" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: isiPAD ? 70 : 50,
    paddingHorizontal: isiPAD ? 32 : 16,
    marginBottom: isiPAD ? 24 : 14,
  },
  headerTitle: {
    fontSize: isiPAD ? 32 : 19,
    fontWeight: "bold",
    color: "#59859C",
    marginLeft: isiPAD ? 24 : 14,
    fontFamily: "Quattrocento",
  },
  sectionTitle: {
    fontSize: isiPAD ? 28 : 17,
    fontWeight: "bold",
    color: "#59859C",
    marginTop: isiPAD ? 36 : 22,
    marginBottom: isiPAD ? 16 : 8,
    fontFamily: "Quattrocento",
  },
  sectionText: {
    fontSize: isiPAD ? 23 : 15.5,
    color: "#333",
    lineHeight: isiPAD ? 36 : 24,
    fontFamily: "Quattrocento",
    marginBottom: isiPAD ? 16 : 8,
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f4fc",
    paddingVertical: isiPAD ? 20 : 12,
    paddingHorizontal: isiPAD ? 36 : 22,
    borderRadius: 28,
    alignSelf: "center",
    shadowColor: "#53b9e5",
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 1,
    marginVertical: 16,
  },
  demoButtonText: {
    fontSize: isiPAD ? 22 : 16,
    color: "#53b9e5",
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
  // Demo Modal styles
  demoOverlay: {
    flex: 1,
    backgroundColor: "#0007",
    alignItems: "center",
    justifyContent: "center",
  },
  demoCard: {
    width: isiPAD ? 460 : 320,
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: isiPAD ? 38 : 22,
    alignItems: "center",
    shadowColor: "#333",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  closeIcon: {
    position: "absolute",
    top: isiPAD ? 12 : 3,
    right: isiPAD ? 12 : 3,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#0000",
  },
  demoStepTitle: {
    fontSize: isiPAD ? 36 : 22,
    fontWeight: "bold",
    color: "#53b9e5",
    marginBottom: 22,
    fontFamily: "Quattrocento",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: isiPAD ? 22 : 10,
    minHeight: isiPAD ? 200 : 140,
  },
  breathCircle: {
    width: isiPAD ? 140 : 90,
    height: isiPAD ? 140 : 90,
    borderRadius: isiPAD ? 70 : 45,
    backgroundColor: "#53b9e5",
    marginBottom: isiPAD ? 18 : 10,
    shadowColor: "#53b9e5",
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  breathInstruction: {
    fontSize: isiPAD ? 26 : 17,
    color: "#333",
    textAlign: "center",
    marginTop: isiPAD ? 12 : 4,
    fontFamily: "Quattrocento",
  },
  // Diagram styles
  diagramWrapper: {
    alignItems: "center",
    marginTop: isiPAD ? 42 : 24,
    marginBottom: isiPAD ? 24 : 14,
  },
  diagramLabel: {
    fontSize: isiPAD ? 22 : 14,
    color: "#59859C",
    fontWeight: "bold",
    marginBottom: isiPAD ? 16 : 7,
    fontFamily: "Quattrocento",
  },
  diagramRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isiPAD ? 26 : 10,
  },
  diagramCircle: {
    width: isiPAD ? 80 : 42,
    height: isiPAD ? 80 : 42,
    borderRadius: isiPAD ? 40 : 21,
    backgroundColor: "#e3f4fc",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: isiPAD ? 9 : 4,
    borderWidth: 1.8,
    borderColor: "#a7dbe9",
  },
  diagramStep: {
    fontSize: isiPAD ? 32 : 18,
    color: "#53b9e5",
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
  diagramDesc: {
    fontSize: isiPAD ? 20 : 10,
    color: "#59859C",
    fontFamily: "Quattrocento",
  },
});

export default TechniqueInfoScreen;
