import { useState, useMemo, useCallback } from "react";

// Hook que encapsula toda la lógica del carrito de Home
export function useHomeCart({
  intl,
  messages,
  startMultiCheckout,
  setErrorModalMessage,
  setErrorModalOpen,
  currentCourses,
  currentTotal,
  ownedQuantities = {},
}) {
  const [showCart, setShowCart] = useState(false);
  const [cartSummary, setCartSummary] = useState(null);
  const [cartQuantities, setCartQuantities] = useState({}); // { priceId: number }

  const openCart = useCallback(() => {
    // Construir un resumen base usando los totales reales del backend
    try {
      const currentCoursesBase = Number(currentCourses) || 0;
      const currentTotalBase = Number(currentTotal) || 0;
      setCartSummary({
        currentTotal: currentTotalBase,
        currentCourses: currentCoursesBase,
        purchasesSubtotal: 0,
        purchasesCourses: 0,
        updatesDelta: 0,
        updatesDeltaCourses: 0,
        newTotal: currentTotalBase,
        newCourses: currentCoursesBase,
      });
    } catch {}
    setShowCart(true);
  }, [currentCourses, currentTotal]);

  const closeCart = useCallback(() => setShowCart(false), []);

  const setQty = useCallback((priceId, qty) => {
    const q = Math.max(0, parseInt(qty || 0, 10));
    setCartQuantities((prev) => ({ ...prev, [priceId]: q }));
  }, []);

  const incQty = useCallback(
    (priceId) => {
      const base =
        cartQuantities[priceId] != null
          ? cartQuantities[priceId]
          : ownedQuantities[priceId] || 0;
      setQty(priceId, (Number(base) || 0) + 1);
    },
    [cartQuantities, ownedQuantities, setQty]
  );

  const decQty = useCallback(
    (priceId) => {
      const base =
        cartQuantities[priceId] != null
          ? cartQuantities[priceId]
          : ownedQuantities[priceId] || 0;
      setQty(priceId, (Number(base) || 0) - 1);
    },
    [cartQuantities, ownedQuantities, setQty]
  );

  const getPriceNumber = useCallback((amountStr) => {
    if (!amountStr) return 0;
    const m1 = String(amountStr).match(/([0-9]+(?:\.[0-9]+)?)/);
    return m1 ? parseFloat(m1[1]) : 0;
  }, []);

  const totalItems = useMemo(
    () =>
      Object.entries(cartQuantities).reduce((acc, [priceId, q]) => {
        const target = Number(q) || 0;
        const owned = Number(ownedQuantities[priceId] || 0);
        const delta = target - owned;
        // Solo contamos compras adicionales por encima de lo ya poseído
        return acc + Math.max(delta, 0);
      }, 0),
    [cartQuantities, ownedQuantities]
  );

  const handleCartCheckout = useCallback(async () => {
    try {
      const items = Object.entries(cartQuantities)
        .map(([priceId, quantity]) => {
          const target = Number(quantity) || 0;
          const owned = Number(ownedQuantities[priceId] || 0);
          const delta = target - owned;
          return { priceId, delta };
        })
        // Solo enviar compras adicionales (delta > 0)
        .filter(({ delta }) => delta > 0)
        .map(({ priceId, delta }) => ({ planType: priceId, quantity: delta }));
      if (!items.length) {
        alert(
          intl.formatMessage(
            messages.cartEmpty || {
              id: "home.cart.empty.fallback",
              defaultMessage: "Your cart is empty.",
            }
          )
        );
        return;
      }
      const resp = startMultiCheckout
        ? await startMultiCheckout({ items, billingCycle: "month" })
        : null;

      // El backend puede devolver `url` o `checkout_url`. Usamos cualquiera de las dos.
      const redirectUrl = resp?.url || resp?.checkout_url;

      if (!resp || !redirectUrl) {
        const msg = intl.formatMessage(
          messages.checkoutNoUrl || {
            id: "home.cart.checkout.no.url.fallback",
            defaultMessage: "Checkout created but no URL was returned.",
          }
        );
        setErrorModalMessage(msg);
        setErrorModalOpen(true);
        return;
      }

      // Redirigir explícitamente al checkout si se devolvió una URL
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Error in cart checkout:", error);
      const msg = intl.formatMessage(
        messages.cartCheckoutError || {
          id: "home.cart.checkout.error.fallback",
          defaultMessage: "There was an error initiating the checkout.",
        }
      );
      setErrorModalMessage(msg);
      setErrorModalOpen(true);
    }
  }, [
    cartQuantities,
    intl,
    messages,
    setErrorModalMessage,
    setErrorModalOpen,
    startMultiCheckout,
  ]);

  return {
    showCart,
    openCart,
    closeCart,
    cartQuantities,
    setQty,
    incQty,
    decQty,
    totalItems,
    cartSummary,
    setCartSummary,
    handleCartCheckout,
  };
}
