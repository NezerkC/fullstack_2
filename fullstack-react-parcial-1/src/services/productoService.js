// src/services/productoService.js
// Servicio de integración REST para MongoDB del backend con fallback local resiliente
import axios from 'axios';
import {
  CLAVE_INVENTARIO_STORAGE,
  obtenerCatalogoActivo,
} from '../data/productos';

let inMemoryToken = null;

/**
 * Permite inyectar o limpiar un token de autenticación en memoria.
 * @param {string|null} token
 */
export function setAuthToken(token) {
  inMemoryToken = token || null;
}

/**
 * Recupera el token JWT desde memoria o desde el almacenamiento local.
 * Soporta claves 'token', 'auth_token', 'sonido_vivo_token' y la sesión 'sonido_vivo_auth_v1'.
 * @returns {string|null}
 */
export function getAuthToken() {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const tokenDirecto =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('sonido_vivo_token');
      if (tokenDirecto) {
        return tokenDirecto;
      }

      const sesionGuardada = localStorage.getItem('sonido_vivo_auth_v1');
      if (sesionGuardada) {
        const sesion = JSON.parse(sesionGuardada);
        return sesion?.token || sesion?.accessToken || null;
      }
    }
  } catch {
    // Si localStorage está bloqueado o da error, no interrumpir flujo
  }
  return null;
}

/**
 * Instancia de Axios configurada para los endpoints REST del backend.
 */
export const apiClient = axios.create({
  baseURL: import.meta?.env?.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

/**
 * Interceptor de solicitud: Inyección automática del header Authorization: Bearer
 * para rutas protegidas o cuando exista un token activo.
 */
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const url = config.url || '';
  const esRutaProtegida =
    url.includes('/api/v1/admin') ||
    url.includes('/admin/') ||
    config.requiresAuth;

  if (token && (esRutaProtegida || !config.publicRoute)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Mapeo DTO MongoDB -> Modelo Frontend
 * Transforma:
 * - precio_clp -> precio
 * - stock_disponible -> stock
 * - _id -> id
 */
export function mapMongoToProducto(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (Array.isArray(doc)) {
    return doc.map(mapMongoToProducto);
  }

  const { _id, precio_clp, stock_disponible, resenas, reseñas, ...resto } = doc;
  return {
    ...resto,
    id: _id !== undefined ? String(_id) : doc.id,
    precio: precio_clp !== undefined ? precio_clp : doc.precio,
    stock: stock_disponible !== undefined ? stock_disponible : doc.stock,
    resenas: resenas || reseñas || doc.resenas || [],
  };
}

/**
 * Mapeo Modelo Frontend -> DTO MongoDB
 * Transforma:
 * - precio -> precio_clp
 * - stock -> stock_disponible
 * - id -> _id
 */
export function mapProductoToMongo(producto) {
  if (!producto || typeof producto !== 'object') return producto;
  if (Array.isArray(producto)) {
    return producto.map(mapProductoToMongo);
  }

  const { id, _id, precio, stock, ...resto } = producto;
  const dto = { ...resto };

  if (_id !== undefined) {
    dto._id = _id;
  } else if (id !== undefined) {
    dto._id = id;
  }

  if (precio !== undefined) {
    dto.precio_clp = precio;
  } else if (producto.precio_clp !== undefined) {
    dto.precio_clp = producto.precio_clp;
  }

  if (stock !== undefined) {
    dto.stock_disponible = stock;
  } else if (producto.stock_disponible !== undefined) {
    dto.stock_disponible = producto.stock_disponible;
  }

  return dto;
}

export const fromMongoDTO = mapMongoToProducto;
export const toMongoDTO = mapProductoToMongo;

/**
 * Mapea operaciones de mutación atómica a la convención MongoDB ($inc, $push).
 */
export function mapMutationToMongo(mutation) {
  if (!mutation || typeof mutation !== 'object') return mutation;
  const payload = { ...mutation };

  if (payload.$inc) {
    payload.$inc = { ...payload.$inc };
    if ('stock' in payload.$inc) {
      payload.$inc.stock_disponible = payload.$inc.stock;
      delete payload.$inc.stock;
    }
    if ('precio' in payload.$inc) {
      payload.$inc.precio_clp = payload.$inc.precio;
      delete payload.$inc.precio;
    }
  }

  if (payload.$push) {
    payload.$push = { ...payload.$push };
    if ('reseña' in payload.$push) {
      payload.$push.resenas = payload.$push.reseña;
      delete payload.$push.reseña;
    } else if ('reseñas' in payload.$push) {
      payload.$push.resenas = payload.$push.reseñas;
      delete payload.$push.reseñas;
    }
  }

  return payload;
}

/**
 * Helper para persistir el catálogo en localStorage como respaldo local.
 */
function guardarCatalogoLocal(catalogo) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(catalogo));
    }
  } catch (error) {
    console.error('Error al persistir inventario local:', error);
  }
}

