import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  currentSessionId: string | null;
  guestEmail: string | null;
}

const initialState: ChatState = {
  currentSessionId: null,
  guestEmail: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentSessionId(state, action: PayloadAction<string>) {
      state.currentSessionId = action.payload;
    },
    clearCurrentSessionId(state) {
      state.currentSessionId = null;
    },
    setGuestEmail(state, action: PayloadAction<string>) {
      state.guestEmail = action.payload;
    },
    clearGuestEmail(state) {
      state.guestEmail = null;
    },
  },
});

export const {
  setCurrentSessionId,
  clearCurrentSessionId,
  setGuestEmail,
  clearGuestEmail,
} = chatSlice.actions;
export default chatSlice.reducer; 