export type RootStackParamList = {
  Splash: undefined;
  BaseHome: undefined;
  Player: {
    isBack: boolean;
    isFrequency: boolean;
    screen: string;
    root: string;
    track?: any;
  };
  VideoPlayer: {
    videoUrl: string;
    fromYoutube?: boolean;
    title?: string;
    sectionId: string | undefined;
    courseId: string | undefined;
    lessonsId: string | undefined;
    completed: boolean;
    onComplete?: () => void;
  };
  ChangeDuration: undefined;
  MusicTracksBase: undefined;
  CourseListHome: undefined;
  CourseDetail: { course: any };
  NineDayBreathworkCourseScreen: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  RegisterEmailScreen: undefined;
  PrivacyPolicy: undefined;
  VideoAskScreen: undefined;
  BookACallScreen: undefined;
  Subscription: undefined;
  CustomDrawerContent: undefined;
  CourseListHomeScreen: {
    isBack: boolean;
  };
  MusicTracksBaseScreen: undefined;
  MusicTrack: undefined;
  MembershipWebView: undefined;
  Home: {
    screen: string;
  };
  SubscriptionTCScreen: undefined;
  SubscriptionAgreementScreen: undefined;
  AboutUsScreen: undefined;
  Chakras: undefined;
  ChakrasTrack: undefined;
  AboutChakraScreen: undefined;
  Courses: undefined;
  MantrasScreen: undefined;
  GuidedMeditationScreen: undefined;
  BottomTabNavigator: {
    screen: string;
    params?: { screen: string };
  };
  MusicTracksScreen: {
    isBack: boolean;
  };
  PlayerScreen: {
    root: string;
    screen: string;
    isFrequency: boolean;
  };
  SleepMusic: undefined;
  BreathRelaxScreen: undefined;
  CustomBreathScreen: undefined;
  RelaxTechniqueInfoScreen: undefined;
  BreathBellyScreen: undefined; // Changed from BellyBreathScreen
  BellyTechniqueInfoScreen: undefined; // Added this line
  BreathBoxScreen: undefined; // Added for Breath to Focus
  BoxTechniqueInfoScreen: undefined; // Added for Box Technique Info
  BreathAlternateNostrilScreen: undefined; // Added for Breathe to Balance
  AlternateNostrilTechniqueInfoScreen: undefined; // Added for Alternate Nostril Technique Info
};