/**
 * Calcula las métricas del panel administrativo a partir del catálogo local.
 */
export function calcularMetricasLocales(catalogo = obtenerCatalogoActivo()) {
  const lista = Array.isArray(catalogo) ? catalogo : [];
  const totalProductos = lista.length;
  const totalUnidades = lista.reduce(
    (acc, p) => acc + (Number(p.stock !== undefined ? p.stock : p.stock_disponible) || 0),
    0
  );
  const valoracionTotal = lista.reduce(
    (acc, p) =>
      acc +
      (Number(p.precio !== undefined ? p.precio : p.precio_clp) || 0) *
        (Number(p.stock !== undefined ? p.stock : p.stock_disponible) || 0),
    0
  );
  const productosCriticos = lista.filter(
    (p) =>
      (Number(p.stock !== undefined ? p.stock : p.stock_disponible) || 0) <=
      (p.stockCritico ?? 3)
  );
  const categoriasSet = new Set(lista.map((p) => p.categoria).filter(Boolean));

  return {
    capitalTotal: valoracionTotal,
    valoracionTotal,
    totalProductos,
    unidadesTotales: totalUnidades,
    totalUnidades,
    categoriasActivas: categoriasSet.size,
    totalCategorias: categoriasSet.size,
    productosCriticos: productosCriticos.length,
    alertasStockCritico: productosCriticos.length,
    detalleCriticos: productosCriticos,
  };
}

/**
 * Consume GET /api/v1/admin/dashboard/metrics con fallback resiliente.
 */
export async function getDashboardMetrics({ fallback = true } = {}) {
  try {
    const respuesta = await apiClient.get('/api/v1/admin/dashboard/metrics');
    return respuesta.data;
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      'Fallo en /api/v1/admin/dashboard/metrics, activando fallback local:',
      error.message
    );
    return calcularMetricasLocales();
  }
}

/**
 * Consume GET /api/v1/admin/products con mapeo DTO y fallback resiliente al catálogo local.
 */
export async function getAdminProducts({ fallback = true } = {}) {
  try {
    const respuesta = await apiClient.get('/api/v1/admin/products');
    const datos = Array.isArray(respuesta.data)
      ? respuesta.data
      : (respuesta.data?.productos || respuesta.data?.data || []);
    return mapMongoToProducto(datos);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      'Fallo en GET /api/v1/admin/products, activando fallback a catálogo local:',
      error.message
    );
    return obtenerCatalogoActivo();
  }
}

export const getProductos = getAdminProducts;

/**
 * Consume GET /api/v1/admin/products/:id con mapeo DTO y fallback.
 */
export async function getProductoPorId(id, { fallback = true } = {}) {
  try {
    const respuesta = await apiClient.get(`/api/v1/admin/products/${id}`);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      `Fallo en GET /api/v1/admin/products/${id}, buscando en catálogo local:`,
      error.message
    );
    const catalogo = obtenerCatalogoActivo();
    const encontrado = catalogo.find(
      (p) => p.codigo === id || String(p.id) === String(id) || String(p._id) === String(id)
    );
    if (encontrado) return encontrado;
    throw error;
  }
}

/**
 * Consume POST /api/v1/admin/products con mapeo hacia DTO MongoDB.
 */
export async function crearProducto(nuevoProducto, { fallback = true } = {}) {
  const payload = mapProductoToMongo(nuevoProducto);
  try {
    const respuesta = await apiClient.post('/api/v1/admin/products', payload);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      'Fallo en POST /api/v1/admin/products, persistiendo en almacenamiento local:',
      error.message
    );
    const catalogo = [...obtenerCatalogoActivo()];
    const productoNormalizado = {
      ...nuevoProducto,
      id: nuevoProducto.id || nuevoProducto.codigo || `LOCAL_${Date.now()}`,
      stock: nuevoProducto.stock ?? 0,
      precio: nuevoProducto.precio ?? 0,
    };
    catalogo.push(productoNormalizado);
    guardarCatalogoLocal(catalogo);
    return productoNormalizado;
  }
}

/**
 * Consume PUT o PATCH /api/v1/admin/products/:id con mapeo hacia DTO MongoDB.
 */
export async function actualizarProducto(id, datos, { fallback = true } = {}) {
  const payload = mapProductoToMongo(datos);
  try {
    const respuesta = await apiClient.put(`/api/v1/admin/products/${id}`, payload);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      `Fallo en PUT /api/v1/admin/products/${id}, actualizando en almacenamiento local:`,
      error.message
    );
    const catalogo = [...obtenerCatalogoActivo()];
    const index = catalogo.findIndex(
      (p) => p.codigo === id || String(p.id) === String(id) || String(p._id) === String(id)
    );
    if (index !== -1) {
      catalogo[index] = { ...catalogo[index], ...datos };
      guardarCatalogoLocal(catalogo);
      return catalogo[index];
    }
    throw error;
  }
}

