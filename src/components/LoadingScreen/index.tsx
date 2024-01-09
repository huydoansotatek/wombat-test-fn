import { useEffect } from "react";
import NProgress from "nprogress";
import  LinearProgress  from "@mui/material/LinearProgress";
import  makeStyles  from "@mui/styles/makeStyles";

const useStyles = makeStyles(() => ({
  root: {
    height: "100%",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const LoadingScreen = () => {
  const classes = useStyles();

  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <div className={classes.root}>
      <LinearProgress />
    </div>
  );
};

export default LoadingScreen;
