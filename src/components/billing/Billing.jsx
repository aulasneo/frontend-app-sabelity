import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import Button from "../buttons/Button";
import messages from "./messages";
import UpcomingInvoicePanel from "./UpcomingInvoicePanel";
import { useSubscriptions } from "../../contexts/SubscriptionsContext";
import "./billing.css";

const Billing = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { subsRaw, loading } = useSubscriptions() || {};
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  // Eliminado: invoices (no hay endpoint en backend)

  useEffect(() => {
    try {
      const active = Array.isArray(subsRaw)
        ? subsRaw.find((s) => s.status === "active")
        : null;
      setSubscription(active || null);
    } catch (e) {
      setError(e?.message || "Error while loading billing data");
      setSubscription(null);
    }
  }, [subsRaw]);

  const parseToLocalDate = (val) => {
    if (!val && val !== 0) return null;
    try {
      // Epoch seconds
      if (typeof val === 'number') {
        return new Date(val * 1000).toLocaleDateString();
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Numeric string epochs
        if (/^\d+$/.test(trimmed)) {
          return new Date(parseInt(trimmed, 10) * 1000).toLocaleDateString();
        }
        // Try direct parse
        let d = new Date(trimmed);
        if (isNaN(d.getTime())) {
          // If missing timezone, try as UTC
          d = new Date(trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`);
        }
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      }
    } catch (e) {
      // fallthrough
    }
    return null;
  };

  const nextBillingLocal = parseToLocalDate(
    subscription?.currentPeriodEnd ?? subscription?.current_period_end
  );
  const currentPeriodStartLocal = parseToLocalDate(
    subscription?.currentPeriodStart ?? subscription?.current_period_start
  );

  return (
    <main>
      <div className="content-home">
        <div className="billing-header-row">
          <h2>{intl.formatMessage(messages.billingTitle)}</h2>
          <Button
            onClick={() => navigate("/billing/history")}
            className="billing-history-button"
            variant="primary"
            messageId={messages.viewHistory.id}
            defaultMessage={messages.viewHistory.defaultMessage}
          />
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="billing-error">{error}</div>}

        {/* Estado de suscripción con fechas de periodo */}
        <div className="billing-card">
          {subscription ? (
            <>
              <div className="billing-text-muted">
                <strong>{intl.formatMessage(messages.status)}:</strong>{" "}
                {subscription.status}
              </div>
              {(() => {
                // Extraer items del plan
                const items = subscription?.items?.data || [];
                if (items.length > 0) {
                  return (
                    <div className="billing-text-muted billing-mt-6">
                      <strong>Plan:</strong>{" "}
                      {items.map((item, idx) => {
                        const name = item?.price?.product?.name || item?.plan?.name || "Unknown";
                        const qty = item?.quantity || 1;
                        return (
                          <span key={idx}>
                            {name} {qty > 1 ? `(x${qty})` : ""}
                            {idx < items.length - 1 ? ", " : ""}
                          </span>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              })()}
              {currentPeriodStartLocal && (
                <div className="billing-text-muted billing-mt-6">
                  <strong>
                    {intl.formatMessage(messages.currentPeriodStart)}:
                  </strong>{" "}
                  {currentPeriodStartLocal}
                </div>
              )}
              {nextBillingLocal && (
                <div className="billing-text-muted billing-mt-6">
                  <strong>{intl.formatMessage(messages.nextBilling)}:</strong>{" "}
                  {nextBillingLocal}
                </div>
              )}

              {/* Upcoming invoice details */}
              <UpcomingInvoicePanel subscriptionId={subscription?.id} />
            </>
          ) : (
            <div className="billing-text-muted">
              {intl.formatMessage(messages.noActiveSubscription)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Billing;
