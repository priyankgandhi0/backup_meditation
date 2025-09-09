import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Animated,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { hp, wp } from "../helper/Responsive";
import { colors } from "../utils/colors";
import TopicCard from "./TopicCard";
import { QACard, SearchBar } from "./QACard";
import { GeneralFAQs } from "../data/GeneralFAQs";
import { MembershipFAQs } from "../data/MembershipFAQs";
import { CourseFAQs } from "../data/CourseFAQs";
import { AppFAQs } from "../data/AppFAQs";
import { TechnicalFAQs } from "../data/TechnicalFAQs";
import { QAItem } from "../types/chatbot";
import { handleUserQuestion } from "../utils/qaHandler";
import { transcribeAudioWithGroq } from "../utils/sttService";
import { fetchSpeechAudioDataUrl } from "../utils/ttsService";
import { CustomAlert } from "./login/CustomFeedback";
import { useAppSelector, useAppDispatch } from "../redux/StateType";
import {
  useGetChatTopics,
  useGetChatFaq,
  usePostChatMessage,
  useGetChatSessions,
  useGetChatHistory,
} from "../api/query/ChatService";
import { FontPath } from "../utils/FontPath";
import {
  setCurrentSessionId,
  clearCurrentSessionId,
  setGuestEmail,
  clearGuestEmail,
} from "../redux/slice/ChatSlice";
import { PostChatMessagePayload } from "../api/ApiPayloadType";

// --- Get Screen Dimensions ---
const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth >= 768; // Common breakpoint for tablets

interface ChatbotWindowProps {
  visible: boolean;
  onClose: () => void;
}

type IconName = "call-outline" | "musical-notes-outline";

interface FloatingOption {
  icon: IconName;
  screen: string;
}

interface ChatTopic {
  id: string | number;
  title: string;
  color?: string;
}

interface ChatFAQ extends QAItem {
  id?: string | number;
}

