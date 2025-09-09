import Animated from "react-native-reanimated";
import { courseThemes } from "../utils/colors";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headerColor: string;
  courseTitleColor: string;
  instructorTextColor: string;
  tabBackgroundColor: string;
  dayBackgroundColor: string;
  sectionBackgroundColor: string;
  subsectionBackgroundColor: string;
  lessonBackgroundColor: string;
  reviewBackgroundColor: string;
  descriptionColor: string;
}

export type Review = {
  id: string;
  reviewer: string;
  rating: number;
  text: string;
};

export type Author = {
  name: string;
  bio: string;
  profileImage: any;
};
export type Lesson = {
  id: string;
  _id?: string;
  title: string;
  videoUrl: string;
  isFromYoutube?: boolean;
  type?: "video" | "file" | "audio";
  file?: string;
  audioUrl: string;
  completed: boolean;
};

export type Subsection = {
  title: string;
  lessons: Lesson[];
};

export type Section = {
  section: string;
  subsections?: Subsection[];
  lessons?: Lesson[];
  resources?: { id: string; title: string; url: string }[];
  _id: string;
  isCompleted: boolean;
};

export type MusicTrack = {
  _id: string | any;
  name: string;
  description: string;
  audioFilename: string;
  imageFilename: string;
  isPremium: boolean;
  favorites: string[];
};

export type Course = {
  _id?: string;
  id: string;
  title: string;
  description: string;
  image: any;
  type: string;
  days: string;
  time: string;
  sections?: Section[];
  lessons?: Section[];
  reviews: Review[];
  author: Author;
  courseTheme?: keyof typeof courseThemes;
  hasAccess?: boolean;
  progress: number;
};

export type CardChakrasTrackHomeProps = {
  item: MusicTrack;
  isAuthenticated: boolean;
  isPremium: boolean;
  index: number;
  onPress: () => void;
};

export type CardCourseHomeProps = {
  item: Course;
  isAuthenticated: boolean;
};

export type CardMusicTrackHomeProps = {
  item: MusicTrack;
  isAuthenticated: boolean;
  index: number;
  isPremiumUser: boolean;
};

export type TitleHomeProps = {
  title: string;
  onClickSeeAll: () => void;
};

export type ProgressBarProps = {
  progress: Animated.SharedValue<number>;
};

export type AuthButtonProps = {
  onPress: () => void;
  isLoading: boolean;
  buttonName: string;
  buttonStyle?: StyleProp<ViewStyle>;
};

export type CustomAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export type PasswordTextInputFieldProps = {
  onPress: () => void;
  secureTextEntry: boolean;
  placeholder: string;
  value: string;
  editable: boolean;
  onChangeText: (text: string) => void;
  isVisible: boolean;
};

export type TextInputFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  placeholder: string;
};

export type AppUpdateModalProps = {
  isVisible: boolean;
  onPress: () => void;
};

export interface CategoryType {
  name: string;
  slug: string;
  type: string;
  _id: string;
}

export type CategoryModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelectCategory: (category: CategoryType) => void;
  selectedCategory: CategoryType | null;
};

export type EffectsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export type FrequenciesModalProps = {
  visible: boolean;
  onClose: () => void;
};

export type AlertModalProps = {
  visible: boolean;
  onClose: () => void;
};

export type PhoneNumberInputModalProps = {
  isVisible: boolean;
  onPhoneNumber: (text: string) => void;
  onRequestClose: () => void;
};

export type ThemeTextProps = {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | undefined;
  onPress?: () => void;
};

export type AnimatedPressbleProps = {
  children: React.ReactNode;
  onPress: () => void;
};

export type ThemeTextTitleProps = {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | undefined;
};

export type FavoritesListProps = {
  tracks: MusicTrack[];
  isLoading: boolean;
  onTrackPress: (track: MusicTrack) => void;
  onToggleFavorite: (musicId: string) => void;
  loadingFavorites: boolean;
  isPremiumUser: boolean;
  isAuthenticated: boolean;
};

export type TrackItemProps = {
  item: MusicTrack;
  onTrackPress: (track: MusicTrack) => void;
  onToggleFavorite: (musicId: string) => void;
  loadingFavorites: boolean;
  index: number;
  isPremiumUser: boolean;
  isFavorite: boolean;
  isAuthenticated: boolean;
};

export type TrackListProps = {
  tracks: MusicTrack[];
  isLoading: boolean;
  onTrackPress: (track: MusicTrack) => void;
  onToggleFavorite: (musicId: string) => void;
  loadingFavorites: boolean;
  isPremiumUser: boolean;
  isAuthenticated: boolean;
};

export type BackButtonProps = {
  buttonStyle?: StyleProp<ViewStyle>;
  onClick?: () => void;
  disabled?: boolean;
};

export type VideoPlayerProps = {
  videoUrl: string;
  title: string | undefined;
};

export type CourseDetailLayoutProps = {
  courseTitle: string;
  courseImage: any;
  sections?: Section[];
  lessons?: Section[];
  reviews: Review[];
  author: Author;
  courseTheme?: keyof typeof courseThemes;
  customTheme?: ThemeColors;
  courseId: string | undefined;
  handlRefresh: () => void;
  onClickBack: () => void;
  onSectionToggle?: (sectionTitle: string, id: string) => void;
  onLessonStart?: (lesson: Lesson, sectionId: string) => void;
  onLessonComplete?: (lesson: Lesson, sectionId: string) => void;
};

export type LoaderProps = {
  isBottom?: boolean;
};
