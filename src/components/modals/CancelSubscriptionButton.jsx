import React from "react";
import Button from "../../components/buttons/Button";

const CancelSubscriptionButton = ({
  intl,
  messages,
  currentSubscription,
  isCancelling,
  onClick,
}) => {
  return (
    <div className="cancel-button-suscription">
      <Button
        style={{ border: "1px solid #ccc" }}
        variant="outline"
        onClick={onClick}
        disabled={
          !currentSubscription ||
          currentSubscription.status !== "active" ||
          isCancelling
        }
      >
        {isCancelling
          ? intl.formatMessage(
              messages.cancellingSubscription || {
                id: "home.cancelling.subscription.fallback",
                defaultMessage: "Cancelling...",
              }
            )
          : intl.formatMessage(
              messages.cancelSubscription || {
                id: "home.cancel.subscription.fallback",
                defaultMessage: "Cancel subscription",
              }
            )}
      </Button>
    </div>
  );
};

export default CancelSubscriptionButton;
