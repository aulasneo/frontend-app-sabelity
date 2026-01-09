import React, { useState, useEffect } from "react";
import CartModal from "../modals/CartModal";
import HeaderBar from "../header-bar/HeaderBar";
import PlanCardList from "../cards/plan-card-list/PlanCardList";
import AditionalInfo from "../aditionalInfo/AditionalInfo";
import { useIntl } from "@edx/frontend-platform/i18n";
import { ModalDialog } from "@openedx/paragon";
import { useSubscriptions } from "../../contexts/SubscriptionsContext";
import { useBilling } from "../../contexts/BillingContext";
import { useHomeCart } from "./useHomeCart";
import "./stylesHome.css";
import messages from "./messages";
import { computeCurrentTotalsFromSubs } from "./cartTotals";
import PlanLimitModal from "../modals/PlanLimitModal";
import ErrorModal from "../modals/ErrorModal";
import SuccessModal from "../modals/SuccessModal";
import DowngradeBlockedModal from "../modals/DowngradeBlockedModal";
import { addOrUpdateProduct } from "../../data/service";

const Home = () => {
  const intl = useIntl();
  const {
    inventory: ctxInventory,
    products: ctxProducts,
    subsRaw,
    packsByProduct,
    refreshAll,
  } = useSubscriptions() || {};
  const {
    courses,
    refreshUserAndCourses,
    startCheckout,
    startMultiCheckout,
  } = useBilling() || {};

  const [planLimit, setPlanLimit] = useState();
  const [coursesCount, setCoursesCount] = useState();
  const [showModal, setShowModal] = useState(false);
  const [newPlanLimit, setNewPlanLimit] = useState();
  const [deleteCourses, setDeleteCourses] = useState();
  const [products, setProducts] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [blockDowngradeModalOpen, setBlockDowngradeModalOpen] = useState(false);

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
    ownedQuantities: packsByProduct || {},
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

  // Aplicar cambios de cantidades sin crear checkout (caso solo bajas o ajustes),
  // usando el mismo flujo que Profile: addOrUpdateProduct con deltas.
  const handleApplyCartUpdates = async () => {
    if (!currentSubscription?.id) return;

    try {
      const base = packsByProduct || {};
      const desiredMap = { ...base };

      // Construir cantidades "deseadas" a partir del carrito; si un producto no
      // está en cartQuantities, asumimos que se mantiene en su cantidad base.
      Object.entries(cartQuantities || {}).forEach(([priceId, qty]) => {
        const target = Number(qty);
        if (!Number.isNaN(target) && target >= 0) {
          desiredMap[priceId] = target;
        }
      });

      const subscriptionId = currentSubscription.id;
      const ops = [];

      Object.keys(desiredMap).forEach((priceId) => {
        const currentQty = Number(base[priceId] || 0);
        const nextQty = Number(desiredMap[priceId] ?? currentQty);
        const diff = nextQty - currentQty; // puede ser positivo o negativo
        if (!diff) return;
        ops.push(addOrUpdateProduct(subscriptionId, priceId, diff));
      });

      if (!ops.length) {
        closeCart();
        return;
      }

      await Promise.all(ops);
      if (typeof refreshAll === "function") {
        try {
          await refreshAll();
        } catch (e) {}
      }

      setSuccessModalMessage(
        intl.formatMessage(
          messages.updateSubscriptionSuccess || {
            id: "home.update.subscription.success.fallback",
            defaultMessage: "Your subscription has been updated.",
          }
        )
      );
      setSuccessModalOpen(true);
      closeCart();
    } catch (error) {
      console.error("Error applying cart updates from Home:", error);
      const msg = intl.formatMessage(
        messages.updateSubscriptionError || {
          id: "home.update.subscription.error.fallback",
          defaultMessage: "There was an error updating your subscription.",
        }
      );
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
    }
  };

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
          setSelectedProductId(priceId);
          openCart();
          return;
        }

        // Si no lo posee aún, agregar 1 unidad al carrito
        const currentQty = cartQuantities[priceId] || 0;
        setQty(priceId, currentQty + 1);
        setSelectedProductId(priceId);
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

  // Cursos en uso para validar el downgrade.
  // Usamos la misma fuente que en Profile (assignedCoursesCount del inventory)
  // y, si no estuviera disponible, caemos al contador del LMS o al total del plan actual.
  const rawCoursesInUse =
    ctxInventory?.assignedCoursesCount ??
    ctxInventory?.assigned_courses_count ??
    (typeof coursesCount === "number" && !Number.isNaN(coursesCount)
      ? coursesCount
      : currentTotalsFromSubs.totalCourses);

  const coursesInUseGuard = Number(rawCoursesInUse) || 0;

  const handleCloseModal = () => setShowModal(false);

  // Nota: el flujo de carrito ya no se abre desde el Header, solo desde las cards
  // por lo que deshabilitamos el botón de carrito en el HeaderBar.

  const handleCloseCart = () => {
    // Al cerrar el modal, limpiar selección para el próximo uso
    setSelectedProductId(null);
    closeCart();
  };

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

  // Ordenar productos para el modal (por número en el nombre: 1, 3, 10)
  const productsSorted = (products || []).slice().sort((a, b) => {
    const na = parseInt(a?.name, 10) || 0;
    const nb = parseInt(b?.name, 10) || 0;
    return na - nb;
  });

  // Si se seleccionó un producto desde una card, mostrar solo ese en el modal
  const productsForCart = selectedProductId
    ? productsSorted.filter((p) => p.stripeId === selectedProductId)
    : productsSorted;

  // Detectar si en el carrito hay productos NUEVOS (que antes no tenía)
  // para decidir si corresponde flujo de checkout o solo updates.
  const hasNewProductsInCart = Object.entries(cartQuantities || {}).some(
    ([priceId, qty]) => {
      const target = Number(qty) || 0;
      const owned = Number((packsByProduct && packsByProduct[priceId]) || 0);
      return target > 0 && owned === 0;
    }
  );

  return (
    <>
      <div className="content-home">
        <HeaderBar
          intl={intl}
          messages={messages}
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

      {/* Success Modal */}
      <SuccessModal
        intl={intl}
        isOpen={successModalOpen}
        message={successModalMessage}
        onClose={() => setSuccessModalOpen(false)}
      />

      <DowngradeBlockedModal
        intl={intl}
        isOpen={blockDowngradeModalOpen}
        onClose={() => setBlockDowngradeModalOpen(false)}
        titleId="home.downgrade.blocked.title"
        messageId="home.downgrade.blocked.message"
        closeId="home.downgrade.blocked.close"
        planLimit={currentTotalsFromSubs.totalCourses}
        coursesInUse={coursesInUseGuard}
      />

      <CartModal
        showCart={showCart}
        closeCart={handleCloseCart}
        intl={intl}
        messages={messages}
        products={productsForCart}
        cartQuantities={cartQuantities}
        setQty={setQty}
        incQty={incQty}
        decQty={decQty}
        totalItems={totalItems}
        onCheckout={handleCartCheckout}
        onApplyUpdates={handleApplyCartUpdates}
        ownedQuantities={packsByProduct || {}}
        hasNewProducts={hasNewProductsInCart}
        cartSummary={cartSummary}
        coursesInUse={coursesInUseGuard}
        onBlockedDowngrade={() => setBlockDowngradeModalOpen(true)}
      />
    </>
  );
};

export default Home;
