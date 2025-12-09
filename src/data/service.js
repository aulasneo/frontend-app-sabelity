import {
  getAuthenticatedHttpClient,
  getAuthenticatedUser,
} from "@edx/frontend-platform/auth";
import { getConfig, camelCaseObject } from "@edx/frontend-platform";

export const getUserData = async () => {
  try {
    // Obtener username del usuario autenticado actual
    const authUser = getAuthenticatedUser()
    const username = authUser?.username;
    if (!username) {
      throw new Error("Authenticated username is not available");
    }
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/user/v1/accounts/${username}`
    );
    return camelCaseObject(res.data || res.body);
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

/**
 * Obtiene el detalle de la próxima factura (upcoming invoice) para una suscripción
 * @param {string} subscriptionId - ID de la suscripción de Stripe
 * @returns {Promise<Object|null>} Detalle de la próxima factura o null si no hay
 */
export const getUpcomingInvoice = async (subscriptionId) => {
  if (!subscriptionId) {
    throw new Error("Se requiere el ID de la suscripción");
  }

  try {
    const response = await getAuthenticatedHttpClient().get(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/${subscriptionId}/upcoming_invoice/`
    );
    return camelCaseObject(response.data || response.body);
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching upcoming invoice:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Obtiene los cursos del usuario
 * @returns {Promise<Object>} Lista de cursos
 */
export const getCourses = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/`
    );
    const data = camelCaseObject(res.data || res.body);
    return data;
  } catch (error) {
    console.error("Error fetching courses:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Actualiza el plan del usuario
 * @param {string} username - Nombre de usuario
 * @param {number} newLimit - Nuevo límite del plan
 * @returns {Promise<Object>} Datos actualizados del usuario
 */
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
    const resp = camelCaseObject(response.data);
    return resp;
  } catch (error) {
    console.error("Error updating plan:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// Servicios de Suscripciones

/**
 * Obtiene la lista de productos/suscripciones disponibles
 * @returns {Promise<Array>} Lista de productos/suscripciones
 */
export const listProducts = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${getConfig().STUDIO_BASE_URL}/api/v1/course-subscription/list_products/`
    );
    const data = camelCaseObject(res.data || res.body);
    return data;
  } catch (error) {
    console.error("Error fetching products:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Crea una sesión de pago para un plan de suscripción
 * @param {string} planType - ID del plan de suscripción
 * @param {string} [billingCycle='month'] - Ciclo de facturación ('month' o 'year')
 * @returns {Promise<Object>} Datos de la sesión de pago
 */
export const createCheckoutSession = async (
  planType,
  billingCycle = "month"
) => {
  try {
    const response = await getAuthenticatedHttpClient().post(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/create_checkout/`,
      {
        plan_type: planType,
        billing_cycle: billingCycle,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating checkout session:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Elimina un curso por ID en el inventario del CMS
 * @param {string|number} courseId - ID del curso/inventario (pk)
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteCourse = async (courseId) => {
  if (!courseId) {
    throw new Error("Se requiere el ID (pk) del curso");
  }

  try {
    const response = await getAuthenticatedHttpClient().get(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-inventory/${courseId}/delete/`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting course from inventory:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Crea una sesión de pago para múltiples productos/suscripciones
 * @param {Array<Object>} items - Lista de productos con sus cantidades
 * @param {string} [billingCycle='month'] - Ciclo de facturación ('month' o 'year')
 * @returns {Promise<Object>} Datos de la sesión de pago
 */
export const createCheckoutWithMultipleItems = async (
  items,
  billingCycle = "month"
) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Se requiere al menos un ítem para crear la sesión de pago"
    );
  }

  try {
    const response = await getAuthenticatedHttpClient().post(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/create_checkout_with_multiple_items/`,
      {
        items: items.map((item) => ({
          plan_type: item.planType,
          quantity: item.quantity || 1,
        })),
        billing_cycle: billingCycle,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating checkout session with multiple items:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Obtiene la suscripción detallada por ID
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<Object|null>} Datos de la suscripción o null si no tiene
 */
export const getUserSubscription = async (subscriptionId) => {
  if (!subscriptionId) {
    throw new Error("Se requiere el ID de la suscripción");
  }

  try {
    const res = await getAuthenticatedHttpClient().get(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/${subscriptionId}/get_user_subscription/`
    );
    const data = camelCaseObject(res.data || res.body);
    return data;
  } catch (error) {
    // Si el error es 404, el usuario no tiene suscripción
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error("Error fetching user subscription:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Lista todas las suscripciones del usuario
 * @returns {Promise<Array>} Lista de suscripciones del usuario
 */
export const listUserSubscriptions = async () => {
  try {
    const res = await getAuthenticatedHttpClient().get(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/list_subscriptions/`
    );
    const data = camelCaseObject(res.data || res.body);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      // No Stripe customer for this user: treat as no subscriptions
      console.info(
        "[service:listUserSubscriptions] 404: No Stripe customer found, returning empty list"
      );
      return [];
    }
    console.error("Error listing user subscriptions:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Cancela una suscripción
 * @param {string} subscriptionId - ID de la suscripción a cancelar
 * @param {boolean} [cancelAtPeriodEnd=false] - Si es true, cancela al final del período de facturación
 * @param {string} [reason=''] - Razón de la cancelación (opcional)
 * @returns {Promise<Object>} Resultado de la cancelación
 */
export const cancelSubscription = async (
  subscriptionId,
  cancelAtPeriodEnd = false,
  reason = ""
) => {
  if (!subscriptionId) {
    throw new Error("Se requiere el ID de la suscripción");
  }

  try {
    const response = await getAuthenticatedHttpClient().delete(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/cancel_subscription/`,
      {
        data: {
          subscription_id: subscriptionId,
          cancel_at_period_end: cancelAtPeriodEnd,
          cancellation_reason: reason,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error canceling subscription:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Añade o actualiza un producto en una suscripción existente
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} priceId - ID del precio del producto a añadir/actualizar
 * @param {number} [quantity=1] - Cantidad del producto
 * @returns {Promise<Object>} Suscripción actualizada
 */
export const addOrUpdateProduct = async (
  subscriptionId,
  priceId,
  quantity = 1
) => {
  if (!subscriptionId || !priceId) {
    throw new Error("Se requieren el ID de la suscripción y el ID del precio");
  }

  try {
    // NOTA: Backend tiene @action con methods=['get'], por lo que mantenemos GET.
    // Aquí permitimos cantidades positivas o negativas (delta), siempre que sean != 0.
    const parsedQty = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQty) || parsedQty === 0) {
      throw new Error("quantity debe ser un entero distinto de 0");
    }

    const response = await getAuthenticatedHttpClient().get(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/${subscriptionId}/add_or_update_product/`,
      {
        params: {
          price_id: priceId,
          quantity: parsedQty,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding/updating product in subscription:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Cambia un plan de suscripción por otro
 * @param {string} subscriptionId - ID de la suscripción
 * @param {string} fromPriceId - ID del precio actual
 * @param {string} toPriceId - ID del nuevo precio
 * @param {number} [quantity=1] - Cantidad (opcional, por defecto 1)
 * @param {boolean} [allowProration=false] - Si permite prorrateo (opcional, por defecto false)
 * @returns {Promise<Object>} Suscripción actualizada
 */
export const changeSubscriptionPlan = async (
  subscriptionId,
  fromPriceId,
  toPriceId,
  quantity = 1,
  allowProration = false
) => {
  if (!subscriptionId || !fromPriceId || !toPriceId) {
    throw new Error(
      "Se requieren los IDs de suscripción, precio actual y nuevo precio"
    );
  }

  try {
    const response = await getAuthenticatedHttpClient().post(
      `${
        getConfig().STUDIO_BASE_URL
      }/api/v1/course-subscription/${subscriptionId}/change_plan/`,
      {
        from_price_id: fromPriceId,
        to_price_id: toPriceId,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        allow_proration: Boolean(allowProration),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error changing subscription plan:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Maneja la redirección después de un pago exitoso
 * @param {string} sessionId - ID de la sesión de pago
 * @returns {Promise<Object>} Detalles del pago exitoso
 */
export const handleSuccessPayment = async (sessionId) => {
  if (!sessionId) {
    throw new Error("Se requiere el ID de la sesión");
  }

  try {
    const response = await getAuthenticatedHttpClient().get(
      `${getConfig().STUDIO_BASE_URL}/api/v1/course-subscription/success/`,
      { params: { session_id: sessionId } }
    );
    return response.data;
  } catch (error) {
    console.error("Error handling success payment:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Obtiene el inventario de cursos del usuario según su suscripción
 * @returns {Promise<Object>} Inventario con total_courses, assigned_courses_count, available_courses
 */
export const getUserInventory = async () => {
  try {
    const response = await getAuthenticatedHttpClient().get(
      `${getConfig().STUDIO_BASE_URL}/api/v1/course-inventory/inventory/`
    );
    return camelCaseObject(response.data);
  } catch (error) {
    console.error("Error fetching user inventory:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    // Si no tiene suscripción, devolver valores por defecto
    if (error.response?.status === 404) {
      return {
        totalCourses: 0,
        assignedCoursesCount: 0,
        availableCourses: 0,
      };
    }
    throw error;
  }
};
