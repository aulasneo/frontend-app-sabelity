import React, { useState, useEffect } from "react";
import { ArrowBack } from '@openedx/paragon/icons';
import Button from '../common/Button';
import { ModalDialog } from "@openedx/paragon";
import { useIntl } from "@edx/frontend-platform/i18n";
import { getAuthenticatedUser } from "@edx/frontend-platform/auth";
import { getConfig } from "@edx/frontend-platform";
import { 
  getUserData, 
  updateUserPlan, 
  getCourses, 
  listProducts, 
  createCheckoutSession, 
  getUserSubscription 
} from "../data/service";
import PlanCard from "../cards/PlanCard";
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

  const user = getAuthenticatedUser();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Obtener el límite del plan actual
        const userData = await getUserData(user.username);
        setPlanLimit(userData.extendedProfile[0].fieldValue);
        
        // Obtener los productos de Stripe
        const productsData = await listProducts();
        setProducts(productsData);
        
        // Verificar si el usuario tiene una suscripción activa
        try {
          const subscription = await getUserSubscription();
          console.log('Current subscription:', subscription);
        } catch (error) {
          console.log('No active subscription found');
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [user.username]);
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

  const handlePlanSelect = async (plan) => {
    const newLimitNumber = parseInt(plan.limit, 10);
    const currentCoursesCount = parseInt(coursesCount, 10);

    if (newLimitNumber < currentCoursesCount) {
      const deleteCount = currentCoursesCount - newLimitNumber;
      setDeleteCourses(deleteCount);
      setNewPlanLimit(plan);
      setShowModal(true);
      return;
    }

    try {
      // Redirigir a Stripe Checkout
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/subscription/cancel`;
      
      const session = await createCheckoutSession(plan.priceId, successUrl, cancelUrl);
      
      // Redirigir a la página de pago de Stripe
      window.location.href = session.url;
      setPlanLimit(newLimit);
    } catch (error) {
      console.error("Error updating plan:", error);
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

  const handleSendEmail = () => {
    const email = "info@aulasneo.com";
    const subject = "Suscripcion para Sabelity";
    const body = "Hola, me quiero suscribir a Sabelity...";

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
  };

  const plans = products.length > 0 
    ? products.map(product => ({
        id: product.id,
        title: { defaultMessage: product.name },
        description: { defaultMessage: product.description },
        price: { defaultMessage: `USD $${(product.prices[0].unit_amount / 100).toFixed(2)}` },
        limit: product.metadata.course_limit,
        priceId: product.prices[0].id,
        isPopular: product.metadata.is_popular === 'true'
      }))
    : [
        {
          id: 'basic',
          title: messages.homeBasicTitle,
          description: messages.homeBasicDescription,
          price: messages.homeBasicPrice,
          limit: 1,
          priceId: 'price_basic',
          isPopular: false
        },
        {
          id: 'standard',
          title: messages.homeStandardTitle,
          description: messages.homeStandardDescription,
          price: messages.homeStandardPrice,
          limit: 3,
          priceId: 'price_standard',
          isPopular: true
        },
        {
          id: 'premium',
          title: messages.homePremiumTitle,
          description: messages.homePremiumDescription,
          price: messages.homePremiumPrice,
          limit: 10,
          priceId: 'price_premium',
          isPopular: false
        },
      ];

  const currentPlan = plans.find((plan) => plan.limit === planLimit);
  const currentPlanTitle = currentPlan ? intl.formatMessage(messages[`home${currentPlan.id.charAt(0).toUpperCase() + currentPlan.id.slice(1)}Title`]) : '';
  return (
    <>
      <div className="content-home">
        <div className="header-container">
          <div>
            <h1>{intl.formatMessage(messages.homeTitle)}</h1>
            <h2>{intl.formatMessage(messages.homeTitle2)}</h2>
            <h3>{intl.formatMessage(messages.homeDescription)}</h3>
          </div>
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

        <div className="contentCards">
          {plans.map((plan) => {
            const price = intl.formatMessage(plan.price);
            return (
              <PlanCard
                key={plan.id}
                title={intl.formatMessage(plan.title)}
                description={intl.formatMessage(plan.description)}
                price={price}
                className={`card-${plan.id} ${
                  plan.id === 'standard' ? 'card-standard' : ''
                }`}
                onPlanSelect={() => handlePlanSelect(plan)}
                isPopular={plan.isPopular}
                isDisabled={planLimit === plan.limit}
              />
            );
          })}
        </div>
        
        <div className="additional-content">
          <h4>
            {currentPlan
              ? `${intl.formatMessage(messages.suscripcionActualTitle)} ${currentPlanTitle}`
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
