import React, { useState, useEffect } from 'react';
import { Button, ModalDialog } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import { getUserData, updateUserPlan, getCourses } from '../data/service';
import PlanCard from '../cards/PlanCard';
import './stylesHome.css';
import messages from './messages';

const Home = () => {
  const intl = useIntl();
  const [planLimit, setPlanLimit] = useState();
  const [coursesCount, setCoursesCount] = useState();
  const [showModal, setShowModal] = useState(false);
  const user = getAuthenticatedUser();

  useEffect(() => {
    const fetchPlanLimit = async () => {
      try {
        const data = await getUserData(user.username);
        setPlanLimit(data.extendedProfile[0].fieldValue);
      } catch (error) {
        console.error('Error fetching user data:', error);
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
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  const handlePlanSelect = async (newLimit) => {
    const newLimitNumber = parseInt(newLimit, 10);
    const currentCoursesCount = parseInt(coursesCount, 10);

    if (newLimitNumber < currentCoursesCount) {
      setShowModal(true);
      return;
    }

    try {
      await updateUserPlan(user.username, newLimit);
      setPlanLimit(newLimit);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  const handleBackStudio = () => {
    const redirectBackStudio = `${getConfig().COURSE_AUTHORING_MICROFRONTEND_URL}/home`;
    if (redirectBackStudio) {
      window.location.href = redirectBackStudio;
    } else {
      console.error('Redirect URL is undefined');
    }
  };

  const plans = [
    {
      title: intl.formatMessage(messages.homeBasicTitle),
      features: intl.formatMessage(messages.homeBasicFeatures),
      description: intl.formatMessage(messages.homeBasicDescription),
      price: intl.formatMessage(messages.homeBasicPrice),
      className: 'card-basic',
      limit: '1',
    },
    {
      title: intl.formatMessage(messages.homeStandardTitle),
      features: intl.formatMessage(messages.homeStandardFeatures),
      description: intl.formatMessage(messages.homeStandardDescription),
      price: intl.formatMessage(messages.homeStandardPrice),
      className: 'card-standard',
      limit: '3',
    },
    {
      title: intl.formatMessage(messages.homePremiumTitle),
      features: intl.formatMessage(messages.homePremiumFeatures),
      description: intl.formatMessage(messages.homePremiumDescription),
      price: intl.formatMessage(messages.homePremiumPrice),
      className: 'card-premium',
      limit: '10',
    },
  ];

  const currentPlan = plans.find((plan) => plan.limit === planLimit)?.title;

  return (
    <>
      <h1 className="m-3">{intl.formatMessage(messages.homeTitle)}</h1>
      <h3 className="m-3">
        {currentPlan
          ? `${intl.formatMessage(messages.suscripcionActualTitle)} ${currentPlan}`
          : intl.formatMessage(messages.suscripcionAnyMessage)}
      </h3>
      <main>
        <div className="text-center mt-5">
          <div className="contentCards">
            {plans.map((plan) => (
              <PlanCard
                key={plan.title}
                title={plan.title}
                features={plan.features}
                description={plan.description}
                price={plan.price}
                className={plan.className}
                isDisabled={plan.limit === planLimit}
                onPlanSelect={() => handlePlanSelect(plan.limit)}
              />
            ))}
          </div>
          <Button
            variant="outline-primary"
            className="mt-4 mb-3"
            onClick={handleBackStudio}
          >
            {intl.formatMessage(messages.homeButtonBack)}
          </Button>
        </div>
      </main>

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
            })}
          </p>
          <p className="alertMinPlan">
            {intl.formatMessage(messages.modalContent)}
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
