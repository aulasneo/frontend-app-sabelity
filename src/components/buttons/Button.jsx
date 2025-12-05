import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import './Button.css';

const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  messageId,
  defaultMessage,
  ...props
}) => {
  const intl = useIntl();
  const buttonClass = `custom-button ${variant} ${disabled ? 'disabled' : ''} ${className}`.trim();
  
  const buttonText = messageId 
    ? intl.formatMessage({ id: messageId, defaultMessage })
    : children;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {buttonText}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'outline']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  messageId: PropTypes.string,
  defaultMessage: PropTypes.string
};

export default Button;
