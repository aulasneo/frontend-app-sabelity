import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import {
  listUserSubscriptions,
  addOrUpdateProduct,
  listProducts,
  createCheckoutWithMultipleItems,
} from "../../data/service";
import { ModalDialog } from "@openedx/paragon";
import "./SubscriptionsManager.css";
import subsMessages from "./subscriptionsMessages";
import CartModal from "../../cart-modal/CartModal";

/*
  SubscriptionsManager
  - Lista las suscripciones del usuario (list_subscriptions)
  - Permite agregar o actualizar productos en una suscripción (add_or_update_product)

  Nota: La forma exacta de los objetos de suscripción puede variar.
  Mostramos información genérica (id, status, items si existen) y
  ofrecemos un pequeño formulario por fila para agregar/actualizar un producto
  ingresando priceId y quantity.
*/

const MOCK_MODE = true; // poner en true para demo sin backend
const MOCK_SUBS = [
  {
    id: "sub_001",
    status: "active",
    items: [
      { name: "1 Course", priceId: "price_1course", quantity: 1 },
      { name: "3 Courses", priceId: "price_3courses", quantity: 2 },
    ],
  },
];

const SubscriptionsManager = () => {
  const intl = useIntl();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionStates, setActionStates] = useState({}); // { [subId]: { [priceId]: { loading, error, success } } }
  const [productsMap, setProductsMap] = useState({}); // priceId -> meta
  const [productsList, setProductsList] = useState([]); // lista para iterar
  const [quantities, setQuantities] = useState({}); // { [subId]: { [priceId]: ownedQty } }
  const [purchaseQuantities, setPurchaseQuantities] = useState({}); // { [subId]: { [priceId]: purchaseQty } }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null); // { mode: 'checkout'|'update', subId, priceId, title, qty, priceText }
  const [editQuantities, setEditQuantities] = useState({}); // { [subId]: { [priceId]: newTotalQty } }
  const [showCart, setShowCart] = useState(false);
  const [currentCartSub, setCurrentCartSub] = useState(null);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      setError("");
      if (MOCK_MODE) {
        // Simular retardo de red
        await new Promise((r) => setTimeout(r, 300));
        setSubs(MOCK_SUBS);
      } else {
        const data = await listUserSubscriptions();
        setSubs(Array.isArray(data) ? data : []);
      }
      // Al refrescar, limpiar estados y cantidades de compra
      setActionStates({});
      setPurchaseQuantities({});
    } catch (e) {
      setError(e?.message || "Error fetching subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchProducts = async () => {
    try {
      const prods = await listProducts();
      const map = {};
      const list = Array.isArray(prods) ? prods : [];
      list.forEach((p) => {
        // Usamos stripeId como priceId (asumido por resto del código)
        const priceId = p.stripeId || p.priceId || p.id;
        map[priceId] = {
          name: p.name,
          amount: p.amount, // puede venir como "149.00 USD"
          currency: p.currency,
        };
      });
      setProductsMap(map);
      // ordenar por número en el nombre (1,3,10)
      const sorted = list.slice().sort((a, b) => {
        const na = parseInt(a?.name, 10) || 0;
        const nb = parseInt(b?.name, 10) || 0;
        return na - nb;
      });
      setProductsList(sorted);
    } catch (e) {
      // Silencioso: si falla, mostramos lo que haya
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sincronizar cantidades a partir de items de cada suscripción
  useEffect(() => {
    const initial = {};
    const initialEdit = {};
    subs.forEach((sub) => {
      const items = sub?.items || sub?.products || sub?.lines || [];
      initial[sub.id] = {};
      initialEdit[sub.id] = {};
      items.forEach((it) => {
        const pid =
          it?.priceId ||
          it?.price_id ||
          it?.plan_type ||
          it?.stripeId ||
          it?.id;
        const q = it?.quantity ?? it?.qty ?? it?.count ?? 0;
        if (pid) {
          const n = Number(q) || 0;
          initial[sub.id][pid] = n;
          initialEdit[sub.id][pid] = n;
        }
      });
    });
    setQuantities((prev) => ({ ...initial }));
    setEditQuantities(initialEdit);
    // resetear purchase quantities (no queremos prefijar con lo adquirido)
    const emptyPurchases = {};
    subs.forEach((sub) => {
      emptyPurchases[sub.id] = {};
    });
    setPurchaseQuantities(emptyPurchases);
  }, [subs]);

  const handleChange = (subId, field, value) => {
    setActionStates((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: value },
    }));
  };

  const handleAddOrUpdate = async (subId) => {
    const { priceId = "", quantity = 1 } = actionStates[subId] || {};
    if (!priceId) {
      setActionStates((p) => ({
        ...p,
        [subId]: { ...p[subId], error: "Price ID is required" },
      }));
      return;
    }
    try {
      setActionStates((p) => ({
        ...p,
        [subId]: { ...p[subId], loading: true, error: "", success: "" },
      }));
      if (MOCK_MODE) {
        // Simular actualización local
        const qty = Number(quantity) || 1;
        setSubs((prev) =>
          prev.map((s) =>
            s.id !== subId
              ? s
              : {
                  ...s,
                  items: (() => {
                    const items = Array.isArray(s.items) ? [...s.items] : [];
                    const idx = items.findIndex((i) => i.priceId === priceId);
                    if (idx >= 0) {
                      items[idx] = { ...items[idx], quantity: qty };
                    } else {
                      items.push({ name: priceId, priceId, quantity: qty });
                    }
                    return items;
                  })(),
                }
          )
        );
        await new Promise((r) => setTimeout(r, 300));
      } else {
        await addOrUpdateProduct(subId, priceId, Number(quantity) || 1);
        await fetchSubs();
      }
      setActionStates((p) => ({
        ...p,
        [subId]: {
          ...p[subId],
          loading: false,
          success: "Updated successfully",
        },
      }));
    } catch (e) {
      setActionStates((p) => ({
        ...p,
        [subId]: {
          ...p[subId],
          loading: false,
          error: e?.message || "Error updating product",
        },
      }));
    }
  };

  const getAmountText = (meta) => {
    if (!meta) return "";
    const rawAmount = meta.amount;
    const rawCurrency = meta.currency;

    // Extraer número desde amount (numérico o string)
    let num;
    if (typeof rawAmount === "number") {
      num = rawAmount;
    } else if (typeof rawAmount === "string") {
      const m = rawAmount.match(/-?\d+(?:\.\d+)?/);
      if (m) num = parseFloat(m[0]);
    }

    // Determinar currency: preferir meta.currency, si no, buscar en el string amount
    let cur = rawCurrency;
    if (!cur && typeof rawAmount === "string") {
      const c = rawAmount.match(/\b([A-Za-z]{3})\b/);
      if (c) cur = c[1];
    }
    if (!cur || num == null) {
      // fallback, intentar limpiar string
      if (typeof rawAmount === "string") {
        const s = rawAmount.trim().replace(/\.00(\s|$)/, "$1");
        return s; // mejor mostrar tal cual antes que duplicar moneda
      }
      return "";
    }

    // Formateo final: quitar .00 si es entero
    const cleaned = Number.isInteger(num)
      ? String(num)
      : String(num.toFixed(2)).replace(/\.00$/, "");
    return `${String(cur).toUpperCase()} $${cleaned}`;
  };

  const findMeta = (priceId, name) => {
    // 1) por priceId en el mapa
    if (priceId && productsMap[priceId]) return productsMap[priceId];
    // 2) por lista de productos: por id/stripeId
    const byId = (productsList || []).find(
      (p) =>
        p?.stripeId === priceId || p?.priceId === priceId || p?.id === priceId
    );
    if (byId) {
      const pid = byId.stripeId || byId.priceId || byId.id;
      return (
        productsMap[pid] || {
          name: byId.name,
          amount: byId.amount,
          currency: byId.currency,
        }
      );
    }
    // 3) fallback por número del nombre (e.g., "3 Courses")
    const n = parseInt(String(name || ""), 10);
    if (!isNaN(n) && n > 0) {
      const byNum = (productsList || []).find(
        (p) => parseInt(String(p?.name || ""), 10) === n
      );
      if (byNum) {
        const pid = byNum.stripeId || byNum.priceId || byNum.id;
        return (
          productsMap[pid] || {
            name: byNum.name,
            amount: byNum.amount,
            currency: byNum.currency,
          }
        );
      }
    }
    return undefined;
  };

  const getPriceNumber = (amountStr) => {
    if (!amountStr) return 0;
    const m1 = String(amountStr).match(/([0-9]+(?:\.[0-9]+)?)/);
    return m1 ? parseFloat(m1[1]) : 0;
  };

  const renderItems = (sub) => {
    // Cantidades actuales del sub
    const subQty = quantities[sub.id] || {};
    // Base de productos: backend -> map -> items de la propia suscripción
    let allProds;
    const subItems = (sub?.items || sub?.products || sub?.lines || []).map(
      (it) => ({
        priceId:
          it.priceId || it.price_id || it.plan_type || it.stripeId || it.id,
        name: it.name,
      })
    );
    const mapList = Object.keys(productsMap).map((priceId) => ({
      stripeId: priceId,
      name: productsMap[priceId]?.name,
    }));

    if (MOCK_MODE) {
      // En modo demo, priorizar lo que viene en la suscripción mock para reflejar lo comprado
      const byId = {};
      subItems.forEach((p) => {
        const id = p.priceId || p.stripeId || p.id;
        if (id) byId[id] = { ...p, stripeId: id };
      });
      mapList.forEach((p) => {
        const id = p.priceId || p.stripeId || p.id;
        if (id && !byId[id]) byId[id] = { ...p, stripeId: id };
      });
      allProds = Object.values(byId);
    } else {
      allProds =
        productsList && productsList.length
          ? productsList
          : mapList.length
          ? mapList
          : subItems;
    }

    // Deduplicar por priceId/stripeId/id
    const pid = (p) => p.stripeId || p.priceId || p.id;
    const uniqMap = {};
    allProds.forEach((p) => {
      const k = pid(p);
      if (k && !uniqMap[k]) uniqMap[k] = p;
    });
    allProds = Object.values(uniqMap);

    // Orden: por número del nombre si existe
    allProds = allProds.slice().sort((a, b) => {
      const na = parseInt(a.name || "", 10) || 0;
      const nb = parseInt(b.name || "", 10) || 0;
      return na - nb;
    });

    if (!allProds.length) return <em className="subs-empty">No items</em>;

    // Conjuntos para separar adquiridos vs disponibles
    const purchasedSet = new Set(
      Object.entries(subQty)
        .filter(([, q]) => Number(q) > 0)
        .map(([k]) => k)
    );
    // Filtro adicional por número del nombre (por si difiere el id)
    // Números parseados desde los nombres en la propia suscripción (más fiable en mock)
    const purchasedNums = new Set(
      (sub?.items || sub?.products || sub?.lines || [])
        .map((it) => parseInt(String(it?.name || ""), 10))
        .filter((n) => !isNaN(n) && n > 0)
    );
    let acquired = allProds.filter(
      (p) =>
        purchasedSet.has(pid(p)) ||
        purchasedNums.has(parseInt(String(p?.name || ""), 10))
    );
    let available = allProds.filter(
      (p) =>
        !purchasedSet.has(pid(p)) &&
        !purchasedNums.has(parseInt(String(p?.name || ""), 10))
    );

    // Deduplicar adquiridos por id y por nombre normalizado
    const norm = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    const seenIds = new Set();
    const seenNames = new Set();
    acquired = acquired.filter((p) => {
      const id = pid(p);
      const nameKey = norm(p?.name);
      if ((id && seenIds.has(id)) || (nameKey && seenNames.has(nameKey)))
        return false;
      if (id) seenIds.add(id);
      if (nameKey) seenNames.add(nameKey);
      return true;
    });
    // Excluir de disponibles
    available = available.filter((p) => {
      const id = pid(p);
      const nameKey = norm(p?.name);
      return !(id && seenIds.has(id)) && !(nameKey && seenNames.has(nameKey));
    });

    // Mapa auxiliar de precios unitarios por priceId (si se puede resolver)
    const unitsMap = (() => {
      const map = {};
      (allProds || []).forEach((p) => {
        const id = pid(p);
        const meta = findMeta(id, p?.name);
        let unit = 0;
        if (meta) {
          const txt = getAmountText(meta);
          unit = getPriceNumber(txt) || 0;
        }
        if (!unit && MOCK_MODE) {
          // fallback: extraer número desde name o id
          const s = String(p?.name || id || "");
          const m = s.match(/(\d+)/);
          const count = m ? parseInt(m[1], 10) : 0;
          const table = { 1: 69, 3: 149, 10: 199 };
          unit = table[count] || 0;
        }
        if (unit) map[id] = unit;
      });
      return map;
    })();

    const renderList = (list) => (
      <ul className="subs-items">
        {list.map((p) => {
          const priceId = p.stripeId || p.priceId || p.id;
          const meta = findMeta(priceId, p.name) || { name: p.name };
          const qty = Number(subQty[priceId] || 0);
          const baseTitle = meta?.name || p.name || priceId;
          const isAcquired = purchasedSet.has(priceId);
          const title = baseTitle;
          const priceText = getAmountText(meta);

          const setQty = (newQty) => {
            const valNum = Math.max(0, Number(newQty) || 0);
            if (isAcquired) {
              setEditQuantities((prev) => ({
                ...prev,
                [sub.id]: { ...(prev[sub.id] || {}), [priceId]: valNum },
              }));
            } else {
              setPurchaseQuantities((prev) => ({
                ...prev,
                [sub.id]: { ...(prev[sub.id] || {}), [priceId]: valNum },
              }));
            }
          };

          const onApply = () => {
            if (isAcquired) {
              const newTotal = Number(
                (editQuantities[sub.id] || {})[priceId] ?? qty
              );
              const safe = Math.max(0, isNaN(newTotal) ? qty : newTotal);
              setConfirmData({
                mode: "update",
                subId: sub.id,
                priceId,
                title: baseTitle,
                qty: safe,
                priceText,
              });
            } else {
              const purchaseQty = Math.max(
                1,
                Number((purchaseQuantities[sub.id] || {})[priceId] || 0) || 1
              );
              setConfirmData({
                mode: "checkout",
                subId: sub.id,
                priceId,
                title: baseTitle,
                qty: purchaseQty,
                priceText,
              });
            }
            setConfirmOpen(true);
          };

          const st =
            (actionStates[sub.id] && actionStates[sub.id][priceId]) || {};
          const val = isAcquired
            ? Number((editQuantities[sub.id] || {})[priceId] ?? qty)
            : Number((purchaseQuantities[sub.id] || {})[priceId] || 0);

          return (
            <li key={priceId} className="subs-item">
              <div className="subs-item-line">
                <span className="subs-item-amount">
                  {isAcquired && qty > 0 ? qty : ""}
                </span>
                <span className="subs-item-title">{title}</span>
                {priceText && (
                  <span className="subs-item-price">{priceText}</span>
                )}
                <div className="spc-actions">
                  <button className="qty-btn" onClick={() => setQty(val - 1)}>
                    -
                  </button>
                  <input
                    className="qty-input"
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => setQty(e.target.value)}
                  />
                  <button className="qty-btn" onClick={() => setQty(val + 1)}>
                    +
                  </button>
                </div>
                {st.success && (
                  <span className="subs-msg subs-success">{st.success}</span>
                )}
              </div>
              {meta?.description && (
                <div className="subs-desc">{meta.description}</div>
              )}
            </li>
          );
        })}
      </ul>
    );

    return (
      <>
        <h5 className="subs-subtitle">{intl.formatMessage(subsMessages.yourProducts)}</h5>
        <div className="subs-items-header">
          <div>{intl.formatMessage(subsMessages.tableSubscriptions)}</div>
          <div>{intl.formatMessage(subsMessages.tablePlan)}</div>
          <div>{intl.formatMessage(subsMessages.tablePrice)}</div>
          <div>{intl.formatMessage(subsMessages.tableQty)}</div>
        </div>
        {acquired.length ? (
          renderList(acquired)
        ) : (
          <div className="subs-empty">{intl.formatMessage(subsMessages.noPurchasedYet)}</div>
        )}
        <h5 className="subs-subtitle mt-10">{intl.formatMessage(subsMessages.availableProducts)}</h5>
        {renderList(available)}

        {(() => {
          // Summary footer: current total, purchases subtotal, updates delta, new total
          const subId = sub.id;
          const purch = purchaseQuantities[subId] || {};
          const edits = editQuantities[subId] || {};
          const owned = quantities[subId] || {};

          // Resolver de precio unitario por priceId apoyado en el catálogo en memoria
          const idToName = (() => {
            const map = {};
            (allProds || []).forEach((p) => {
              const id = p?.stripeId || p?.priceId || p?.id;
              if (id && !map[id]) map[id] = p?.name;
            });
            return map;
          })();
          // Fallback tabla para MOCK: precios conocidos por cantidad del nombre
          const mockPriceByCount = MOCK_MODE ? { 1: 69, 3: 149, 10: 199 } : {};
          const resolveMockUnit = (nm) => {
            const s = String(nm || "");
            const m = s.match(/(\d+)/);
            const n = m ? parseInt(m[1], 10) : 0;
            return mockPriceByCount[n] || 0;
          };
          const getUnit = (priceId) => {
            if (unitsMap[priceId] != null) return unitsMap[priceId];
            const nm = idToName[priceId] || String(priceId);
            const meta = findMeta(priceId, nm) || {};
            const txt = getAmountText(meta);
            const u = getPriceNumber(txt);
            if (u) return u;
            // fallback MOCK por nombre
            let byName = resolveMockUnit(nm);
            if (byName) return byName;
            // intentar por priceId si contiene números (p.ej., price_3courses)
            return resolveMockUnit(String(priceId));
          };

          // Current total (what the user is paying now)
          let currentTotal = 0;
          Object.entries(owned).forEach(([priceId, qty]) => {
            const unit = getUnit(priceId);
            currentTotal += (unit || 0) * (Number(qty) || 0);
          });

          // Purchases (available products to add)
          let purchasesSubtotal = 0;
          let purchasesCount = 0;
          Object.entries(purch).forEach(([priceId, q]) => {
            const qty = Number(q) || 0;
            if (qty > 0) {
              const unit = getUnit(priceId);
              purchasesSubtotal += (unit || 0) * qty;
              purchasesCount += qty;
            }
          });

          // Updates delta (difference between edited totals and owned totals)
          let updatesCount = 0;
          let updatesDelta = 0;
          const allIds = new Set([
            ...Object.keys(owned),
            ...Object.keys(edits),
          ]);
          allIds.forEach((priceId) => {
            const from = Number(owned[priceId] || 0);
            const to = Number(edits[priceId] != null ? edits[priceId] : from);
            if (to !== from) {
              updatesCount += 1;
              const unit = getUnit(priceId);
              updatesDelta += (to - from) * (unit || 0);
            }
          });

          const hasPurchases = purchasesCount > 0; // decide modal by count, not by subtotal
          const hasUpdates = updatesCount > 0;
          const newTotal = currentTotal + purchasesSubtotal + updatesDelta;

          const onReview = async () => {
            if (hasPurchases || hasUpdates) {
              setCurrentCartSub(subId);
              setShowCart(true);
            }
          };

          const fmt = (n) =>
            `USD $${(Math.round(n * 100) / 100)
              .toString()
              .replace(/\.00$/, "")}`;
          const countOf = (priceId) => {
            const nm = idToName[priceId] || String(priceId);
            const m = String(nm).match(/(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          };
          // Courses counts
          let currentCourses = 0;
          Object.entries(owned).forEach(([priceId, qty]) => {
            currentCourses += (Number(qty) || 0) * countOf(priceId);
          });
          let purchasesCourses = 0;
          Object.entries(purch).forEach(([priceId, qty]) => {
            purchasesCourses += (Number(qty) || 0) * countOf(priceId);
          });
          let updatesDeltaCourses = 0;
          allIds.forEach((priceId) => {
            const from = Number(owned[priceId] || 0);
            const to = Number(edits[priceId] != null ? edits[priceId] : from);
            updatesDeltaCourses += (to - from) * countOf(priceId);
          });
          const newCourses =
            currentCourses + purchasesCourses + updatesDeltaCourses;
          const btnLabel = intl.formatMessage(subsMessages.reviewChanges);

          return (
            <div className="subs-summary">
              <div className="subs-summary-row subs-summary-courses">
                <span>
                  {intl.formatMessage(subsMessages.summaryCurrentCourses)}: <strong>{currentCourses}</strong>
                </span>
                <span>
                  {intl.formatMessage(subsMessages.summaryChanges)}:{" "}
                  <strong>
                    {purchasesCourses + updatesDeltaCourses >= 0 ? "+" : ""}
                    {purchasesCourses + updatesDeltaCourses}
                  </strong>
                </span>
                <span>
                  {intl.formatMessage(subsMessages.summaryNewCourses)}: <strong>{newCourses}</strong>
                </span>
              </div>
              <div className="subs-summary-row subs-summary-money-row">
                <div className="subs-summary-money">
                  <span>
                    {intl.formatMessage(subsMessages.summaryCurrentTotal)}: <strong>{fmt(currentTotal)}</strong>
                  </span>
                  <span>
                    {intl.formatMessage(subsMessages.summaryChanges)}:{" "}
                    <strong>{fmt(purchasesSubtotal + updatesDelta)}</strong>
                  </span>
                  <span>
                    {intl.formatMessage(subsMessages.summaryNewTotal)}: <strong>{fmt(newTotal)}</strong>
                  </span>
                </div>
                <button
                  className="subs-btn"
                  onClick={onReview}
                  disabled={!hasPurchases && !hasUpdates}
                >
                  {btnLabel}
                </button>
              </div>
            </div>
          );
        })()}
      </>
    );
  };

  return (
    <div className="subs-manager">
      <h4 className="subs-title">{intl.formatMessage(subsMessages.mySubscriptions)}</h4>
      {loading && <div className="subs-loading">{intl.formatMessage(subsMessages.loading)}</div>}
      {/* {error && <div className="subs-error">{error}</div>} */}
      {!loading && subs.length === 0 && (
        <div className="subs-card">
          <div className="subs-card-header">
            <button className="subs-refresh" onClick={fetchSubs}>
              {intl.formatMessage(subsMessages.refresh)}
            </button>
          </div>
          <div className="subs-card-body">
            {renderItems({ id: "new", items: [] })}
          </div>
        </div>
      )}
      <div className="subs-list">
        {subs.map((sub) => {
          const st = actionStates[sub.id] || {};
          return (
            <div key={sub.id} className="subs-card">
              <div className="subs-card-header">
                <button className="subs-refresh" onClick={fetchSubs}>
                  {intl.formatMessage(subsMessages.refresh)}
                </button>
              </div>

              <div className="subs-card-body">{renderItems(sub)}</div>
            </div>
          );
        })}
      </div>

      {/* Cart Modal unified checkout for purchases */}
      {showCart && (
        <CartModal
          showCart={showCart}
          closeCart={() => setShowCart(false)}
          intl={{ formatMessage: (m) => m?.defaultMessage || "" }}
          messages={{
            cartTitle: { defaultMessage: "Add subscriptions" },
            cartSubtotal: { defaultMessage: "Subtotal" },
            noProducts: { defaultMessage: "No products available." },
            checkoutButton: { defaultMessage: "Checkout" },
            modalButtonClose: { defaultMessage: "Cancel" },
          }}
          products={(function () {
            // Build full catalog list (like Pricing Plans cart), not just qty>0
            const catalog = (
              productsList && productsList.length
                ? productsList
                : Object.keys(productsMap).map((id) => ({
                    stripeId: id,
                    name: productsMap[id]?.name,
                  }))
            ).slice();
            // sort by leading number in name when possible
            catalog.sort((a, b) => {
              const na = parseInt(String(a?.name || ""), 10) || 0;
              const nb = parseInt(String(b?.name || ""), 10) || 0;
              return na - nb;
            });

            const mockPriceByCount = MOCK_MODE
              ? { 1: 69, 3: 149, 10: 199 }
              : {};
            const getId = (p) => p?.stripeId || p?.priceId || p?.id;
            const resolveUnit = (priceId, name) => {
              const meta = findMeta(priceId, name) || {};
              const u = getPriceNumber(getAmountText(meta));
              if (u) return u;
              const m = String(name || priceId || "").match(/(\d+)/);
              const n = m ? parseInt(m[1], 10) : 0;
              return mockPriceByCount[n] || 0;
            };
            const countOf = (nameOrId) => {
              const m = String(nameOrId || "").match(/(\d+)/);
              return m ? parseInt(m[1], 10) : 0;
            };
            const fmt = (n) => {
              const v = Number(n || 0);
              return `USD $${(Number.isInteger(v) ? v : v.toFixed(2))
                .toString()
                .replace(/\.00$/, "")}`;
            };
            const subId = currentCartSub;
            const owned = quantities[subId] || {};
            const edits = editQuantities[subId] || {};
            const purch = purchaseQuantities[subId] || {};
            const idCount = (s) => { const m = String(s||'').match(/(\d+)/); return m ? parseInt(m[1],10) : 0; };
            // Construir índice por cantidad de cursos para owned y edits
            const ownedByCount = (()=>{
              const map = {};
              Object.keys(owned).forEach((k)=>{ const c = idCount(k); if (c) map[c] = k; });
              return map;
            })();
            const editsByCount = (()=>{
              const map = {};
              Object.keys(edits).forEach((k)=>{ const c = idCount(k); if (c) map[c] = k; });
              return map;
            })();
            const purchByCount = (()=>{
              const map = {};
              Object.keys(purch).forEach((k)=>{ const c = idCount(k); if (c) map[c] = k; });
              return map;
            })();
            // build rows with combined qty = (edits or owned) for acquired items, or purchase qty for new ones
            return catalog.map((p) => {
              const id = getId(p);
              const name = p?.name || productsMap[id]?.name || id;
              const unit = resolveUnit(id, name);
              const c = countOf(name) || countOf(id);
              const ownedKey = Object.prototype.hasOwnProperty.call(owned, id) ? id : (Object.keys(owned).find(k => countOf(k) === c) || null);
              const editKey = (edits[id] != null ? id : (Object.keys(edits).find(k => countOf(k) === c) || null));
              const purchKey = (purch[id] != null ? id : (Object.keys(purch).find(k => countOf(k) === c) || null));
              const ownedQty = Number((ownedKey ? owned[ownedKey] : 0) || 0);
              const editQty = (editKey != null && edits[editKey] != null) ? Number(edits[editKey]) : undefined;
              const newQtyForNew = (purchKey != null && purch[purchKey] != null) ? Number(purch[purchKey]) : 0;
              const isOwned = !!ownedKey && ownedQty > 0;
              const qty = Number(editQty != null ? editQty : (isOwned ? ownedQty : newQtyForNew));
              const setQtyHandler = (priceId, newVal) => {
                const v = Math.max(0, Number(newVal) || 0);
                if (isOwned) {
                  const targetKey = editKey || ownedKey || priceId;
                  setEditQuantities((prev) => ({ ...prev, [subId]: { ...(prev[subId] || {}), [targetKey]: v } }));
                } else {
                  const targetKey = purchKey || priceId;
                  setPurchaseQuantities((prev) => ({ ...prev, [subId]: { ...(prev[subId] || {}), [targetKey]: v } }));
                }
              };
              const incHandler = (priceId) => setQtyHandler(priceId, qty + 1);
              const decHandler = (priceId) =>
                setQtyHandler(priceId, Math.max(0, qty - 1));
              return {
                stripeId: id,
                name,
                amount: fmt(unit),
                qty,
                onSet: setQtyHandler,
                onInc: incHandler,
                onDec: decHandler,
              };
            });
          })()}
          cartQuantities={purchaseQuantities[currentCartSub] || {}}
          setQty={(priceId, newQty) =>
            setPurchaseQuantities((prev) => ({
              ...prev,
              [currentCartSub]: {
                ...(prev[currentCartSub] || {}),
                [priceId]: Math.max(0, Number(newQty) || 0),
              },
            }))
          }
          incQty={(priceId) =>
            setPurchaseQuantities((prev) => {
              const cur = Number((prev[currentCartSub] || {})[priceId] || 0);
              return {
                ...prev,
                [currentCartSub]: {
                  ...(prev[currentCartSub] || {}),
                  [priceId]: cur + 1,
                },
              };
            })
          }
          decQty={(priceId) =>
            setPurchaseQuantities((prev) => {
              const cur = Number((prev[currentCartSub] || {})[priceId] || 0);
              return {
                ...prev,
                [currentCartSub]: {
                  ...(prev[currentCartSub] || {}),
                  [priceId]: Math.max(0, cur - 1),
                },
              };
            })
          }
          totalItems={(function () {
            const qmap = purchaseQuantities[currentCartSub] || {};
            return Object.values(qmap).reduce(
              (a, b) => a + (Number(b) || 0),
              0
            );
          })()}
          subtotal={(function () {
            // compute delta total across all products: (targetQty - ownedQty) * unit
            const subId = currentCartSub;
            const owned = quantities[subId] || {};
            const edits = editQuantities[subId] || {};
            const purch = purchaseQuantities[subId] || {};
            const mockPriceByCount = MOCK_MODE
              ? { 1: 69, 3: 149, 10: 199 }
              : {};
            const getId = (p) => p?.stripeId || p?.priceId || p?.id;
            const resolveUnit = (priceId, name) => {
              const meta = findMeta(priceId, name) || {};
              const u = getPriceNumber(getAmountText(meta));
              if (u) return u;
              const m = String(name || priceId || '').match(/(\d+)/);
              const n = m ? parseInt(m[1], 10) : 0;
              return mockPriceByCount[n] || 0;
            };
            let delta = 0;
            const catalog =
              productsList && productsList.length
                ? productsList
                : Object.keys(productsMap).map((id) => ({ stripeId: id, name: productsMap[id]?.name }));
            catalog.forEach((p) => {
              const id = getId(p);
              const name = p?.name || productsMap[id]?.name || id;
              const unit = resolveUnit(id, name) || 0;
              const c = (String(name||id).match(/(\d+)/) || [0,0])[1] | 0;
              const findByCount = (obj) => { const key = Object.keys(obj).find(k => (String(k).match(/(\d+)/)||[0,0])[1] == c); return key ? obj[key] : undefined; };
              const ownedQtyRaw = (owned[id] != null ? owned[id] : findByCount(owned));
              const ownedQty = Number(ownedQtyRaw || 0);
              const editQtyRaw = (edits[id] != null ? edits[id] : findByCount(edits));
              const purchQtyRaw = (purch[id] != null ? purch[id] : findByCount(purch));
              const targetQty = ownedQty > 0 ? Number(editQtyRaw != null ? editQtyRaw : ownedQty) : Number(purchQtyRaw || 0);
              delta += (targetQty - ownedQty) * unit;
            });
            return delta;
          })()}
          ownedQuantities={(function () {
            const subId = currentCartSub;
            return quantities[subId] || {};
          })()}
          unitsById={(function () {
            const subId = currentCartSub;
            const map = {};
            const all =
              productsList && productsList.length
                ? productsList
                : Object.keys(productsMap).map((id) => ({
                    stripeId: id,
                    name: productsMap[id]?.name,
                  }));
            const mockPriceByCount = MOCK_MODE
              ? { 1: 69, 3: 149, 10: 199 }
              : {};
            all.forEach((p) => {
              const id = p.stripeId || p.priceId || p.id;
              const name = p.name || productsMap[id]?.name || id;
              const meta = findMeta(id, name) || {};
              let u = getPriceNumber(getAmountText(meta));
              if (!u) {
                const m = String(name || "").match(/(\d+)/);
                const n = m ? parseInt(m[1], 10) : 0;
                u = mockPriceByCount[n] || 0;
              }
              map[id] = u;
            });
            return map;
          })()}
          countsById={(function () {
            const all =
              productsList && productsList.length
                ? productsList
                : Object.keys(productsMap).map((id) => ({
                    stripeId: id,
                    name: productsMap[id]?.name,
                  }));
            const map = {};
            all.forEach((p) => {
              const id = p.stripeId || p.priceId || p.id;
              const m = String(p?.name || id || "").match(/(\d+)/);
              map[id] = m ? parseInt(m[1], 10) : 0;
            });
            return map;
          })()}
          onCheckout={async () => {
            let redirected = false;
            try {
              const subId = currentCartSub;
              const purch = purchaseQuantities[subId] || {};
              // also include positive deltas from edits vs owned
              const owned = quantities[subId] || {};
              const edits = editQuantities[subId] || {};
              const deltaEntries = Object.keys({ ...owned, ...edits }).map(
                (priceId) => {
                  const from = Number(owned[priceId] || 0);
                  const to = Number(edits[priceId] != null ? edits[priceId] : from);
                  const delta = Math.max(0, to - from);
                  return [priceId, delta];
                }
              );
              const items = [
                ...Object.entries(purch),
                ...deltaEntries,
              ]
                .filter(([, q]) => Number(q) > 0)
                .map(([priceId, q]) => ({ planType: priceId, quantity: Number(q) }));
              if (!items.length) return;
              if (!MOCK_MODE) {
                const resp = await createCheckoutWithMultipleItems(
                  items,
                  "month"
                );
                const url =
                  resp?.url ||
                  resp?.checkout_url ||
                  resp?.data?.url ||
                  resp?.data?.checkout_url;
                if (url) {
                  // debug + robust navigation
                  // eslint-disable-next-line no-console
                  console.log("[checkout] redirecting to:", url, "resp:", resp);
                  try {
                    window.location.assign(url);
                  } catch (e) {
                    window.open(url, "_self");
                  }
                  redirected = true;
                  return;
                }
              } else {
                await new Promise((r) => setTimeout(r, 400));
              }
            } finally {
              if (!redirected) setShowCart(false);
            }
          }}
          onApplyUpdates={async () => {
            const subId = currentCartSub;
            const owned = quantities[subId] || {};
            const edits = editQuantities[subId] || {};
            const allIds = new Set([
              ...Object.keys(owned),
              ...Object.keys(edits),
            ]);
            try {
              setConfirmLoading(true);
              const tasks = Array.from(allIds).map(async (priceId) => {
                const from = Number(owned[priceId] || 0);
                const to = Number(
                  edits[priceId] != null ? edits[priceId] : from
                );
                if (to !== from) {
                  if (!MOCK_MODE) {
                    await addOrUpdateProduct(
                      subId,
                      priceId,
                      Math.max(0, to || 0)
                    );
                  }
                }
              });
              await Promise.all(tasks);
              if (!MOCK_MODE) await fetchSubs();
            } finally {
              setConfirmLoading(false);
              setShowCart(false);
            }
          }}
        />
      )}

      <ModalDialog
        isOpen={!!confirmOpen}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setConfirmData(null);
          }
        }}
        title=""
      >
        <ModalDialog.Body>
          {confirmData && (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="subs-modal-row">
                <div className="subs-modal-title">
                  <span className="name">{confirmData.title}</span>
                  {confirmData.priceText && (
                    <span className="price">{confirmData.priceText}</span>
                  )}
                </div>
                <div className="subs-modal-actions">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setConfirmData((d) => ({
                        ...d,
                        qty: Math.max(0, (d?.qty || 0) - 1),
                      }))
                    }
                  >
                    -
                  </button>
                  <input
                    className="qty-input"
                    type="number"
                    min={0}
                    value={confirmData.qty}
                    onChange={(e) =>
                      setConfirmData((d) => ({
                        ...d,
                        qty: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setConfirmData((d) => ({ ...d, qty: (d?.qty || 0) + 1 }))
                    }
                  >
                    +
                  </button>
                </div>
                <div></div>
              </div>

              <div className="subs-modal-footer">
                <div>Subtotal</div>
                {(() => {
                  const unit = getPriceNumber(confirmData.priceText);
                  const subtotal = (unit || 0) * (confirmData.qty || 0);
                  return (
                    <div className="subs-modal-subtotal">
                      USD ${subtotal.toFixed(2)}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <button
            className="subs-btn"
            onClick={async () => {
              if (!confirmData) return;
              try {
                setConfirmLoading(true);
                let redirected = false;
                if (!MOCK_MODE) {
                  const items = [
                    {
                      planType: confirmData.priceId,
                      quantity: Math.max(1, confirmData.qty || 1),
                    },
                  ];
                  const resp = await createCheckoutWithMultipleItems(
                    items,
                    "month"
                  );
                  const url =
                    resp?.url ||
                    resp?.checkout_url ||
                    resp?.data?.url ||
                    resp?.data?.checkout_url;
                  if (url) {
                    // eslint-disable-next-line no-console
                    console.log("[checkout-confirm] redirecting to:", url, "resp:", resp);
                    try {
                      window.location.assign(url);
                    } catch (e) {
                      window.open(url, "_self");
                    }
                    redirected = true;
                    return;
                  }
                } else {
                  await new Promise((r) => setTimeout(r, 400));
                }
                if (!redirected) {
                  setConfirmOpen(false);
                  setConfirmData(null);
                }
              } catch (e) {
                console.error("Error initiating checkout:", e);
              } finally {
                setConfirmLoading(false);
              }
            }}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Processing..." : "Checkout"}
          </button>
          <button
            className="subs-refresh"
            onClick={() => {
              if (!confirmLoading) {
                setConfirmOpen(false);
                setConfirmData(null);
              }
            }}
            disabled={confirmLoading}
          >
            Cancel
          </button>
        </ModalDialog.Footer>
      </ModalDialog>
    </div>
  );
};

export default SubscriptionsManager;
