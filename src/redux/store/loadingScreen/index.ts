import { createSlice } from "@reduxjs/toolkit";
import REDUX_SLICE_NAMES from "consts/redux-slice-names";
import { useDispatch } from "react-redux";

interface InitialStateType {
  isLoading: boolean;
}

const initialState: InitialStateType = {
  isLoading: false,
};

export const loadingSlice = createSlice({
  name: REDUX_SLICE_NAMES.LOADING_FULL_SCREEN,
  initialState,
  reducers: {
    setLoadingScreenState: (state: InitialStateType, { payload }) => {
      state.isLoading = payload;
    },
  },
});

export const { setLoadingScreenState } = loadingSlice.actions;

export const useSetLoadingScreenState = () => {
  const dispatch = useDispatch();
  const setLoadingScreen = (bool: boolean) => {
    dispatch(setLoadingScreenState(bool));
  };
  return { setLoadingScreen };
};

export default loadingSlice.reducer;
