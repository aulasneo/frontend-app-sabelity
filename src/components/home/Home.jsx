import React, { useState, useEffect } from "react";
import { ArrowBack } from "@openedx/paragon/icons";
import Button from "../common/Button";
import { ModalDialog } from "@openedx/paragon";
import { useIntl } from "@edx/frontend-platform/i18n";
import { getConfig } from "@edx/frontend-platform";
import {
  getUserData,
  getCourses,
  listProducts,
  createCheckoutSession,
  getUserSubscription,
  listUserSubscriptions,
  getUserInventory,
} from "../data/service";
import PlanCard from "../cards/PlanCard";
import InventoryInfo from "../inventory/InventoryInfo";
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
          console.error("Error fetching products:", err?.response?.status, err?.message);
          setProducts([]);
        }
        
        // Listar todas las suscripciones del usuario (solo lectura)
        try {
          const allSubs = await listUserSubscriptions();
          console.log("All user subscriptions:", allSubs);
          
          // Si hay suscripciones, obtener detalles de la primera activa
          if (allSubs && allSubs.length > 0) {
            const activeSub = allSubs.find(sub => sub.status === 'active') || allSubs[0];
            try {
              const subscription = await getUserSubscription(activeSub.id);
              console.log("Current subscription details:", subscription);
            } catch (error) {
              console.log("Error fetching subscription details:", error?.response?.status);
            }
          }
        } catch (err) {
          console.log("Error listing user subscriptions:", err?.response?.status, err?.message);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user?.username]);

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

  const handlePlanSelect = async (product) => {
    console.log("Producto seleccionado:", product);

    try {
      console.log("Iniciando proceso de pago...");

      // URLs de redirección
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/subscription/cancel`;

      console.log("Llamando a createCheckoutSession con:", {
        planType: product.stripeId || product.id,
        successUrl,
        cancelUrl,
      });

      const response = await createCheckoutSession(product.stripeId || product.id, "month");

      console.log("Respuesta del servidor:", response);

      if (response && response.url) {
        console.log("Redirigiendo a:", response.url);
        window.location.href = response.url;
      } else {
        console.error("La respuesta no contiene URL de redirección");
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error en handlePlanSelect:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

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
            let displayPrice = `${product.currency?.toUpperCase() || 'USD'} $0`;
            if (typeof product.amount === 'string') {
              const match = product.amount.match(/^(\d+)(?:\.00)?\s+([A-Z]{3})$/);
              if (match) {
                const amountNum = match[1];
                const curr = match[2];
                displayPrice = `${curr} $${amountNum}`;
              }
            }

            return ({
              id: product.stripeId,
              stripeId: product.stripeId,
              title: { defaultMessage: product.name },
              description: { defaultMessage: product.description },
              price: {
                defaultMessage: displayPrice,
              },
              // Garantizar 'limit': usar coursesCount o derivarlo del nombre (e.g., "3 Courses")
              limit: (typeof product.coursesCount !== 'undefined' && product.coursesCount !== null)
                ? Number(product.coursesCount)
                : (parseInt(product.name, 10) || 0),
              priceId: product.stripeId,
              // "Most Popular" para el plan cuyo nombre sea exactamente "3 Courses"
              isPopular: String(product.name).trim() === '3 Courses',
            });
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
  const currentPlan = Number(planLimit) > 0
    ? plans.find((plan) => Number(plan.limit) === Number(planLimit))
    : null;
  const currentPlanTitle = currentPlan ? (currentPlan.title?.defaultMessage || currentPlan.title) : "";

  return (
    <>
      <div className="content-home">
        <div className="back-container">
          <Button
            variant="outline-primary"
            iconBefore={ArrowBack}
            // onClick={() => window.history.back()}
            onClick={() => handleBackToStudio()}
            className="back-button"
          >
            {intl.formatMessage(messages.homeButtonBack)}
          </Button>
        </div>
        <div className="header-container">
          <div>
            <h1>{intl.formatMessage(messages.homeTitle)}</h1>
            <h2>{intl.formatMessage(messages.homeTitle2)}</h2>
            <h3>{intl.formatMessage(messages.homeDescription)}</h3>
          </div>
        </div>

        {userInventory && userInventory.totalCourses > 0 && (
          <InventoryInfo userInventory={userInventory} />
        )}

        <div className="contentCards">
          {plans.map((plan) => {
            const title = plan.title?.defaultMessage || plan.title;
            const description = plan.description?.defaultMessage || plan.description;
            const price = plan.price?.defaultMessage || plan.price;
            return (
              <PlanCard
                key={plan.id}
                title={title}
                description={description}
                price={price}
                className={`card-${plan.id} ${
                  plan.id === "standard" ? "card-standard" : ""
                }`}
                onPlanSelect={() => handlePlanSelect(plan)}
                isPopular={plan.isPopular}
                // Solo deshabilitar (mostrar Current Plan) si hay un currentPlan válido
                isDisabled={!!currentPlan && plan.id === currentPlan.id}
              />
            );
          })}
        </div>

        <div className="additional-content">
          <h4>
            {currentPlan
              ? `${intl.formatMessage(
                  messages.suscripcionActualTitle
                )} ${currentPlanTitle}`
              : intl.formatMessage(messages.suscripcionAnyMessage)}
          </h4>

          <div className="features-section">
            <h3>{intl.formatMessage(messages.featuresTitle)}</h3>
            <ul className="features-list">
              <li>{intl.formatMessage(messages.feature1)}</li>
              <li>{intl.formatMessage(messages.feature2)}</li>
              <li>{intl.formatMessage(messages.feature3)}</li>
              <li>{intl.formatMessage(messages.feature4)}</li>
            </ul>
          </div>

          <div className="additional-info">
            <h3>{intl.formatMessage(messages.additionalInfo)}</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">∞</div>
                <div className="info-text">
                  <h4>{intl.formatMessage(messages.unlimitedLearnersTitle)}</h4>
                  <p>{intl.formatMessage(messages.unlimitedLearnersDesc)}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">💰</div>
                <div className="info-text">
                  <h4>{intl.formatMessage(messages.zeroCommissionTitle)}</h4>
                  <p>{intl.formatMessage(messages.zeroCommissionDesc)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </>
  );
};

export default Home;
