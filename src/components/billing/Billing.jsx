import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import Button from "../buttons/Button";
import messages from "./messages";
import UpcomingInvoicePanel from "./UpcomingInvoicePanel";
import { useSubscriptions } from "../../contexts/SubscriptionsContext";
import { useBilling } from "../../contexts/BillingContext";
import "./billing.css";

const Billing = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { subsRaw, loading } = useSubscriptions() || {};
  const { upcomingInvoice } = useBilling() || {};
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Eliminado: invoices (no hay endpoint en backend)

  useEffect(() => {
    try {
      const active = Array.isArray(subsRaw)
        ? subsRaw.find((s) => s.status === "active")
        : null;
      setSubscription(active || null);
    } catch (e) {
      setError(e?.message || intl.formatMessage(messages.billingDataError));
      setSubscription(null);
    }
  }, [subsRaw]);

  // Resetear página cuando cambie la suscripción o la upcomingInvoice
  useEffect(() => {
    setPage(1);
  }, [subscription, upcomingInvoice]);

  const upcomingLines = Array.isArray(upcomingInvoice?.lines)
    ? upcomingInvoice.lines
    : [];
  const totalPages = Math.max(1, Math.ceil(upcomingLines.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const goToPrev = () => setPage((prev) => Math.max(1, prev - 1));
  const goToNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

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

        {loading && (
          <div className="billing-text-muted">
            {intl.formatMessage(messages.loading)}
          </div>
        )}
        {error && <div className="billing-error">{error}</div>}

        {/* Estado de suscripción con fechas de periodo + upcoming invoice */}
        <div>
          {subscription ? (
            <>
              <div className="billing-card">
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
                        <strong>
                          {intl.formatMessage(messages.planLabel)}:
                        </strong>{" "}
                        {items.map((item, idx) => {
                          const name =
                            item?.price?.product?.name ||
                            item?.plan?.name ||
                            intl.formatMessage(messages.planUnknown);
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
              </div>

              {/* Upcoming invoice details (solo el contenido de la página actual) */}
              <UpcomingInvoicePanel
                subscriptionId={subscription?.id}
                page={currentPage - 1}
                pageSize={pageSize}
              />
            </>
          ) : (
            <div className="billing-text-muted">
              {intl.formatMessage(messages.noActiveSubscription)}
            </div>
          )}
        </div>

        {/* Paginación del upcoming invoice fuera del recuadro, centrada */}
        {upcomingLines.length > 0 && (
          <div className="billing-history-pagination-wrapper">
            <div className="billing-history-pagination">
              <Button
                onClick={goToPrev}
                variant="outline"
                className="billing-page-button"
                disabled={currentPage <= 1}
              >
                {"<"}
              </Button>
              <Button
                variant="primary"
                className="billing-page-button billing-page-current"
                disabled
              >
                {currentPage}
              </Button>
              <Button
                onClick={goToNext}
                variant="outline"
                className="billing-page-button"
                disabled={currentPage >= totalPages}
              >
                {">"}
              </Button>
            </div>
            <div className="billing-page-info">
              {intl.formatMessage(messages.billingHistoryPaginationPageOf, {
                page: currentPage,
                total: totalPages,
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Billing;
