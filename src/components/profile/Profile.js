import React, { useEffect, useState } from "react";
import { ModalDialog } from "@openedx/paragon";
import InventoryInfo from "../profile/inventory/InventoryInfo/InventoryInfo";
import { useIntl } from "react-intl";
import SubscriptionsManager from "./SubscriptionsManager/SubscriptionsManager";
import SubscriptionsFooter from "./SubscriptionsManager/SuscriptionsFooter/SubscriptionsFooter";
import messages from "./SubscriptionsManager/subscriptionsMessages";
import homeMessages from "../home/messages";
import { computeCurrentTotalsFromSubs } from "../home/cartTotals";
import { useBilling } from "../../contexts/BillingContext";
import CancelSubscriptionButton from "../modals/CancelSubscriptionButton";
import ConfirmCancelSubscriptionModal from "../modals/ConfirmCancelSubscriptionModal";
import SuccessModal from "../modals/SuccessModal";
import ErrorModal from "../modals/ErrorModal";
import ProfileConfirmChangesModal from "../modals/ProfileConfirmChangesModal";
import { cancelSubscription, addOrUpdateProduct } from "../../data/service";
import { useSubscriptions } from "../../contexts/SubscriptionsContext";
import "./profile.css";

const ProfileInner = () => {
  const intl = useIntl();
  const { loading, error, inventory, subsRaw, products, packsByProduct, refreshAll } =
    useSubscriptions();
  const { startMultiCheckout } = useBilling() || {};
  const [userInventory, setUserInventory] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmChangesOpen, setConfirmChangesOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [summaryChangesMoney, setSummaryChangesMoney] = useState(0);
  const [summaryChangesCourses, setSummaryChangesCourses] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [latestQuantitiesByProduct, setLatestQuantitiesByProduct] = useState({});

  const currentTotalsFromSubs = computeCurrentTotalsFromSubs(
    subsRaw,
    products || []
  );

  useEffect(() => {
    // Sincronizar inventory y suscripción activa desde el contexto
    setUserInventory(inventory || null);
    if (Array.isArray(subsRaw) && subsRaw.length) {
      const active = subsRaw.find((s) => s.status === "active") || null;
      setCurrentSubscription(active);
    } else {
      setCurrentSubscription(null);
    }
  }, [inventory, subsRaw]);

  const onCancelSubscription = () => {
    if (!currentSubscription?.id) return;
    setConfirmCancelOpen(true);
  };

  const applyProfileCartChanges = async () => {
    if (!currentSubscription?.id) return;

    try {
      const desired = latestQuantitiesByProduct || {};
      const base = packsByProduct || {};
      const subscriptionId = currentSubscription.id;

      const ops = [];

      Object.keys(desired).forEach((priceId) => {
        const currentQty = base[priceId] || 0;
        const nextQty = desired[priceId] ?? currentQty;
        const diff = nextQty - currentQty;
        if (!diff) return;

        ops.push(addOrUpdateProduct(subscriptionId, priceId, diff));
      });

      if (!ops.length) {
        closeCart();
        return;
      }

      await Promise.all(ops);
      try {
        await refreshAll();
      } catch (e) {}

      setSuccessModalMessage(
        intl.formatMessage(
          homeMessages.updateSubscriptionSuccess || {
            id: "profile.update.subscription.success.fallback",
            defaultMessage: "Your subscription has been updated.",
          }
        )
      );
      setSuccessModalOpen(true);
      setConfirmChangesOpen(false);
    } catch (error) {
      const msg = intl.formatMessage(
        homeMessages.updateSubscriptionError || {
          id: "profile.update.subscription.error.fallback",
          defaultMessage: "There was an error updating your subscription.",
        }
      );
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
    }
  };

  const performCancelSubscription = async () => {
    // Cancelar todas las suscripciones activas del usuario
    const activeSubs = Array.isArray(subsRaw)
      ? subsRaw.filter((s) => s?.status === "active")
      : [];

    if (!activeSubs.length) {
      setConfirmCancelOpen(false);
      return;
    }

    try {
      setIsCancelling(true);
      // Cancelar inmediatamente en Stripe (no esperar al final del período)
      const cancelAtPeriodEnd = false;
      await Promise.all(
        activeSubs.map((sub) =>
          cancelSubscription(
            sub.id,
            cancelAtPeriodEnd,
            "User initiated cancellation from Profile (all subscriptions)"
          )
        )
      );
      await refreshAll();
      setSuccessModalMessage(
        intl.formatMessage(
          homeMessages.cancelSubscriptionSuccess || {
            id: "profile.cancel.subscription.success.fallback",
            defaultMessage:
              "Your subscription cancellations have been scheduled.",
          }
        )
      );
      setSuccessModalOpen(true);
    } catch (error) {
      const msg = intl.formatMessage(
        homeMessages.cancelSubscriptionError || {
          id: "home.cancel.subscription.error.fallback",
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

  const handleReviewChanges = () => {
    if (!hasChanges) return;
    setConfirmChangesOpen(true);
  };

  return (
    <main>
      <div className="content-home">
        <h2>
          {intl.formatMessage(messages.profileTitle)}
        </h2>
        {userInventory && (
          <InventoryInfo
            userInventory={userInventory}
            currentSubscription={currentSubscription}
            isCancelling={isCancelling}
            computedCurrentTotalCourses={currentTotalsFromSubs.totalCourses}
          />
        )}
             
        <SubscriptionsManager
          onSummaryChange={(
            { moneyDelta = 0, coursesDelta = 0, quantitiesByProduct = {} } = {}
          ) => {
            setSummaryChangesMoney(moneyDelta);
            setSummaryChangesCourses(coursesDelta);
            setLatestQuantitiesByProduct(quantitiesByProduct || {});
            setHasChanges(Boolean(moneyDelta || coursesDelta));
          }}
        />

        <SubscriptionsFooter
          currentMoney={currentTotalsFromSubs.totalAmount}
          changesMoney={summaryChangesMoney}
          targetMoney={currentTotalsFromSubs.totalAmount + summaryChangesMoney}
          currentCourses={currentTotalsFromSubs.totalCourses}
          changesCourses={summaryChangesCourses}
          targetCourses={
            currentTotalsFromSubs.totalCourses + summaryChangesCourses
          }
          btnLabel={homeMessages.reviewChangesButton || "Review changes"}
          onReview={handleReviewChanges}
          btnDisabled={!hasChanges}
        />

        {/* Cancel subscription button placed BELOW subscriptions/inventory */}
        <CancelSubscriptionButton
          intl={intl}
          messages={messages}
          currentSubscription={currentSubscription}
          isCancelling={isCancelling}
          onClick={onCancelSubscription}
        />

        <ErrorModal
          intl={intl}
          messages={homeMessages}
          isOpen={errorModalOpen}
          message={errorModalMessage}
          onClose={() => setErrorModalOpen(false)}
        />

        <ConfirmCancelSubscriptionModal
          intl={intl}
          messages={homeMessages}
          isOpen={confirmCancelOpen}
          onClose={() => setConfirmCancelOpen(false)}
          onConfirm={performCancelSubscription}
          isCancelling={isCancelling}
        />

        <SuccessModal
          intl={intl}
          isOpen={successModalOpen}
          message={successModalMessage}
          onClose={() => setSuccessModalOpen(false)}
        />

        <ProfileConfirmChangesModal
          intl={intl}
          isOpen={confirmChangesOpen}
          onClose={() => setConfirmChangesOpen(false)}
          onConfirm={applyProfileCartChanges}
          currentTotal={currentTotalsFromSubs.totalAmount}
          changesMoney={summaryChangesMoney}
          currentCourses={currentTotalsFromSubs.totalCourses}
          changesCourses={summaryChangesCourses}
        />
      </div>
    </main>
  );
};

export default ProfileInner;
