import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import messages from './messages';
import Button from '../buttons/Button';
import '../home/stylesHome.css';
import './PlanCard.css';

const PlanCard = ({
  title,
  description,
  price,
  className,
  onPlanSelect,
  isCurrentPlan = false,
}) => {
  const intl = useIntl();

  // Asegura que la descripción siempre sea un string seguro
  const safeDescription = typeof description === 'string' ? description : '';

  const handleClick = () => {
    if (onPlanSelect) {
      // Delega al padre la lógica de usar el plan seleccionado (incluido su priceId)
      onPlanSelect();
    }
  };

  return (
    <div className={`plan-card ${className}`}>
      <h2>{title}</h2>
      {safeDescription && (
        <p className="card-description">{safeDescription}</p>
      )}
      <div className="card-price-content">
        <span className="card-price">{price}</span>
        <span className="card-mouth">
          {intl.formatMessage(messages.suscribeMouth || { id: 'suscribe.month.text.fallback', defaultMessage: '/mes' })}
        </span>
      </div>
        <Button
          onClick={handleClick}
          variant="primary"
          className="full-width"
          messageId={isCurrentPlan ? 'change.plan.button.text' : 'upgrade.plan.button.text'}
          defaultMessage={isCurrentPlan ? 'Change' : 'Suscribe'}
        />
    </div>
  );
};

PlanCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  onPlanSelect: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  isCurrentPlan: PropTypes.bool,
};

export default PlanCard;
