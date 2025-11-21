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
  price,
  className,
  isDisabled,
  onPlanSelect,
  isPopular = false,
}) => {
  const intl = useIntl();

  const handleClick = () => {
    if (onPlanSelect) {
      onPlanSelect({
        id: 'price_1OcYr0Lvx3g2W5Lp5X5X5X5X', // Reemplaza con el ID correcto del precio de Stripe
        name: title,
        price: price,
        // Agrega cualquier otra propiedad que necesites
      });
    }
  };

  return (
    <div className={`plan-card ${className} ${isPopular ? 'popular' : ''}`}>
      {isPopular && (
        <div className="popular-badge">
          {intl.formatMessage(messages.mostPopular || { defaultMessage: 'Most Popular' })}
        </div>
      )}
      <h2>{title}</h2>
      <p className="card-description">{description}</p>
      <div className="card-price-content">
        <span className="card-price">{price}</span>
        <span className="card-mouth">
          {intl.formatMessage(messages.suscribeMouth || { defaultMessage: '/mes' })}
        </span>
      </div>
      {isDisabled ? (
        <div className="current-plan-badge">
          {intl.formatMessage(messages.currentPlanText || { defaultMessage: 'Plan Actual' })}
        </div>
      ) : (
        <Button
          onClick={handleClick}
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
  price: PropTypes.string.isRequired,
  onPlanSelect: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
  isPopular: PropTypes.bool,
};

PlanCard.defaultProps = {
  isDisabled: false,
  isPopular: false,
};

export default PlanCard;
