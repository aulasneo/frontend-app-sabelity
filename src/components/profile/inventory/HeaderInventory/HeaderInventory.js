import React from "react";
import { useIntl } from "react-intl";
import { useSubscriptions } from "../../../../contexts/SubscriptionsContext";
import "./HeaderInventory.css";
import messages from "../messages";

const HeaderInventory = ({
  userInventory,
  computedCurrentTotalCourses,
}) => {
  const intl = useIntl();
  const { totalCoursesFromSubscriptions } = useSubscriptions() || {};

  if (!userInventory) return null;

  // Usar el mayor valor entre:
  // - el total derivado de las suscripciones que llega por props (Profile)
  // - el total derivado del contexto
  // - el total que reporta el inventario del backend
  const overrideTotal = Number(computedCurrentTotalCourses ?? 0);
  const computedTotalFromSubs = Number(totalCoursesFromSubscriptions || 0);
  const backendTotal = Number(userInventory.totalCourses || 0);
  const total = Math.max(backendTotal, computedTotalFromSubs, overrideTotal);

  const used = Number(userInventory.assignedCoursesCount || 0);
  const available = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div className="inventory-info">
      <div className="inventory-stats">
        <div className="inventory-stat">
          <strong>{intl.formatMessage(messages.totalCourses)}:</strong>{" "}
          {total}
        </div>
        <div className="inventory-stat">
          <strong>{intl.formatMessage(messages.usedCourses)}:</strong>{" "}
          {userInventory.assignedCoursesCount}
        </div>
        <div
          className={`inventory-stat inventory-available ${
            available > 0 ? "ok" : "no-courses"
          }`}
        >
          <strong>{intl.formatMessage(messages.availableCourses)}:</strong>{" "}
          {available}
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

      {available === 0 && (
        <div className="inventory-warning">
          ⚠️ {intl.formatMessage(messages.limitReachedWarning)}
        </div>
      )}
    </div>
  );
};

export default HeaderInventory;
