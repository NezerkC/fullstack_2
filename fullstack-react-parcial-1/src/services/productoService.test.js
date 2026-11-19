import { describe, test, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  obtenerMetricas,
  obtenerProductos,
  ajustarStock,
  actualizarEstado,
} from './productoService';
import { PRODUCTOS_SONIDO_VIVO } from '../data/productos';

vi.mock('axios');

describe('productoService', () => {
  const TOKEN = 'jwt-admin-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('obtenerMetricas(token) invoca GET /api/v1/admin/dashboard/metrics con Authorization Bearer y retorna métricas', async () => {
    const mockMetrics = {
      totalProductos: 30,
      valoracionTotal: 5400000,
      unidadesStock: 120,
      productosCriticos: 4,
    };
    axios.get.mockResolvedValueOnce({ data: mockMetrics });

    const resultado = await obtenerMetricas(TOKEN);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/dashboard/metrics'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
    expect(resultado).toEqual(mockMetrics);
  });

  test('obtenerProductos(params, token) invoca GET /api/v1/admin/products con query params y mapea DTOs (precio_clp -> precio, stock_disponible -> stock)', async () => {
    const params = { categoria: 'Guitarras Acústicas', page: 1 };
    const dtoBackend = [
      {
        codigo: 'GA001',
        nombre: 'Guitarra Acústica Folk',
        categoria: 'Guitarras Acústicas',
        precio_clp: 129990,
        stock_disponible: 8,
        estado: 'ACTIVO',
      },
      {
        codigo: 'GA002',
        nombre: 'Guitarra Acústica Dreadnought',
        categoria: 'Guitarras Acústicas',
        precio_clp: 189990,
        stock_disponible: 5,
        estado: 'ACTIVO',
      },
    ];
    axios.get.mockResolvedValueOnce({ data: dtoBackend });

    const productos = await obtenerProductos(params, TOKEN);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/products'),
      expect.objectContaining({
        params,
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
    expect(productos).toHaveLength(2);
    expect(productos[0]).toMatchObject({
      codigo: 'GA001',
      nombre: 'Guitarra Acústica Folk',
      precio: 129990,
      stock: 8,
    });
    expect(productos[1]).toMatchObject({
      codigo: 'GA002',
      precio: 189990,
      stock: 5,
    });
  });

  test('ajustarStock(codigo, delta, motivo, token) invoca POST /api/v1/admin/products/{codigo}/stock con { delta, motivo } y Bearer token', async () => {
    const mockRespuesta = { codigo: 'GA001', stock_disponible: 13 };
    axios.post.mockResolvedValueOnce({ data: mockRespuesta });

    const resultado = await ajustarStock('GA001', 5, 'Reposición de bodega', TOKEN);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/products/GA001/stock'),
      { delta: 5, motivo: 'Reposición de bodega' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
    expect(resultado).toEqual(mockRespuesta);
  });

  test('actualizarEstado(codigo, estado, token) invoca PATCH /api/v1/admin/products/{codigo}/status con { estado }', async () => {
    const mockRespuesta = { codigo: 'GA001', estado: 'INACTIVO' };
    axios.patch.mockResolvedValueOnce({ data: mockRespuesta });

    const resultado = await actualizarEstado('GA001', 'INACTIVO', TOKEN);

    expect(axios.patch).toHaveBeenCalledTimes(1);
    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/products/GA001/status'),
      { estado: 'INACTIVO' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
    expect(resultado).toEqual(mockRespuesta);
  });

  describe('fallback offline ante errores de red o servidor (>= 500)', () => {
    test('obtenerProductos retorna catálogo local ante Network Error sin lanzar excepción', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      const productos = await obtenerProductos({}, TOKEN);

      expect(Array.isArray(productos)).toBe(true);
      expect(productos.length).toBeGreaterThan(0);
      expect(productos[0]).toMatchObject({
        codigo: PRODUCTOS_SONIDO_VIVO[0].codigo,
        precio: PRODUCTOS_SONIDO_VIVO[0].precio,
        stock: PRODUCTOS_SONIDO_VIVO[0].stock,
      });
    });

    test('obtenerMetricas retorna métricas de fallback locales ante status >= 500 sin lanzar excepción', async () => {
      const serverError = Object.assign(new Error('Internal Server Error'), {
        response: { status: 500 },
      });
      axios.get.mockRejectedValueOnce(serverError);

      const metricas = await obtenerMetricas(TOKEN);

      expect(metricas).toBeDefined();
      expect(typeof metricas).toBe('object');
    });
  });
});
