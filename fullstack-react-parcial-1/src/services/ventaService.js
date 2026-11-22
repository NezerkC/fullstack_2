import axios from 'axios';
import { obtenerCatalogoActivo } from '../data/productos';
import { guardarOrdenStorage } from '../utils/checkout';

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
 * Valida la existencia de stock suficiente para cada ítem contra el catálogo.
 * @param {Array<Record<string, any>>} [items=[]]
 * @param {Array<Record<string, any>>} [catalogo=obtenerCatalogoActivo()]
 * @returns {{ valido: boolean, faltantes: Array<{ codigo: string, nombre: string, solicitado: number, disponible: number }> }}
 */
export function validarStockPrevio(items = [], catalogo = obtenerCatalogoActivo()) {
  if (!Array.isArray(items)) {
    return { valido: true, faltantes: [] };
  }

  const faltantes = [];

  for (const item of items) {
    const prodCatalogo = catalogo.find((p) => p.codigo === item.codigo);
    if (prodCatalogo) {
      const stockDisponible = Number(prodCatalogo.stock ?? 0);
      const cantidadSolicitada = Number(item.cantidad ?? 0);
      if (cantidadSolicitada > stockDisponible) {
        faltantes.push({
          codigo: item.codigo,
          nombre: item.nombre || prodCatalogo.nombre,
          solicitado: cantidadSolicitada,
          disponible: stockDisponible,
        });
      }
    }
  }

  return {
    valido: faltantes.length === 0,
    faltantes,
  };
}

/**
 * Registra una venta en el backend o en almacenamiento local de respaldo ante modo offline/error del servidor.
 * @param {Record<string, any>} orden
 * @param {string} [token]
 * @returns {Promise<Record<string, any>>}
 */
export async function registrarVenta(orden, token) {
  const payload = {
    numeroOrden: orden.numero,
    cliente: orden.cliente,
    entrega: orden.entrega,
    pago: orden.pago,
    items: orden.items,
    subtotal: orden.subtotal,
    iva: orden.iva,
    total: orden.total,
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/store/sales`, payload, {
      headers: buildAuthHeaders(token),
    });

    const codigoFinal =
      response.data?.codigoOrden ||
      response.data?.numeroOrden ||
      response.data?.numero ||
      orden.numero;

    const ordenRegistrada = {
      ...orden,
      numero: codigoFinal,
      origenRegistro: 'api',
      comprobanteApi: response.data,
    };

    guardarOrdenStorage(ordenRegistrada);
    return ordenRegistrada;
  } catch (error) {
    if (isOfflineOrServerError(error)) {
      const ordenOffline = {
        ...orden,
        origenRegistro: 'offline',
      };
      guardarOrdenStorage(ordenOffline);
      return ordenOffline;
    }
    throw error;
  }
}
