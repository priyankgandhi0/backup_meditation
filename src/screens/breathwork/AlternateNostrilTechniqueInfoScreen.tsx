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
import { trackScreenView } from "@/src/utils/analytics";
// import { RootStackParamList } from "@/src/navigation/NavigationType"; // Ensure this path is correct or adjust as needed

const { width, height } = Dimensions.get("window");
const isiPAD = Platform.OS === "ios" && (width >= 768 || height >= 1024);

// Durations for Alternate Nostril Breathing Demo
const INHALE_DURATION = 6;
const HOLD_DURATION = 2;
const EXHALE_DURATION = 8;

interface DemoAlternateNostrilBreathProps {
  visible: boolean;
  onClose: () => void;
}

const DemoAlternateNostrilBreath: React.FC<DemoAlternateNostrilBreathProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState(0); // 0: Inhale L, 1: Hold 1, 2: Exhale R, 3: Inhale R, 4: Hold 2, 5: Exhale L
  const [running, setRunning] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [instruction, setInstruction] = useState("Tap Start to Begin");

  useEffect(() => {
    trackScreenView("AlternateNostrilTechniqueInfo", "AlternateNostrilTechniqueInfoScreen");
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
    nextStepFn?: () => void
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
    // Inhale Left
    runStep(1.3, INHALE_DURATION, `Inhale Left... (${INHALE_DURATION}s)`, () => {
      setStep(1);
      // Hold 1
      runStep(1.3, HOLD_DURATION, `Hold... (${HOLD_DURATION}s)`, () => {
        setStep(2);
        // Exhale Right
        runStep(1, EXHALE_DURATION, `Exhale Right... (${EXHALE_DURATION}s)`, () => {
          setStep(3);
          // Inhale Right
          runStep(1.3, INHALE_DURATION, `Inhale Right... (${INHALE_DURATION}s)`, () => {
            setStep(4);
            // Hold 2
            runStep(1.3, HOLD_DURATION, `Hold... (${HOLD_DURATION}s)`, () => {
              setStep(5);
              // Exhale Left
              runStep(1, EXHALE_DURATION, `Exhale Left... (${EXHALE_DURATION}s)`, () => {
                setInstruction("Cycle Complete! Tap Close or Start Again.");
                setRunning(false);
              });
            });
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
          <Text style={styles.demoStepTitle}>Alternate Nostril Breathing Demo</Text>
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

interface AlternateNostrilTechniqueInfoScreenProps {
  navigation: StackNavigationProp<any, any>; // TEMPORARY FIX: Changed to any. Update RootStackParamList!
}

const AlternateNostrilTechniqueInfoScreen: React.FC<AlternateNostrilTechniqueInfoScreenProps> = ({ navigation }) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={isiPAD ? 32 : 26} color="#59859C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alternate Nostril Breathing</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.sectionTitle}>
          The Technique: Nadi Shodhana (6-2-8 Alternating)
        </Text>
        <View style={styles.sectionTextContainer}>
          <Text style={styles.sectionText}>
            Nadi Shodhana, or Alternate Nostril Breathing, is a calming practice that involves breathing through one nostril at a time. You will typically use your right hand to gently close off the nostrils: use the thumb for the right nostril and the ring finger for the left.
          </Text>
          <Text style={styles.sectionText}>
            1. <Text style={{ fontWeight: "bold" }}>Close Right Nostril, Inhale Left (6s):</Text> Gently close your right nostril with your thumb. Inhale slowly and deeply through your left nostril for a count of 6.
          </Text>
          <Text style={styles.sectionText}>
            2. <Text style={{ fontWeight: "bold" }}>Hold Breath (2s):</Text> Close both nostrils (left with ring finger, right still with thumb) and hold your breath gently for a count of 2.
          </Text>
          <Text style={styles.sectionText}>
            3. <Text style={{ fontWeight: "bold" }}>Open Right Nostril, Exhale Right (8s):</Text> Keep left nostril closed. Release your thumb from the right nostril and exhale slowly and completely through it for a count of 8.
          </Text>
          <Text style={styles.sectionText}>
            4. <Text style={{ fontWeight: "bold" }}>Inhale Right (6s):</Text> Keep left nostril closed. Inhale slowly and deeply through your right nostril for a count of 6.
          </Text>
          <Text style={styles.sectionText}>
            5. <Text style={{ fontWeight: "bold" }}>Hold Breath (2s):</Text> Close both nostrils again and hold your breath gently for a count of 2.
          </Text>
          <Text style={styles.sectionText}>
            6. <Text style={{ fontWeight: "bold" }}>Open Left Nostril, Exhale Left (8s):</Text> Keep right nostril closed. Release your ring finger from the left nostril and exhale slowly through it for a count of 8.
          </Text>
          <Text style={styles.sectionText}>
            This completes one full cycle. Continue alternating for several rounds.
          </Text>
        </View>
        <TouchableOpacity style={styles.demoButton} onPress={() => setShowDemo(true)}>
          <Ionicons name="play-circle-outline" size={28} color="#53b9e5" style={{ marginRight: 8 }} />
          <Text style={styles.demoButtonText}>Interactive Demo (6-2-8 Alt.)</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionText}>
          Alternate Nostril Breathing is believed to balance the flow of prana (life force energy) in the body by purifying the nadis (energy channels). It helps to calm the mind, reduce stress and anxiety, improve focus and concentration, and promote overall well-being. It can also help balance the left and right hemispheres of the brain.
        </Text>

        <View style={styles.diagramWrapper}>
          <Text style={styles.diagramLabel}>Nadi Shodhana Visual (One Half-Cycle):</Text>
          <View style={styles.diagramRow}>
            <View style={styles.diagramCircle}>
              <Text style={styles.diagramStep}>6s</Text>
              <Text style={styles.diagramDesc}>Inhale (Left)</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#c8e6c9" }]}>
              <Text style={styles.diagramStep}>2s</Text>
              <Text style={styles.diagramDesc}>Hold</Text>
            </View>
            <Ionicons name="arrow-forward" size={isiPAD ? 38 : 22} color="#9cc" />
            <View style={[styles.diagramCircle, { backgroundColor: "#b4eaff" }]}>
              <Text style={styles.diagramStep}>8s</Text>
              <Text style={styles.diagramDesc}>Exhale (Right)</Text>
            </View>
          </View>
          <Text style={[styles.sectionText, {textAlign: 'center', marginTop: 15}]}>
            Then, switch sides: Inhale Right (6s), Hold (2s), Exhale Left (8s). Continue alternating.
          </Text>
        </View>
      </ScrollView>
      <DemoAlternateNostrilBreath visible={showDemo} onClose={() => setShowDemo(false)} />
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
  sectionTextContainer: { 
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
    justifyContent: "center", 
    flexWrap: "wrap", 
    gap: isiPAD ? 15 : 8, 
  },
  diagramCircle: {
    width: isiPAD ? 70 : 40, 
    height: isiPAD ? 70 : 40,
    borderRadius: isiPAD ? 35 : 20,
    backgroundColor: "#e3f4fc",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: isiPAD ? 7 : 3, 
    borderWidth: 1.8,
    borderColor: "#a7dbe9",
  },
  diagramStep: {
    fontSize: isiPAD ? 28 : 16, 
    color: "#53b9e5",
    fontWeight: "bold",
    fontFamily: "Quattrocento",
  },
  diagramDesc: {
    fontSize: isiPAD ? 18 : 9, 
    color: "#59859C",
    fontFamily: "Quattrocento",
    textAlign: "center", 
  },
});

export default AlternateNostrilTechniqueInfoScreen;
