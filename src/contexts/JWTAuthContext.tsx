import React, { useEffect, useReducer } from "react";

import SplashScreen from "components/SplashScreen/index";
import { STATUS_CODE } from "consts/statusCode";
import { useSetUserInformationState } from "redux/store/userInfo";

const ACTION_TYPE = {
  INITIALISE: "INITIALISE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
};

interface InitialAuthStateProps {
  isAuthenticated: boolean;
  isInitialised: boolean;
}

const initialAuthState: InitialAuthStateProps = {
  isAuthenticated: false,
  isInitialised: false,
};

const reducer = (state: any, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case ACTION_TYPE.INITIALISE: {
      const { isAuthenticated, user } = action.payload;
      return {
        ...state,
        isAuthenticated,
        isInitialised: true,
        user,
      };
    }
    case ACTION_TYPE.LOGIN: {
      const { user } = action.payload;
      return {
        ...state,
        isAuthenticated: true,
        user,
      };
    }
    case ACTION_TYPE.LOGOUT: {
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    }
    default: {
      return state;
    }
  }
};

const AuthContext = React.createContext({
  ...initialAuthState,
  login: (data: any) => Promise,
  logout: () => Promise,
});

interface IAuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: IAuthProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialAuthState);
  const { setUserInformation } = useSetUserInformationState();

  const login = async (data: any) => {
    localStorage.setItem("token", data.token);
    let userInfo = null;

    try {
      if (data.token) {
        const responseUserInfo = data.responseUserInfo;
        if (responseUserInfo?.statusCode === STATUS_CODE.SUCCESS) {
          userInfo = responseUserInfo;
          if (userInfo) {
            localStorage.setItem("userInfo", JSON.stringify(userInfo));
            setUserInformation(userInfo);
          }
        }
      }
    } finally {
      dispatch({
        type: ACTION_TYPE.LOGIN,
        payload: {
          user: userInfo,
        },
      });
    }
    return true;
  };

  const logout = () => {
    localStorage.clear();
    dispatch({ type: ACTION_TYPE.LOGOUT });
  };

  const initData = async () => {
    let token = localStorage.getItem("token");
    let userInfo: any = null;
    try {
      if (token) {
        const responseUserInfoFake = localStorage.getItem("userInfo") || "'responseUserInfoFake'";
        const responseUserInfo = JSON.parse(responseUserInfoFake);
        if (responseUserInfo?.statusCode === STATUS_CODE.SUCCESS) {
          userInfo = responseUserInfo;
          if (userInfo) {
            setUserInformation(userInfo);
          }
        }
      }
    } finally {
      setTimeout(() => {
        dispatch({
          type: ACTION_TYPE.INITIALISE,
          payload: {
            isAuthenticated: Boolean(token && userInfo),
            // isAuthenticated: true,
            user: userInfo,
          },
        });
      }, 200);
    }
  };

  useEffect(() => {
    initData();
    // eslint-disable-next-line
  }, []);

  if (!state.isInitialised) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
