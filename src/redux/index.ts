import { useDispatch as useReduxDispatch, useSelector as useReduxSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import REDUX_SLICE_NAMES from "consts/redux-slice-names";
import confirmModalSlice from "./store/confirmModal/confirmModalSlice";
import loadingSlice from "./store/loadingScreen";
import userSlice from "./store/userInfo";

const store = configureStore({
  reducer: {
    [REDUX_SLICE_NAMES.USER_INFO]: userSlice,
    [REDUX_SLICE_NAMES.LOADING_FULL_SCREEN]: loadingSlice,
    [REDUX_SLICE_NAMES.CONFIRM_MODAL]: confirmModalSlice,
  },
});

export const useSelector = useReduxSelector;

export const useDispatch = () => useReduxDispatch();

export default store;
