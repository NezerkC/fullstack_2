// src/services/productoService.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import productoService, {
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
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  incrementarStock,
  agregarResena,
  mutarProductoAtomico,
} from './productoService';
import { CLAVE_INVENTARIO_STORAGE } from '../data/productos';

const MOCK_MONGO_DOC = {
  _id: '6745123abc99',
  codigo: 'GA001',
  nombre: 'Guitarra Acústica Folk',
  precio_clp: 129990,
  stock_disponible: 8,
  categoria: 'Guitarras Acústicas',
  stockCritico: 3,
};

const MOCK_PRODUCTO_FRONTEND = {
  id: '6745123abc99',
  codigo: 'GA001',
  nombre: 'Guitarra Acústica Folk',
  precio: 129990,
  stock: 8,
  categoria: 'Guitarras Acústicas',
  stockCritico: 3,
};

describe('productoService - Mapeo Bidireccional DTO MongoDB', () => {
  it('mapMongoToProducto mapea precio_clp -> precio, stock_disponible -> stock y _id -> id', () => {
    const resultado = mapMongoToProducto(MOCK_MONGO_DOC);
    expect(resultado.precio).toBe(129990);
    expect(resultado.stock).toBe(8);
    expect(resultado.id).toBe('6745123abc99');
    expect(resultado.nombre).toBe('Guitarra Acústica Folk');
    expect(resultado.codigo).toBe('GA001');
    expect(resultado.resenas).toEqual([]);
  });

  it('mapMongoToProducto maneja valores numéricos en 0 correctamente', () => {
    const docZero = {
      _id: '123',
      precio_clp: 0,
      stock_disponible: 0,
    };
    const resultado = mapMongoToProducto(docZero);
    expect(resultado.precio).toBe(0);
    expect(resultado.stock).toBe(0);
  });

  it('mapMongoToProducto soporta arrays de documentos', () => {
    const docs = [MOCK_MONGO_DOC, { ...MOCK_MONGO_DOC, _id: '6745123abc98', precio_clp: 80000, stock_disponible: 2 }];
    const resultado = mapMongoToProducto(docs);
    expect(resultado).toHaveLength(2);
    expect(resultado[1].precio).toBe(80000);
    expect(resultado[1].stock).toBe(2);
  });

  it('mapMongoToProducto maneja valores no objetos de manera segura', () => {
    expect(mapMongoToProducto(null)).toBeNull();
    expect(mapMongoToProducto(undefined)).toBeUndefined();
    expect(mapMongoToProducto('string')).toBe('string');
  });

  it('mapProductoToMongo mapea precio -> precio_clp, stock -> stock_disponible e id -> _id', () => {
    const resultado = mapProductoToMongo(MOCK_PRODUCTO_FRONTEND);
    expect(resultado.precio_clp).toBe(129990);
    expect(resultado.stock_disponible).toBe(8);
    expect(resultado._id).toBe('6745123abc99');
    expect(resultado.precio).toBeUndefined();
    expect(resultado.stock).toBeUndefined();
    expect(resultado.id).toBeUndefined();
  });

  it('mapProductoToMongo conserva precio_clp o stock_disponible si ya vienen definidos', () => {
    const objeto = {
      nombre: 'Bajo',
      precio_clp: 250000,
      stock_disponible: 4,
    };
    const resultado = mapProductoToMongo(objeto);
    expect(resultado.precio_clp).toBe(250000);
    expect(resultado.stock_disponible).toBe(4);
  });

  it('mapProductoToMongo soporta arrays de objetos', () => {
    const lista = [MOCK_PRODUCTO_FRONTEND];
    const resultado = mapProductoToMongo(lista);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].precio_clp).toBe(129990);
  });

  it('mapProductoToMongo maneja valores no objetos de manera segura', () => {
    expect(mapProductoToMongo(null)).toBeNull();
    expect(mapProductoToMongo(123)).toBe(123);
  });

  it('fromMongoDTO y toMongoDTO funcionan como alias correspondientes', () => {
    expect(fromMongoDTO).toBe(mapMongoToProducto);
    expect(toMongoDTO).toBe(mapProductoToMongo);
  });

  it('mapMutationToMongo transforma $inc stock y $push reseña a formato de base de datos', () => {
    const mutacionFrontend = {
      $inc: { stock: -1, precio: 1000 },
      $push: { reseña: { autor: 'Juan', comentario: 'Excelente', calificacion: 5 } },
    };
    const mutacionMongo = mapMutationToMongo(mutacionFrontend);

    expect(mutacionMongo.$inc.stock_disponible).toBe(-1);
    expect(mutacionMongo.$inc.stock).toBeUndefined();
    expect(mutacionMongo.$inc.precio_clp).toBe(1000);
    expect(mutacionMongo.$inc.precio).toBeUndefined();
    expect(mutacionMongo.$push.resenas).toEqual({
      autor: 'Juan',
      comentario: 'Excelente',
      calificacion: 5,
    });
    expect(mutacionMongo.$push.reseña).toBeUndefined();
  });

  it('mapMutationToMongo maneja inputs no válidos', () => {
    expect(mapMutationToMongo(null)).toBeNull();
    expect(mapMutationToMongo(undefined)).toBeUndefined();
  });
});

