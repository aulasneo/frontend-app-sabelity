import React, { useState } from "react";
import { useIntl } from "react-intl";
import subsMessages from "../subscriptionsMessages";
import { useSubscriptions } from "../../../../contexts/SubscriptionsContext";
import "../../../modals/stylesCart.css";

// Tabla de suscripciones: muestra productos comprados (arriba) y disponibles (abajo)
// con controles +/- para modificar cantidades a nivel UI.
const SubscriptionsTable = ({
  onSummaryChange,
  currentTotalCourses,
  coursesInUse,
  onBlockedDowngrade,
}) => {
  const intl = useIntl();
  const { products = [], packsByProduct = {} } = useSubscriptions() || {};

  // Ordenar productos por el número inicial del nombre (1 Course, 3 Courses, 10 Courses)
  const sortedProducts = (products || []).slice().sort((a, b) => {
    const na = parseInt(a?.name, 10) || 0;
    const nb = parseInt(b?.name, 10) || 0;
    return na - nb;
  });

  const getName = (item) => item?.name || item?.title || "-";

  const getPlan = (item) => {
    return item?.planName || item?.plan || getName(item);
  };

  const getPrice = (item) => {
    if (typeof item?.amount === "string") return item.amount;
    if (typeof item?.price === "string") return item.price;
    if (typeof item?.unitAmount === "number") return `USD $${item.unitAmount}`;
    return "-";
  };

  // Clave de producto consistente con packsByProduct (debe ser un ID de "price_" cuando exista)
  const getProductKey = (item) => {
    if (!item) return null;

    // Priorizar siempre IDs de precio explícitos
    if (item.price && item.price.id) return item.price.id; // Stripe price object
    if (item.priceId) return item.priceId;
    if (item.price_id) return item.price_id;
    if (item.stripeId) return item.stripeId; // en nuestro catálogo suele ser el price_id

    // IDs de plan lógicos que también usamos como clave en otros contextos
    if (item.planType) return item.planType;
    if (item.plan_type) return item.plan_type;

    // Como último recurso, usar id solo si parece un price_id de Stripe
    if (item.id && String(item.id).startsWith("price_")) {
      return item.id;
    }

    return item.id || null;
  };

  // Estado local de cantidades por producto (clave Stripe/producto)
  const [quantitiesByProduct, setQuantitiesByProduct] = useState(() => {
    const initial = {};
    (products || []).forEach((p) => {
      const key = getProductKey(p);
      if (!key) return;
      const ownedQty = packsByProduct[key] || 0;
      initial[key] = ownedQty;
    });
    return initial;
  });

  // Helper local para parsear montos tipo "10.00 USD" a número
  const parseAmountLoose = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val);
    const m = s.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };

  // Recalcular deltas de dinero y cursos respecto a las suscripciones actuales
  const recomputeSummaryFromQuantities = (nextQuantities) => {
    if (typeof onSummaryChange !== "function") return;

    let moneyDelta = 0;
    let coursesDelta = 0;

    (products || []).forEach((p) => {
      const key = getProductKey(p);
      if (!key) return;

      const currentQty = packsByProduct[key] || 0; // lo que ya está comprado
      const nextQty = nextQuantities[key] ?? currentQty; // lo que el usuario dejó en la UI
      const diff = nextQty - currentQty;
      if (!diff) return;

      const unitAmount = parseAmountLoose(p.amount || p.price || p.unitAmount);
      const coursesPerPack =
        typeof p.coursesCount === "number"
          ? p.coursesCount
          : typeof p.courses_count === "number"
          ? p.courses_count
          : 0;

      moneyDelta += diff * (unitAmount || 0);
      coursesDelta += diff * (coursesPerPack || 0);
    });

    try {
      onSummaryChange({ moneyDelta, coursesDelta, quantitiesByProduct: nextQuantities });
    } catch (e) {
      // fail-silent: no romper UI si el callback falla
    }
  };

  const getCurrentQty = (item) => {
    const key = getProductKey(item);
    if (!key) return 0;
    return quantitiesByProduct[key] ?? packsByProduct[key] ?? 0;
  };

  const updateQuantity = (item, delta) => {
    const key = getProductKey(item);
    if (!key) return;
    setQuantitiesByProduct((prev) => {
      const current = prev[key] ?? packsByProduct[key] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === current) return prev;
      const updated = { ...prev, [key]: next };

      // Calcular el nuevo total de cursos del plan para esta UI
      let nextCoursesDelta = 0;
      (products || []).forEach((p) => {
        const pKey = getProductKey(p);
        if (!pKey) return;
        const ownedQty = packsByProduct[pKey] || 0;
        const uiQty = updated[pKey] ?? ownedQty;
        const diff = uiQty - ownedQty;
        if (!diff) return;
        const coursesPerPack =
          typeof p.coursesCount === "number"
            ? p.coursesCount
            : typeof p.courses_count === "number"
            ? p.courses_count
            : 0;
        nextCoursesDelta += diff * (coursesPerPack || 0);
      });

      const targetTotal = (currentTotalCourses || 0) + nextCoursesDelta;

      // Si con este cambio quedaríamos por debajo de los cursos en uso (incluyendo 0), bloquear y no aplicar
      if (
        typeof coursesInUse === "number" &&
        coursesInUse > 0 &&
        targetTotal < coursesInUse &&
        typeof onBlockedDowngrade === "function"
      ) {
        try {
          onBlockedDowngrade();
        } catch (e) {}
        return prev;
      }

      // Recalcular totales a partir de las nuevas cantidades
      recomputeSummaryFromQuantities(updated);
      return updated;
    });
  };

  return (
    <>
      <h5 className="subs-subtitle">
        {intl.formatMessage(subsMessages.yourProducts)}
      </h5>
      <div className="subs-items-header">
        <div>{intl.formatMessage(subsMessages.tableSubscriptions)}</div>
        <div>{intl.formatMessage(subsMessages.tableProduct)}</div>
        <div>{intl.formatMessage(subsMessages.tablePrice)}</div>
        <div>{intl.formatMessage(subsMessages.tableQty)}</div>
      </div>

      {(() => {
        const owned = sortedProducts.filter((p) => {
          const id = getProductKey(p);
          return id && (packsByProduct[id] || 0) > 0;
        });

        if (!owned.length) {
          return (
            <div className="subs-empty">
              {intl.formatMessage(subsMessages.noPurchasedYet)}
            </div>
          );
        }

        return owned.map((item) => {
          const id = getProductKey(item);
          const qty = getCurrentQty(item);
          return (
            <div
              key={id}
              className="subs-item-line"
            >
              {/* Subscriptions column: cantidad comprada */}
              <div className="subs-item-amount">{qty}</div>
              {/* Plan */}
              <div className="subs-item-title">{getPlan(item)}</div>
              {/* Price: pegado visualmente al plan con una clase específica */}
              <div className="subs-item-price subs-item-price-owned">{getPrice(item)}</div>
              {/* Controles Qty para modificar packs existentes, alineados a la derecha */}
              <div className="spc-actions">
                <button
                  className="qty-btn"
                  type="button"
                  onClick={() => updateQuantity(item, -1)}
                  disabled={qty <= 0}
                >
                  -
                </button>
                <input
                  className="qty-input"
                  type="number"
                  min="0"
                  value={qty}
                  readOnly
                />
                <button
                  className="qty-btn"
                  type="button"
                  onClick={() => updateQuantity(item, 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        });
      })()}

      <div className="subs-line" />

      <h5 className="subs-subtitle mt-10">
        {intl.formatMessage(subsMessages.availableProducts)}
      </h5>

      {Array.isArray(sortedProducts) && sortedProducts.length > 0 ? (
        sortedProducts
          .filter((p) => {
            const id = getProductKey(p);
            return !id || (packsByProduct[id] || 0) === 0;
          })
          .map((item) => {
            const qty = getCurrentQty(item);
            return (
          <div
            key={getProductKey(item) || item.id || item.stripeId || item.priceId}
            className="subs-item-line"
          >
            {/* Subscriptions column: vacío / placeholder */}
            <div className="subs-item-amount">-</div>
            {/* Plan */}
            <div className="subs-item-title">{getPlan(item)}</div>
            {/* Price */}
            <div className="subs-item-price">{getPrice(item)}</div>
            {/* Controles Qty estilo botones, deshabilitados por ahora */}
            <div className="spc-actions">
              <button
                className="qty-btn"
                type="button"
                onClick={() => updateQuantity(item, -1)}
                disabled={qty <= 0}
              >
                -
              </button>
              <input
                className="qty-input"
                type="number"
                min="0"
                value={qty}
                readOnly
              />
              <button
                className="qty-btn"
                type="button"
                onClick={() => updateQuantity(item, 1)}
              >
                +
              </button>
            </div>
          </div>
        );
          })
      ) : (
        <div className="subs-empty">
          {intl.formatMessage(
            subsMessages.noAvailableProducts || subsMessages.noPurchasedYet
          )}
        </div>
      )}
    </>
  );
};

export default SubscriptionsTable;