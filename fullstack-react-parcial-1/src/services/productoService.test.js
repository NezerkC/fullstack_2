import { describe, test, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  obtenerMetricas,
  obtenerProductos,
  ajustarStock,
  actualizarEstado,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  agregarResena,
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

  describe('crearProducto', () => {
    test('invoca POST /api/v1/admin/products con DTO mapeado y Bearer token', async () => {
      const nuevoProducto = {
        codigo: 'MIC001',
        nombre: 'Micrófono Dinámico Pro',
        categoria: 'Microfonía',
        precioClp: 89990,
        stockDisponible: 12,
        especificaciones: { patron: 'Cardioide' },
        tags: ['audio', 'estudio'],
      };

      const dtoRespuesta = {
        codigo: 'MIC001',
        nombre: 'Micrófono Dinámico Pro',
        categoria: 'Microfonía',
        precioClp: 89990,
        stockDisponible: 12,
        estado: 'ACTIVO',
      };
      axios.post.mockResolvedValueOnce({ data: dtoRespuesta });

      const resultado = await crearProducto(nuevoProducto, TOKEN);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/products'),
        {
          codigo: 'MIC001',
          nombre: 'Micrófono Dinámico Pro',
          categoria: 'Microfonía',
          precioClp: 89990,
          stockDisponible: 12,
          especificaciones: { patron: 'Cardioide' },
          tags: ['audio', 'estudio'],
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        })
      );
      expect(resultado).toMatchObject({
        codigo: 'MIC001',
        precio: 89990,
        stock: 12,
      });
    });

    test('relanza error si el status es 400 (Bad Request)', async () => {
      const error400 = Object.assign(new Error('Bad Request'), {
        response: { status: 400, data: { mensaje: 'Código duplicado' } },
      });
      axios.post.mockRejectedValueOnce(error400);

      await expect(
        crearProducto({ codigo: 'GA001', nombre: 'Duplicado' }, TOKEN)
      ).rejects.toThrow('Bad Request');
    });

    test('retorna fallback mapeado ante Network Error sin lanzar', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      const datos = {
        codigo: 'FALLBACK01',
        nombre: 'Fallback Producto',
        categoria: 'Microfonía',
        precioClp: 45000,
        stockDisponible: 5,
      };

      const resultado = await crearProducto(datos, TOKEN);
      expect(resultado).toMatchObject({
        codigo: 'FALLBACK01',
        nombre: 'Fallback Producto',
        precio: 45000,
        stock: 5,
        estado: 'ACTIVO',
      });
    });
  });

  describe('actualizarProducto', () => {
    test('invoca PUT /api/v1/admin/products/{codigo} con DTO mapeado y Bearer token', async () => {
      const datosActualizar = {
        nombre: 'Guitarra Acústica Custom',
        categoria: 'Guitarras Acústicas',
        precio_clp: 145000,
        stock_disponible: 10,
        tags: ['custom'],
      };

      const dtoRespuesta = {
        codigo: 'GA001',
        nombre: 'Guitarra Acústica Custom',
        categoria: 'Guitarras Acústicas',
        precioClp: 145000,
        stockDisponible: 10,
      };
      axios.put.mockResolvedValueOnce({ data: dtoRespuesta });

      const resultado = await actualizarProducto('GA001', datosActualizar, TOKEN);

      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/products/GA001'),
        {
          nombre: 'Guitarra Acústica Custom',
          categoria: 'Guitarras Acústicas',
          precioClp: 145000,
          stockDisponible: 10,
          tags: ['custom'],
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        })
      );
      expect(resultado).toMatchObject({
        codigo: 'GA001',
        precio: 145000,
        stock: 10,
      });
    });

    test('retorna fallback mapeado ante error del servidor (>= 500)', async () => {
      const error500 = Object.assign(new Error('Internal Server Error'), {
        response: { status: 500 },
      });
      axios.put.mockRejectedValueOnce(error500);

      const datos = {
        nombre: 'Falla Servidor',
        categoria: 'Audio',
        precio: 20000,
        stock: 2,
      };

      const resultado = await actualizarProducto('GA001', datos, TOKEN);
      expect(resultado).toMatchObject({
        codigo: 'GA001',
        nombre: 'Falla Servidor',
        precio: 20000,
        stock: 2,
      });
    });
  });

  describe('eliminarProducto', () => {
    test('invoca DELETE /api/v1/admin/products/{codigo} con Bearer token y retorna objeto de confirmación', async () => {
      axios.delete.mockResolvedValueOnce({ status: 204 });

      const resultado = await eliminarProducto('GA001', TOKEN);

      expect(axios.delete).toHaveBeenCalledTimes(1);
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/products/GA001'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        })
      );
      expect(resultado).toEqual({
        codigo: 'GA001',
        eliminado: true,
        estado: 'DESCONTINUADO',
      });
    });

    test('retorna objeto de confirmación ante Network Error (fallback offline)', async () => {
      axios.delete.mockRejectedValueOnce(new Error('Network Error'));

      const resultado = await eliminarProducto('GA001', TOKEN);
      expect(resultado).toEqual({
        codigo: 'GA001',
        eliminado: true,
        estado: 'DESCONTINUADO',
      });
    });
  });

  describe('agregarResena', () => {
    test('invoca POST /api/v1/admin/products/{codigo}/reviews con ReviewCreateDTO y Bearer token', async () => {
      const resena = {
        cliente: 'Martina Gomez',
        calificacion: 5,
        comentario: 'Excelente sonido y acabado.',
      };

      const dtoRespuesta = {
        codigo: 'GA001',
        nombre: 'Guitarra Acústica Folk',
        precio_clp: 129990,
        stock_disponible: 8,
        resenas: [
          {
            cliente: 'Martina Gomez',
            calificacion: 5,
            comentario: 'Excelente sonido y acabado.',
            fecha: '2026-03-25',
          },
        ],
      };
      axios.post.mockResolvedValueOnce({ data: dtoRespuesta });

      const resultado = await agregarResena('GA001', resena, TOKEN);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/products/GA001/reviews'),
        {
          cliente: 'Martina Gomez',
          calificacion: 5,
          comentario: 'Excelente sonido y acabado.',
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        })
      );
      expect(resultado.resenas).toHaveLength(1);
      expect(resultado.resenas[0].cliente).toBe('Martina Gomez');
    });

    test('retorna fallback local ante Network Error agregando reseña con fecha actual', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      const resena = {
        cliente: 'Pedro Soto',
        calificacion: 4,
        comentario: 'Muy buen producto.',
      };

      const resultado = await agregarResena('GA001', resena, TOKEN);

      expect(resultado).toBeDefined();
      expect(resultado.codigo).toBe('GA001');
      expect(Array.isArray(resultado.resenas)).toBe(true);
      const resenaAgregada = resultado.resenas.find((r) => r.cliente === 'Pedro Soto');
      expect(resenaAgregada).toBeDefined();
      expect(resenaAgregada.calificacion).toBe(4);
      expect(resenaAgregada.fecha).toBeDefined();
    });
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
