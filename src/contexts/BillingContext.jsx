import React, { createContext, useContext, useState, useCallback } from "react";
import {
  getUserData,
  getCourses,
  createCheckoutSession,
  createCheckoutWithMultipleItems,
  cancelSubscription,
  getUpcomingInvoice,
  getUserSubscription,
  getBillingHistory,
} from "../data/service";
import { useSubscriptions } from "./SubscriptionsContext";

const BillingContext = createContext(null);

export const BillingProvider = ({ children }) => {
  const { refreshAll } = useSubscriptions() || {};
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);
  const [upcomingInvoiceLoading, setUpcomingInvoiceLoading] = useState(false);
  const [upcomingInvoiceError, setUpcomingInvoiceError] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [subscriptionDetailsLoading, setSubscriptionDetailsLoading] = useState(false);
  const [subscriptionDetailsError, setSubscriptionDetailsError] = useState(null);
  const [billingHistory, setBillingHistory] = useState(null);
  const [billingHistoryLoading, setBillingHistoryLoading] = useState(false);
  const [billingHistoryError, setBillingHistoryError] = useState(null);

  const refreshUserAndCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, c] = await Promise.all([
        getUserData().catch((e) => {
          console.log("[BillingContext] getUserData error", e?.response?.status);
          return null;
        }),
        getCourses().catch((e) => {
          console.log("[BillingContext] getCourses error", e?.response?.status);
          return null;
        }),
      ]);
      if (u) setUser(u);
      if (c) setCourses(c);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const startCheckout = useCallback(async ({ planType, billingCycle = "month" }) => {
    const session = await createCheckoutSession(planType, billingCycle);
    if (session?.url) {
      window.location.href = session.url;
    }
    return session;
  }, []);

  const startMultiCheckout = useCallback(
    async ({ items, billingCycle = "month" }) => {
      const session = await createCheckoutWithMultipleItems(items, billingCycle);
      if (session?.url) {
        window.location.href = session.url;
      }
      return session;
    },
    []
  );

  const fetchBillingHistory = useCallback(async () => {
    try {
      setBillingHistoryLoading(true);
      setBillingHistoryError(null);
      const data = await getBillingHistory();
      setBillingHistory(data || { currency: "usd", payments: [], currentMonthTotal: 0 });
    } catch (e) {
      setBillingHistoryError(e);
    } finally {
      setBillingHistoryLoading(false);
    }
  }, []);

  const fetchSubscriptionDetails = useCallback(
    async (subscriptionId) => {
      if (!subscriptionId) return;
      try {
        setSubscriptionDetailsLoading(true);
        setSubscriptionDetailsError(null);
        const data = await getUserSubscription(subscriptionId);
        setSubscriptionDetails(data || null);
      } catch (e) {
        setSubscriptionDetailsError(e);
      } finally {
        setSubscriptionDetailsLoading(false);
      }
    },
    []
  );

  const cancelSubscriptionSafe = useCallback(
    async ({ subscriptionId, cancelAtPeriodEnd = true, reason = "" }) => {
      await cancelSubscription(subscriptionId, cancelAtPeriodEnd, reason);
      try {
        if (refreshAll) {
          await refreshAll();
        }
      } catch (e) {}
    },
    [refreshAll]
  );

  const fetchUpcomingInvoiceForSubscription = useCallback(
    async (subscriptionId) => {
      if (!subscriptionId) return;
      try {
        setUpcomingInvoiceLoading(true);
        setUpcomingInvoiceError(null);
        const data = await getUpcomingInvoice(subscriptionId);
        setUpcomingInvoice(data || null);
      } catch (e) {
        setUpcomingInvoiceError(e);
      } finally {
        setUpcomingInvoiceLoading(false);
      }
    },
    []
  );

  const value = {
    loading,
    error,
    user,
    courses,
    refreshUserAndCourses,
    startCheckout,
    startMultiCheckout,
    cancelSubscriptionSafe,
    upcomingInvoice,
    upcomingInvoiceLoading,
    upcomingInvoiceError,
    fetchUpcomingInvoiceForSubscription,
    subscriptionDetails,
    subscriptionDetailsLoading,
    subscriptionDetailsError,
    fetchSubscriptionDetails,
    billingHistory,
    billingHistoryLoading,
    billingHistoryError,
    fetchBillingHistory,
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  return useContext(BillingContext);
};
