import React from "react";
import { useIntl } from "react-intl";
import "./HeaderInventory.css";
import messages from "../messages";

const HeaderInventory = ({ userInventory }) => {
  const intl = useIntl();
  if (!userInventory) return null;

  return (
    <div className="inventory-info">
      <h4 className="inventory-title">{intl.formatMessage(messages.title)}</h4>
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

      {userInventory.availableCourses === 0 && (
        <div className="inventory-warning">
          ⚠️ {intl.formatMessage(messages.limitReachedWarning)}
        </div>
      )}
    </div>
  );
};

export default HeaderInventory;