describe('productoService - Autenticación e Inyección Automática de Bearer Token', () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthToken(null);
  });

  afterEach(() => {
    localStorage.clear();
    setAuthToken(null);
  });

  it('recupera token establecido mediante setAuthToken', () => {
    setAuthToken('token-en-memoria-123');
    expect(getAuthToken()).toBe('token-en-memoria-123');
  });

  it('recupera token desde localStorage ("token")', () => {
    localStorage.setItem('token', 'jwt-local-1');
    expect(getAuthToken()).toBe('jwt-local-1');
  });

  it('recupera token desde localStorage ("auth_token")', () => {
    localStorage.setItem('auth_token', 'jwt-local-2');
    expect(getAuthToken()).toBe('jwt-local-2');
  });

  it('recupera token desde la sesión institucional sonido_vivo_auth_v1', () => {
    localStorage.setItem(
      'sonido_vivo_auth_v1',
      JSON.stringify({ rut: '12345678-5', token: 'jwt-sesion-institucional' })
    );
    expect(getAuthToken()).toBe('jwt-sesion-institucional');
  });

  it('retorna null si no hay token ni en memoria ni en storage', () => {
    expect(getAuthToken()).toBeNull();
  });

  it('inyecta header Authorization: Bearer automáticamente en rutas protegidas cuando hay token', async () => {
    setAuthToken('jwt-admin-secret-token');

    // Usamos el request interceptor directamente
    const interceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = {
      url: '/api/v1/admin/products',
      headers: {},
    };

    const resultado = interceptor(config);
    expect(resultado.headers.Authorization).toBe('Bearer jwt-admin-secret-token');
  });

  it('no inyecta Authorization si no hay token disponible', async () => {
    setAuthToken(null);
    const interceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const config = {
      url: '/api/v1/admin/products',
      headers: {},
    };

    const resultado = interceptor(config);
    expect(resultado.headers.Authorization).toBeUndefined();
  });
});

describe('productoService - Consumo de Endpoints y Mutaciones Atómicas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getDashboardMetrics consume GET /api/v1/admin/dashboard/metrics exitosamente', async () => {
    const mockMetrics = {
      valoracionTotal: 5000000,
      totalProductos: 51,
      totalUnidades: 200,
      productosCriticos: 4,
    };
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockMetrics });

    const metricas = await getDashboardMetrics();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/dashboard/metrics');
    expect(metricas).toEqual(mockMetrics);
  });

  it('getAdminProducts consume GET /api/v1/admin/products y mapea DTO MongoDB', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [MOCK_MONGO_DOC] });

    const productos = await getAdminProducts();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/products');
    expect(productos[0].precio).toBe(129990);
    expect(productos[0].stock).toBe(8);
  });

  it('getProductoPorId consume GET /api/v1/admin/products/:id y mapea DTO', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: MOCK_MONGO_DOC });

    const producto = await getProductoPorId('6745123abc99');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/products/6745123abc99');
    expect(producto.id).toBe('6745123abc99');
    expect(producto.precio).toBe(129990);
  });

  it('crearProducto consume POST /api/v1/admin/products enviando DTO mapeado', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        _id: 'nuevo-123',
        codigo: 'NUEVO01',
        precio_clp: 99990,
        stock_disponible: 10,
        nombre: 'Teclado MIDI',
      },
    });

    const creado = await crearProducto({
      codigo: 'NUEVO01',
      precio: 99990,
      stock: 10,
      nombre: 'Teclado MIDI',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/products', {
      codigo: 'NUEVO01',
      precio_clp: 99990,
      stock_disponible: 10,
      nombre: 'Teclado MIDI',
    });
    expect(creado.precio).toBe(99990);
    expect(creado.stock).toBe(10);
    expect(creado.id).toBe('nuevo-123');
  });

  it('actualizarProducto consume PUT /api/v1/admin/products/:id con DTO', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: {
        _id: 'GA001',
        codigo: 'GA001',
        precio_clp: 139990,
        stock_disponible: 12,
      },
    });

    const actualizado = await actualizarProducto('GA001', {
      precio: 139990,
      stock: 12,
    });

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/admin/products/GA001', {
      precio_clp: 139990,
      stock_disponible: 12,
    });
    expect(actualizado.precio).toBe(139990);
    expect(actualizado.stock).toBe(12);
  });

  it('eliminarProducto consume DELETE /api/v1/admin/products/:id', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { ok: true } });

    const res = await eliminarProducto('GA001');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/admin/products/GA001');
    expect(res).toEqual({ ok: true });
  });

  it('incrementarStock ejecuta mutación atómica $inc en stock_disponible', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        _id: 'GA001',
        codigo: 'GA001',
        stock_disponible: 15,
        precio_clp: 129990,
      },
    });

    const res = await incrementarStock('GA001', 5);
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/admin/products/GA001', {
      $inc: { stock_disponible: 5 },
    });
    expect(res.stock).toBe(15);
  });

  it('agregarResena ejecuta mutación atómica $push en resenas', async () => {
    const nuevaResena = {
      usuario: 'Carlos',
      calificacion: 5,
      comentario: 'Sonido impecable',
    };
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        _id: 'GA001',
        codigo: 'GA001',
        stock_disponible: 8,
        precio_clp: 129990,
        resenas: [nuevaResena],
      },
    });

    const res = await agregarResena('GA001', nuevaResena);
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/admin/products/GA001', {
      $push: { resenas: nuevaResena },
    });
    expect(res.resenas).toHaveLength(1);
    expect(res.resenas[0].usuario).toBe('Carlos');
  });

  it('mutarProductoAtomico soporta múltiples operadores atómicos MongoDB', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: {
        _id: 'GA001',
        codigo: 'GA001',
        stock_disponible: 7,
        precio_clp: 129990,
      },
    });

    const res = await mutarProductoAtomico('GA001', {
      $inc: { stock: -1 },
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/admin/products/GA001', {
      $inc: { stock_disponible: -1 },
    });
    expect(res.stock).toBe(7);
  });
});

