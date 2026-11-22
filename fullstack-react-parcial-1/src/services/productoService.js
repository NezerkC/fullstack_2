import axios from 'axios';
import { PRODUCTOS_SONIDO_VIVO, obtenerCatalogoActivo } from '../data/productos';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '';

/**
 * Construye los headers de autenticación con el token Bearer.
 * @param {string} [token]
 * @returns {Record<string, string>}
 */
function buildAuthHeaders(token) {
  const resolvedToken =
    token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  return resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {};
}

/**
 * Determina si un error corresponde a falla de red o error de servidor (>= 500).
 * @param {unknown} error
 * @returns {boolean}
 */
function isOfflineOrServerError(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const status = error.response?.status;
  if (typeof status === 'number') {
    return status >= 500;
  }
  return !error.response || error.message === 'Network Error';
}

/**
 * Calcula métricas de respaldo usando el catálogo local.
 * @returns {{ totalProductos: number, valoracionTotal: number, unidadesStock: number, productosCriticos: number }}
 */
function buildFallbackMetrics() {
  const totalProductos = PRODUCTOS_SONIDO_VIVO.length;
  const valoracionTotal = PRODUCTOS_SONIDO_VIVO.reduce(
    (acc, item) => acc + (item.precio ?? 0) * (item.stock ?? 0),
    0
  );
  const unidadesStock = PRODUCTOS_SONIDO_VIVO.reduce((acc, item) => acc + (item.stock ?? 0), 0);
  const productosCriticos = PRODUCTOS_SONIDO_VIVO.filter(
    (item) => (item.stock ?? 0) <= (item.stockCritico ?? 3)
  ).length;

  return {
    totalProductos,
    valoracionTotal,
    unidadesStock,
    productosCriticos,
  };
}

/**
 * Mapea un DTO de producto del backend al modelo usado por el frontend.
 * @param {Record<string, any>} dto
 * @returns {Record<string, any>}
 */
export function mapProductoDTO(dto) {
  if (!dto || typeof dto !== 'object') {
    return {};
  }

  return {
    ...dto,
    precio: dto.precio_clp ?? dto.precioClp ?? dto.precio ?? 0,
    stock: dto.stock_disponible ?? dto.stockDisponible ?? dto.stock ?? 0,
  };
}

/**
 * Extrae la lista única de categorías ordenadas alfabéticamente a partir de un arreglo de productos.
 * @param {Array<Record<string, any>>} [productos=[]]
 * @returns {Array<string>}
 */
export function extraerCategoriasUnicas(productos = []) {
  if (!Array.isArray(productos)) {
    return [];
  }

  const setCategorias = new Set();
  for (const prod of productos) {
    if (typeof prod?.categoria === 'string') {
      const limpia = prod.categoria.trim();
      if (limpia.length > 0) {
        setCategorias.add(limpia);
      }
    }
  }

  return Array.from(setCategorias).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene el catálogo público de productos con normalización DTO y fallback offline/error.
 * @param {Record<string, any>} [params={}]
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function obtenerProductosPublicos(params = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/public/products`, {
      params,
    });
    const rawList = Array.isArray(response.data)
      ? response.data
      : response.data?.content || response.data?.productos || [];
    return rawList.map(mapProductoDTO);
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      let fallbackList = obtenerCatalogoActivo();

      const categoria = params?.categoria;
      if (categoria && categoria !== 'Todas') {
        const catNormalizada = categoria.trim().toLowerCase();
        fallbackList = fallbackList.filter(
          (item) => (item.categoria || '').trim().toLowerCase() === catNormalizada
        );
      }

      const q = typeof params?.q === 'string' ? params.q.trim().toLowerCase() : '';
      if (q) {
        fallbackList = fallbackList.filter((item) => {
          const texto = `${item.nombre || ''} ${item.marca || ''} ${item.modelo || ''} ${item.codigo || ''} ${item.categoria || ''} ${item.descripcion || ''}`.toLowerCase();
          return texto.includes(q);
        });
      }

      return fallbackList.map(mapProductoDTO);
    }
    throw error;
  }
}

/**
 * Obtiene las métricas del dashboard de administración.
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function obtenerMetricas(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/admin/dashboard/metrics`, {
      headers: buildAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      return buildFallbackMetrics();
    }
    throw error;
  }
}

