// Helpers puros para cálculos de totales del carrito en Home

// totalCourses y totalAmount actuales a partir de las suscripciones crudas
// y del catálogo de productos. No tiene efectos secundarios.
export function computeCurrentTotalsFromSubs(subsRaw, products) {
  let totalCourses = 0;
  let totalAmount = 0;

  const parseAmountLoose = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val);
    const m = s.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : 0;
  };

  (Array.isArray(subsRaw) ? subsRaw : []).forEach((sub) => {
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

    items.forEach((it) => {
      const qtyRaw =
        it?.quantity != null
          ? it.quantity
          : it?.qty != null
          ? it.qty
          : it?.count != null
          ? it.count
          : 1;
      const qty = Number(qtyRaw || 0) || 0;

      // Cursos desde backend (misma lógica que estaba en Home):
      const rawCoursesCount =
        typeof it?.coursesCount === "number"
          ? it.coursesCount
          : typeof it?.courses_count === "number"
          ? it.courses_count
          : 0;
      const totalCoursesFromItem =
        typeof it?.total_courses_count === "number"
          ? it.total_courses_count
          : typeof it?.totalCoursesCount === "number"
          ? it.totalCoursesCount
          : rawCoursesCount;

      // Precio: matchear por stripeId/priceId/plan_type contra catálogo actual.
      const priceId =
        it?.price?.id ||
        it?.priceId ||
        it?.price_id ||
        it?.plan_type ||
        it?.stripeId ||
        it?.id ||
        null;

      let amountPerUnit = 0;
      if (priceId) {
        const match = (products || []).find((p) => {
          const pId = p?.stripeId || p?.priceId || p?.id;
          return pId === priceId;
        });
        if (match) {
          amountPerUnit = parseAmountLoose(match.amount);
        }
      }

      if (!amountPerUnit) {
        amountPerUnit = parseAmountLoose(it?.amount);
      }

      totalCourses += totalCoursesFromItem || 0;
      totalAmount += qty * (amountPerUnit || 0);
    });
  });

  return { totalCourses, totalAmount };
}
