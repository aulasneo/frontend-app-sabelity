import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, camelCaseObject } from '@edx/frontend-platform';

export const getUserData = async (username) => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/user/v1/accounts/${username}`
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
        field_name: 'planLimit',
        field_value: newLimit,
      },
    ],
  };

  try {
    const response = await getAuthenticatedHttpClient().patch(url, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    });
    return camelCaseObject(response.data);
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};
