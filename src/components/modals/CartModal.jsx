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
  hasNewProducts = false,
  coursesInUse,
  onBlockedDowngrade,
}) => {
  const fm = (desc, fallback = "") => {
    if (!desc) return fallback;
    if (desc.id && intl && typeof intl.formatMessage === 'function') {
      try { return intl.formatMessage(desc); } catch (e) { /* ignore */ }
    }
    return desc.defaultMessage || fallback;
  };

  const handleDecClick = (product) => {
    const priceId = product.stripeId;

    // Construir cantidades tentativas aplicando el "-1" a este producto
    const baseQty =
      cartQuantities[priceId] != null
        ? cartQuantities[priceId]
        : ownedQuantities[priceId] || 0;
    const nextQty = Math.max(0, (Number(baseQty) || 0) - 1);

    const nextQuantities = {
      ...cartQuantities,
      [priceId]: nextQty,
    };

    // Si con esta cantidad quedaríamos por debajo de los cursos en uso, bloquear y no aplicar
    if (shouldBlockDowngrade(nextQuantities)) {
      if (typeof onBlockedDowngrade === "function") {
        try {
          onBlockedDowngrade();
        } catch (e) {}
      }
      return;
    }

    // Si el producto define su propio handler, usarlo; si no, usar decQty del hook
    if (product.onDec) {
      product.onDec(priceId);
    } else {
      decQty(priceId);
    }
  };
  const fmtUSD = (n) => {
    const v = Number(n || 0);
    const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return `USD $${s.replace(/\.00$/, "")}`;
  };

  const shouldBlockDowngrade = (overrideQuantities) => {
    try {
      const {
        currentCourses,
        targetCourses,
      } = computeCartTotals({
        products,
        cartQuantities: overrideQuantities || cartQuantities,
        unitsById,
        countsById,
        ownedQuantities,
        cartSummary,
      });

      console.log("HOME GUARD", { coursesInUse, currentCourses, targetCourses });

      if (
        typeof coursesInUse === "number" &&
        coursesInUse > 0 &&
        typeof targetCourses === "number" &&
        targetCourses < coursesInUse
      ) {
        return true;
      }
    } catch (e) {
      // si algo falla, no bloqueamos para no romper el flujo
    }
    return false;
  };

  const handleApplyClick = () => {
    if (shouldBlockDowngrade()) {
      if (typeof onBlockedDowngrade === "function") {
        try {
          onBlockedDowngrade();
        } catch (e) {}
      }
      return;
    }
    if (typeof onApplyUpdates === "function") {
      onApplyUpdates();
    }
  };
  const { changesMoney, changesCourses } = computeCartTotals({
    products,
    cartQuantities,
    unitsById,
    countsById,
    ownedQuantities,
    cartSummary,
  });

  // Determinar si hay *cualquier* cambio en cantidades respecto de lo que ya posee
  // el usuario, sin depender de los montos o cursos calculados.
  const hasChanges = (() => {
    const allIds = new Set([
      ...Object.keys(ownedQuantities || {}),
      ...Object.keys(cartQuantities || {}),
    ]);
    for (const id of allIds) {
      const owned = Number(ownedQuantities?.[id] || 0);
      const targetRaw =
        cartQuantities && Object.prototype.hasOwnProperty.call(cartQuantities, id)
          ? cartQuantities[id]
          : owned;
      const target = Number(targetRaw);
      if (!Number.isNaN(target) && target !== owned) {
        return true;
      }
    }
    return false;
  })();
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
                const qty = (
                  p.qty != null
                    ? p.qty
                    : (cartQuantities[p.stripeId] != null
                        ? cartQuantities[p.stripeId]
                        : (ownedQuantities[p.stripeId] || 0))
                );
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
                      <button
                        className="qty-btn"
                        onClick={() => handleDecClick(p)}
                      >
                        -
                      </button>
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

              const hasMoneyChanges = Number(changesMoney) !== 0;
              const hasCoursesChanges = Number(changesCourses) !== 0;

              const displayNewMoney = hasMoneyChanges
                ? targetMoney
                : 0;
              const displayNewCourses = hasCoursesChanges
                ? targetCourses
                : 0;

              return (
                <div className="cart-summary-header">
                  <div className="cart-summary-col cart-summary-col-left">
                    <div className="cart-summary-col-content">
                      <span>
                        {fm(messages.currentCoursesLabel, "Current courses")}:{' '}
                        <strong>{currentCourses}</strong>
                      </span>
                      <span>
                        {fm(messages.changesLabel, "Changes")}:{' '}
                        <strong>{changesCourses >= 0 ? '+' : ''}{changesCourses}</strong>
                      </span>
                      <span>
                        {fm(messages.newCoursesLabel, "New courses")}:{' '}
                        <strong>{displayNewCourses}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="cart-summary-col cart-summary-col-right">
                    <div className="cart-summary-col-content">
                      <span>
                        {fm(messages.currentTotalLabel, "Current total")}:{' '}
                        <strong>{fmtUSD(currentMoney)}</strong>
                      </span>
                      <span>
                        {fm(messages.changesLabel, "Changes")}:{' '}
                        <strong>{changesMoney >= 0 ? '+' : ''}{fmtUSD(changesMoney)}</strong>
                      </span>
                      <span>
                        {fm(messages.newTotalLabel, "New total")}:{' '}
                        <strong>{fmtUSD(displayNewMoney)}</strong>
                      </span>
                    </div>
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
        {hasNewProducts ? (
          <Button
            variant="primary"
            onClick={onCheckout}
            disabled={totalItems === 0}
          >
            {fm(messages.checkoutButton, "Checkout")}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleApplyClick}
            disabled={!hasChanges}
          >
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
