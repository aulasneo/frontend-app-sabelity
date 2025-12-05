import React from "react";
import { useIntl } from "react-intl";
import "./AditionalInfo.css";

// Props: currentPlan, currentPlanTitle, userInventory, messages
const AditionalInfo = ({ messages }) => {
  const intl = useIntl();
  return (
    <div className="additional-content">
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
  );
};

export default AditionalInfo;