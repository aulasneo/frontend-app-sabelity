import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  listUserSubscriptions,
  getUserSubscription,
  listProducts,
  getUserInventory,
} from "../data/service";

const SubscriptionsContext = createContext(null);

export const SubscriptionsProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subsRaw, setSubsRaw] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [packsByProduct, setPacksByProduct] = useState({}); // priceId -> quantity (suscripciones/packs)
  const [totalCoursesFromSubscriptions, setTotalCoursesFromSubscriptions] =
    useState(0); // suma de total_courses_count de todas las suscripciones

  // Evitar que el auto-refresh se ejecute dos veces en modo StrictMode
  const didAutoRefreshRef = useRef(false);

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Suscripciones del usuario (sin normalizar)
      const data = await listUserSubscriptions();
      const list = Array.isArray(data) ? data : [];
      const enriched = await Promise.all(
        list.map(async (sub) => {
          try {
            const hasItems =
              Array.isArray(sub?.items?.data) && sub.items.data.length > 0;
            if (hasItems) return sub;
            const detailed = await getUserSubscription(sub.id);
            if (detailed && (detailed.items?.data?.length || 0) > 0) {
              return { ...sub, items: detailed.items };
            }
            if (
              detailed &&
              Array.isArray(detailed.products) &&
              detailed.products.length > 0
            ) {
              return { ...sub, products: detailed.products };
            }
            return sub;
          } catch (e) {
            return sub;
          }
        })
      );
      setSubsRaw(enriched);

      // 1b) Calcular agregados por producto: cantidad de packs y total de cursos
      const packsAgg = {};
      let totalCoursesAgg = 0;

      const pushItemAgg = (it) => {
        if (!it) return;
        // Clave basada en precio (Stripe price_...) y asociar también por producto (Stripe prod_...)
        const priceId =
          it?.price?.id ||
          it?.priceId ||
          it?.price_id ||
          null;

        // Clave alternativa por producto/plan, usada por el catálogo (list_products)
        const productKey =
          it?.price?.product ||
          it?.productId ||
          it?.product ||
          it?.stripeId ||
          it?.planType ||
          it?.plan_type ||
          it?.id ||
          null;

        if (!priceId && !productKey) return;
        
        // total de cursos para este item
        const totalCoursesFromItem =
          typeof it?.total_courses_count === "number"
            ? it.total_courses_count
            : typeof it?.totalCoursesCount === "number"
            ? it.totalCoursesCount
            : undefined;
        if (typeof totalCoursesFromItem === "number" && totalCoursesFromItem) {
          totalCoursesAgg += totalCoursesFromItem;
        }

        // quantity de suscripciones/packs
        const qRaw =
          it?.quantity != null
            ? it.quantity
            : it?.qty != null
            ? it.qty
            : it?.count != null
            ? it.count
            : 0;
        const parsedQ = Number(qRaw || 0);

        // Si no viene quantity pero sí hay cursos, asumimos 1 pack para poder detectar el producto comprado
        const q =
          parsedQ > 0
            ? parsedQ
            : typeof totalCoursesFromItem === "number" && totalCoursesFromItem
            ? 1
            : 0;

        if (q > 0) {
          if (priceId) {
            packsAgg[priceId] = (packsAgg[priceId] || 0) + q;
          }
          if (productKey) {
            packsAgg[productKey] = (packsAgg[productKey] || 0) + q;
          }
        }
      };

      enriched.forEach((sub) => {
        let items = [];
        if (sub?.items?.data && Array.isArray(sub.items.data)) {
          items = sub.items.data;
        } else if (Array.isArray(sub?.items)) {
          items = sub.items;
        } else if (Array.isArray(sub?.products)) {
          items = sub.products;
        } else if (Array.isArray(sub?.lines)) {
          items = sub.lines;
        }
        items.forEach(pushItemAgg);
      });

      setPacksByProduct(packsAgg);
      setTotalCoursesFromSubscriptions(totalCoursesAgg);

      // 2) Catálogo de productos
      const prods = await listProducts();
      setProducts(Array.isArray(prods) ? prods : []);

      // 3) Inventario del usuario
      const inv = await getUserInventory();
      setInventory(inv || null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didAutoRefreshRef.current) return;
    didAutoRefreshRef.current = true;
    refreshAll();
  }, [refreshAll]);

  const value = {
    loading,
    error,
    subsRaw,
    products,
    inventory,
    packsByProduct,
    totalCoursesFromSubscriptions,
    refreshAll,
  };

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => useContext(SubscriptionsContext);
