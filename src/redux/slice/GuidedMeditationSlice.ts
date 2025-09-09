import { createSlice } from "@reduxjs/toolkit";
import { IGuidedMeditationInitialState } from "../StateType";

const initialState: IGuidedMeditationInitialState = {
    guidedMeditation: {
      isPremium:false,
      musicList:[]
    }
  };
  
  const guidedMeditationSlice = createSlice({
    name: "guidedMeditation",
    initialState: initialState,
    reducers: {
      setGuidedMeditation: (state, action) => {
        state.guidedMeditation = action.payload;
      },
    
    },
  });
  
  export default guidedMeditationSlice.reducer;
  
  export const guidedMeditationActions = guidedMeditationSlice.actions;
  