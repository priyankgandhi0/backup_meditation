import analytics from "@react-native-firebase/analytics";

export const ScreenEvents = {
  VIEW_COURSE_LIST: "view_course_list",
  VIEW_COURSE_DETAIL: "view_course_detail",
  VIEW_GUIDED_MEDITATION: "view_guided_meditation",
  VIEW_MANTRA: "view_mantra",
  VIEW_SLEEP_MUSIC: "view_sleep_music",
  VIEW_PROGRESS_TRACKING: "view_progress_tracking",
  START_LESSON: "start_lesson",
  COMPLETE_LESSON: "complete_lesson",
} as const;

export const MusicEvents = {
  ACCESS_SLEEP_MUSIC: "access_sleep_music",
  ACCESS_CHAKRA_MUSIC: "access_chakra_music",
  ACCESS_MANTRA: "access_mantra",
  ACCESS_GUIDED_MEDITATION: "access_guided_meditation",
  PLAY_TRACK: "play_track",
} as const;

export const CourseEvents = {
  SELECT_COURSE: "select_course",
  TOGGLE_SECTION: "toggle_course_section",
  START_LESSON: "start_lesson",
  COMPLETE_LESSON: "complete_lesson",
  VIEW_COURSE_LIST: "view_course_list",
  VIEW_COURSE_DETAIL: "view_course_detail",
} as const;

export const trackScreenView = async (
  screenName: string,
  screenClass: string,
  additionalParams?: Record<string, any>
) => {
  try {
    let payload = {
      screen_name: screenName,
      screen_class: screenClass,
      ...additionalParams,
    };
    await analytics().logScreenView(payload);

    if (additionalParams) {
      await analytics().logEvent(screenName, additionalParams);
    }
  } catch (error) {
    console.log("Analytics Error:", error);
  }
};

export const trackEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.log("Analytics Event Error:", error);
  }
};

export const trackMusicAccess = async (
  musicType: keyof typeof MusicEvents,
  trackDetails: {
    trackId?: string;
    trackName?: string;
    isPremium?: boolean;
    hasAccess?: boolean;
  }
) => {
  try {
    await analytics().logEvent(MusicEvents[musicType], {
      ...trackDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Music Analytics Error:", error);
  }
};
