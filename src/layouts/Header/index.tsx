import React, { useRef, useState } from "react";
import { AppBar, Box, MenuItem, MenuList, Popover, Toolbar } from "@mui/material";
import ROUTERS_PATHS from "consts/router-paths";
import { Link } from "react-router-dom";
import styles from "./styles.module.scss";
import logoSrc from "assets/images/logo.png";
import clsx from "clsx";
import Icons from "consts/SvgIcon";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "hooks/useAuth";
const Header = () => {
  const { logout } = useAuth();

  const anchorElRef = useRef(null);

  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const idAction = openMenu ? "simple-popover" : undefined;

  const handleClosePopover = () => {
    setOpenMenu(false);
  };

  return (
    <AppBar className={styles.appBar}>
      <Toolbar className={styles.toolBar}>

        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} ref={anchorElRef} onClick={(e) => setOpenMenu(true)}>
          <Icons.DefaultAvatarIcon />
          <div className={styles.textContainer}>
            <p className={styles.userName}>Wombat exchange app</p>
          </div>
        </Box>
        <Popover
          id={idAction}
          open={openMenu}
          anchorEl={anchorElRef.current}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuList>
            <MenuItem
              key="1"
              className={clsx({
                [styles.menuItem]: true,
                [styles.menuItemLogOut]: true,
              })}
              onClick={() => logout()}
            >
              <LogoutIcon color="error" sx={{ marginRight: "10px" }} />
              Log out
            </MenuItem>
          </MenuList>
        </Popover>
      </Toolbar>
    </AppBar>
  );
};
export default Header;
