import React, { useEffect, useState } from "react";
import InventoryInfo from "../inventory/InventoryInfo/InventoryInfo";
import { useIntl } from "react-intl";
import subsMessages from "../inventory/SubscriptionsManager/subscriptionsMessages";
import { getUserInventory } from "../data/service";
import "./profile.css";

const Profile = () => {
  const intl = useIntl();
  const [userInventory, setUserInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const inv = await getUserInventory();
        setUserInventory(inv || null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load user inventory", e);
        setError(intl.formatMessage(subsMessages.errorLoading || { defaultMessage: "Error loading subscriptions" }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [intl]);

  return (
    <main>
      <div className="content-home">
        <h1>Profile</h1>

        {loading && (
          <div className="profile-loading">
            {intl.formatMessage(subsMessages.loading || { defaultMessage: "Loading..." })}
          </div>
        )}
        {error && <div className="profile-error">{error}</div>}

        {userInventory && <InventoryInfo userInventory={userInventory} />}
      </div>
    </main>
  );
};

export default Profile;
