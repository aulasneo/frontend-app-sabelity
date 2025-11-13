import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import messages from './messages';
import Button from '../common/Button';
import '../home/stylesHome.css';
import './PlanCard.css';

const PlanCard = ({
  title,
  description,
  features,
  price,
  className,
  isDisabled,
  onPlanSelect,
  isPopular = false,
}) => {
  const intl = useIntl();

  return (
    <div className={`plan-card ${className}`}>
      {isPopular && <div className="popular-badge">Most Popular</div>}
      <h2>{title}</h2>
      <p className="card-description">{description}</p>
      <div className="card-price-content">
        <span className="card-price">{price}</span>
        <span className="card-mouth">
          {intl.formatMessage(messages.suscribeMouth)}
        </span>
      </div>
      {isDisabled ? (
        <div className="current-plan-badge">
          {intl.formatMessage(messages.currentPlanText || { defaultMessage: 'Plan Actual' })}
        </div>
      ) : (
        <Button
          onClick={onPlanSelect}
          variant="primary"
          className="full-width"
          messageId="upgrade.plan.button.text"
          defaultMessage="Suscribite"
        />
      )}
    </div>
  );
};

PlanCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  features: PropTypes.string,
  price: PropTypes.string.isRequired,
  onPlanSelect: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
  isPopular: PropTypes.bool,
};

PlanCard.defaultProps = {
  isDisabled: false,
  isPopular: false,
  features: '',
};

export default PlanCard;
