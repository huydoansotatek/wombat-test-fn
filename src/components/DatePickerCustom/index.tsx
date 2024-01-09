import { Box, Button, DialogActions, Popover, TextField } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import React, { useState } from "react";
import EventIcon from "@mui/icons-material/Event";

interface MyActionBarProps {
  onAccept: Function;
  onCancel: Function;
  onClear: Function;
  handleClose: Function;
}

const MyActionBar = ({ onAccept, onCancel, onClear, handleClose }: MyActionBarProps) => {
  return (
    <DialogActions>
      <Button
        onClick={(e) => {
          onClear(e);
        }}
      >
        {" "}
        Clear{" "}
      </Button>
      <Button
        onClick={(e) => {
          onCancel(e);
          handleClose();
        }}
      >
        {" "}
        Cancel{" "}
      </Button>
      <Button
        onClick={(e) => {
          onAccept(e);
          handleClose();
        }}
      >
        {" "}
        OK{" "}
      </Button>
    </DialogActions>
  );
};

interface DatePickerCustomProps {
  onChange: Function, value: any, inputProps: any, staticDateTimePickerProps: any, inputFormat: string
}

const DatePickerCustom = (props: DatePickerCustomProps) => {
  const { onChange, value, inputProps = {}, staticDateTimePickerProps = {}, inputFormat } = props;
  const [valueDate, setValueDate] = useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <>
      <TextField
        {...inputProps}
        inputProps={{ readOnly: true }}
        value={value || valueDate ? moment(value || valueDate).format(inputFormat || "DD/MM/YYYY") : ""}
        disabled={!!staticDateTimePickerProps?.disabled}
        size="small"
        fullWidth
        placeholder={inputFormat || "DD/MM/YYYY"}
        // color="success"
        onClick={(e) => {
          if (staticDateTimePickerProps.disabled) return;
          inputProps.onClick && inputProps.onClick(e);
          handleClick(e);
        }}
        InputProps={{
          endAdornment: <EventIcon sx={{ cursor: "pointer" }} />,
        }}
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box position="relative">
          <StaticDatePicker
            sx={{
              "& button.MuiPickersToolbar-penIconButton": { display: "none" },
            }}
            components={{ ActionBar: (actionProps: any) => <MyActionBar {...actionProps} handleClose={handleClose} /> }}
            componentsProps={{
              actionBar: { actions: ["clear", "cancel", "accept"] },
            }}
            {...staticDateTimePickerProps}
            renderInput={(params: any) => <TextField {...params} size="small" fullWidth color="success" />}
            onChange={onChange || setValueDate}
            // onAccept={handleClose}
            value={value || valueDate}
          />
        </Box>
      </Popover>
    </>
  );
};

export default DatePickerCustom;