/**
 * Obtiene el listado de productos administrativos y normaliza cada DTO.
 * @param {Record<string, any>} [params]
 * @param {string} [token]
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function obtenerProductos(params = {}, token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/admin/products`, {
      params,
      headers: buildAuthHeaders(token),
    });
    const rawList = Array.isArray(response.data)
      ? response.data
      : response.data?.content || response.data?.productos || [];
    return rawList.map(mapProductoDTO);
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      const categoria = params?.categoria;
      const filtered =
        categoria && categoria !== 'Todas'
          ? PRODUCTOS_SONIDO_VIVO.filter((item) => item.categoria === categoria)
          : PRODUCTOS_SONIDO_VIVO;
      return filtered.map(mapProductoDTO);
    }
    throw error;
  }
}

/**
 * Ajusta el stock de un producto en el backend.
 * @param {string} codigo
 * @param {number} delta
 * @param {string} motivo
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function ajustarStock(codigo, delta, motivo, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/products/${encodeURIComponent(codigo)}/stock`,
      { delta, motivo },
      { headers: buildAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      const localProduct = PRODUCTOS_SONIDO_VIVO.find((item) => item.codigo === codigo);
      const nextStock = Math.max(0, (localProduct?.stock ?? 0) + delta);
      return { codigo, stock_disponible: nextStock, stock: nextStock };
    }
    throw error;
  }
}

/**
 * Actualiza el estado de un producto en el backend.
 * @param {string} codigo
 * @param {string} estado
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarEstado(codigo, estado, token) {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/v1/admin/products/${encodeURIComponent(codigo)}/status`,
      { estado },
      { headers: buildAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      return { codigo, estado };
    }
    throw error;
  }
}

/**
 * Crea un nuevo producto en el catálogo administrativo.
 * @param {Record<string, any>} datos
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function crearProducto(datos, token) {
  const precioClp = Number(datos.precioClp ?? datos.precio_clp ?? datos.precio ?? 0);
  const stockDisponible = Number(datos.stockDisponible ?? datos.stock_disponible ?? datos.stock ?? 0);

  const payload = {
    codigo: datos.codigo,
    nombre: datos.nombre,
    categoria: datos.categoria,
    precioClp,
    stockDisponible,
    ...(datos.especificaciones ? { especificaciones: datos.especificaciones } : {}),
    ...(datos.tags ? { tags: datos.tags } : {}),
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/admin/products`, payload, {
      headers: buildAuthHeaders(token),
    });
    return mapProductoDTO(response.data);
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      return mapProductoDTO({
        ...datos,
        precioClp,
        stockDisponible,
        estado: datos.estado || 'ACTIVO',
      });
    }
    throw error;
  }
}

/**
 * Actualiza la información de un producto existente.
 * @param {string} codigo
 * @param {Record<string, any>} datos
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function actualizarProducto(codigo, datos, token) {
  const precioClp = Number(datos.precioClp ?? datos.precio_clp ?? datos.precio ?? 0);
  const stockDisponible = Number(datos.stockDisponible ?? datos.stock_disponible ?? datos.stock ?? 0);

  const payload = {
    nombre: datos.nombre,
    categoria: datos.categoria,
    precioClp,
    stockDisponible,
    ...(datos.especificaciones ? { especificaciones: datos.especificaciones } : {}),
    ...(datos.tags ? { tags: datos.tags } : {}),
  };

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/admin/products/${encodeURIComponent(codigo)}`,
      payload,
      {
        headers: buildAuthHeaders(token),
      }
    );
    return mapProductoDTO(response.data);
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      return mapProductoDTO({
        ...datos,
        codigo,
        precioClp,
        stockDisponible,
      });
    }
    throw error;
  }
}

/**
 * Descontinúa o elimina un producto en el backend.
 * @param {string} codigo
 * @param {string} [token]
 * @returns {Promise<{ codigo: string, eliminado: boolean, estado: string }>}
 */
export async function eliminarProducto(codigo, token) {
  try {
    await axios.delete(`${API_BASE_URL}/api/v1/admin/products/${encodeURIComponent(codigo)}`, {
      headers: buildAuthHeaders(token),
    });
    return { codigo, eliminado: true, estado: 'DESCONTINUADO' };
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      return { codigo, eliminado: true, estado: 'DESCONTINUADO' };
    }
    throw error;
  }
}

/**
 * Agrega una reseña embebida ($push) a un producto.
 * @param {string} codigo
 * @param {{ cliente: string, calificacion: number|string, comentario?: string }} resena
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function agregarResena(codigo, resena, token) {
  const payload = {
    cliente: resena.cliente,
    calificacion: Number(resena.calificacion),
    comentario: resena.comentario ?? '',
  };

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/products/${encodeURIComponent(codigo)}/reviews`,
      payload,
      {
        headers: buildAuthHeaders(token),
      }
    );
    return mapProductoDTO(response.data);
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      const local = PRODUCTOS_SONIDO_VIVO.find((item) => item.codigo === codigo);
      return mapProductoDTO({
        ...(local || { codigo }),
        resenas: [
          ...(local?.resenas || []),
          { ...payload, fecha: new Date().toISOString().slice(0, 10) },
        ],
      });
    }
    throw error;
  }
}
