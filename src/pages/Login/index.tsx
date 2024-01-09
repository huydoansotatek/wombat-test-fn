import { Box, Button, Container, Grid, Typography } from "@mui/material";

import LogoSrc from "assets/images/logo.png";
import useAuth from "hooks/useAuth";

const Login = () => {
  const { login } = useAuth();

  const handleLogin = (data: any) => {
    const submitData = {
      token: "This is token!",
      responseUserInfo: {
        statusCode: 200,
      },
    };
    login(submitData);
  };
  return (
    <div>
      <Container maxWidth="sm">
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{
              display: {
                marginTop: "30%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              },
            }}
          >
            <Box
              sx={{
                display: {
                  width: "80%",
                  padding: "30px",
                  background: "#e3e4eb",
                  borderRadius: "15px",
                },
              }}
            >
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleLogin}
                  sx={{
                    width: "50%",
                    padding: "15px 20px",
                    borderRadius: "25px",
                  }}
                >
                  Log in
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Login;
