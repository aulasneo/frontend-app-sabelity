import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../../components/buttons/Button";

const SuccessModal = ({ intl, isOpen, message, onClose }) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage({
        id: "home.success.title",
        defaultMessage: "Success",
      })}
    >
      <ModalDialog.Body>
        <p className="alertSuccess">{message}</p>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <Button variant="primary" onClick={onClose}>
          {intl.formatMessage({
            id: "home.modal.button.close",
            defaultMessage: "Close",
          })}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default SuccessModal;
