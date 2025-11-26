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
              <div className="cart-subtotal-value">USD ${subtotal.toFixed(2)}</div>
            </div>

            {(() => {
              // Summary by COUNT buckets, to align owned keys and catalog keys
              const mockPriceByCount = { 1: 69, 3: 149, 10: 199 };
              const inferCountFromKey = (key) => {
                const m = String(key || "").match(/(\d+)/);
                return m ? parseInt(m[1], 10) : 0;
              };
              const inferUnitFromCount = (count) => mockPriceByCount[count] || 0;

              // Build products map by count with target qty and unit
              const prodByCount = {};
              (products || []).forEach((p) => {
                const id = p.stripeId;
                const count = (countsById[id] != null ? countsById[id] : inferCountFromKey(id)) || 0;
                const unit = (unitsById[id] != null ? Number(unitsById[id]) : inferUnitFromCount(count));
                const qty = (p.qty != null ? Number(p.qty) : Number(cartQuantities[id] || 0)) || 0;
                if (!prodByCount[count]) prodByCount[count] = { qty: 0, unit };
                prodByCount[count].qty = qty; // one product per count expected
                prodByCount[count].unit = unit; // keep last resolved
              });

              // Aggregate owned by count
              const ownedByCount = {};
              Object.keys(ownedQuantities || {}).forEach((id) => {
                const count = (countsById[id] != null ? countsById[id] : inferCountFromKey(id)) || 0;
                ownedByCount[count] = (ownedByCount[count] || 0) + Number(ownedQuantities[id] || 0);
                // Make sure unit exists for this count even if not in products
                if (!prodByCount[count]) {
                  prodByCount[count] = { qty: 0, unit: inferUnitFromCount(count) };
                }
              });

              let currentMoney = 0, targetMoney = 0;
              let currentCourses = 0, targetCourses = 0;
              Object.keys(prodByCount).forEach((k) => {
                const count = parseInt(k, 10) || 0;
                const unit = prodByCount[count].unit || inferUnitFromCount(count);
                const ownedQ = Number(ownedByCount[count] || 0);
                const targetQ = Number(prodByCount[count].qty != null ? prodByCount[count].qty : ownedQ);
                currentMoney += ownedQ * unit;
                targetMoney += targetQ * unit;
                currentCourses += ownedQ * count;
                targetCourses += targetQ * count;
              });
              const changesMoney = targetMoney - currentMoney;
              const changesCourses = targetCourses - currentCourses;
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
