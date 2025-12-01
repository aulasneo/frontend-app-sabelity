import React from "react";
import { useIntl } from "react-intl";
import Button from "../../common/Button";
import "./HeaderInventory.css";
import messages from "../messages";

const HeaderInventory = ({
  userInventory,
  currentSubscription,
  onOpenInvoices,
}) => {
  const intl = useIntl();
  console.log(userInventory);
  if (!userInventory) return null;

  const total = Number(userInventory.totalCourses || 0);
  const used = Number(userInventory.assignedCoursesCount || 0);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  // Extraer nombre del plan desde subscription.items.data
  const planName = (() => {
    if (!currentSubscription?.items?.data) return null;
    const items = currentSubscription.items.data;
    if (!items.length) return null;
    // Tomar el primer item y extraer nombre del producto
    const firstItem = items[0];
    return firstItem?.price?.product?.name || firstItem?.plan?.name || null;
  })();

  return (
    <div className="inventory-info">
      <h4 className="inventory-title">{intl.formatMessage(messages.title)}</h4>
      {planName && (
        <div style={{ color: "#6b21a8", fontWeight: 600, marginBottom: 8 }}>
          Plan: {planName}
        </div>
      )}
      <div className="inventory-stats">
        <div className="inventory-stat">
          <strong>{intl.formatMessage(messages.totalCourses)}:</strong>{" "}
          {userInventory.totalCourses}
        </div>
        <div className="inventory-stat">
          <strong>{intl.formatMessage(messages.usedCourses)}:</strong>{" "}
          {userInventory.assignedCoursesCount}
        </div>
        <div
          className={`inventory-stat inventory-available ${
            userInventory.availableCourses > 0 ? "ok" : "no-courses"
          }`}
        >
          <strong>{intl.formatMessage(messages.availableCourses)}:</strong>{" "}
          {userInventory.availableCourses}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{ height: 8, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#6b21a8",
              transition: "width .3s",
            }}
          />
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
          {used} / {total} ({pct}%)
        </div>
      </div>

      {userInventory.availableCourses === 0 && (
        <div className="inventory-warning">
          ⚠️ {intl.formatMessage(messages.limitReachedWarning)}
        </div>
      )}

      {/** Billing info moved to Sidebar (opens in a new tab) */}
    </div>
  );
};

export default HeaderInventory;
