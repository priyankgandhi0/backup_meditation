import { createSlice } from "@reduxjs/toolkit";
import { IProgressInitialState } from "../StateType";

const initialState: IProgressInitialState = {
    progressStats: {
        totalCourses: 0,
        completedCourses:0,
        inProgressCourses:0,
        completedPercentage:0,
        courseProgress:[]
    },
    progressCourse:[]
  };
  
  const progressSlice = createSlice({
    name: "progress",
    initialState: initialState,
    reducers: {
      setProgressStats: (state, action) => {
        state.progressStats = action.payload;
      },
      setProgressCourse: (state, action) => {
        state.progressCourse = action.payload;
      },
    },
  });
  
  export default progressSlice.reducer;
  
  export const progressActions = progressSlice.actions;
  