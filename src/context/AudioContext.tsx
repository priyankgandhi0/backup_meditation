import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import TrackPlayer, {
  Capability,
  Event,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
  AndroidAudioContentType,
  RepeatMode,
  State as TrackState,
  useProgress,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import { Audio } from "expo-av";
import { Platform, AppState, AppStateStatus } from "react-native";
import crashlytics from "@react-native-firebase/crashlytics";

export type Track = {
  id: string;
  url: string;
  title: string;
  image: string;
};

export interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => Promise<void>;
  instructionVolume: number;
  setInstructionVolume: (volume: number) => void;
  playInstructionSound: (soundUrl: string) => Promise<void>;
  loadTrack: (track: Track, title?: string, artist?: string) => Promise<void>;
  playlist: Track[];
  loading: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  playPause: () => Promise<void>;
  stop: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setPlaylist: (tracks: Track[]) => void;
  unloadAll: () => Promise<void>;
  duration: number;
  position: number;
  setLoopMode: (mode: RepeatMode) => Promise<void>;
  musicTitle: string;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [instructionVolume, setInstructionVolumeState] = useState(0.7);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [musicTitle, setMusicTitle] = useState("");
  const [isPlayerSetup, setIsPlayerSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const { position, duration } = useProgress(1000);

  // Setup audio session for Android
  const setupAudioSession = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        console.log("[AudioContext] Android audio session configured");
      }
    } catch (error: any) {
      console.error("[AudioContext] Audio session setup error:", error);
      crashlytics().recordError(error, "[AudioContext setupAudioSession]");
    }
  }, []);

  // Lazy setup - only setup when needed
  const ensurePlayerSetup = useCallback(async (): Promise<boolean> => {
    // If already setup, return true
    if (isPlayerSetup) {
      console.log("[AudioContext] Player already setup");
      return true;
    }

    // If currently setting up, wait for it
    if (isSettingUp) {
      console.log("[AudioContext] Setup in progress, waiting...");
      // Wait for setup to complete
      while (isSettingUp) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return isPlayerSetup;
    }

    setIsSettingUp(true);
    console.log("[AudioContext] Setting up TrackPlayer...");

    try {
      // Check if TrackPlayer is already initialized
      try {
        await TrackPlayer.getState();
        console.log("[AudioContext] TrackPlayer already initialized");
        setIsPlayerSetup(true);
        setIsSettingUp(false);
        return true;
      } catch {
        // Player not setup, continue with initialization
        console.log("[AudioContext] TrackPlayer needs setup");
      }

      // Setup audio session first
      await setupAudioSession();

      // Small delay to ensure audio session is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Setup TrackPlayer
      await TrackPlayer.setupPlayer({
        iosCategoryMode: IOSCategoryMode.Default,
        iosCategory: IOSCategory.Playback,
        iosCategoryOptions: [
          IOSCategoryOptions.DefaultToSpeaker,
          IOSCategoryOptions.AllowBluetooth,
        ],
        androidAudioContentType: AndroidAudioContentType.Music,
      });

      console.log("[AudioContext] TrackPlayer setup complete");

      // Set initial volume
      await TrackPlayer.setVolume(volume);
      console.log(`[AudioContext] Initial volume set to: ${volume}`);

      // Update options
      await TrackPlayer.updateOptions({
        backwardJumpInterval: 5,
        capabilities: [Capability.Play, Capability.Pause],
        compactCapabilities: [Capability.Play, Capability.Pause],
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          // alwaysPauseOnInterruption: true,
        },
      });

      setIsPlayerSetup(true);
      setIsSettingUp(false);
      console.log("[AudioContext] TrackPlayer ready for use");
      return true;
    } catch (error: any) {
      console.error("[AudioContext] Error setting up TrackPlayer:", error);
      crashlytics().recordError(error, "[AudioContext ensurePlayerSetup]");
      setIsPlayerSetup(false);
      setIsSettingUp(false);
      return false;
    }
  }, [isPlayerSetup, isSettingUp, volume, setupAudioSession]);

  // Cleanup effect only
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log("[AudioContext] App state changed to:", nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();

      // Cleanup TrackPlayer only if it was setup
      const cleanup = async () => {
        try {
          if (isPlayerSetup) {
            console.log("[AudioContext] Cleaning up TrackPlayer");
            await TrackPlayer.reset();
          }
        } catch (error: any) {
          console.error("[AudioContext] Cleanup error:", error);
          crashlytics().recordError(error, "[AudioContext cleanup]");
        }
      };

      cleanup();
    };
  }, [isPlayerSetup]);

  const loadTrack = useCallback(
    async (track: Track, title?: string, artist?: string) => {
      setLoading(true);

      try {
        // Ensure player is setup before loading track
        const setupSuccess = await ensurePlayerSetup();
        if (!setupSuccess) {
          throw new Error("Failed to setup TrackPlayer");
        }

        await TrackPlayer.reset();

        const defaultArtwork = 'https://storage.googleapis.com/schoolbreathvideos/images/MeditationCourse.png';

        const trackPlayerData = {
          id: track.id,
          url: track.url,
          title: track.title ?? "Unknown Title",
          artist: artist ?? "Unknown Artist",
          artwork: track.image || defaultArtwork,
        };

        await TrackPlayer.add([trackPlayerData]);
        setCurrentTrack(track);
        setMusicTitle(title ?? track.title ?? "Unknown Title");

        await TrackPlayer.play();
        setIsPlaying(true);

        console.log("[AudioContext] Track loaded and playing");
      } catch (error: any) {
        console.error("[AudioContext] Error loading track:", error);
        crashlytics().recordError(error, "[AudioContext loadTrack]");
        setIsPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [ensurePlayerSetup]
  );

  const playPause = useCallback(async () => {
    try {
      const setupSuccess = await ensurePlayerSetup();
      if (!setupSuccess) {
        console.warn("[AudioContext] Player setup failed for playPause");
        return;
      }

      const state = await TrackPlayer.getState();
      if (state === TrackState.Playing) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
      }
    } catch (error: any) {
      console.error("[AudioContext] PlayPause error:", error);
      crashlytics().recordError(error, "[AudioContext playPause]");
    }
  }, [ensurePlayerSetup]);

  const play = useCallback(async () => {
    try {
      const setupSuccess = await ensurePlayerSetup();
      if (!setupSuccess) return;

      await TrackPlayer.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error("[AudioContext] Play error:", error);
      crashlytics().recordError(error, "[AudioContext play]");
    }
  }, [ensurePlayerSetup]);

  const pause = useCallback(async () => {
    try {
      const setupSuccess = await ensurePlayerSetup();
      if (!setupSuccess) return;

      await TrackPlayer.pause();
      setIsPlaying(false);
    } catch (error: any) {
      console.error("[AudioContext] Pause error:", error);
      crashlytics().recordError(error, "[AudioContext pause]");
    }
  }, [ensurePlayerSetup]);

  const stop = useCallback(async () => {
    try {
      const setupSuccess = await ensurePlayerSetup();
      if (!setupSuccess) return;

      await TrackPlayer.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
      setMusicTitle("");
    } catch (error: any) {
      console.error("[AudioContext] Stop error:", error);
      crashlytics().recordError(error, "[AudioContext stop]");
    }
  }, [ensurePlayerSetup]);

  const nextTrack = useCallback(async () => {
    if (!currentTrack) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      await loadTrack(playlist[currentIndex + 1], musicTitle);
    }
  }, [playlist, currentTrack, loadTrack, musicTitle]);

  const previousTrack = useCallback(async () => {
    if (!currentTrack) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      await loadTrack(playlist[currentIndex - 1], musicTitle);
    }
  }, [playlist, currentTrack, loadTrack, musicTitle]);

  const unloadAll = useCallback(async () => {
    try {
      if (isPlayerSetup) {
        await TrackPlayer.reset();
      }
      setCurrentTrack(null);
      setIsPlaying(false);
      setMusicTitle("");
    } catch (error: any) {
      console.error("[AudioContext] Unload error:", error);
      crashlytics().recordError(error, "[AudioContext unloadAll]");
    }
  }, [isPlayerSetup]);

  const setLoopMode = useCallback(
    async (mode: RepeatMode) => {
      try {
        const setupSuccess = await ensurePlayerSetup();
        if (!setupSuccess) return;

        await TrackPlayer.setRepeatMode(mode);
      } catch (error: any) {
        console.error("[AudioContext] SetLoopMode error:", error);
        crashlytics().recordError(error, "[AudioContext setLoopMode]");
      }
    },
    [ensurePlayerSetup]
  );

  const setVolume = async (newVolume: number) => {
    try {
      setVolumeState(newVolume);

      // Only set volume if player is already setup
      if (isPlayerSetup) {
        await TrackPlayer.setVolume(newVolume);
      }
      // If not setup, volume will be set during ensurePlayerSetup
    } catch (error: any) {
      console.error("[AudioContext] SetVolume error:", error);
      crashlytics().recordError(error, "[AudioContext setVolume]");
    }
  };

  const setInstructionVolume = (newVolume: number) => {
    setInstructionVolumeState(Math.max(0, Math.min(1, newVolume)));
  };

  const playInstructionSound = useCallback(
    async (soundUrl: string) => {
      if (!soundUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundUrl },
          {
            volume: instructionVolume,
            shouldPlay: true,
            isLooping: false,
          }
        );

        // Cleanup after playback
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.error(
                "[AudioContext] Error unloading instruction sound:",
                error
              );
            }
          }
        });
      } catch (error: any) {
        console.error("[AudioContext] Error playing instruction sound:", error);
        crashlytics().recordError(error, "[AudioContext playInstructionSound]");
      }
    },
    [instructionVolume]
  );

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        playlist,
        isPlaying,
        loading,
        loadTrack,
        play,
        pause,
        playPause,
        stop,
        nextTrack,
        previousTrack,
        setPlaylist,
        unloadAll,
        duration,
        position,
        setLoopMode,
        musicTitle,
        playInstructionSound,
        volume,
        setVolume,
        instructionVolume,
        setInstructionVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
