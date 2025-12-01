import React, { useEffect, useState } from "react";
import InventoryInfo from "../inventory/InventoryInfo/InventoryInfo";
import { useIntl } from "react-intl";
import subsMessages from "../inventory/SubscriptionsManager/subscriptionsMessages";
import homeMessages from "../home/messages";
import { ModalDialog } from "@openedx/paragon";
import Button from "../common/Button";
import {
  getUserInventory,
  listUserSubscriptions,
  cancelSubscription,
  listInvoices,
} from "../data/service";
import "./profile.css";

const Profile = () => {
  const intl = useIntl();
  const [userInventory, setUserInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const inv = await getUserInventory();
        setUserInventory(inv || null);
        // fetch subscriptions to enable cancel button
        try {
          const subs = await listUserSubscriptions();
          const active = Array.isArray(subs)
            ? subs.find((s) => s.status === "active")
            : null;
          setCurrentSubscription(active || null);
        } catch (err) {
          setCurrentSubscription(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load user inventory", e);
        setError(intl.formatMessage(subsMessages.errorLoading || { id: 'subs.error.loading.fallback', defaultMessage: "Error loading subscriptions" }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [intl]);

  const onCancelSubscription = () => {
    if (!currentSubscription?.id) return;
    setConfirmCancelOpen(true);
  };

  const performCancelSubscription = async () => {
    if (!currentSubscription?.id) return;
    try {
      setIsCancelling(true);
      const cancelAtPeriodEnd = true;
      await cancelSubscription(
        currentSubscription.id,
        cancelAtPeriodEnd,
        "User initiated cancellation from Profile"
      );
      // refresh subs
      try {
        const subs = await listUserSubscriptions();
        const active = Array.isArray(subs)
          ? subs.find((s) => s.status === "active")
          : null;
        setCurrentSubscription(active || null);
      } catch (e) {
        setCurrentSubscription(null);
      }
      // refresh inventory
      try {
        const inv = await getUserInventory();
        setUserInventory(inv || null);
      } catch (e) {}
      setSuccessModalMessage(
        intl.formatMessage(
          homeMessages.cancelSubscriptionSuccess || {
            id: 'home.cancel.subscription.success.fallback',
            defaultMessage: "Your subscription cancellation has been scheduled.",
          }
        )
      );
      setSuccessModalOpen(true);
    } catch (error) {
      const msg = intl.formatMessage(
        homeMessages.cancelSubscriptionError || {
          id: 'home.cancel.subscription.error.fallback',
          defaultMessage: "There was an error canceling your subscription.",
        }
      );
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
    } finally {
      setIsCancelling(false);
      setConfirmCancelOpen(false);
    }
  };

  return (
    <main>
      <div className="content-home">
        <h1>Profile</h1>

        {loading && (
          <div className="profile-loading">
            {intl.formatMessage(subsMessages.loading || { defaultMessage: "Loading..." })}
          </div>
        )}
        {error && <div className="profile-error">{error}</div>}

        {userInventory && (
          <InventoryInfo
            userInventory={userInventory}
            currentSubscription={currentSubscription}
            // Botón movido al pie de la página, por eso no pasamos onCancelSubscription aquí
            isCancelling={isCancelling}
          />
        )}

        {/* Cancel subscription button centered at bottom (like Home) */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <Button
            style={{ border: '1px solid #ccc' }}
            variant="outline"
            onClick={onCancelSubscription}
            disabled={!currentSubscription || currentSubscription.status !== 'active' || isCancelling}
          >
            {isCancelling
              ? intl.formatMessage(
                  homeMessages.cancellingSubscription || { id: 'home.cancelling.subscription.fallback', defaultMessage: 'Cancelling...' }
                )
              : intl.formatMessage(
                  homeMessages.cancelSubscription || { id: 'home.cancel.subscription.fallback', defaultMessage: 'Cancel subscription' }
                )}
          </Button>
        </div>

        {/* Confirm Cancel Subscription Modal */}
        <ModalDialog
          isOpen={confirmCancelOpen}
          onClose={() => setConfirmCancelOpen(false)}
          title={intl.formatMessage(
            homeMessages.cancelSubscription || { id: 'home.cancel.subscription.title.fallback', defaultMessage: "Cancel subscription" }
          )}
        >
          <ModalDialog.Body>
            <p className="alertMinPlan">
              {intl.formatMessage(
                homeMessages.confirmCancelSubscription || {
                  id: 'home.confirm.cancel.subscription.fallback',
                  defaultMessage: "Are you sure you want to cancel your subscription?",
                }
              )}
            </p>
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelOpen(false)}
              style={{ marginRight: 12, padding: "6px 12px", fontSize: "0.9rem" }}
            >
              {intl.formatMessage(homeMessages.modalButtonClose)}
            </Button>
            <Button
              variant="primary"
              onClick={performCancelSubscription}
              disabled={isCancelling}
              style={{ padding: "6px 12px", fontSize: "0.9rem" }}
            >
              {isCancelling
                ? intl.formatMessage(
                    homeMessages.cancellingSubscription || { id: 'home.cancelling.subscription.fallback', defaultMessage: "Cancelling..." }
                  )
                : intl.formatMessage(homeMessages.modalButtonConfirm)}
            </Button>
          </ModalDialog.Footer>
        </ModalDialog>

        {/* Success Modal */}
        <ModalDialog
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          title={intl.formatMessage({ id: "profile.success.title", defaultMessage: "Success" })}
        >
          <ModalDialog.Body>
            <p className="alertMinPlan">{successModalMessage}</p>
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <Button variant="primary" onClick={() => setSuccessModalOpen(false)}>
              {intl.formatMessage(homeMessages.modalButtonClose)}
            </Button>
          </ModalDialog.Footer>
        </ModalDialog>

        {/* Error Modal */}
        <ModalDialog
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          title={intl.formatMessage(homeMessages.errorTitle || { id: 'home.error.title.fallback', defaultMessage: "Error" })}
        >
          <ModalDialog.Body>
            <p className="alertMinPlan">{errorModalMessage}</p>
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <Button variant="primary" onClick={() => setErrorModalOpen(false)}>
              {intl.formatMessage(homeMessages.modalButtonClose)}
            </Button>
          </ModalDialog.Footer>
        </ModalDialog>

        {/* Billing moved to dedicated page opened from Sidebar */}

      </div>
    </main>
  );
};

export default Profile;