/**
 * Consume DELETE /api/v1/admin/products/:id con fallback local.
 */
export async function eliminarProducto(id, { fallback = true } = {}) {
  try {
    const respuesta = await apiClient.delete(`/api/v1/admin/products/${id}`);
    return respuesta.data;
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      `Fallo en DELETE /api/v1/admin/products/${id}, eliminando de almacenamiento local:`,
      error.message
    );
    const catalogo = obtenerCatalogoActivo().filter(
      (p) => p.codigo !== id && String(p.id) !== String(id) && String(p._id) !== String(id)
    );
    guardarCatalogoLocal(catalogo);
    return { ok: true, id, fallback: true };
  }
}

/**
 * Mutación atómica: $inc stock_disponible en MongoDB.
 * Consume PATCH /api/v1/admin/products/:id con payload { $inc: { stock_disponible: delta } }.
 */
export async function incrementarStock(id, cantidad = 1, { fallback = true } = {}) {
  const payload = { $inc: { stock_disponible: cantidad } };
  try {
    const respuesta = await apiClient.patch(`/api/v1/admin/products/${id}`, payload);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      `Fallo en $inc stock para ${id}, aplicando mutación local:`,
      error.message
    );
    const catalogo = [...obtenerCatalogoActivo()];
    const index = catalogo.findIndex(
      (p) => p.codigo === id || String(p.id) === String(id) || String(p._id) === String(id)
    );
    if (index !== -1) {
      const stockActual = Number(catalogo[index].stock) || 0;
      catalogo[index] = {
        ...catalogo[index],
        stock: Math.max(0, stockActual + cantidad),
      };
      guardarCatalogoLocal(catalogo);
      return catalogo[index];
    }
    throw error;
  }
}

/**
 * Mutación atómica: $push reseña en MongoDB.
 * Consume PATCH /api/v1/admin/products/:id con payload { $push: { resenas: resena } }.
 */
export async function agregarResena(id, resena, { fallback = true } = {}) {
  const payload = { $push: { resenas: resena } };
  try {
    const respuesta = await apiClient.patch(`/api/v1/admin/products/${id}`, payload);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    console.warn(
      `Fallo en $push reseña para ${id}, agregando reseña local:`,
      error.message
    );
    const catalogo = [...obtenerCatalogoActivo()];
    const index = catalogo.findIndex(
      (p) => p.codigo === id || String(p.id) === String(id) || String(p._id) === String(id)
    );
    if (index !== -1) {
      const resenasActuales = Array.isArray(catalogo[index].resenas)
        ? catalogo[index].resenas
        : [];
      catalogo[index] = {
        ...catalogo[index],
        resenas: [...resenasActuales, resena],
      };
      guardarCatalogoLocal(catalogo);
      return catalogo[index];
    }
    throw error;
  }
}

/**
 * Mutación atómica genérica ($inc, $push, etc.)
 */
export async function mutarProductoAtomico(id, mutacion, { fallback = true } = {}) {
  const payload = mapMutationToMongo(mutacion);
  try {
    const respuesta = await apiClient.patch(`/api/v1/admin/products/${id}`, payload);
    return mapMongoToProducto(respuesta.data);
  } catch (error) {
    if (!fallback) throw error;
    const catalogo = [...obtenerCatalogoActivo()];
    const index = catalogo.findIndex(
      (p) => p.codigo === id || String(p.id) === String(id) || String(p._id) === String(id)
    );
    if (index !== -1) {
      let actualizado = { ...catalogo[index] };
      if (payload.$inc?.stock_disponible !== undefined) {
        const stockActual = Number(actualizado.stock) || 0;
        actualizado.stock = Math.max(0, stockActual + payload.$inc.stock_disponible);
      }
      if (payload.$push?.resenas !== undefined) {
        const lista = Array.isArray(actualizado.resenas) ? actualizado.resenas : [];
        actualizado.resenas = [...lista, payload.$push.resenas];
      }
      catalogo[index] = actualizado;
      guardarCatalogoLocal(catalogo);
      return actualizado;
    }
    throw error;
  }
}

const productoService = {
  apiClient,
  setAuthToken,
  getAuthToken,
  mapMongoToProducto,
  mapProductoToMongo,
  fromMongoDTO,
  toMongoDTO,
  mapMutationToMongo,
  calcularMetricasLocales,
  getDashboardMetrics,
  getAdminProducts,
  getProductos,
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  incrementarStock,
  agregarResena,
  mutarProductoAtomico,
};

export default productoService;
