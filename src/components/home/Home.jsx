import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import { ModalDialog } from "@openedx/paragon";
import CartModal from "../cart-modal/CartModal";
import HeaderBar from "../header-bar/HeaderBar";
import PlanCardList from "../plan-card-list/PlanCardList";
import AditionalInfo from "../AditionalInfo/AditionalInfo";
import { useIntl } from "@edx/frontend-platform/i18n";
import { getConfig } from "@edx/frontend-platform";
import {
  getUserData,
  getCourses,
  listProducts,
  createCheckoutSession,
  createCheckoutWithMultipleItems,
  getUserSubscription,
  listUserSubscriptions,
  cancelSubscription,
  getUserInventory,
} from "../data/service";
import "./stylesHome.css";
import messages from "./messages";

const Home = () => {
  const intl = useIntl();
  const [planLimit, setPlanLimit] = useState();
  const [coursesCount, setCoursesCount] = useState();
  const [showModal, setShowModal] = useState(false);
  const [newPlanLimit, setNewPlanLimit] = useState();
  const [deleteCourses, setDeleteCourses] = useState();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInventory, setUserInventory] = useState(null);
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartQuantities, setCartQuantities] = useState({}); // { priceId: number }
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Obtener datos del usuario desde el servicio
        try {
          const u = await getUserData();
          setUser(u);
        } catch (err) {
          console.log("Error fetching user data:", err?.response?.status);
        }

        // Obtener el inventario de cursos del usuario
        try {
          const inventory = await getUserInventory();
          console.log("User inventory:", inventory);
          setUserInventory(inventory);
          setPlanLimit(inventory.totalCourses || 0);
        } catch (err) {
          console.log("Error fetching inventory:", err?.response?.status);
          setPlanLimit(0);
        }

        // Obtener los productos de Stripe
        try {
          const productsData = await listProducts();
          setProducts(productsData || []);
          console.log("Products:", productsData);
        } catch (err) {
          console.error(
            "Error fetching products:",
            err?.response?.status,
            err?.message
          );
          setProducts([]);
        }

        // Listar todas las suscripciones del usuario (solo lectura)
        try {
          const allSubs = await listUserSubscriptions();
          console.log("All user subscriptions:", allSubs);

          // Si hay suscripciones, obtener detalles de la primera activa
          if (allSubs && allSubs.length > 0) {
            const activeSub =
              allSubs.find((sub) => sub.status === "active") || allSubs[0];
            setCurrentSubscription(activeSub || null);
            try {
              const subscription = await getUserSubscription(activeSub.id);
              console.log("Current subscription details:", subscription);
            } catch (error) {
              console.log(
                "Error fetching subscription details:",
                error?.response?.status
              );
            }
          } else {
            setCurrentSubscription(null);
          }
        } catch (err) {
          console.log(
            "Error listing user subscriptions:",
            err?.response?.status,
            err?.message
          );
          setCurrentSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user?.username]);

  // Shopping cart helpers
  const openCart = () => setShowCart(true);
  const closeCart = () => setShowCart(false);
  const setQty = (priceId, qty) => {
    const q = Math.max(0, parseInt(qty || 0, 10));
    setCartQuantities((prev) => ({ ...prev, [priceId]: q }));
  };
  const incQty = (priceId) =>
    setQty(priceId, (cartQuantities[priceId] || 0) + 1);
  const decQty = (priceId) =>
    setQty(priceId, (cartQuantities[priceId] || 0) - 1);

  // Helpers para sumarizar carrito
  const getPriceNumber = (amountStr) => {
    // intenta extraer número desde formatos como "149.00 USD" o "USD $149"
    if (!amountStr) return 0;
    const m1 = String(amountStr).match(/([0-9]+(?:\.[0-9]+)?)/);
    return m1 ? parseFloat(m1[1]) : 0;
  };
  const totalItems = Object.values(cartQuantities).reduce(
    (acc, q) => acc + (Number(q) || 0),
    0
  );
  const subtotal = (products || []).reduce((sum, p) => {
    const qty = cartQuantities[p.stripeId] || 0;
    return sum + qty * getPriceNumber(p.amount);
  }, 0);

  const handleCartCheckout = async () => {
    try {
      const items = Object.entries(cartQuantities)
        .filter(([, q]) => (q || 0) > 0)
        .map(([priceId, quantity]) => ({ planType: priceId, quantity }));
      if (!items.length) {
        alert(
          intl.formatMessage(
            messages.cartEmpty || { defaultMessage: "Your cart is empty." }
          )
        );
        return;
      }
      const resp = await createCheckoutWithMultipleItems(items, "month");
      const url =
        resp?.url ||
        resp?.checkout_url ||
        resp?.data?.url ||
        resp?.data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        const msg = intl.formatMessage(
          messages.checkoutNoUrl || {
            defaultMessage: "Checkout created but no URL was returned.",
          }
        );
        setErrorModalMessage(msg);
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error("Error in cart checkout:", error);
      const msg = intl.formatMessage(
        messages.cartCheckoutError || {
          defaultMessage: "There was an error initiating the checkout.",
        }
      );
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.id) return;
    const confirmMsg = intl.formatMessage(
      messages.confirmCancelSubscription || {
        defaultMessage: "Are you sure you want to cancel your subscription?",
      }
    );
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      setIsCancelling(true);
      // Cancelar al final del período de facturación para evitar interrupciones inmediatas
      const cancelAtPeriodEnd = true;
      await cancelSubscription(
        currentSubscription.id,
        cancelAtPeriodEnd,
        "User initiated cancellation from Home"
      );
      // Refrescar suscripciones
      const allSubs = await listUserSubscriptions();
      const activeSub =
        allSubs && allSubs.find((sub) => sub.status === "active");
      setCurrentSubscription(activeSub || null);
      // Opcional: refrescar inventario
      try {
        const inventory = await getUserInventory();
        setUserInventory(inventory);
        setPlanLimit(inventory.totalCourses || 0);
      } catch (e) {
        // si falla, no romper la UX
      }
      alert(
        intl.formatMessage(
          messages.cancelSubscriptionSuccess || {
            defaultMessage:
              "Your subscription cancellation has been scheduled.",
          }
        )
      );
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert(
        intl.formatMessage(
          messages.cancelSubscriptionError || {
            defaultMessage: "There was an error canceling your subscription.",
          }
        )
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Selección de plan: compra directa si no tiene suscripción; si ya tiene, agregar al carrito
  const handlePlanSelect = async (product) => {
    try {
      // Si ya tiene una suscripción activa, agregamos el producto al carrito
      if (currentSubscription && currentSubscription.status === "active") {
        const priceId = product.stripeId || product.priceId || product.id;
        const currentQty = cartQuantities[priceId] || 0;
        setQty(priceId, currentQty + 1);
        openCart();
        return;
      }

      // Si NO tiene suscripción activa, compra directa (checkout de 1 item)
      const planType = product.stripeId || product.id;
      const response = await createCheckoutSession(planType, "month");
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        console.error("La respuesta no contiene URL de redirección");
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
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCoursesCount(data.pagination.count);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  const handleCloseModal = () => setShowModal(false);

  const handleBackToStudio = () => {
    const redirectBackStudio = `${
      getConfig().COURSE_AUTHORING_MICROFRONTEND_URL
    }/home`;
    if (redirectBackStudio) {
      window.location.href = redirectBackStudio;
    } else {
      console.error("Redirect URL is undefined");
    }
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
              priceId: product.stripeId,
              // "Most Popular" para el plan cuyo nombre sea exactamente "3 Courses"
              isPopular: String(product.name).trim() === "3 Courses",
            };
          })
      : [
          {
            id: "basic",
            title: messages.homeBasicTitle,
            description: messages.homeBasicDescription,
            price: messages.homeBasicPrice,
            limit: 1,
            priceId: "price_basic",
            isPopular: false,
          },
          {
            id: "standard",
            title: messages.homeStandardTitle,
            description: messages.homeStandardDescription,
            price: messages.homeStandardPrice,
            limit: 3,
            priceId: "price_standard",
            isPopular: true,
          },
          {
            id: "premium",
            title: messages.homePremiumTitle,
            description: messages.homePremiumDescription,
            price: messages.homePremiumPrice,
            limit: 10,
            priceId: "price_premium",
            isPopular: false,
          },
        ];

  // Solo considerar currentPlan si tenemos un límite de plan válido (> 0)
  const currentPlan =
    Number(planLimit) > 0
      ? plans.find((plan) => Number(plan.limit) === Number(planLimit))
      : null;
  const currentPlanTitle = currentPlan
    ? currentPlan.title?.defaultMessage || currentPlan.title
    : "";

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
        <div className="header-container">
          <div>
            <h1>{intl.formatMessage(messages.homeTitle)}</h1>
            <h2>{intl.formatMessage(messages.homeTitle2)}</h2>
            <h3>{intl.formatMessage(messages.homeDescription)}</h3>
          </div>
        </div>

        <PlanCardList
          plans={plans}
          currentPlan={currentPlan}
          onPlanSelect={handlePlanSelect}
        />

        {/* Cancel subscription button placed BELOW subscriptions/inventory */}
        <div className="cancel-button-suscription">
          <Button
            style={{ border: "1px solid #ccc" }}
            variant="outline-primary"
            onClick={handleCancelSubscription}
            disabled={
              !currentSubscription ||
              currentSubscription.status !== "active" ||
              isCancelling
            }
          >
            {isCancelling
              ? intl.formatMessage(
                  messages.cancellingSubscription || {
                    defaultMessage: "Cancelling...",
                  }
                )
              : intl.formatMessage(
                  messages.cancelSubscription || {
                    defaultMessage: "Cancel subscription",
                  }
                )}
          </Button>
        </div>

        <AditionalInfo
          currentPlan={currentPlan}
          currentPlanTitle={currentPlanTitle}
          userInventory={userInventory}
          messages={messages}
        />
      </div>

      <ModalDialog
        isOpen={showModal}
        onClose={handleCloseModal}
        title={intl.formatMessage(messages.modalTitle)}
      >
        <ModalDialog.Body>
          <p className="alertMinPlan">
            {intl.formatMessage(messages.modalExceedsCourses, {
              currentCourses: coursesCount,
              newLimit: planLimit,
              limit: newPlanLimit,
            })}
          </p>
          <p className="alertMinPlan">
            {intl.formatMessage(messages.modalContent, {
              limit: newPlanLimit,
              deleteCourses: deleteCourses,
            })}
          </p>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <Button variant="primary" onClick={handleCloseModal}>
            {intl.formatMessage(messages.modalButtonClose)}
          </Button>
        </ModalDialog.Footer>
      </ModalDialog>

      {/* Error Modal */}
      <ModalDialog
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title={intl.formatMessage(
          messages.errorTitle || { defaultMessage: "Error" }
        )}
      >
        <ModalDialog.Body>
          <p className="alertMinPlan">{errorModalMessage}</p>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <Button variant="primary" onClick={() => setErrorModalOpen(false)}>
            {intl.formatMessage(messages.modalButtonClose)}
          </Button>
        </ModalDialog.Footer>
      </ModalDialog>

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
        subtotal={subtotal}
        onCheckout={handleCartCheckout}
      />
    </>
  );
};

export default Home;
