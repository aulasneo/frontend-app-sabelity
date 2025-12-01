import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../common/Button";
import "./stylesCart.css";

const CartModal = ({
  showCart,
  closeCart,
  intl,
  messages,
  products = [],
  cartQuantities = {},
  setQty,
  incQty,
  decQty,
  totalItems = 0,
  subtotal = 0,
  onCheckout,
  onApplyUpdates,
  unitsById = {},
  countsById = {},
  ownedQuantities = {},
  cartSummary = null,
}) => {
  const fm = (desc, fallback = "") => {
    if (!desc) return fallback;
    if (desc.id && intl && typeof intl.formatMessage === 'function') {
      try { return intl.formatMessage(desc); } catch (e) { /* ignore */ }
    }
    return desc.defaultMessage || fallback;
  };
  const fmtUSD = (n) => {
    const v = Number(n || 0);
    const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return `USD $${s.replace(/\.00$/, "")}`;
  };
  const parseAmountLoose = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    const s = String(val);
    const m = s.replace(',', '.').match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };
  const extractCountFromName = (name) => {
    const m = String(name || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };
  // Recalcular totales dinámicamente a partir de las props actuales
  const computeCartTotals = () => {
    // Base actual (lo que paga hoy) desde el footer si está disponible
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
    const prodIndex = Object.fromEntries((products || []).map(p => [p.stripeId, p]));
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
  };
  return (
    <ModalDialog
      isOpen={showCart}
      onClose={closeCart}
      title={fm(messages.cartTitle, "Add subscriptions")}
      className="cart-modal"
    >
      <ModalDialog.Body>
        {(products && products.length) ? (
          <>
            <div className="cart-list">
              {products.map((p) => {
                const qty = (p.qty != null ? p.qty : (cartQuantities[p.stripeId] || 0));
                const unit = Number(unitsById[p.stripeId] != null ? unitsById[p.stripeId] : 0);
                const perPkg = Number(countsById[p.stripeId] != null ? countsById[p.stripeId] : 0);
                const lineTotal = unit * (Number(qty) || 0);
                const courses = perPkg * (Number(qty) || 0);
                return (
                  <div key={p.stripeId} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-row">
                        <div className="cart-item-title">{p.name}</div>
                        <div className="cart-item-price">{p.amount}</div>
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => (p.onDec ? p.onDec(p.stripeId) : decQty(p.stripeId))}>-</button>
                      <input
                        className="qty-input"
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => (p.onSet ? p.onSet(p.stripeId, e.target.value) : setQty(p.stripeId, e.target.value))}
                      />
                      <button className="qty-btn" onClick={() => (p.onInc ? p.onInc(p.stripeId) : incQty(p.stripeId))}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cart-subtotal">
              <div className="cart-subtotal-label">{fm(messages.cartSubtotal, "Subtotal")}</div>
              {(() => {
                const { changesMoney } = computeCartTotals();
                return <div className="cart-subtotal-value">{fmtUSD(changesMoney)}</div>;
              })()}
            </div>

            {(() => {
              const {
                currentMoney,
                targetMoney,
                changesMoney,
                currentCourses,
                targetCourses,
                changesCourses,
              } = computeCartTotals();
              return (
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  <div style={{ color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Current total: <strong>{fmtUSD(currentMoney)}</strong></span>
                    <span>Changes: <strong>{changesMoney >= 0 ? '+' : ''}{fmtUSD(changesMoney)}</strong></span>
                    <span>New total: <strong>{fmtUSD(targetMoney)}</strong></span>
                  </div>
                  <div style={{ color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Current courses: <strong>{currentCourses}</strong></span>
                    <span>Changes: <strong>{changesCourses >= 0 ? '+' : ''}{changesCourses}</strong></span>
                    <span>New courses: <strong>{targetCourses}</strong></span>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <p>{fm(messages.noProducts, "No products available.")}</p>
        )}

        {/* Updates list intentionally hidden: quantities are controlled only via the products above */}
      </ModalDialog.Body>
      <ModalDialog.Footer>
        {totalItems > 0 ? (
          <Button variant="primary" onClick={onCheckout} disabled={totalItems === 0}>
            {fm(messages.checkoutButton, "Checkout")}
          </Button>
        ) : (
          <Button variant="primary" onClick={onApplyUpdates}>
            {"Apply changes"}
          </Button>
        )}
        <Button variant="primary" onClick={closeCart}>
          {fm(messages.modalButtonClose, "Cancel")}
        </Button>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default CartModal;
