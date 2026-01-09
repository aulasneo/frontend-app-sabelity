import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useBilling } from "../../contexts/BillingContext";
import "./billing.css";

const UpcomingInvoicePanel = ({ subscriptionId, page = 0, pageSize = 10 }) => {
  const intl = useIntl();
  const {
    upcomingInvoice,
    upcomingInvoiceLoading,
    upcomingInvoiceError,
    fetchUpcomingInvoiceForSubscription,
  } = useBilling() || {};

  useEffect(() => {
    if (!subscriptionId || !fetchUpcomingInvoiceForSubscription) return;
    fetchUpcomingInvoiceForSubscription(subscriptionId);
  }, [subscriptionId, fetchUpcomingInvoiceForSubscription]);

  if (!subscriptionId) {
    return null;
  }

  if (upcomingInvoiceLoading) {
    return (
      <div style={{ marginTop: 16 }} className="billing-text-muted">
        {intl.formatMessage({
          id: "billing.upcoming.loading",
          defaultMessage: "Loading upcoming invoice...",
        })}
      </div>
    );
  }

  if (upcomingInvoiceError) {
    return (
      <div style={{ marginTop: 16 }} className="billing-error">
        {intl.formatMessage({
          id: "billing.upcoming.error",
          defaultMessage: "There was an error loading the upcoming invoice.",
        })}
      </div>
    );
  }

  if (!upcomingInvoice) {
    return (
      <div style={{ marginTop: 16 }} className="billing-text-muted">
        {intl.formatMessage({
          id: "billing.upcoming.none",
          defaultMessage: "No upcoming invoice for this subscription.",
        })}
      </div>
    );
  }

  const { currency, total, lines = [] } = upcomingInvoice;

  const totalPages = Math.max(1, Math.ceil(lines.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleLines = Array.isArray(lines)
    ? lines.slice(startIndex, endIndex)
    : [];

  const fmtAmount = (value) => {
    if (value == null) return "-";
    const v = Number(value) / 100;
    const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return `${(currency || "USD").toUpperCase()} $${s.replace(/\.00$/, "")}`;
  };

  const formatPeriodDate = (value) => {
    if (!value && value !== 0) return null;
    try {
      // Stripe sends epoch seconds
      if (typeof value === "number") {
        return new Date(value * 1000).toLocaleDateString();
      }
      if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        return new Date(parseInt(value, 10) * 1000).toLocaleDateString();
      }
    } catch (e) {}
    return null;
  };

  return (
    <section className="billing-card">
      <h4 className="billing-upcoming-title">
        {intl.formatMessage({
          id: "billing.upcoming.title",
          defaultMessage: "Upcoming invoice",
        })}
      </h4>

      <div className="billing-upcoming-table-wrapper">
        <table className="billing-upcoming-table">
          <thead>
            <tr className="billing-upcoming-header-row">
              <th className="billing-upcoming-th">
                {intl.formatMessage({
                  id: "billing.upcoming.col.description",
                  defaultMessage: "Description",
                })}
              </th>
              <th className="billing-upcoming-th-right">
                {intl.formatMessage({
                  id: "billing.upcoming.col.quantity",
                  defaultMessage: "Qty",
                })}
              </th>
              <th className="billing-upcoming-th-right">
                {intl.formatMessage({
                  id: "billing.upcoming.col.amount",
                  defaultMessage: "Amount",
                })}
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(visibleLines) && visibleLines.length > 0 ? (
              visibleLines.map((line) => (
                <tr key={line.id} className="billing-upcoming-row">
                  <td className="billing-upcoming-td">
                    <div>{line.description || "-"}</div>
                    {(() => {
                      const start = formatPeriodDate(line.periodStart);
                      const end = formatPeriodDate(line.periodEnd);
                      if (!start && !end) return null;
                      return (
                        <div className="billing-upcoming-period">
                          {start || ""}
                          {start && end ? " - " : ""}
                          {end || ""}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="billing-upcoming-td-right">
                    {line.quantity ?? "-"}
                  </td>
                  <td className="billing-upcoming-td-right">
                    {fmtAmount(line.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="billing-upcoming-empty">
                  {intl.formatMessage({
                    id: "billing.upcoming.empty",
                    defaultMessage: "No upcoming invoice lines.",
                  })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="billing-upcoming-summary">
        <span>
          {intl.formatMessage({
            id: "billing.upcoming.total",
            defaultMessage: "Total:",
          })}{" "}
          <strong>{fmtAmount(total)}</strong>
        </span>
      </div>
    </section>
  );
};

export default UpcomingInvoicePanel;
