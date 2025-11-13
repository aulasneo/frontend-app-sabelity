import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, camelCaseObject } from '@edx/frontend-platform';
import queryString from 'query-string';

export const getUserData = async (username) => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/user/v1/accounts/${username}`
    );
    return camelCaseObject(res.data || res.body);
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const getCourses = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`
    );
    return camelCaseObject(res.data || res.body);
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUserPlan = async (username, newLimit) => {
  const url = `${getConfig().LMS_BASE_URL}/api/user/v1/accounts/${username}`;
  const data = {
    extended_profile: [
      {
        field_name: "planLimit",
        field_value: newLimit,
      },
    ],
  };

  try {
    const response = await getAuthenticatedHttpClient().patch(url, data, {
      headers: { "Content-Type": "application/merge-patch+json" },
    });
    return camelCaseObject(response.data);
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const listProducts = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/course-subscription/list_products/`
    );
    return camelCaseObject(res.data || res.body);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createCheckoutSession = async (priceId, successUrl, cancelUrl) => {
  try {
    const response = await getAuthenticatedHttpClient().post(
      `${getConfig().LMS_BASE_URL}/api/course-subscription/create_checkout/`,
      {
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const getUserSubscription = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/course-subscription/get_user_subscription/`
    );
    return camelCaseObject(res.data || res.body);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await getAuthenticatedHttpClient().post(
      `${getConfig().LMS_BASE_URL}/api/course-subscription/cancel_subscription/`,
      { subscription_id: subscriptionId }
    );
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};
