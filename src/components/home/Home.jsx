import React, { useState, useEffect } from "react";
import { ArrowBack } from '@openedx/paragon/icons';
import Button from '../common/Button';
import { ModalDialog } from "@openedx/paragon";
import { useIntl } from "@edx/frontend-platform/i18n";
import { getAuthenticatedUser } from "@edx/frontend-platform/auth";
import { getConfig } from "@edx/frontend-platform";
import { getUserData, updateUserPlan, getCourses } from "../data/service";
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

  const user = getAuthenticatedUser();

  useEffect(() => {
    const fetchPlanLimit = async () => {
      try {
        const data = await getUserData(user.username);
        setPlanLimit(data.extendedProfile[0].fieldValue);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchPlanLimit();
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

  const handlePlanSelect = async (newLimit) => {
    const newLimitNumber = parseInt(newLimit, 10);
    const currentCoursesCount = parseInt(coursesCount, 10);

    if (newLimitNumber < currentCoursesCount) {
      const deleteCount = currentCoursesCount - newLimitNumber;
      setDeleteCourses(deleteCount);
      setNewPlanLimit(newLimit);
      setShowModal(true);
      return;
    }

    try {
      await updateUserPlan(user.username, newLimit);
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

  const plans = [
    {
      id: 'basic',
      title: messages.homeBasicTitle,
      description: messages.homeBasicDescription,
      price: messages.homeBasicPrice,
      limit: 1,
      isPopular: false
    },
    {
      id: 'standard',
      title: messages.homeStandardTitle,
      description: messages.homeStandardDescription,
      price: messages.homeStandardPrice,
      limit: 3,
      isPopular: true
    },
    {
      id: 'premium',
      title: messages.homePremiumTitle,
      description: messages.homePremiumDescription,
      price: messages.homePremiumPrice,
      limit: 10,
      isPopular: false
    },
  ];

  const currentPlan = plans.find((plan) => plan.limit === planLimit)?.title;

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
                onPlanSelect={() => handlePlanSelect(plan.limit)}
                isPopular={plan.isPopular}
                isDisabled={planLimit === plan.limit}
              />
            );
          })}
        </div>
        
        <div className="additional-content">
          <h4>
            {currentPlan
              ? `${intl.formatMessage(messages.suscripcionActualTitle)} ${currentPlan}`
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
