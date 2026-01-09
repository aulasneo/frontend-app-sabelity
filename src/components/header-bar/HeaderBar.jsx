import React from "react";
import Button from "../buttons/Button";
import "./header.css";
import { useIntl } from "react-intl";
import messages from "../home/messages";

const HeaderBar = ({ totalItems = 0, onOpenCart }) => {
  const intl = useIntl();
  return (
    <div className="back-container">
      <div className="header-container">
          <div>
            <h1>{intl.formatMessage(messages.homeTitle)}</h1>
            <h2>{intl.formatMessage(messages.homeTitle2)}</h2>
            <h3>{intl.formatMessage(messages.homeDescription)}</h3>
          </div>
        </div>
    </div>
  );
};

export default HeaderBar;
