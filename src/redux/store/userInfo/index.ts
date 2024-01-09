import { createSlice } from "@reduxjs/toolkit";
import REDUX_SLICE_NAMES from "consts/redux-slice-names";
import { useDispatch } from "react-redux";

interface InitialStateType {
  currentUser: object;
}

const initialState: InitialStateType = {
  currentUser: {},
};

export const userSlice = createSlice({
  name: REDUX_SLICE_NAMES.USER_INFO,
  initialState,
  reducers: {
    setCurrentUser: (state, { payload }) => {
      state.currentUser = payload.user;
    },
  },
});

export const { setCurrentUser } = userSlice.actions;

export const useSetUserInformationState = () => {
  const dispatch = useDispatch();
  const setUserInformation = (user: object) => {
    dispatch(setCurrentUser({ user }));
  };
  return { setUserInformation };
};

export default userSlice.reducer;
