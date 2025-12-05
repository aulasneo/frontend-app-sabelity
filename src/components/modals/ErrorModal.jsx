import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../../components/buttons/Button";

const ErrorModal = ({ intl, messages, isOpen, message, onClose }) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage(
        messages.errorTitle || {
          id: "home.error.title.fallback",
          defaultMessage: "Error",
        }
      )}
    >
      <ModalDialog.Body>
        <p className="alertMinPlan">{message}</p>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <Button variant="primary" onClick={onClose}>
          {intl.formatMessage(messages.modalButtonClose)}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default ErrorModal;
