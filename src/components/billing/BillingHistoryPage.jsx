import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import Button from "../buttons/Button";
import BillingHistoryPanel from "./BillingHistoryPanel";
import messages from "./messages";
import { useBilling } from "../../contexts/BillingContext";
import "./billing.css";

const BillingHistoryPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const {
    billingHistory,
    billingHistoryLoading,
    billingHistoryError,
    fetchBillingHistory,
  } = useBilling() || {};

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!fetchBillingHistory) return;
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  const payments = useMemo(() => {
    if (!billingHistory) return [];
    return Array.isArray(billingHistory?.payments)
      ? billingHistory.payments
      : [];
  }, [billingHistory]);

  const currency = useMemo(() => {
    if (!payments.length && !billingHistory) return "usd";
    if (billingHistory?.currency) return billingHistory.currency;
    if (payments.length && payments[0].currency) return payments[0].currency;
    return "usd";
  }, [payments, billingHistory]);

  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const currentPageItems = payments.slice(startIndex, startIndex + pageSize);

  const goToPrev = () => setPage((prev) => Math.max(1, prev - 1));
  const goToNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <main>
      <div className="content-home">
        <div className="billing-header-row">
          <h2>{intl.formatMessage(messages.billingHistoryTitle)}</h2>
          <Button
            onClick={() => navigate("/billing")}
            className="billing-history-button"
            variant="outline"
            messageId={messages.billingHistoryBackToSubscription.id}
            defaultMessage={messages.billingHistoryBackToSubscription.defaultMessage}
          />
        </div>
        <div className="billing-card">
          <BillingHistoryPanel
            payments={currentPageItems}
            currency={currency}
            loading={billingHistoryLoading}
            error={billingHistoryError}
          />
        </div>

        {/* Paginación fuera del recuadro, centrada */}
        {payments.length > 0 && (
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

export default BillingHistoryPage;
