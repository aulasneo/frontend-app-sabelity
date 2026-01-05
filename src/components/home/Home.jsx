import React, { useState, useEffect } from "react";
import CartModal from "../modals/CartModal";
import HeaderBar from "../header-bar/HeaderBar";
import PlanCardList from "../cards/plan-card-list/PlanCardList";
import AditionalInfo from "../aditionalInfo/AditionalInfo";
import { useIntl } from "@edx/frontend-platform/i18n";
import { useSubscriptions } from "../../contexts/SubscriptionsContext";
import { useBilling } from "../../contexts/BillingContext";
import { useHomeCart } from "./useHomeCart";
import "./stylesHome.css";
import messages from "./messages";
import { computeCurrentTotalsFromSubs } from "./cartTotals";
import CancelSubscriptionButton from "../modals/CancelSubscriptionButton";
import PlanLimitModal from "../modals/PlanLimitModal";
import ErrorModal from "../modals/ErrorModal";
import ConfirmCancelSubscriptionModal from "../modals/ConfirmCancelSubscriptionModal";
import SuccessModal from "../modals/SuccessModal";

const Home = () => {
  const intl = useIntl();
  const {
    inventory: ctxInventory,
    products: ctxProducts,
    subsRaw,
    packsByProduct,
  } = useSubscriptions() || {};
  const {
    courses,
    refreshUserAndCourses,
    startCheckout,
    startMultiCheckout,
    cancelSubscriptionSafe,
  } = useBilling() || {};

  const [planLimit, setPlanLimit] = useState();
  const [coursesCount, setCoursesCount] = useState();
  const [showModal, setShowModal] = useState(false);
  const [newPlanLimit, setNewPlanLimit] = useState();
  const [deleteCourses, setDeleteCourses] = useState();
  const [products, setProducts] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  // Cancel subscription confirm/success modals
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");

  // Lógica del carrito extraída a un helper dedicado: totales actuales
  // reales desde las suscripciones del backend y el catálogo de productos.
  const currentTotalsFromSubs = computeCurrentTotalsFromSubs(subsRaw, products);

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
    planLimit,
    products,
    intl,
    messages,
    startMultiCheckout,
    setErrorModalMessage,
    setErrorModalOpen,
    currentCourses: currentTotalsFromSubs.totalCourses,
    currentTotal: currentTotalsFromSubs.totalAmount,
  });

  // Sincronizar inventory (solo para planLimit) y catálogo desde el contexto global cuando esté disponible
  useEffect(() => {
    if (ctxInventory) {
      if (
        ctxInventory.totalCourses != null &&
        ctxInventory.totalCourses !== undefined
      ) {
        setPlanLimit((prev) =>
          typeof prev === "undefined" ? ctxInventory.totalCourses || 0 : prev
        );
      }
    }
    if (Array.isArray(ctxProducts) && ctxProducts.length) {
      setProducts((prev) => (prev && prev.length ? prev : ctxProducts));
    }
  }, [ctxInventory, ctxProducts]);

  // Derivar suscripción activa desde las suscripciones crudas del contexto
  useEffect(() => {
    if (Array.isArray(subsRaw) && subsRaw.length) {
      const active = subsRaw.find((s) => s.status === "active") || subsRaw[0];
      setCurrentSubscription(active || null);
    } else {
      setCurrentSubscription(null);
    }
  }, [subsRaw]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (refreshUserAndCourses) {
          await refreshUserAndCourses();
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
      }
    };
    fetchInitialData();
  }, [refreshUserAndCourses]);

  // La lógica de carrito (openCart, closeCart, cantidades y checkout) vive en useHomeCart

  const handleCancelSubscription = () => {
    if (!currentSubscription?.id) return;
    setConfirmCancelOpen(true);
  };

  const performCancelSubscription = async () => {
    // Cancelar todas las suscripciones activas del usuario (no solo la actual)
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

      if (cancelSubscriptionSafe) {
        await Promise.all(
          activeSubs.map((sub) =>
            cancelSubscriptionSafe({
              subscriptionId: sub.id,
              cancelAtPeriodEnd,
              reason:
                "User initiated cancellation from Home (all subscriptions)",
            })
          )
        );
      }
      setSuccessModalMessage(
        intl.formatMessage(
          messages.cancelSubscriptionSuccess || {
            id: "home.cancel.subscription.success.fallback",
            defaultMessage:
              "Your subscription cancellations have been scheduled.",
          }
        )
      );
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      const msg = intl.formatMessage(
        messages.cancelSubscriptionError || {
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

  // Selección de plan: compra directa si no tiene suscripción; si ya tiene, agregar al carrito
  const handlePlanSelect = async (product) => {
    try {
      // Si ya tiene una suscripción activa, agregamos el producto al carrito
      if (currentSubscription && currentSubscription.status === "active") {
        const priceId = product.stripeId || product.priceId || product.id;

        // Si ya posee este producto (packsByProduct > 0), solo abrir el carrito
        // sin incrementar cantidad automáticamente (caso botón "Change").
        const ownedQty = packsByProduct?.[priceId] || 0;
        if (ownedQty > 0) {
          openCart();
          return;
        }

        // Si no lo posee aún, agregar 1 unidad al carrito
        const currentQty = cartQuantities[priceId] || 0;
        setQty(priceId, currentQty + 1);
        openCart();
        return;
      }

      // Si NO tiene suscripción activa, compra directa (checkout de 1 item)
      const planType = product.stripeId || product.id;
      if (startCheckout) {
        await startCheckout({ planType, billingCycle: "month" });
      }
    } catch (error) {
      console.error("Error en handlePlanSelect:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
    }
  };

  useEffect(() => {
    if (
      courses &&
      courses.pagination &&
      typeof courses.pagination.count === "number"
    ) {
      setCoursesCount(courses.pagination.count);
    }
  }, [courses]);

  const handleCloseModal = () => setShowModal(false);

  // const handleSendEmail = () => {
  //   const email = "info@aulasneo.com";
  //   const subject = "Suscripcion para Sabelity";
  //   const body = "Hola, me quiero suscribir a Sabelity...";

  //   const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
  //     subject
  //   )}&body=${encodeURIComponent(body)}`;
  //   window.open(mailtoLink, "_blank");
  // };
 
  const plans =
    products.length > 0
      ? products
          // Ordenar por el número inicial del nombre (e.g., "1 Course", "3 Courses", "10 Courses")
          .slice()
          .sort((a, b) => {
            const na = parseInt(a.name, 10) || 0;
            const nb = parseInt(b.name, 10) || 0;
            if (na !== nb) return na - nb;
            // Fallback por nombre para estabilidad
            return String(a.name).localeCompare(String(b.name));
          })
          .map((product) => {
            // Formatear a "USD $<monto>" y quitar .00
            let displayPrice = `${product.currency?.toUpperCase() || "USD"} $0`;
            if (typeof product.amount === "string") {
              const match = product.amount.match(
                /^(\d+)(?:\.00)?\s+([A-Z]{3})$/
              );
              if (match) {
                const amountNum = match[1];
                const curr = match[2];
                displayPrice = `${curr} $${amountNum}`;
              }
            }

            return {
              id: product.stripeId,
              stripeId: product.stripeId,
              title: { defaultMessage: product.name },
              description: { defaultMessage: product.description },
              price: {
                defaultMessage: displayPrice,
              },
              // Garantizar 'limit': usar coursesCount o derivarlo del nombre (e.g., "3 Courses")
              limit:
                typeof product.coursesCount !== "undefined" &&
                product.coursesCount !== null
                  ? Number(product.coursesCount)
                  : parseInt(product.name, 10) || 0,
              // priceId: usamos el id de precio de Stripe si está disponible
              // En la API viene como price_id (snake_case)
              priceId: product.price_id || product.priceId || product.stripeId,
              // "Most Popular" para el plan cuyo nombre sea exactamente "3 Courses"
              isPopular: String(product.name).trim() === "3 Courses",
            };
          })
      : [];

  // Lista de product_ids/stripeIds de todos los productos con cantidad > 0
  const activeProductIds = packsByProduct
    ? Object.entries(packsByProduct)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([key]) => key)
    : [];

  // Debug: verificar qué product_ids están activos y cómo se mapean a los planes
  console.log("activeProductIds >>>", activeProductIds);
  console.log(
    "plans stripeIds >>>",
    plans.map((p) => ({
      id: p.id,
      name: p.title?.defaultMessage || p.title,
      stripeId: p.stripeId,
    }))
  );

  // Ordenar productos para el modal (por número en el nombre: 1, 3, 10)
  const productsSorted = (products || []).slice().sort((a, b) => {
    const na = parseInt(a?.name, 10) || 0;
    const nb = parseInt(b?.name, 10) || 0;
    return na - nb;
  });

  return (
    <>
      <div className="content-home">
        <HeaderBar
          intl={intl}
          messages={messages}
          totalItems={totalItems}
          onOpenCart={openCart}
        />
        {plans && plans.length > 0 ? (
          <PlanCardList
            plans={plans}
            activeProductIds={activeProductIds}
            onPlanSelect={handlePlanSelect}
          />
        ) : (
          <div
            style={{ textAlign: "center", margin: "24px 0", color: "#6b7280" }}
          >
            {intl.formatMessage(messages.noPlansAvailable)}
          </div>
        )}

        {/* Cancel subscription button placed BELOW subscriptions/inventory */}
        <CancelSubscriptionButton
          intl={intl}
          messages={messages}
          currentSubscription={currentSubscription}
          isCancelling={isCancelling}
          onClick={handleCancelSubscription}
        />
        <AditionalInfo messages={messages} />
      </div>

      <PlanLimitModal
        intl={intl}
        messages={messages}
        isOpen={showModal}
        onClose={handleCloseModal}
        coursesCount={coursesCount}
        planLimit={planLimit}
        newPlanLimit={newPlanLimit}
        deleteCourses={deleteCourses}
      />

      {/* Error Modal */}
      <ErrorModal
        intl={intl}
        messages={messages}
        isOpen={errorModalOpen}
        message={errorModalMessage}
        onClose={() => setErrorModalOpen(false)}
      />

      {/* Confirm Cancel Subscription Modal */}
      <ConfirmCancelSubscriptionModal
        intl={intl}
        messages={messages}
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={performCancelSubscription}
        isCancelling={isCancelling}
      />

      {/* Success Modal */}
      <SuccessModal
        intl={intl}
        isOpen={successModalOpen}
        message={successModalMessage}
        onClose={() => setSuccessModalOpen(false)}
      />

      <CartModal
        showCart={showCart}
        closeCart={closeCart}
        intl={intl}
        messages={messages}
        products={productsSorted}
        cartQuantities={cartQuantities}
        setQty={setQty}
        incQty={incQty}
        decQty={decQty}
        totalItems={totalItems}
        onCheckout={handleCartCheckout}
        cartSummary={cartSummary}
      />
    </>
  );
};

export default Home;
