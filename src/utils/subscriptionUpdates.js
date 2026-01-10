// Helper compartido para aplicar cambios de suscripción a nivel de productos
// Calcula deltas entre cantidades actuales (base) y deseadas, y ejecuta
// addOrUpdateProduct para cada priceId correspondiente.

import { addOrUpdateProduct } from "../data/service";

/**
 * Calcula las operaciones de update (deltas) entre dos mapas de cantidades.
 * @param {Object} baseQuantities - Cantidades actuales por priceId.
 * @param {Object} desiredQuantities - Cantidades deseadas por priceId.
 * @returns {Array<{ priceId: string, diff: number, currentQty: number, nextQty: number }>}
 */
export function computeSubscriptionUpdateOps(baseQuantities = {}, desiredQuantities = {}) {
  const ops = [];
  const allIds = new Set([
    ...Object.keys(baseQuantities || {}),
    ...Object.keys(desiredQuantities || {}),
  ]);

  allIds.forEach((priceId) => {
    const currentQty = Number(baseQuantities[priceId] || 0);
    const nextRaw =
      Object.prototype.hasOwnProperty.call(desiredQuantities || {}, priceId)
        ? desiredQuantities[priceId]
        : currentQty;
    const nextQty = Number(nextRaw);
    if (Number.isNaN(nextQty)) {
      return;
    }
    const diff = nextQty - currentQty;
    if (!diff) {
      return;
    }
    ops.push({ priceId, diff, currentQty, nextQty });
  });

  return ops;
}

/**
 * Ejecuta secuencialmente addOrUpdateProduct para una lista de operaciones.
 * Esto evita posibles problemas de concurrencia en el backend.
 *
 * @param {string} subscriptionId
 * @param {Array<{ priceId: string, diff: number }>} ops
 */
export async function runSubscriptionUpdateOps(subscriptionId, ops = []) {
  if (!subscriptionId || !Array.isArray(ops) || !ops.length) {
    return;
  }

  for (const { priceId, diff } of ops) {
    // addOrUpdateProduct ya valida que diff !== 0 y que sea entero.
    // Ejecutamos en serie para no saturar Stripe/backend con peticiones concurrentes.
    // Si alguna falla, propagamos el error para que el caller muestre el modal de error.
    // eslint-disable-next-line no-await-in-loop
    await addOrUpdateProduct(subscriptionId, priceId, diff);
  }
}
