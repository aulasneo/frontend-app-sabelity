import React from 'react';
import { Button, Card } from '@openedx/paragon';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import '../home/stylesHome.css';
import messages from './messages';

const PlanCard = ({
  title,
  description,
  features,
  price,
  className,
  isDisabled,
  onPlanSelect,
}) => {
  const intl = useIntl();

  return (
    <Card className={`plan-card p-3 ${className}`} style={{ width: '18rem' }}>
      <Card.Body className="plan-card-body">
        <Card.Header title={title} />
        <Card.Section className="card-section">{features}</Card.Section>
        <div className="card-price-content">
          <div className="card-price">{price}</div>
          <div className="card-mouth">
            {intl.formatMessage(messages.suscribeMouth)}
          </div>
        </div>
        <p className={`card-description card-description-${className}`}>
          {description}
        </p>
        <Button
          className="button-subscribe"
          disabled={isDisabled}
          onClick={onPlanSelect}
        >
          {isDisabled
            ? intl.formatMessage(messages.currentPlanText)
            : intl.formatMessage(messages.upgradePlanBtnText)}
        </Button>
      </Card.Body>
    </Card>
  );
};

PlanCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  features: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  onPlanSelect: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
};

PlanCard.defaultProps = {
  isDisabled: false,
};

export default PlanCard;
