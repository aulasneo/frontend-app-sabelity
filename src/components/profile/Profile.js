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
import { useHomeCart } from "../home/useHomeCart";
import CartModal from "../modals/CartModal";
import CancelSubscriptionButton from "../modals/CancelSubscriptionButton";
import ConfirmCancelSubscriptionModal from "../modals/ConfirmCancelSubscriptionModal";
import SuccessModal from "../modals/SuccessModal";
import ErrorModal from "../modals/ErrorModal";
import ProfileConfirmChangesModal from "../modals/ProfileConfirmChangesModal";
import DowngradeBlockedModal from "../modals/DowngradeBlockedModal";
import { cancelSubscription } from "../../data/service";
import {
  computeSubscriptionUpdateOps,
  runSubscriptionUpdateOps,
} from "../../utils/subscriptionUpdates";
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
  // Forzar el remount de SubscriptionsManager cuando queramos descartar cambios en Profile
  const [subsManagerKey, setSubsManagerKey] = useState(0);
  const [blockDowngradeModalOpen, setBlockDowngradeModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("downgrade"); // "downgrade" | "cancel"
  const [cartSelectedProduct, setCartSelectedProduct] = useState(null);

  const currentTotalsFromSubs = computeCurrentTotalsFromSubs(
    subsRaw,
    products || []
  );

  // Reutilizar la lógica de carrito de Home también en Profile para compras nuevas
  const {
    showCart: showProfileCart,
    openCart: openProfileCart,
    closeCart: closeProfileCart,
    cartQuantities: profileCartQuantities,
    setQty: setProfileCartQty,
    incQty: incProfileCartQty,
    decQty: decProfileCartQty,
    totalItems: profileCartTotalItems,
    cartSummary: profileCartSummary,
    handleCartCheckout: handleProfileCartCheckout,
  } = useHomeCart({
    intl,
    messages: homeMessages,
    startMultiCheckout,
    setErrorModalMessage,
    setErrorModalOpen,
    currentCourses: currentTotalsFromSubs.totalCourses,
    currentTotal: currentTotalsFromSubs.totalAmount,
    ownedQuantities: packsByProduct || {},
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

  const getCoursesInUse = () => {
    const inv = userInventory || inventory || {};
    return (
      inv.assignedCoursesCount ??
      inv.assigned_courses_count ??
      inv.coursesInUse ??
      inv.courses_in_use ??
      0
    );
  };

  // Abrir el CartModal (reutilizado de Home) cuando en Profile se pulsa "Subscribe"
  const handleSubscribeProduct = (product) => {
    if (!product) return;
    const priceId =
      product.stripeId || product.priceId || product.price_id || product.id;
    if (!priceId) return;

    // Inicializar el carrito con 1 unidad de ese producto
    setProfileCartQty(priceId, 1);
    setCartSelectedProduct(product);
    openProfileCart();
  };

  const onCancelSubscription = () => {
    if (!currentSubscription?.id) return;

    const coursesInUse = getCoursesInUse();

    // Si hay cursos en uso, mostrar primero el modal que indica que deben
    // eliminarse los cursos antes de poder cancelar la suscripción.
    if (Number(coursesInUse) > 0) {
      setBlockReason("cancel");
      setBlockDowngradeModalOpen(true);
      return;
    }

    // Si no hay cursos creados, permitir ir al flujo normal de cancelación.
    setConfirmCancelOpen(true);
  };

  const applyProfileCartChanges = async () => {
    if (!currentSubscription?.id) return;

    try {
      const desired = latestQuantitiesByProduct || {};
      const base = packsByProduct || {};
      const subscriptionId = currentSubscription.id;

      const newItems = [];

      const ops = computeSubscriptionUpdateOps(base, desired);

      Object.keys(desired).forEach((priceId) => {
        const currentQty = base[priceId] || 0;
        const nextQty = desired[priceId] ?? currentQty;

        // Producto nuevo (no presente en la suscripción actual): ir por checkout.
        if (!currentQty && nextQty > 0) {
          // Producto nuevo (no presente en la suscripción actual): ir por checkout.
          // Para este endpoint el backend espera el ID de PRODUCTO de Stripe
          // (stripe_id, "prod_...") como plan_type.
          const product = (products || []).find((p) => {
            const pPriceId = p.price_id || p.priceId;
            const pStripeId = p.stripeId;
            const candidates = [pPriceId, pStripeId, p.id, p.productId].filter(Boolean);
            return candidates.includes(priceId);
          });

          const planType =
            product?.stripeId ||
            (product?.id && String(product.id).startsWith("prod_")
              ? product.id
              : null) ||
            product?.productId ||
            product?.product ||
            product?.price_id ||
            product?.priceId ||
            priceId;

          newItems.push({ planType, quantity: nextQty });
        }
      });

      if (!ops.length && !newItems.length) {
        setConfirmChangesOpen(false);
        return;
      }

      // 1) Aplicar primero updates sobre productos ya existentes
      if (ops.length) {
        await runSubscriptionUpdateOps(subscriptionId, ops);
      }

      // 2) Si hay productos nuevos y tenemos startMultiCheckout disponible, iniciar checkout
      if (newItems.length && startMultiCheckout) {
        const resp = await startMultiCheckout({
          items: newItems,
          billingCycle: "month",
        });

        const redirectUrl = resp?.url || resp?.checkout_url;
        if (!redirectUrl) {
          throw new Error("Checkout created but no URL was returned.");
        }

        // Redirigir a Stripe; el resto del flujo (refreshAll, etc.) ocurrirá al volver
        window.location.href = redirectUrl;
        return;
      }
      try {
        await refreshAll();
      } catch (e) {}

      // Tras aplicar correctamente, reiniciar el estado de cambios y forzar
      // que SubscriptionsManager se monte de nuevo con los datos actualizados.
      setSummaryChangesMoney(0);
      setSummaryChangesCourses(0);
      setLatestQuantitiesByProduct({});
      setHasChanges(false);
      setSubsManagerKey((k) => k + 1);

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

    const coursesInUse = getCoursesInUse();
    const targetTotalCourses =
      (currentTotalsFromSubs?.totalCourses || 0) + (summaryChangesCourses || 0);

    // Si el nuevo plan permite menos cursos que los que ya tengo creados, bloquear downgrade
    if (targetTotalCourses > 0 && targetTotalCourses < coursesInUse) {
      setBlockReason("downgrade");
      setBlockDowngradeModalOpen(true);
      return;
    }

    setConfirmChangesOpen(true);
  };

  // Cancelar desde el modal de confirmación: descartar cambios en la UI y
  // volver a mostrar únicamente las cantidades efectivamente compradas.
  const handleCancelProfileChanges = () => {
    setConfirmChangesOpen(false);
    setSummaryChangesMoney(0);
    setSummaryChangesCourses(0);
    setLatestQuantitiesByProduct({});
    setHasChanges(false);
    setSubsManagerKey((k) => k + 1);
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
          key={subsManagerKey}
          onSummaryChange={(
            { moneyDelta = 0, coursesDelta = 0, quantitiesByProduct = {} } = {}
          ) => {
            setSummaryChangesMoney(moneyDelta);
            setSummaryChangesCourses(coursesDelta);
            setLatestQuantitiesByProduct(quantitiesByProduct || {});
            setHasChanges(Boolean(moneyDelta || coursesDelta));
          }}
          currentTotalCourses={currentTotalsFromSubs.totalCourses}
          coursesInUse={getCoursesInUse()}
          onBlockedDowngrade={() => setBlockDowngradeModalOpen(true)}
          onSubscribeProduct={handleSubscribeProduct}
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
          onClose={handleCancelProfileChanges}
          onConfirm={applyProfileCartChanges}
          currentTotal={currentTotalsFromSubs.totalAmount}
          changesMoney={summaryChangesMoney}
          currentCourses={currentTotalsFromSubs.totalCourses}
          changesCourses={summaryChangesCourses}
        />

        <DowngradeBlockedModal
          intl={intl}
          isOpen={blockDowngradeModalOpen}
          onClose={() => setBlockDowngradeModalOpen(false)}
          titleId="profile.downgrade.blocked.title"
          messageId="profile.downgrade.blocked.message"
          closeId="profile.downgrade.blocked.close"
          planLimit={currentTotalsFromSubs.totalCourses}
          coursesInUse={getCoursesInUse()}
          messageDefault={
            blockReason === "cancel"
              ? "To cancel your subscription you must first delete all your courses."
              : undefined
          }
        />

        {/* CartModal reutilizado de Home para compras nuevas desde Profile */}
        <CartModal
          showCart={showProfileCart}
          closeCart={closeProfileCart}
          intl={intl}
          messages={homeMessages}
          products={cartSelectedProduct ? [cartSelectedProduct] : []}
          cartQuantities={profileCartQuantities}
          setQty={setProfileCartQty}
          incQty={incProfileCartQty}
          decQty={decProfileCartQty}
          totalItems={profileCartTotalItems}
          onCheckout={handleProfileCartCheckout}
          onApplyUpdates={undefined}
          ownedQuantities={packsByProduct || {}}
          hasNewProducts
          cartSummary={profileCartSummary}
          coursesInUse={getCoursesInUse()}
          onBlockedDowngrade={() => setBlockDowngradeModalOpen(true)}
        />
      </div>
    </main>
  );
};

export default ProfileInner;
