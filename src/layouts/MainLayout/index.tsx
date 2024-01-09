import React, { useEffect, useState } from "react";
import Header from "../Header";
import { makeStyles } from "@mui/styles";
import LoadingScreen from "components/LoadingScreen";
import { useLoadingScreen } from "hooks/useLoadingScreen";
import { Box, Paper } from "@mui/material";

const useStyles = makeStyles({
  mainContainer: {
    marginTop: 82,
    backgroundColor: "#E5E5E5",
    // minHeight: window.innerHeight - 122,
    left: 0,
    position: "relative",
    transition: "all 0.2s ease-in-out",
    padding: 30,
  },
  paperContainer: {
    height: "95%",
    backgroundColor: "#ffffff",
    borderRadius: "30px !important",
    padding: "20px !important",
  },
});

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const classes = useStyles();
  const { isLoadingScreen } = useLoadingScreen();
  const [windowHeight, setWindowHeight] = useState(window.innerHeight - 142);
  const updateHeight = () => {
    setWindowHeight(window.innerHeight - 142);
  };

  useEffect(() => {
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  });
  return (
    <>
      <Header />
      <div className={"page-wrapper " + classes.mainContainer} style={{ minHeight: windowHeight }}>
        <Box className={classes.paperContainer} component={Paper}>
          {children}
        </Box>
      </div>

      {isLoadingScreen && <LoadingScreen />}
    </>
  );
};

export default MainLayout;
