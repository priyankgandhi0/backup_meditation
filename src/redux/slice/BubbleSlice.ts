import { createSlice } from "@reduxjs/toolkit";
import {  IBubbleSliceInitialState } from "../StateType";


const initialState: IBubbleSliceInitialState = {
  isFirstTimeShowBubble: true
};

const bubbleSlice = createSlice({
  name: "bubble",
  initialState: initialState,
  reducers: {
    setFirstTimeShowBubble: (state, action) => {
      state.isFirstTimeShowBubble = action.payload;
    },
  },
});

export default bubbleSlice.reducer;

export const bubbleActions = bubbleSlice.actions;
