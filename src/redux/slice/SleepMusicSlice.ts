import { createSlice } from "@reduxjs/toolkit";
import { ISleepMusicInitialState } from "../StateType";

const initialState: ISleepMusicInitialState = {
    sleepMusic: {
      isPremium:false,
      musicList:[]
    }
  };
  
  const sleepMusicSlice = createSlice({
    name: "sleepMusic",
    initialState: initialState,
    reducers: {
      setSleepMusic: (state, action) => {
        state.sleepMusic = action.payload;
      },
    
    },
  });
  
  export default sleepMusicSlice.reducer;
  
  export const sleepMusicActions = sleepMusicSlice.actions;
  