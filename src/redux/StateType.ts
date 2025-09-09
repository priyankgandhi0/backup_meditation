import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./Store";

export interface IPlayerSliceInitialState {
  isPlayerContinue: boolean;
  music: {
    root: string;
    isBack: boolean;
    isFrequency: boolean;
    screen: string;
  };
}

export interface IAuthSliceInitialState {
  isPlayerModal: boolean;
  userData: {
    token: string;
    user: {
      id: string;
      email: string;
      fullName: string;
    };
  };
  contactId: string;
  membershipStatus: string;
  isMembershipLoading: boolean;
  isBreathwork: boolean;
}

export interface IBubbleSliceInitialState {
  isFirstTimeShowBubble:boolean
}

export interface ICoureseInitialState {
  courese: [];
  section:[];
}

export interface IProgressInitialState {
  progressStats:{
    totalCourses: number,
    completedCourses:number,
    inProgressCourses:number,
    completedPercentage: number
    courseProgress:[]
  },
  progressCourse:[]
}

export interface ISleepMusicInitialState {
  sleepMusic: {
    isPremium: boolean;
    musicList: [];
  };
}

export interface IGuidedMeditationInitialState {
  guidedMeditation: {
    isPremium: boolean;
    musicList: [];
  }
}

export interface IChakraInitialState {
  chakra: {
    isPremium: boolean;
    musicList: [];
  }
}

export interface IMantraInitialState {
  mantra: {
    hasAccess: boolean;
    videoList: [];
  }
}

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
