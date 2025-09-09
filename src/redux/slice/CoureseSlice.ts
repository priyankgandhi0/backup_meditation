import { createSlice } from "@reduxjs/toolkit";
import { ICoureseInitialState } from "../StateType";

const initialState: ICoureseInitialState = {
    courese: [],
    section:[]
  };
  
  const coureseSlice = createSlice({
    name: "courese",
    initialState: initialState,
    reducers: {
      setCoures: (state, action) => {
        state.courese = action.payload;
      },
      setCouresSection: (state, action) => {
        state.section = action.payload;
      },
    },
  });
  
  export default coureseSlice.reducer;
  
  export const coureseActions = coureseSlice.actions;
  