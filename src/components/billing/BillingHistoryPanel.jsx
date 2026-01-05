import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import messages from "./messages";
import "./billing.css";

const BillingHistoryPanel = ({ payments, currency = "usd", loading, error }) => {
  const intl = useIntl();

  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments]
  );

  const { monthTotal, monthLabel } = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
    if (!safePayments.length) return { monthTotal: 0, monthLabel: label };

    const year = now.getFullYear();
    const month = now.getMonth();

    const total = safePayments.reduce((acc, p) => {
      const d = p.created ? new Date(p.created) : null;
      if (!d || Number.isNaN(d.getTime())) return acc;
      if (d.getFullYear() !== year || d.getMonth() !== month) return acc;
      return acc + (Number(p.amountPaid || p.amount_paid || 0));
    }, 0);

    return { monthTotal: total, monthLabel: label };
  }, [safePayments]);

  const fmtAmount = (value) => {
    if (value == null) return "-";
    const v = Number(value);
    const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return `${String(currency || "USD").toUpperCase()} $${s}`;
  };

  return (
    <section className="billing-history-section">
      {loading && (
        <div style={{ marginTop: 24 }} className="billing-text-muted">
          {intl.formatMessage(messages.billingHistoryLoading)}
        </div>
      )}

      {error && !loading && (
        <div style={{ marginTop: 24 }} className="billing-error">
          {intl.formatMessage(messages.billingHistoryError)}
        </div>
      )}

      {!loading && !error && (
        <>
          {safePayments.length === 0 ? (
            <div className="billing-text-muted" style={{ marginTop: 16 }}>
              {intl.formatMessage(messages.billingHistoryEmpty)}
            </div>
          ) : (
            <>
              <div className="billing-upcoming-table-wrapper">
                <table className="billing-upcoming-table">
                  <thead>
                    <tr className="billing-upcoming-header-row">
                      <th className="billing-upcoming-th">
                        {intl.formatMessage(messages.billingHistoryColDate)}
                      </th>
                      <th className="billing-upcoming-th">
                        {intl.formatMessage(messages.billingHistoryColSubscription)}
                      </th>
                      <th className="billing-upcoming-th">
                        {intl.formatMessage(messages.billingHistoryColBillingCycle)}
                      </th>
                      <th className="billing-upcoming-th">
                        {intl.formatMessage(messages.billingHistoryColAmount)}
                      </th>
                      <th className="billing-upcoming-th-right">
                        {intl.formatMessage(messages.billingHistoryColStatus)}
                      </th>
                      <th className="billing-upcoming-th-right">
                        {intl.formatMessage(messages.billingHistoryColInvoice)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safePayments.map((p) => (
                      <tr key={p.id} className="billing-upcoming-row">
                        <td className="billing-upcoming-td">
                          {p.created
                            ? new Date(p.created).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="billing-upcoming-td">
                          {p.subscriptionName || p.subscription_name || "-"}
                        </td>
                        <td className="billing-upcoming-td">
                          {p.billingCycle || p.billing_cycle || "-"}
                        </td>
                        <td className="billing-upcoming-td-right">
                          {fmtAmount(p.amountPaid || p.amount_paid)}
                        </td>
                        <td className="billing-upcoming-td-right">
                          {p.status || "-"}
                        </td>
                        <td className="billing-upcoming-td-right">
                          {p.hostedInvoiceUrl ||
                          p.hosted_invoice_url ||
                          p.invoicePdf ||
                          p.invoice_pdf ? (
                            <a
                              href={
                                p.hostedInvoiceUrl ||
                                p.hosted_invoice_url ||
                                p.invoicePdf ||
                                p.invoice_pdf
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={intl.formatMessage(
                                messages.billingHistoryInvoiceDownload
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <line x1="10" y1="9" x2="9" y2="9" />
                              </svg>
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default BillingHistoryPanel;
