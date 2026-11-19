import axios from 'axios';
import { PRODUCTOS_SONIDO_VIVO } from '../data/productos';

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
    precio: dto.precio_clp ?? dto.precio ?? 0,
    stock: dto.stock_disponible ?? dto.stock ?? 0,
  };
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