describe('productoService - Fallback Resiliente a Catálogo Local', () => {
  beforeEach(() => {
    localStorage.clear();
    const catalogoInicial = [
      {
        codigo: 'GA001',
        nombre: 'Guitarra Acústica Folk',
        precio: 100000,
        stock: 5,
        stockCritico: 3,
        resenas: [],
      },
      {
        codigo: 'GA002',
        nombre: 'Guitarra Dreadnought',
        precio: 200000,
        stock: 2,
        stockCritico: 3,
        resenas: [],
      },
    ];
    localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(catalogoInicial));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('getDashboardMetrics activa fallback resiliente y calcula métricas locales si el backend falla', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network Error'));

    const metricas = await getDashboardMetrics();
    expect(metricas.totalProductos).toBe(2);
    expect(metricas.totalUnidades).toBe(7); // 5 + 2
    expect(metricas.valoracionTotal).toBe(900000); // 5*100000 + 2*200000
    expect(metricas.productosCriticos).toBe(1); // GA002 stock 2 <= 3
  });

  it('calcularMetricasLocales entrega estructura completa de KPIs', () => {
    const kpis = calcularMetricasLocales();
    expect(kpis).toHaveProperty('valoracionTotal');
    expect(kpis).toHaveProperty('totalProductos');
    expect(kpis).toHaveProperty('totalUnidades');
    expect(kpis).toHaveProperty('productosCriticos');
    expect(kpis).toHaveProperty('alertasStockCritico');
    expect(kpis).toHaveProperty('detalleCriticos');
  });

  it('getAdminProducts retorna catálogo local si el backend no responde', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Connection Refused 503'));

    const productos = await getAdminProducts();
    expect(productos).toHaveLength(2);
    expect(productos[0].codigo).toBe('GA001');
  });

  it('getProductoPorId busca en catálogo local si el backend falla', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Timeout'));

    const producto = await getProductoPorId('GA002');
    expect(producto.codigo).toBe('GA002');
    expect(producto.precio).toBe(200000);
  });

  it('getProductoPorId lanza error si fallback: false y el backend falla', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('404 Not Found'));

    await expect(getProductoPorId('GA999', { fallback: false })).rejects.toThrow('404 Not Found');
  });

  it('crearProducto persiste en catálogo local si el backend no responde', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Server Error 500'));

    const nuevo = {
      codigo: 'MIC001',
      nombre: 'Micrófono Shure',
      precio: 85000,
      stock: 4,
    };
    const resultado = await crearProducto(nuevo);
    expect(resultado.codigo).toBe('MIC001');

    const catalogoStorage = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
    expect(catalogoStorage).toHaveLength(3);
    expect(catalogoStorage.find((p) => p.codigo === 'MIC001')).toBeTruthy();
  });

  it('actualizarProducto persiste cambios locales si el backend no responde', async () => {
    vi.spyOn(apiClient, 'put').mockRejectedValueOnce(new Error('Backend Offline'));

    const actualizado = await actualizarProducto('GA001', { precio: 115000 });
    expect(actualizado.precio).toBe(115000);

    const catalogoStorage = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
    const prod = catalogoStorage.find((p) => p.codigo === 'GA001');
    expect(prod.precio).toBe(115000);
  });

  it('eliminarProducto remueve del catálogo local si el backend no responde', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new Error('Backend Offline'));

    const resultado = await eliminarProducto('GA001');
    expect(resultado.ok).toBe(true);
    expect(resultado.fallback).toBe(true);

    const catalogoStorage = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
    expect(catalogoStorage).toHaveLength(1);
    expect(catalogoStorage[0].codigo).toBe('GA002');
  });

  it('incrementarStock aplica delta al catálogo local cuando el backend falla', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Backend Offline'));

    const resultado = await incrementarStock('GA001', 3);
    expect(resultado.stock).toBe(8); // 5 + 3

    const catalogoStorage = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
    const prod = catalogoStorage.find((p) => p.codigo === 'GA001');
    expect(prod.stock).toBe(8);
  });

  it('agregarResena anexa reseña al catálogo local cuando el backend falla', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Backend Offline'));

    const resena = { usuario: 'Ana', calificacion: 5, comentario: 'Excelente producto' };
    const resultado = await agregarResena('GA001', resena);
    expect(resultado.resenas).toHaveLength(1);
    expect(resultado.resenas[0].usuario).toBe('Ana');

    const catalogoStorage = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
    const prod = catalogoStorage.find((p) => p.codigo === 'GA001');
    expect(prod.resenas).toHaveLength(1);
  });

  it('mutarProductoAtomico aplica $inc y $push en catálogo local si el backend falla', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Backend Offline'));

    const res = await mutarProductoAtomico('GA001', {
      $inc: { stock: 2 },
      $push: { reseña: { usuario: 'Pedro' } },
    });

    expect(res.stock).toBe(7);
    expect(res.resenas).toHaveLength(1);
  });

  it('re-lanza error en fallback si fallback: false', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Crash'));
    await expect(getDashboardMetrics({ fallback: false })).rejects.toThrow('Crash');

    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Crash Products'));
    await expect(getAdminProducts({ fallback: false })).rejects.toThrow('Crash Products');

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Crash Post'));
    await expect(crearProducto({}, { fallback: false })).rejects.toThrow('Crash Post');

    vi.spyOn(apiClient, 'put').mockRejectedValueOnce(new Error('Crash Put'));
    await expect(actualizarProducto('GA001', {}, { fallback: false })).rejects.toThrow('Crash Put');

    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new Error('Crash Delete'));
    await expect(eliminarProducto('GA001', { fallback: false })).rejects.toThrow('Crash Delete');

    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Crash Patch Inc'));
    await expect(incrementarStock('GA001', 1, { fallback: false })).rejects.toThrow('Crash Patch Inc');

    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Crash Patch Resena'));
    await expect(agregarResena('GA001', {}, { fallback: false })).rejects.toThrow('Crash Patch Resena');

    vi.spyOn(apiClient, 'patch').mockRejectedValueOnce(new Error('Crash Patch Mutation'));
    await expect(mutarProductoAtomico('GA001', {}, { fallback: false })).rejects.toThrow('Crash Patch Mutation');
  });

  it('lanza error original si el producto no existe localmente durante fallback de mutación', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValue(new Error('Backend Unavailable'));

    await expect(incrementarStock('INEXISTENTE', 1)).rejects.toThrow('Backend Unavailable');
    await expect(agregarResena('INEXISTENTE', { calificacion: 5 })).rejects.toThrow('Backend Unavailable');
    await expect(mutarProductoAtomico('INEXISTENTE', { $inc: { stock: 1 } })).rejects.toThrow('Backend Unavailable');
  });
});

describe('productoService - Export por defecto', () => {
  it('exporta todos los métodos esperados en el objeto por defecto', () => {
    expect(typeof productoService.getDashboardMetrics).toBe('function');
    expect(typeof productoService.getAdminProducts).toBe('function');
    expect(typeof productoService.getProductos).toBe('function');
    expect(typeof productoService.getProductoPorId).toBe('function');
    expect(typeof productoService.crearProducto).toBe('function');
    expect(typeof productoService.actualizarProducto).toBe('function');
    expect(typeof productoService.eliminarProducto).toBe('function');
    expect(typeof productoService.incrementarStock).toBe('function');
    expect(typeof productoService.agregarResena).toBe('function');
    expect(typeof productoService.mutarProductoAtomico).toBe('function');
    expect(typeof productoService.mapMongoToProducto).toBe('function');
    expect(typeof productoService.mapProductoToMongo).toBe('function');
    expect(typeof productoService.fromMongoDTO).toBe('function');
    expect(typeof productoService.toMongoDTO).toBe('function');
    expect(typeof productoService.setAuthToken).toBe('function');
    expect(typeof productoService.getAuthToken).toBe('function');
    expect(typeof productoService.calcularMetricasLocales).toBe('function');
  });
});
