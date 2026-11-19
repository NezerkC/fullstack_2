// src/components/admin/mongoQueryUtils.js
// Lógica pura de filtrado NoSQL para el Query Builder de MongoQueryBar
// Emula el pipeline de consulta MongoDB $text, $regex y $match

/**
 * Estados del documento homologados en la colección MongoDB.
 * Corresponden al campo `estado` del documento BSON.
 * - ACTIVO: productos con stock > 0 (disponibles)
 * - AGOTADO: productos con stock === 0 (sin existencias)
 * - DESCONTINUADO: productos marcados explícitamente con estado: 'DESCONTINUADO'
 */
export const ESTADOS_DOCUMENTO = ['ACTIVO', 'AGOTADO', 'DESCONTINUADO'];

/**
 * Las 6 categorías principales homologadas de instrumentos de Sonido Vivo.
 * Se toman las primeras 6 de la constante CATEGORIAS_SONIDO_VIVO (las familias primarias).
 */
export const CATEGORIAS_HOMOLOGADAS_6 = [
  'Guitarras Acústicas',
  'Guitarras Eléctricas',
  'Bajos Eléctricos',
  'Baterías',
  'Teclados y Pianos',
  'Amplificadores',
];

/**
 * Iconos por categoría para los chips
 */
export const ICONOS_CATEGORIA = {
  'Guitarras Acústicas': '🎸',
  'Guitarras Eléctricas': '⚡',
  'Bajos Eléctricos': '🎸',
  'Baterías': '🥁',
  'Teclados y Pianos': '🎹',
  'Amplificadores': '🔊',
  'Micrófonos': '🎙️',
  'Pedales de Efectos': '🎛️',
  'Accesorios': '🎼',
  'Estudio y Grabación': '🎧',
};

/**
 * Resuelve el estado del documento a partir del documento de producto.
 * Prioriza el campo `estado` explícito del BSON; si no existe, lo infiere del stock.
 * @param {Object} producto
 * @returns {'ACTIVO'|'AGOTADO'|'DESCONTINUADO'}
 */
export function resolverEstadoDocumento(producto) {
  if (!producto) return 'ACTIVO';
  if (producto.estado === 'DESCONTINUADO') return 'DESCONTINUADO';
  const stock = Number(producto.stock !== undefined ? producto.stock : producto.stock_disponible) || 0;
  if (stock <= 0) return 'AGOTADO';
  return 'ACTIVO';
}

/**
 * Aplica el filtro full-text sobre nombre, marca y codigo.
 * Emula MongoDB $text / $regex case-insensitive sobre múltiples campos.
 * @param {Object} producto
 * @param {string} query
 * @returns {boolean}
 */
export function coincideTextoFullText(producto, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const nombre = (producto.nombre || '').toLowerCase();
  const marca = (producto.marca || '').toLowerCase();
  const codigo = (producto.codigo || producto.id || '').toLowerCase();
  return nombre.includes(q) || marca.includes(q) || codigo.includes(q);
}

/**
 * Aplica filtro polimórfico por categoría ($match: { categoria: cat }).
 * @param {Object} producto
 * @param {string|null} categoria - null o '' = sin filtro
 * @returns {boolean}
 */
export function coincideCategoria(producto, categoria) {
  if (!categoria || categoria === 'TODAS') return true;
  return (producto.categoria || '').trim() === categoria.trim();
}

/**
 * Aplica filtro por estado del documento ($match: { estado: ... }).
 * @param {Object} producto
 * @param {string|null} estado - null o '' = sin filtro
 * @returns {boolean}
 */
export function coincideEstado(producto, estado) {
  if (!estado || estado === 'TODOS') return true;
  return resolverEstadoDocumento(producto) === estado;
}

/**
 * Función principal que aplica el query polimórfico completo sobre la colección.
 * Emula MongoDB: db.productos.find({ $text: ..., categoria: ..., estado: ... })
 *
 * @param {Array} productos - Colección de documentos
 * @param {Object} filtros
 * @param {string} filtros.texto - Búsqueda full-text
 * @param {string|null} filtros.categoria - Filtro por categoría
 * @param {string|null} filtros.estado - Filtro por estado (ACTIVO/AGOTADO/DESCONTINUADO)
 * @returns {Array} Documentos filtrados
 */
export function aplicarQueryMongo(productos, { texto = '', categoria = null, estado = null } = {}) {
  if (!Array.isArray(productos)) return [];
  return productos.filter(
    (p) =>
      coincideTextoFullText(p, texto) &&
      coincideCategoria(p, categoria) &&
      coincideEstado(p, estado)
  );
}
