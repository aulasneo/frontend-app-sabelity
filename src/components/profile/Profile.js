import React, { useEffect, useState } from "react";
import InventoryInfo from "../profile/inventory/InventoryInfo/InventoryInfo";
import { useIntl } from "react-intl";
import SubscriptionsManager from "./SubscriptionsManager/SubscriptionsManager";
import SubscriptionsFooter from "./SubscriptionsManager/SuscriptionsFooter/SubscriptionsFooter";
import messages from "./SubscriptionsManager/subscriptionsMessages";
import homeMessages from "../home/messages";
import { computeCurrentTotalsFromSubs } from "../home/cartTotals";
import CartModal from "../modals/CartModal";
import { useHomeCart } from "../home/useHomeCart";
import { useBilling } from "../../contexts/BillingContext";
import CancelSubscriptionButton from "../modals/CancelSubscriptionButton";
import ConfirmCancelSubscriptionModal from "../modals/ConfirmCancelSubscriptionModal";
import SuccessModal from "../modals/SuccessModal";
import ErrorModal from "../modals/ErrorModal";
import { cancelSubscription } from "../../data/service";
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

  // Reutilizar la lógica de carrito del Home para el modal de checkout
  const {
    showCart,
    openCart,
    closeCart,
    cartQuantities,
    setQty,
    incQty,
    decQty,
    totalItems,
    cartSummary,
    handleCartCheckout,
  } = useHomeCart({
    intl,
    messages: homeMessages,
    startMultiCheckout,
    setErrorModalMessage,
    setErrorModalOpen,
    currentCourses: currentTotalsFromSubs.totalCourses,
    currentTotal: currentTotalsFromSubs.totalAmount,
  });

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
      try {
        await refreshAll();
      } catch (e) {}
      setSuccessModalMessage(
        intl.formatMessage(
          homeMessages.cancelSubscriptionSuccess || {
            id: "home.cancel.subscription.success.fallback",
            defaultMessage:
              "Your subscription cancellation has been scheduled.",
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

    // Construir cantidades adicionales (deltas positivos) respecto a lo ya comprado
    const desired = latestQuantitiesByProduct || {};
    const base = packsByProduct || {};

    Object.keys(desired).forEach((key) => {
      const currentQty = base[key] || 0;
      const nextQty = desired[key] ?? currentQty;
      const diff = nextQty - currentQty;
      if (diff > 0) {
        setQty(key, diff);
      }
    });

    // Abrir el mismo CartModal que en Home con estos items
    openCart();
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

        {/* Cart modal para confirmar cambios desde Profile, reutilizando el de Home */}
        <CartModal
          showCart={showCart}
          closeCart={closeCart}
          intl={intl}
          messages={homeMessages}
          products={(products || []).slice().sort((a, b) => {
            const na = parseInt(a?.name, 10) || 0;
            const nb = parseInt(b?.name, 10) || 0;
            return na - nb;
          })}
          cartQuantities={cartQuantities}
          setQty={setQty}
          incQty={incQty}
          decQty={decQty}
          totalItems={totalItems}
          onCheckout={handleCartCheckout}
          cartSummary={cartSummary}
        />
      </div>
    </main>
  );
};

export default ProfileInner;
