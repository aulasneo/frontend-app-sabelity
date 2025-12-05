import React from "react";
import { ModalDialog } from "@openedx/paragon";
import Button from "../../components/buttons/Button";
import "./stylesCart.css";
import { computeCartTotals } from "../home/cartModalTotals";

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
                const { changesMoney } = computeCartTotals({
                  products,
                  cartQuantities,
                  unitsById,
                  countsById,
                  ownedQuantities,
                  cartSummary,
                });
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
              } = computeCartTotals({
                products,
                cartQuantities,
                unitsById,
                countsById,
                ownedQuantities,
                cartSummary,
              });
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
