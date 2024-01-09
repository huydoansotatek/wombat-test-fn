import React from "react";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";

import { AuthProvider } from "./contexts/JWTAuthContext";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { ToastContainer } from "react-toastify";
import routes, { renderRoutes } from "routers/routes";
//--- Redux
import { Provider } from "react-redux";
import store from "redux/index";

function App() {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <AuthProvider>{renderRoutes(routes)}</AuthProvider>
        </Router>
      </LocalizationProvider>
      <ToastContainer />
    </Provider>
  );
}

export default App;
