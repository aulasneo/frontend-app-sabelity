import React from "react";
import { useIntl } from "react-intl";
import "./SubscriptionsManager.css";
import subsMessages from "./subscriptionsMessages";
import { useSubscriptions } from "../../../contexts/SubscriptionsContext";
import SubscriptionsTable from "./SuscriptionsTable/SubscriptionsTable";

// Manager de suscripciones: muestra título, estados y delega la tabla.
// Los datos de acquired/available y el callback de resumen vienen desde Profile.
const SubscriptionsManager = ({
  onSummaryChange,
  currentTotalCourses,
  coursesInUse,
  onBlockedDowngrade,
  onSubscribeProduct,
}) => {
  const intl = useIntl();
  const { loading, error } = useSubscriptions() || {};

  return (
    <div className="subs-manager">
      <h4 className="subs-title">
        {intl.formatMessage(subsMessages.mySubscriptions)}
      </h4>

      {loading && (
        <div className="subs-loading">
          {intl.formatMessage(subsMessages.loading)}
        </div>
      )}

      {error && <div className="subs-error">{String(error)}</div>}

      {!loading && !error && (
        <div className="subs-card">
          <SubscriptionsTable
            onSummaryChange={onSummaryChange}
            currentTotalCourses={currentTotalCourses}
            coursesInUse={coursesInUse}
            onBlockedDowngrade={onBlockedDowngrade}
            onSubscribeProduct={onSubscribeProduct}
          />
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManager;
