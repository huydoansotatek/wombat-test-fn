import REDUX_SLICE_NAMES from 'consts/redux-slice-names';
import { useSelector } from 'react-redux';
import { useSetLoadingScreenState } from 'redux/store/loadingScreen';

export const useLoadingScreen = () => {
  const isLoadingScreen = useSelector((state: any) => state[REDUX_SLICE_NAMES.LOADING_FULL_SCREEN].isLoading);
  const { setLoadingScreen } = useSetLoadingScreenState();
  return { isLoadingScreen, setLoadingScreen };
};
