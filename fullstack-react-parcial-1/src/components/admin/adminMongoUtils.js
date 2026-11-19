// src/components/admin/adminMongoUtils.js
// Utilidades de cálculo y formato para el pipeline de agregación MongoDB ($group / $facet)

/**
 * Formatea un valor numérico a moneda chilena ($ CLP).
 * @param {number|string} valor
 * @returns {string}
 */
export function formatearCapitalCLP(valor) {
  const monto = Number(valor) || 0;
  return '$' + monto.toLocaleString('es-CL');
}

/**
 * Simulación pura del pipeline de agregación MongoDB ($facet con etapas $group y $match).
 * Opera transparentemente tanto sobre DTOs MongoDB (precio_clp, stock_disponible, _id)
 * como sobre el modelo del frontend (precio, stock, id, codigo).
 *
 * Pipeline MongoDB equivalente:
 * db.productos.aggregate([
 *   {
 *     $facet: {
 *       capitalYUnidades: [
 *         {
 *           $group: {
 *             _id: null,
 *             capitalTotal: { $sum: { $multiply: ["$precio_clp", "$stock_disponible"] } },
 *             unidadesTotales: { $sum: "$stock_disponible" },
 *             totalProductos: { $sum: 1 }
 *           }
 *         }
 *       ],
 *       categoriasActivas: [
 *         { $match: { stock_disponible: { $gt: 0 } } },
 *         { $group: { _id: "$categoria" } },
 *         { $count: "total" }
 *       ],
 *       criticos: [
 *         { $match: { stock_disponible: { $lte: 3 } } }
 *       ]
 *     }
 *   }
 * ])
 *
 * @param {Array} productos - Documentos de la colección
 * @returns {Object} Métricas agregadas
 */
export function calcularAgregacionesMongo(productos = []) {
  const lista = Array.isArray(productos) ? productos : [];

  let capitalTotal = 0;
  let unidadesTotales = 0;
  const categoriasSet = new Set();
  const productosCriticos = [];

  for (let i = 0; i < lista.length; i++) {
    const item = lista[i];
    const precio = Number(item.precio !== undefined ? item.precio : item.precio_clp) || 0;
    const stock = Number(item.stock !== undefined ? item.stock : item.stock_disponible) || 0;
    const categoria = item.categoria?.trim();
    const stockCriticoUmbral = Number(item.stockCritico ?? 3);

    // Acumulador de capital monetario total en bodega ($group)
    capitalTotal += precio * stock;

    // Acumulador de unidades físicas ($group)
    unidadesTotales += stock;

    // Conjunto de categorías activas
    if (categoria) {
      categoriasSet.add(categoria);
    }

    // Etapa $match: Items con stock <= 3 (nivel crítico / agotado)
    if (stock <= stockCriticoUmbral) {
      productosCriticos.push({
        ...item,
        codigo: item.codigo || item.id || (item._id ? String(item._id) : `PROD_${i}`),
        nombre: item.nombre || 'Producto sin nombre',
        stock,
        precio,
        categoria: categoria || 'Sin categoría',
        stockCritico: stockCriticoUmbral,
      });
    }
  }

  const totalProductos = lista.length;
  const categoriasActivas = categoriasSet.size;

  return {
    capitalTotal,
    valoracionTotal: capitalTotal,
    unidadesTotales,
    totalUnidades: unidadesTotales,
    totalProductos,
    categoriasActivas,
    totalCategorias: categoriasActivas,
    categoriasLista: Array.from(categoriasSet),
    productosCriticos,
    detalleCriticos: productosCriticos,
    totalCriticos: productosCriticos.length,
    alertasStockCritico: productosCriticos.length,
  };
}
