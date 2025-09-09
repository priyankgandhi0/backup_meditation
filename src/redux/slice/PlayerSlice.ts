import { createSlice } from "@reduxjs/toolkit";
import { IPlayerSliceInitialState } from "../StateType";


const initialState: IPlayerSliceInitialState = {
  isPlayerContinue: false,
  music: {
    root: '',
    isBack: false,
    isFrequency: false,
    screen: ""
  }
 
};

const playerSlice = createSlice({
  name: "player",
  initialState: initialState,
  reducers: {
    setIsPlayerContinue: (state, action) => {
      state.isPlayerContinue = action.payload;
    },
    setMusic:(state, action) =>{
      state.music = action.payload;
    }
  },
});

export default playerSlice.reducer;

export const playerActions = playerSlice.actions;
