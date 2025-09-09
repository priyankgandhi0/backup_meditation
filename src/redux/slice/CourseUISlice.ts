import { createSlice } from "@reduxjs/toolkit";

interface CourseUIState {
  expandedSection: string | null;
  expandedSubsection: string | null;
  lastViewedSectionId: string | null;
  lastViewedLessonId: string | null;
}

const initialState: CourseUIState = {
  expandedSection: null,
  expandedSubsection: null,
  lastViewedSectionId: null,
  lastViewedLessonId: null,
};

const courseUISlice = createSlice({
  name: "courseUI",
  initialState,
  reducers: {
    setExpandedSection: (state, action) => {
      state.expandedSection = action.payload;
    },
    setExpandedSubsection: (state, action) => {
      state.expandedSubsection = action.payload;
    },
    setLastViewedIds: (state, action) => {
      state.lastViewedSectionId = action.payload.sectionId;
      state.lastViewedLessonId = action.payload.lessonId;
    },
    resetCourseUI: (state) => {
      state.expandedSection = null;
      state.expandedSubsection = null;
      state.lastViewedSectionId = null;
      state.lastViewedLessonId = null;
    },
  },
});

export const courseUIActions = courseUISlice.actions;
export default courseUISlice.reducer; 