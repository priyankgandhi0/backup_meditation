import { createSlice } from "@reduxjs/toolkit";
import { IMantraInitialState } from "../StateType";

const initialState: IMantraInitialState = {
  mantra: {
    hasAccess: false,
    videoList: [],
  },
};

const mantraSlice = createSlice({
  name: "mantra",
  initialState: initialState,
  reducers: {
    setMantra: (state, action) => {
      state.mantra = action.payload;
    },
  },
});

export default mantraSlice.reducer;

export const mantraActions = mantraSlice.actions;
