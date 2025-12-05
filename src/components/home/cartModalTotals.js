// Helper puro para calcular los totales del CartModal a partir de las props actuales.

const parseAmountLoose = (val) => {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const s = String(val);
  const m = s.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? parseFloat(m[1]) : 0;
};

const extractCountFromName = (name) => {
  const m = String(name || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

export function computeCartTotals({
  products = [],
  cartQuantities = {},
  unitsById = {},
  countsById = {},
  ownedQuantities = {},
  cartSummary = null,
}) {
  // Base actual (lo que paga hoy) desde el resumen si está disponible
  let currentMoney = cartSummary?.currentTotal ?? null;
  let currentCourses = cartSummary?.currentCourses ?? null;

  // Si no hay resumen, calcular desde ownedQuantities
  if (currentMoney == null || currentCourses == null) {
    currentMoney = 0;
    currentCourses = 0;
    Object.keys(ownedQuantities || {}).forEach((id) => {
      const unit = Number(unitsById[id] || 0);
      const count = Number(countsById[id] || 0);
      const ownedQ = Number(ownedQuantities[id] || 0);
      currentMoney += ownedQ * unit;
      currentCourses += ownedQ * count;
    });
  }

  // Index de productos por id para inferencias cuando no vienen maps
  const prodIndex = Object.fromEntries((products || []).map((p) => [p.stripeId, p]));

  const getTargetQ = (id) => {
    const prod = prodIndex[id];
    if (prod && prod.qty != null) return Number(prod.qty || 0);
    return Number((cartQuantities && cartQuantities[id]) || 0);
  };

  const getUnit = (id) => {
    const u = unitsById[id];
    if (u != null && !Number.isNaN(Number(u))) return Number(u);
    return parseAmountLoose(prodIndex[id]?.amount);
  };

  const getCount = (id) => {
    const c = countsById[id];
    if (c != null && !Number.isNaN(Number(c))) return Number(c);
    return extractCountFromName(prodIndex[id]?.name);
  };

  // Delta respecto de owned: (targetQty - ownedQty) por cada producto
  const allIds = new Set([
    ...Object.keys(ownedQuantities || {}),
    ...Object.keys(prodIndex),
  ]);
  let changesMoney = 0;
  let changesCourses = 0;

  allIds.forEach((id) => {
    const unit = Number(getUnit(id) || 0);
    const count = Number(getCount(id) || 0);
    const ownedQ = Number(ownedQuantities[id] || 0);
    const targetQ = getTargetQ(id) || ownedQ;
    changesMoney += (targetQ - ownedQ) * unit;
    changesCourses += (targetQ - ownedQ) * count;
  });

  const targetMoney = currentMoney + changesMoney;
  const targetCourses = currentCourses + changesCourses;

  return {
    currentMoney,
    targetMoney,
    changesMoney,
    currentCourses,
    targetCourses,
    changesCourses,
  };
}
