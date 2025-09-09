import {
  configureStore,
  combineReducers,
  PayloadAction,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import { PersistConfig, persistReducer, persistStore } from "redux-persist";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PlayerSlice from "./slice/PlayerSlice";
import AuthSlice from "./slice/AuthSlice";
import CoureseSlice from "./slice/CoureseSlice";
import SleepMusicSlice from "./slice/SleepMusicSlice";
import GuidedMeditationSlice from "./slice/GuidedMeditationSlice";
import ChakraSlice from "./slice/ChakraSlice";
import MantraSlice from "./slice/MantraSlice";
import courseUIReducer from "./slice/CourseUISlice";
import ProgressSlice from "./slice/ProgressSlice";
import BubbleSlice from "./slice/BubbleSlice";
import chatReducer from "./slice/ChatSlice";


const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: "the-school-of-breath-redux-root",
  storage: AsyncStorage,
  stateReconciler: autoMergeLevel2,
  whitelist: [
    "player",
    "auth",
    "courese",
    "sleepMusic",
    "guidedMeditation",
    "chakra",
    "mantra",
    "courseUI",
    "progress",
    "chat",
  ],
};

const combinedRootReducer = combineReducers({
  player: PlayerSlice,
  auth: AuthSlice,
  courese: CoureseSlice,
  sleepMusic: SleepMusicSlice,
  guidedMeditation: GuidedMeditationSlice,
  chakra: ChakraSlice,
  mantra: MantraSlice,
  courseUI: courseUIReducer,
  progress: ProgressSlice,
  bubble: BubbleSlice,
  chat: chatReducer,

});

export type RootState = ReturnType<typeof combinedRootReducer>;

const rootReducer: any = (state: RootState, action: PayloadAction) => {
  return combinedRootReducer(state, action);
};

const persistRootReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistRootReducer,
  middleware: (gDM) => gDM({ serializableCheck: false }).concat(logger),
});

export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);

export default store;