const optionButtons: FloatingOption[] = [
  { icon: "call-outline", screen: "BookACallScreen" },
  { icon: "musical-notes-outline", screen: "SleepMusic" },
];

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  hasAudio?: boolean;
  isLoading?: boolean;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ visible, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<
    string | null
  >(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(
    null
  );
  const [showQA, setShowQA] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatFAQ[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInChat, setIsInChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // --- State for STT ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecordingStt, setIsRecordingStt] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  // --- State for TTS ---
  const [playbackObject, setPlaybackObject] = useState<Audio.Sound | null>(
    null
  );
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // --- State for Email Input (Guest Users) ---
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // --- State for Custom Alert ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // --- Get User Data from Redux ---
  const dispatch = useAppDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const { currentSessionId, guestEmail: persistedGuestEmail } = useAppSelector(
    (state) => state.chat
  );
  const isLoggedIn = !!userData?.user?.email;
  const effectiveUserEmail = userData?.user?.email ?? persistedGuestEmail ?? "";

  // --- TanStack Query Hooks ---
  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    isError: isErrorTopics,
    error: topicsError,
  } = useGetChatTopics();
  const topics = topicsData ?? [];

  const {
    data: currentFaqsData,
    isLoading: isLoadingFaq,
    isError: isErrorFaq,
    error: faqError,
  } = useGetChatFaq(
    { category: selectedTopicCategory! },
    { enabled: !!selectedTopicCategory }
  );
  const currentFaqs = currentFaqsData ?? [];

  const postMessageMutation = usePostChatMessage();

  // Fetch Sessions: Enabled only if we have an email but no session ID yet
  const {
    data: chatSessionsData, // Expected: ChatSessionItem[]
    isFetching: isFetchingSessions,
    isError: isErrorSessions,
    error: sessionsError,
  } = useGetChatSessions(
    { userEmail: effectiveUserEmail },
    { enabled: !!effectiveUserEmail && !currentSessionId } // <-- Enable condition
  );

  // Fetch History: Enabled only if we have a session ID (set by effect below or persisted)
  const {
    data: historyMessagesData,
    isFetching: isFetchingHistory,
    isError: isErrorHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useGetChatHistory(
    { sessionId: currentSessionId ?? "" }, // Pass currentSessionId (hook needs non-null)
    { enabled: !!currentSessionId } // <-- Enable condition depends on sessionId
  );

  // --- Effect to set Session ID from fetched sessions ---
  useEffect(() => {
    // Check if sessions finished loading, we have sessions, and no ID is set yet
    if (
      !isFetchingSessions &&
      chatSessionsData &&
      chatSessionsData.length > 0 &&
      !currentSessionId
    ) {
      // Assuming the API returns sessions sorted newest first
      // Or implement sorting based on lastActivity if available
      const latestSession = chatSessionsData[0];
      if (latestSession?.id) {
        console.log(
          `--- Setting session ID from fetched sessions: ${latestSession.id} ---`
        );
        dispatch(setCurrentSessionId(latestSession.id));
      }
    }
  }, [chatSessionsData, isFetchingSessions, currentSessionId, dispatch]);

  // --- Effect to load initial messages from history ---
  useEffect(() => {
    const historyMessages = historyMessagesData ?? [];
    // console.log(`--- History Effect Triggered --- History Length: ${historyMessages.length}, Fetching History: ${isFetchingHistory}, Session ID: ${currentSessionId}, History Data:`, historyMessagesData);

    // Load history if fetch is done, session exists, and history has content.
    // Removed the hasLoadedHistory checks.
    if (!isFetchingHistory && currentSessionId && historyMessages.length > 0) {
      console.log(
        "--- Loading history into messages state and entering chat ---"
      );
      const formattedMessages: ChatMessage[] = historyMessages.map(
        (item: any) => ({
          id: item.id,
          text: item.text,
          isUser: item.isUser,
        })
      );
      // console.log("--- Formatted History Messages: ---", formattedMessages);
      setMessages(formattedMessages); // Set UI state
      setIsInChat(true);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: false }),
        150
      );
    }
    // Dependencies updated - removed hasLoadedHistory
  }, [historyMessagesData, isFetchingHistory, currentSessionId]); // <-- Removed hasLoadedHistory

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleTopicSelect = (category: string, title: string) => {
    setSelectedTopicCategory(category);
    setSelectedTopicTitle(title);
    setShowQA(true);
    setIsSearchMode(false);
    setSearchResults([]);
  };

  const handleBack = () => {
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchResults([]);
    } else if (showQA) {
      setShowQA(false);
      setSelectedTopicCategory(null);
      setSelectedTopicTitle(null);
    }
  };

  const handleSearch = useCallback(
    (searchText: string) => {
      if (!selectedTopicCategory || !searchText.trim()) {
        setSearchResults([]);
        return;
      }
      const results = currentFaqs.filter(
        (qa: QAItem) =>
          qa.question.toLowerCase().includes(searchText.toLowerCase()) ||
          qa.answer.toLowerCase().includes(searchText.toLowerCase())
      );
      setSearchResults(results);
      setIsSearchMode(true);
    },
    [selectedTopicCategory, currentFaqs]
  );

  // --- STT Function ---
  const handleVoiceInput = async () => {
    if (isRecordingStt) {
      await stopSttRecording();
    } else {
      await startSttRecording();
    }
  };

  const startSttRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setSttError("Microphone permission is required.");
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecordingStt(true);
      setSttError(null);
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecordingStt(false);
      setSttError("Failed to start recording.");
      setRecording(null);
    }
  };

  const stopSttRecording = async () => {
    if (!recording) return;
    setIsRecordingStt(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        transcribeAudio(uri);
      } else {
        setSttError("Failed to get recording data.");
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      setSttError("Failed to stop recording.");
      setRecording(null);
    }
  };

  const transcribeAudio = async (fileUri: string) => {
    setQuestion("Processing voice...");
    setSttError(null);
    setTtsError(null);
    try {
      const transcribedText = await transcribeAudioWithGroq(fileUri);
      setQuestion(transcribedText);
    } catch (error: any) {
      if (error.message?.includes("429")) {
        setAlertTitle("Quota Limit Reached");
        setAlertMessage("Voice limit reached. Use text.");
        setAlertVisible(true);
      } else {
        setSttError("Transcription failed: " + (error.message || "Unknown"));
      }
      setQuestion("");
    }
  };

  const handleSendQuestion = async () => {
    const currentLoggedInEmail = userData?.user?.email;
    const currentGuestEmail = persistedGuestEmail;
    const currentEffectiveEmail = currentLoggedInEmail || currentGuestEmail;

    if (!question.trim() || !currentEffectiveEmail) {
      console.log(
        `--- handleSendQuestion returning early --- Question: ${question.trim()}, Found Email: ${!!currentEffectiveEmail} (Logged In: ${!!currentLoggedInEmail}, Guest: ${!!currentGuestEmail})`
      );
      return;
    }

    setIsInChat(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: question.trim(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = question.trim();
    setQuestion("");

    const loadingMessage: ChatMessage = {
      id: "loading",
      text: "",
      isUser: false,
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    const payload: PostChatMessagePayload = {
      message: currentQuestion,
      userEmail: currentEffectiveEmail,
      sessionId: currentSessionId ?? "",
    };

    // Log the payload being sent
    console.log(
      "--- Sending chat payload to API: ---",
      JSON.stringify(payload, null, 2)
    );

    try {
      const responseData = await postMessageMutation.mutateAsync(payload);

      // Log the raw response received
      console.log(
        "--- Received chat response data from API: ---",
        JSON.stringify(responseData, null, 2)
      );

      const botResponseText = responseData?.text;
      const returnedSessionId = responseData?.sessionId;

      if (!botResponseText) {
        console.error(
          "Chat API Error: Invalid response structure",
          responseData
        );
        throw new Error("Invalid response structure from chat API");
      }

      if (returnedSessionId && returnedSessionId !== currentSessionId) {
        console.log("--- Updating session ID: ---", returnedSessionId);
        dispatch(setCurrentSessionId(returnedSessionId));
      }

      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== "loading")
          .concat({
            id: Date.now().toString() + "-bot",
            text: botResponseText,
            isUser: false,
            hasAudio: true,
          })
      );

      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100
      );
    } catch (error: any) {
      console.error("--- Chat API Error: ---", error);
      if (error.response) {
        console.error("--- Error Response Data: ---", error.response.data);
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : error?.response?.data?.message ||
            "Sorry, I encountered an error sending your message.";

      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== "loading")
          .concat({
            id: Date.now().toString() + "-error",
            text: errorMessage,
            isUser: false,
          })
      );
    }
  };

  // --- Email Submission Handler (for Guest Users) ---
  const handleEmailSubmit = () => {
    if (
      emailInput.trim() &&
      emailInput.includes("@") &&
      emailInput.includes(".")
    ) {
      setEmailError(null);
      dispatch(setGuestEmail(emailInput));
      console.log("Guest email dispatched to Redux:", emailInput);
      setEmailInput("");
    } else {
      setEmailError("Please enter a valid email address.");
    }
  };

  const displayedTopics = showAllTopics ? topics : topics.slice(0, 6);

  const renderQuestionInput = () => (
    <View style={styles.questionInputContainer}>
      <TextInput
        style={styles.questionInput}
        placeholder="Type or hold mic to talk"
        value={question}
        onChangeText={setQuestion}
        multiline={false}
        placeholderTextColor={colors.balck_800}
      />
      <Pressable
        style={({ pressed }) => [
          styles.voiceButton,
          isRecordingStt && styles.voiceButtonRecording,
        ]}
        onPressIn={startSttRecording}
        onPressOut={stopSttRecording}
      >
        <Ionicons name={"mic"} size={24} color={colors.primary} />
      </Pressable>
      <TouchableOpacity
        style={styles.sendButton}
        onPress={handleSendQuestion}
        disabled={!question.trim()}
      >
        <Ionicons
          name="send"
          size={24}
          color={question.trim() ? colors.primary : colors.gray_3}
        />
      </TouchableOpacity>
    </View>
  );

  const renderWelcomeScreen = () => {
    return (
      <View style={styles.welcomeScreenContainer}>
        <View style={styles.welcomeHeader}>
          <Image
            source={require("../assets/splashscreen_image.png")}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeTitle}>
            Welcome{" "}
            {userData?.user?.email
              ? `${userData.user.email} `
              : persistedGuestEmail
              ? `${persistedGuestEmail} `
              : ""}
            to your personalized journey
          </Text>
        </View>

        {isLoggedIn || persistedGuestEmail ? (
          <View style={styles.loggedInContainer}>
            <Text style={styles.welcomeSubtitle}>
              CHOOSE YOUR WELLBEING PATH
            </Text>
            {isLoadingTopics ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: hp(5) }}
              />
            ) : isErrorTopics ? (
              <Text style={styles.errorText}>
                Error loading topics: {topicsError?.message}
              </Text>
            ) : (
              <>
                <View style={styles.topicsGrid}>
                  {displayedTopics.map((topic, index) => (
                    <View
                      key={`${topic.id}-${index}`}
                      style={styles.topicCardWrapper}
                    >
                      <TopicCard
                        title={topic.title}
                        backgroundColor={topic.color || colors.light_mauve}
                        onPress={() =>
                          handleTopicSelect(topic.category, topic.title)
                        }
                      />
                    </View>
                  ))}
                  {topics.length > 6 && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setShowAllTopics(!showAllTopics)}
                    >
                      <Text style={styles.showMoreText}>
                        {showAllTopics ? "Show Less" : "Show More"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            {renderQuestionInput()}
          </View>
        ) : (
          <View style={styles.guestContainer}>
            <View style={styles.guestEmailPhaseContainer}>
              <Text style={styles.welcomeSubtitle}>
                Enter your email to continue
              </Text>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.gray_3}
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEmailSubmit}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQAScreen = () => (
    <View style={styles.qaContainer}>
      <SearchBar
        onSearch={handleSearch}
        onVoiceInput={handleVoiceInput}
        isRecording={isRecordingStt}
      />
      <ScrollView
        style={styles.qaScrollView}
        contentContainerStyle={styles.qaScrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingFaq ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: hp(5) }}
          />
        ) : isErrorFaq ? (
          <Text style={styles.errorText}>
            Error loading FAQs: {faqError?.message || "Unknown error"}
          </Text>
        ) : (
          <>
            {(isSearchMode ? searchResults : currentFaqs)?.map(
              (qa: QAItem, index: number) => (
                <QACard
                  key={qa.id ? `faq-${qa.id}` : `faq-fallback-${index}`}
                  id={qa.id ? `faq-${qa.id}` : `faq-fallback-${index}`}
                  question={qa.question}
                  answer={qa.answer}
                  backgroundColor={qa.backgroundColor || colors.white}
                  currentlySpeakingId={currentlyPlayingId}
                  isSpeaking={isPlaying}
                  handlePlaySpeech={handlePlaySpeech}
                />
              )
            )}
            {(isSearchMode ? searchResults : currentFaqs).length === 0 &&
              selectedTopicCategory && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {isSearchMode
                      ? "No matching questions found"
                      : "No questions available for this topic yet."}
                  </Text>
                  {isSearchMode && (
                    <TouchableOpacity
                      style={styles.showAllButton}
                      onPress={() => setIsSearchMode(false)}
                    >
                      <Text style={styles.showAllButtonText}>
                        Show All Questions
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </>
        )}
      </ScrollView>
      {renderQuestionInput()}
    </View>
  );

  const renderChatScreen = () => (
    <View style={styles.chatContainer}>
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: hp(2) }}
      >
        {isFetchingHistory && messages.length === 0 && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: hp(5) }}
          />
        )}
        {isErrorHistory && messages.length === 0 && (
          <Text style={styles.errorText}>
            Error loading chat history: {historyError?.message}
          </Text>
        )}
        {messages.map((message) => renderMessage(message))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.questionInput}
          value={question}
          onChangeText={setQuestion}
          placeholder="Type or hold mic to talk"
          placeholderTextColor={colors.gray_2}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSendQuestion}
        />
        <Pressable
          style={({ pressed }) => [
            styles.voiceButton,
            isRecordingStt && styles.voiceButtonRecording,
          ]}
          onPressIn={startSttRecording}
          onPressOut={stopSttRecording}
        >
          <Ionicons name={"mic"} size={24} color={colors.primary} />
        </Pressable>
        <TouchableOpacity
          style={[
            styles.sendButton,
            !question.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendQuestion}
          disabled={!question.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={question.trim() ? colors.primary : colors.gray_2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMessage = (message: ChatMessage) => {
    const isCurrentlyPlaying = message.id === currentlyPlayingId && isPlaying;
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        {!message.isUser && (
          <Image
            source={require("../assets/splashscreen_image.png")}
            style={styles.botAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.botBubble,
            isCurrentlyPlaying && {
              backgroundColor: "transparent",
              padding: 0,
            },
          ]}
        >
          {message.isLoading ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <>
              {!message.isUser ? (
                isCurrentlyPlaying ? (
                  <View style={styles.audioVisualizationContainer}>
                    <Image
                      source={require("../assets/splashscreen_image.png")}
                      style={styles.audioVisImage}
                    />
                    <View style={[styles.concentricCircle, styles.circle1]} />
                    <View style={[styles.concentricCircle, styles.circle2]} />
                    <TouchableOpacity
                      style={styles.audioVisPauseButton}
                      onPress={() => handlePlaySpeech(message.id, message.text)}
                    >
                      <Ionicons
                        name={"pause"}
                        size={wp(8)}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.botMessageText}>{message.text}</Text>
                    {message.hasAudio && (
                      <TouchableOpacity
                        style={styles.audioButton}
                        onPress={() =>
                          handlePlaySpeech(message.id, message.text)
                        }
                      >
                        <Ionicons
                          name={"play-circle-outline"}
                          size={26}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </>
                )
              ) : (
                <Text style={styles.userMessageText}>{message.text}</Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  // --- TTS Functions ---
  const resetSpeechState = async () => {
    if (playbackObject) {
      try {
        await playbackObject.stopAsync();
        await playbackObject.unloadAsync();
      } catch (error) {
        console.error("Error stopping/unloading playback:", error);
      }
    }
    setPlaybackObject(null);
    setIsPlaying(false);
    setCurrentlyPlayingId(null);
    setTtsError(null);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (audioModeError) {
      console.error("Error setting audio mode post-playback:", audioModeError);
    }
  };

  const handlePlaySpeech = async (messageId: string, text: string) => {
    const isCurrentlyPlayingThis = messageId === currentlyPlayingId;
    if (isCurrentlyPlayingThis && isPlaying) {
      if (playbackObject) {
        await playbackObject.pauseAsync();
        setIsPlaying(false);
      }
    } else if (isCurrentlyPlayingThis && !isPlaying) {
      if (playbackObject) {
        await playbackObject.playAsync();
        setIsPlaying(true);
      }
    } else {
      await resetSpeechState();
      setCurrentlyPlayingId(messageId);
      setIsPlaying(true);
      setTtsError(null);
      try {
        const audioDataUrl = await fetchSpeechAudioDataUrl(text);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioDataUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) resetSpeechState();
            } else if (status.error) {
              setTtsError("TTS Error: " + (status.error || "Unknown"));
              resetSpeechState();
            }
          }
        );
        setPlaybackObject(sound);
      } catch (error: any) {
        resetSpeechState();
        if (error.message?.includes("429")) {
          setAlertTitle("Quota Limit Reached");
          setAlertMessage("Voice limit reached. Use text.");
          setAlertVisible(true);
        } else {
          setTtsError("TTS Error: " + (error.message || "Unknown"));
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      resetSpeechState();
    };
  }, []);
  useEffect(() => {
    if (!visible) resetSpeechState();
  }, [visible]);

  // Keep the dynamic offset calculation
  const calculateKeyboardOffset = () => {
    const approxHeaderHeight = hp(7);
    const iosStatusBarHeight = hp(5);
    if (isMaximized) {
      // Maximized: Offset for header (+ status bar on iOS)
      return (
        approxHeaderHeight + (Platform.OS === "ios" ? iosStatusBarHeight : 0)
      );
    } else {
      // Non-maximized:
      if (Platform.OS === "ios") {
        // iOS needs offset for space above modal + header
        const spaceAboveModal = hp(100) - hp(75);
        return spaceAboveModal + approxHeaderHeight;
      } else {
        // Android: Try offset for just the header height
        return approxHeaderHeight;
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isMaximized ? { flex: 1, marginTop: hp(5) } : { height: hp(75) },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => {
                  if (isInChat) setIsInChat(false);
                  else if (showQA) handleBack();
                  else onClose();
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {isInChat
                  ? "Chat with Abhi"
                  : selectedTopicTitle || "AI Assistant"}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={toggleMaximize}
                style={styles.headerButton}
              >
                <Ionicons
                  name={isMaximized ? "contract-outline" : "expand-outline"}
                  size={24}
                  color={colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={calculateKeyboardOffset()}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.outerScrollView}
              contentContainerStyle={styles.outerScrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {isInChat
                ? renderChatScreen()
                : showQA
                ? renderQAScreen()
                : renderWelcomeScreen()}

              {(ttsError ||
                sttError ||
                topicsError ||
                faqError ||
                historyError ||
                postMessageMutation.error) && (
                <Text style={styles.errorText}>
                  {ttsError ||
                    sttError ||
                    topicsError?.message ||
                    faqError?.message ||
                    historyError?.message ||
                    postMessageMutation.error?.message ||
                    "An error occurred"}
                </Text>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    backgroundColor: colors.primary,
  },
  headerLeft: {},
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: colors.white,
    fontSize: isTablet ? wp(4.5) : wp(4.5),
    fontWeight: "bold",
    textAlign: "center",
  },
  headerButton: { paddingHorizontal: wp(2) },
  welcomeScreen: {
    flex: 1,
    padding: wp(4),
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeScreenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  welcomeHeader: {
    alignItems: "center",
    paddingTop: hp(3),
    paddingBottom: hp(1),
  },
  loggedInContainer: {
    paddingHorizontal: wp(4),
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guestEmailPhaseContainer: {
    alignItems: "center",
    paddingBottom: hp(2),
    width: "100%",
    paddingHorizontal: wp(4),
    marginTop: hp(2),
  },
  welcomeImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    marginBottom: hp(2),
  },
  welcomeTitle: {
    fontSize: isTablet ? wp(3.5) : wp(4.5),
    fontFamily: "Quattrocento",
    color: colors.black,
    textAlign: "center",
    marginBottom: hp(1),
  },
  welcomeSubtitle: {
    fontSize: isTablet ? wp(3) : wp(4),
    fontFamily: "Quattrocento",
    color: colors.black,
    marginBottom: hp(2),
    textAlign: "center",
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: hp(1),
    paddingTop: hp(1),
    paddingVertical: hp(1),
  },
  topicCardWrapper: {
    marginBottom: isTablet ? hp(1.5) : hp(2),
    flexBasis: "30%",
    alignItems: "stretch",
  },
  showMoreButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginTop: hp(2),
    marginRight: wp(1),
    fontSize: isTablet ? wp(3) : wp(3.5),
    fontFamily: "Quattrocento",
    color: colors.black,
  },
  showMoreText: {
    color: colors.white,
    fontSize: isTablet ? wp(3) : wp(3.5),
    fontFamily: "Quattrocento",
  },
  qaContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  qaScrollView: {
    flex: 1,
  },
  qaScrollViewContent: {
    paddingHorizontal: wp(4),
    paddingTop: wp(2),
    paddingBottom: hp(2),
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: hp(4),
  },
  noResultsText: {
    fontSize: isTablet ? wp(3) : wp(3.8),
    fontFamily: "Quattrocento",
    color: colors.gray_3,
    marginBottom: hp(2),
  },
  showAllButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: colors.primary,
    borderRadius: 15,
  },
  showAllButtonText: {
    color: colors.white,
    fontSize: isTablet ? wp(3) : wp(3.5),
    fontFamily: "Quattrocento",
  },
  questionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray_1,
    marginTop: hp(-1),
  },
  questionInput: {
    flex: 1,
    height: isTablet ? hp(5) : hp(5),
    backgroundColor: colors.gray_1,
    borderRadius: 20,
    paddingHorizontal: wp(4),
    marginRight: wp(1),
    fontSize: isTablet ? wp(3.2) : wp(3.8),
    fontFamily: "Quattrocento",
    color: colors.black,
  },
  sendButton: {
    width: isTablet ? wp(8) : wp(10),
    height: isTablet ? wp(8) : wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.gray_1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(1),
  },
  chatContainer: {},
  messagesContainer: {
    padding: wp(4),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
  },
  sendButtonDisabled: { opacity: 0.5 },
  backButton: {},
  messageContainer: {
    flexDirection: "row",
    marginBottom: hp(2),
    alignItems: "flex-start",
  },
  userMessage: { justifyContent: "flex-end" },
  botMessage: { justifyContent: "flex-start" },
  botAvatar: {
    width: isTablet ? wp(8) : wp(10),
    height: isTablet ? wp(8) : wp(10),
    borderRadius: wp(5),
    marginRight: wp(2),
    marginBottom: "auto",
    marginTop: hp(0.5),
  },
  messageBubble: {
    maxWidth: "75%",
    padding: wp(3),
    borderRadius: 15,
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
    marginLeft: "auto",
  },
  botBubble: {
    backgroundColor: colors.gray_1,
    borderBottomLeftRadius: 5,
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: isTablet ? wp(3.2) : wp(3.8),
    fontFamily: "Quattrocento",
    lineHeight: isTablet ? wp(4) : wp(5),
  },
  userMessageText: { color: colors.white },
  botMessageText: { color: colors.black },
  audioButton: { marginTop: hp(1), alignSelf: "flex-start", padding: wp(1) },
  audioVisualizationContainer: {
    width: wp(45),
    height: wp(45),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginLeft: wp(-2),
  },
  audioVisImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    zIndex: 2,
  },
  concentricCircle: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 2,
    zIndex: 1,
  },
  circle1: {
    width: wp(35),
    height: wp(35),
    borderColor: "rgba(76, 127, 156, 0.5)",
  },
  circle2: {
    width: wp(45),
    height: wp(45),
    borderColor: "rgba(76, 127, 156, 0.25)",
  },
  audioVisPauseButton: {
    position: "absolute",
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    bottom: hp(1),
  },
  closeButton: { marginLeft: wp(2), paddingHorizontal: wp(2) },
  voiceButton: {
    width: isTablet ? wp(8) : wp(10),
    height: isTablet ? wp(8) : wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.gray_1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: wp(1),
  },
  voiceButtonRecording: { backgroundColor: colors.light_sky },
  errorText: {
    color: "red",
    fontSize: isTablet ? wp(3) : wp(3.5),
    textAlign: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    fontFamily: FontPath.QuattrocentoRegular,
  },
  submitButton: {
    marginTop: hp(1),
    backgroundColor: colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(10),
    borderRadius: 25,
    alignItems: "center",
    width: "80%",
    marginVertical: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: isTablet ? wp(3.2) : wp(4),
    fontWeight: "bold",
    fontFamily: "Quattrocento",
    justifyContent: "flex-start",
  },
  emailInput: {
    height: isTablet ? hp(5) : hp(6),
    width: "80%",
    backgroundColor: colors.gray_1,
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    fontSize: isTablet ? wp(3.2) : wp(4),
    fontFamily: "Quattrocento",
    color: colors.black,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "flex-start",
  },
  keyboardAvoidingView: { flex: 1 },
  outerScrollView: { flex: 1 },
  outerScrollViewContent: {
    flexGrow: 1,
    paddingBottom: hp(3),
  },
});

export default ChatbotWindow;
