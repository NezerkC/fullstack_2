import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { validarStockPrevio, registrarVenta } from './ventaService';
import { ORDENES_STORAGE_KEY } from '../utils/checkout';

vi.mock('axios');

describe('ventaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('validarStockPrevio', () => {
    const catalogoMock = [
      { codigo: 'PROD1', nombre: 'Guitarra Eléctrica', stock: 5 },
      { codigo: 'PROD2', nombre: 'Amplificador', stock: 0 },
    ];

    it('retorna valido: true cuando hay stock suficiente para todos los ítems', () => {
      const items = [{ codigo: 'PROD1', cantidad: 3 }];
      const res = validarStockPrevio(items, catalogoMock);
      expect(res.valido).toBe(true);
      expect(res.faltantes).toEqual([]);
    });

    it('retorna valido: false y los detalles de faltantes cuando se solicita más que el stock disponible', () => {
      const items = [
        { codigo: 'PROD1', cantidad: 10 },
        { codigo: 'PROD2', cantidad: 1 },
      ];
      const res = validarStockPrevio(items, catalogoMock);
      expect(res.valido).toBe(false);
      expect(res.faltantes).toHaveLength(2);
      expect(res.faltantes[0]).toMatchObject({
        codigo: 'PROD1',
        solicitado: 10,
        disponible: 5,
      });
      expect(res.faltantes[1]).toMatchObject({
        codigo: 'PROD2',
        solicitado: 1,
        disponible: 0,
      });
    });

    it('maneja entradas vacías o inválidas sin errores', () => {
      expect(validarStockPrevio([], catalogoMock)).toEqual({ valido: true, faltantes: [] });
      expect(validarStockPrevio(null)).toEqual({ valido: true, faltantes: [] });
    });
  });

  describe('registrarVenta', () => {
    const ordenBase = {
      numero: 'SV-123456',
      cliente: { nombre: 'Juan', correo: 'juan@duoc.cl' },
      entrega: { tipo: 'retiro' },
      pago: { metodo: 'WebPay', tipoDocumento: 'boleta' },
      items: [{ codigo: 'PROD1', cantidad: 1, precio: 50000 }],
      subtotal: 50000,
      iva: 9500,
      total: 59500,
    };

    it('envía POST /api/v1/store/sales, persiste en storage y retorna orden con origen api', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          codigoOrden: 'SV-999999',
          estado: 'CONFIRMADA',
        },
      });

      const res = await registrarVenta(ordenBase, 'token-123');

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/store/sales'),
        expect.objectContaining({
          numeroOrden: 'SV-123456',
          pago: ordenBase.pago,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      );
      expect(res.numero).toBe('SV-999999');
      expect(res.origenRegistro).toBe('api');

      const storage = JSON.parse(localStorage.getItem(ORDENES_STORAGE_KEY));
      expect(storage).toHaveLength(1);
      expect(storage[0].numero).toBe('SV-999999');
    });

    it('guarda en storage local y marca origen offline ante falla de red o error de servidor', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      const res = await registrarVenta(ordenBase);

      expect(res.origenRegistro).toBe('offline');
      expect(res.numero).toBe('SV-123456');

      const storage = JSON.parse(localStorage.getItem(ORDENES_STORAGE_KEY));
      expect(storage).toHaveLength(1);
      expect(storage[0].origenRegistro).toBe('offline');
    });

    it('relanza error en caso de fallo 400 (Bad Request)', async () => {
      const error400 = Object.assign(new Error('Stock insuficiente'), {
        response: { status: 400, data: { message: 'Stock agotado' } },
      });
      axios.post.mockRejectedValueOnce(error400);

      await expect(registrarVenta(ordenBase)).rejects.toThrow('Stock insuficiente');
    });
  });
});
