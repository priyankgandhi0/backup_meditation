import { createSlice } from "@reduxjs/toolkit";
import { IChakraInitialState } from "../StateType";

const initialState: IChakraInitialState = {
    chakra: {
      isPremium:false,
      musicList:[]
    }
  };
  
  const chakraSlice = createSlice({
    name: "chakra",
    initialState: initialState,
    reducers: {
      setChakra: (state, action) => {
        state.chakra = action.payload;
      },
    
    },
  });
  
  export default chakraSlice.reducer;
  
  export const chakraActions = chakraSlice.actions;
  