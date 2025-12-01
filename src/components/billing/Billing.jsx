import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import messages from "./messages";
import { listUserSubscriptions } from "../data/service";

const Billing = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  // Eliminado: invoices (no hay endpoint en backend)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Cargar suscripción activa (si la hay)
        try {
          const subs = await listUserSubscriptions();
          const active = Array.isArray(subs)
            ? subs.find((s) => s.status === "active")
            : null;
          setSubscription(active || null);
        } catch (e) {
          setSubscription(null);
        }
        // No invoices endpoint available; omitido
      } catch (e) {
        setError(e?.message || "Error while loading billing data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [intl]);

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
        <h1>{intl.formatMessage(messages.billingTitle)}</h1>

        {loading && <div>Loading...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

        {/* Estado de suscripción con fechas de periodo */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {intl.formatMessage(messages.subscriptionTitle)}
          </h3>
          {subscription ? (
            <>
              <div style={{ color: "#6b7280" }}>
                <strong>{intl.formatMessage(messages.status)}:</strong>{" "}
                {subscription.status}
              </div>
              {(() => {
                // Extraer items del plan
                const items = subscription?.items?.data || [];
                if (items.length > 0) {
                  return (
                    <div style={{ color: "#6b7280", marginTop: 6 }}>
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
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  <strong>
                    {intl.formatMessage(messages.currentPeriodStart)}:
                  </strong>{" "}
                  {currentPeriodStartLocal}
                </div>
              )}
              {nextBillingLocal && (
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  <strong>{intl.formatMessage(messages.nextBilling)}:</strong>{" "}
                  {nextBillingLocal}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#6b7280" }}>
              {intl.formatMessage(messages.noActiveSubscription)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Billing;
