import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../../components/buttons/Button";

const ConfirmCancelSubscriptionModal = ({
  intl,
  messages,
  isOpen,
  onClose,
  onConfirm,
  isCancelling,
}) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={intl.formatMessage(
        messages.cancelSubscription || {
          id: "home.cancel.subscription.title.fallback",
          defaultMessage: "Cancel subscription",
        }
      )}
    >
      <ModalDialog.Body>
        <p className="alertMinPlan">
          {intl.formatMessage(
            messages.confirmCancelSubscription || {
              id: "home.confirm.cancel.subscription.fallback",
              defaultMessage:
                "Are you sure you want to cancel your subscription?",
            }
          )}
        </p>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <Button
          variant="outline"
          onClick={onClose}
          style={{ marginRight: 12, padding: "6px 12px", fontSize: "0.9rem" }}
        >
          {intl.formatMessage(messages.modalButtonClose)}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isCancelling}
          style={{ padding: "6px 12px", fontSize: "0.9rem" }}
        >
          {isCancelling
            ? intl.formatMessage(
                messages.cancellingSubscription || {
                  id: "home.cancelling.subscription.fallback",
                  defaultMessage: "Cancelling...",
                }
              )
            : intl.formatMessage(messages.modalButtonConfirm)}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default ConfirmCancelSubscriptionModal;
