import React from "react";
import { useIntl } from "react-intl";
import "./InventoryInfo.css";
import SubscriptionsManager from "../SubscriptionsManager/SubscriptionsManager";
import HeaderInventory from "../HeaderInventory/HeaderInventory";

const InventoryInfo = ({ userInventory }) => {
  const intl = useIntl();
  if (!userInventory) return null;

  return (
    <div className="inventory-content">
      <HeaderInventory userInventory={userInventory} />
      <SubscriptionsManager />
    </div>
  );
};

export default InventoryInfo;
