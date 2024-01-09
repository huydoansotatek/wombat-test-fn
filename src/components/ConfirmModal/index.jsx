import React from 'react';
import ELEMENT_ID from 'consts/element-id';
import { useGetConfirmModalState, useSetConfirmModalState } from 'redux/store/confirmModal/confirmModalSlice';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Button } from '@mui/material';

const ConfirmModal = (props) => {
  const { isOpen, title, message, cancelBtnLabel, okBtnLabel, isDeleteConfirm } = useGetConfirmModalState();
  const { closeConfirmModal } = useSetConfirmModalState();
  const onOk = () => {
    const el = document.getElementById(ELEMENT_ID.CONFIRM_MODAL_OK_BUTTON);
    if (el) {
      el.click();
    }
    closeConfirmModal();
  };

  return (
    <>
      <Dialog open={isOpen} onClose={closeConfirmModal}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeConfirmModal}>
            {cancelBtnLabel}
          </Button>
          <Button variant="contained" color={isDeleteConfirm ? 'error' : "success"} onClick={onOk}>
            {okBtnLabel}
          </Button>
        </DialogActions>
      </Dialog>
      <div id={ELEMENT_ID.CONFIRM_MODAL_OK_BUTTON} hidden></div>
    </>
  );
};

export default ConfirmModal;
