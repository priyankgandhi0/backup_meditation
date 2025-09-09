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
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/NavigationType"; // Import for navigation param list
import { trackScreenView } from "@/src/utils/analytics";

const { width, height } = Dimensions.get("window");
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);

// Durations for Deep Belly Breathing Demo
const INHALE_BELLY_DURATION = 3;
const INHALE_CHEST_DURATION = 3;
const HOLD_DURATION = 2;
const EXHALE_DURATION = 8;

interface DemoBellyBreathProps {
  visible: boolean;
  onClose: () => void;
}

const DemoBellyBreath: React.FC<DemoBellyBreathProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState(0); // 0: Inhale Belly, 1: Inhale Chest, 2: Hold, 3: Exhale
  const [running, setRunning] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [instruction, setInstruction] = useState("Tap Start to Begin");

  useEffect(() => {
    trackScreenView("BellyTechniqueInfo", "BellyTechniqueInfoScreen");
  }, []);

  React.useEffect(() => {
    if (visible) {
      setRunning(false);
      setInstruction("Tap Start to Begin");
      setStep(0);
      scaleAnim.setValue(1);
    }
  }, [visible]);

  const runStep = (
    toValue: number,
    duration: number,
    instructionText: string,
    nextStepFn?: () => void // Optional callback
  ) => {
    setInstruction(instructionText);
    Animated.timing(scaleAnim, {
      toValue,
      duration: duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (nextStepFn) nextStepFn();
      else setRunning(false);
    });
  };

  const startCycle = () => {
    setRunning(true);
    setStep(0);
    // Inhale Belly
    runStep(1.2, INHALE_BELLY_DURATION, `Inhale Belly... (${INHALE_BELLY_DURATION}s)`, () => {
      setStep(1);
      // Inhale Chest
      runStep(1.4, INHALE_CHEST_DURATION, `Inhale Chest... (${INHALE_CHEST_DURATION}s)`, () => {
        setStep(2);
        // Hold
        runStep(1.4, HOLD_DURATION, `Hold... (${HOLD_DURATION}s)`, () => {
          setStep(3);
          // Exhale
          runStep(1, EXHALE_DURATION, `Exhale... (${EXHALE_DURATION}s)`, () => {
            setInstruction("Cycle Complete! Tap Close or Start Again.");
            setRunning(false);
          });
        });
      });
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.demoOverlay}>
        <View style={styles.demoCard}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose} accessibilityLabel="Close">
            <Ionicons name="close" size={28} color="#53b9e5" />
          </TouchableOpacity>
          <Text style={styles.demoStepTitle}>Deep Belly Breathing Demo</Text>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: "#b4eaff",
                  shadowOpacity: 0.65,
                },
              ]}
            />
            <Text style={styles.breathInstruction}>{instruction}</Text>
          </View>
          {running ? (
            <TouchableOpacity style={styles.demoButton} onPress={onClose}>
              <Text style={[styles.demoButtonText, { color: "#53b9e5" }]}>Close</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.demoButton} onPress={startCycle}>
              <Ionicons name="play-circle-outline" size={isiPAD ? 42 : 32} color="#53b9e5" style={{ marginRight: 10 }} />
              <Text style={styles.demoButtonText}>Start Demo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface BellyTechniqueInfoScreenProps {
  // navigation: StackNavigationProp<RootStackParamList, 'BellyTechniqueInfoScreen'>; // Typed navigation prop
  navigation: StackNavigationProp<any, any>; // TEMPORARY FIX: Changed to any. Update RootStackParamList!
}

const BellyTechniqueInfoScreen: React.FC<BellyTechniqueInfoScreenProps> = ({ navigation }) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={isiPAD ? 32 : 26} color="#59859C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deep Belly Breathing</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.sectionTitle}>
          The Technique: Deep Belly Breathing (3-3-2-8)
        </Text>
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionText}>
            1. <Text style={{ fontWeight: "bold" }}>Inhale into Belly (3s):</Text> Breathe in slowly through your nose, allowing your belly to expand first. Feel the diaphragm lower.
          </Text>
          <Text style={styles.sectionText}>
            2. <Text style={{ fontWeight: "bold" }}>Inhale into Chest (3s):</Text> Continue inhaling, now allowing your chest to expand. Feel your rib cage lift and widen.
          </Text>
          <Text style={styles.sectionText}>
            3. <Text style={{ fontWeight: "bold" }}>Hold (2s):</Text> Gently hold your breath for a brief moment.
          </Text>
          <Text style={styles.sectionText}>
            4. <Text style={{ fontWeight: "bold" }}>Exhale (8s):</Text> Exhale slowly and completely through your mouth, feeling your chest fall first, then your belly draw in. Make the exhale long and smooth.
          </Text>
          <Text style={styles.sectionText}>
            Repeat this cycle, focusing on the wave-like motion of your breath.
          </Text>
        </View>
        <TouchableOpacity style={styles.demoButton} onPress={() => setShowDemo(true)}>
          <Ionicons name="play-circle-outline" size={28} color="#53b9e5" style={{ marginRight: 8 }} />
          <Text style={styles.demoButtonText}>Interactive Demo (3-3-2-8)</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionText}>
          Deep belly breathing, also known as diaphragmatic breathing, encourages full oxygen exchange. This type of breathing slows the heartbeat and can lower or stabilize blood pressure. It helps to reduce stress, improve core muscle stability, and increase energy by maximizing oxygen intake and promoting relaxation.
        </Text>

        <View style={styles.diagramWrapper}>
          <Text style={styles.diagramLabel}>Deep Belly Breathing Visual (3-3-2-8):</Text>
          <View style={styles.diagramRow}>
            <View style={styles.diagramCircle}>
              <Text style={styles.diagramStep}>3s</Text>
              <Text style={styles.diagramDesc}>Inhale Belly</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#c8e6c9" }]}>
              <Text style={styles.diagramStep}>3s</Text>
              <Text style={styles.diagramDesc}>Inhale Chest</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#b4eaff" }]}>
              <Text style={styles.diagramStep}>2s</Text>
              <Text style={styles.diagramDesc}>Hold</Text>
            </View>
          </View>
          <View style={[styles.diagramRow, { marginTop: isiPAD ? 15 : 10}]}>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#d3f9e6" }]}>
              <Text style={styles.diagramStep}>8s</Text>
              <Text style={styles.diagramDesc}>Exhale</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <DemoBellyBreath visible={showDemo} onClose={() => setShowDemo(false)} />
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
  sectionTextContainer: { // Style for the new container
    marginBottom: isiPAD ? 16 : 8,
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
    justifyContent: "center", // Changed to center for potentially fewer items
    flexWrap: "wrap", // Allow wrapping if not enough space for 4 items
    gap: isiPAD ? 15 : 8, // Adjusted gap
  },
  diagramCircle: {
    width: isiPAD ? 70 : 40, // Slightly smaller to fit 4 if needed, or adjust layout
    height: isiPAD ? 70 : 40,
    borderRadius: isiPAD ? 35 : 20,
    backgroundColor: "#e3f4fc",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: isiPAD ? 7 : 3, // Adjusted margin
    borderWidth: 1.8,
    borderColor: "#a7dbe9",
  },
  diagramStep: {
    fontSize: isiPAD ? 28 : 16, // Adjusted font size
    color: "#53b9e5",
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
  diagramDesc: {
    fontSize: isiPAD ? 18 : 9, // Adjusted font size
    color: "#59859C",
    fontFamily: "Quattrocento",
    textAlign: "center", // Center description text
  },
});

export default BellyTechniqueInfoScreen;
