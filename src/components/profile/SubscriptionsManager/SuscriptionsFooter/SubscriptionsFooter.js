import React from "react";
import { useIntl } from "react-intl";
import "./SubscriptionsFooter.css";
import subsMessages from "../subscriptionsMessages";

const SubscriptionsFooter = ({
  currentMoney = 0,
  changesMoney = 0,
  targetMoney = 0,
  currentCourses = 0,
  changesCourses = 0,
  targetCourses = 0,
  btnLabel,
  onReview,
  btnDisabled = false,
}) => {
  const intl = useIntl();

  const fmt = (n) =>
    `USD $${(Math.round(Number(n || 0) * 100) / 100)
      .toString()
      .replace(/\.00$/, "")}`;

  const changesMoneySign = changesMoney >= 0 ? "+" : "";
  const changesCoursesSign = changesCourses >= 0 ? "+" : "";

  return (
    <div className="subs-summary-container">
      <div className="subs-summary">
        <div className="subs-summary-row subs-summary-money-row">
          <div className="subs-summary-money">
            <span>
              {intl.formatMessage(subsMessages.summaryCurrentTotal)}:{" "}
              <strong>{fmt(currentMoney)}</strong>
            </span>
            <span>
              {intl.formatMessage(subsMessages.summaryChanges)}:{" "}
              <strong>
                {changesMoneySign}
                {fmt(changesMoney)}
              </strong>
            </span>
            <span>
              {intl.formatMessage(subsMessages.summaryNewTotal)}:{" "}
              <strong>{fmt(targetMoney)}</strong>
            </span>
          </div>
        </div>

        <div className="subs-summary-row subs-summary-courses">
          <span>
            {intl.formatMessage(subsMessages.summaryCurrentCourses)}:{" "}
            <strong>{currentCourses}</strong>
          </span>
          <span>
            {intl.formatMessage(subsMessages.summaryChanges)}:{" "}
            <strong>
              {changesCoursesSign}
              {changesCourses}
            </strong>
          </span>
          <span>
            {intl.formatMessage(subsMessages.summaryNewCourses)}:{" "}
            <strong>{targetCourses}</strong>
          </span>
        </div>

        {btnLabel && onReview && (
          <div className="subs-summary-row subs-summary-actions">
            <button
              className="subs-btn"
              type="button"
              onClick={onReview}
              disabled={btnDisabled}
            >
              {btnLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsFooter;
