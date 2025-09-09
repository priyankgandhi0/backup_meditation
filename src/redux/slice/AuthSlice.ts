import { createSlice } from "@reduxjs/toolkit";
import { IAuthSliceInitialState } from "../StateType";


const initialState: IAuthSliceInitialState = {
  isPlayerModal: false,
  userData: {
    token: "",
    user: {
      id: "",
      email: "",
      fullName: ""
    }
  },
  contactId: '',
  membershipStatus:'Basic Membership',
  isMembershipLoading: false,
  isBreathwork: false
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setIsPlayerModal: (state, action) => {
      state.isPlayerModal = action.payload;
    },
    setContactId: (state, action) => {
      state.contactId = action.payload;
    },
    setMembershipStatus: (state, action) => {
      state.membershipStatus = action.payload;
    },
    setIsMembershipLoading: (state, action) => {
      state.isMembershipLoading = action.payload;
    },

    logoutUser: (state) => {
      state.userData = initialState.userData;
      state.membershipStatus = initialState.membershipStatus;
      state.contactId = initialState.contactId; // Also reset contactId if necessary
      state.isMembershipLoading = false;
      // Optionally reset other auth-related state if needed upon logout
    },
    setIsBreathwork: (state, action) => {
      state.isBreathwork = action.payload;
    },
      },
});

export default authSlice.reducer;

export const authActions = authSlice.actions;
