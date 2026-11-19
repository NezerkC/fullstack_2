// src/components/admin/AdminMongoKpis.test.jsx
// Suite de pruebas unitarias para AdminMongoKpis (Tarea 23 · [FE-02])

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'jest-axe';
import AdminMongoKpis from './AdminMongoKpis';
import {
  calcularAgregacionesMongo,
  formatearCapitalCLP,
} from './adminMongoUtils';
import * as productoService from '../../services/productoService';

const MOCK_PRODUCTOS = [
  {
    codigo: 'GA001',
    nombre: 'Guitarra Acústica Folk',
    categoria: 'Guitarras Acústicas',
    precio: 100000,
    stock: 10,
    stockCritico: 3,
  },
  {
    codigo: 'BA001',
    nombre: 'Bajo Eléctrico Jazz',
    categoria: 'Bajos Eléctricos',
    precio: 500000,
    stock: 2,
    stockCritico: 3,
  },
  {
    codigo: 'AC001',
    nombre: 'Cable Plug 3m',
    categoria: 'Accesorios',
    precio: 15000,
    stock: 0,
    stockCritico: 3,
  },
];

const MOCK_PRODUCTOS_SIN_CRITICOS = [
  {
    codigo: 'GA001',
    nombre: 'Guitarra Folk',
    categoria: 'Guitarras Acústicas',
    precio: 100000,
    stock: 10,
    stockCritico: 3,
  },
  {
    codigo: 'TE001',
    nombre: 'Piano Digital',
    categoria: 'Teclados y Pianos',
    precio: 450000,
    stock: 5,
    stockCritico: 3,
  },
];

const MOCK_MONGO_DTOS = [
  {
    _id: '67451a1',
    codigo: 'MIC01',
    nombre: 'Micrófono Dinámico',
    categoria: 'Micrófonos',
    precio_clp: 80000,
    stock_disponible: 4,
  },
  {
    _id: '67451a2',
    codigo: 'PED01',
    nombre: 'Pedal Overdrive',
    categoria: 'Pedales de Efectos',
    precio_clp: 120000,
    stock_disponible: 1,
  },
];

describe('<AdminMongoKpis /> (Tarea 23 · [FE-02])', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Función auxiliar formatearCapitalCLP', () => {
    it('formatea correctamente montos positivos a moneda chilena ($ CLP)', () => {
      expect(formatearCapitalCLP(2000000)).toBe('$2.000.000');
      expect(formatearCapitalCLP(129990)).toBe('$129.990');
    });

    it('formatea el valor 0 de manera limpia como $0', () => {
      expect(formatearCapitalCLP(0)).toBe('$0');
      expect(formatearCapitalCLP(null)).toBe('$0');
      expect(formatearCapitalCLP(undefined)).toBe('$0');
    });
  });

  describe('Pipeline de Agregación MongoDB (calcularAgregacionesMongo)', () => {
    it('calcula capitalTotal, unidadesTotales, categoriasActivas y stockCritico en base a productos frontend', () => {
      const res = calcularAgregacionesMongo(MOCK_PRODUCTOS);

      // Capital total: (100.000 * 10) + (500.000 * 2) + (15.000 * 0) = 1.000.000 + 1.000.000 = 2.000.000
      expect(res.capitalTotal).toBe(2000000);
      expect(res.valoracionTotal).toBe(2000000);

      // Unidades totales: 10 + 2 + 0 = 12
      expect(res.unidadesTotales).toBe(12);

      // Categorías activas: Guitarras Acústicas, Bajos Eléctricos, Accesorios = 3
      expect(res.categoriasActivas).toBe(3);

      // Total productos en el catálogo
      expect(res.totalProductos).toBe(3);

      // Críticos: BA001 (stock 2 <= 3) y AC001 (stock 0 <= 3)
      expect(res.totalCriticos).toBe(2);
      expect(res.productosCriticos).toHaveLength(2);
      expect(res.productosCriticos[0].codigo).toBe('BA001');
      expect(res.productosCriticos[1].codigo).toBe('AC001');
    });

    it('soporta documentos nativos DTO MongoDB con campos precio_clp y stock_disponible', () => {
      const res = calcularAgregacionesMongo(MOCK_MONGO_DTOS);

      // Capital: (80.000 * 4) + (120.000 * 1) = 320.000 + 120.000 = 440.000
      expect(res.capitalTotal).toBe(440000);
      // Unidades: 4 + 1 = 5
      expect(res.unidadesTotales).toBe(5);
      // Categorías: Micrófonos, Pedales de Efectos = 2
      expect(res.categoriasActivas).toBe(2);
      // Crítico: PED01 (stock 1 <= 3)
      expect(res.totalCriticos).toBe(1);
      expect(res.productosCriticos[0].codigo).toBe('PED01');
    });

    it('retorna valores en cero y listas vacías ante un array vacío o nulo', () => {
      const resVacio = calcularAgregacionesMongo([]);
      expect(resVacio.capitalTotal).toBe(0);
      expect(resVacio.unidadesTotales).toBe(0);
      expect(resVacio.categoriasActivas).toBe(0);
      expect(resVacio.totalCriticos).toBe(0);
      expect(resVacio.productosCriticos).toEqual([]);

      const resNull = calcularAgregacionesMongo(null);
      expect(resNull.capitalTotal).toBe(0);
    });
  });

  describe('Criterio de Aceptación 1: Card Capital Total en Bodega formateada en $ CLP', () => {
    it('renderiza la card de Capital Total en Bodega con formato CLP', () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);

      const cardCapital = container.querySelector('#kpi-capital-bodega');
      expect(cardCapital).toBeInTheDocument();
      expect(cardCapital).toHaveTextContent(/Capital Total en Bodega/i);

      const valorCapital = container.querySelector('#valor-capital-bodega');
      expect(valorCapital).toHaveTextContent('$2.000.000');
    });

    it('muestra $0 si el inventario no posee productos o su capital acumulado es cero', () => {
      const { container } = render(<AdminMongoKpis productos={[]} />);
      const valorCapital = container.querySelector('#valor-capital-bodega');
      expect(valorCapital).toHaveTextContent('$0');
    });
  });

  describe('Criterio de Aceptación 2: Card Unidades Físicas Totales y Categorías Activas', () => {
    it('renderiza la card de Unidades Físicas Totales con el acumulador numérico correcto', () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);

      const cardUnidades = container.querySelector('#kpi-unidades-totales');
      expect(cardUnidades).toBeInTheDocument();
      expect(cardUnidades).toHaveTextContent(/Unidades Físicas Totales/i);

      const valorUnidades = container.querySelector('#valor-unidades-totales');
      expect(valorUnidades).toHaveTextContent('12');
    });

    it('renderiza la card de Categorías Activas con la cantidad de categorías distintas', () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);

      const cardCategorias = container.querySelector('#kpi-categorias-activas');
      expect(cardCategorias).toBeInTheDocument();
      expect(cardCategorias).toHaveTextContent(/Categorías Activas/i);

      const valorCategorias = container.querySelector('#valor-categorias-activas');
      expect(valorCategorias).toHaveTextContent('3');
    });

    it('renderiza la Card de resumen consolidado "Card Unidades Físicas Totales y Categorías Activas"', () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);

      const cardConsolidada = container.querySelector('#card-unidades-categorias');
      expect(cardConsolidada).toBeInTheDocument();
      expect(cardConsolidada).toHaveTextContent(/Card Unidades Físicas Totales y Categorías Activas/i);
      expect(cardConsolidada).toHaveTextContent(/Unidades Físicas Totales:\s*12/);
      expect(cardConsolidada).toHaveTextContent(/Categorías Activas:\s*3/);
    });
  });

  describe('Criterio de Aceptación 3: Alerta visual destacada cuando existan items con stock <= 3', () => {
    it('muestra la alerta destacada cuando existen productos con stock crítico (<= 3)', () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);

      const alerta = container.querySelector('#alerta-stock-critico');
      expect(alerta).toBeInTheDocument();
      expect(alerta).toHaveAttribute('role', 'alert');
      expect(alerta).toHaveTextContent(/Alerta de Stock Crítico/i);
      expect(alerta).toHaveTextContent(/2 productos requieren reabastecimiento urgente/i);

      // Card KPI de stock crítico en rojo
      const cardCriticos = container.querySelector('#kpi-stock-critico');
      expect(cardCriticos).toHaveTextContent('2');

      // Tabla de detalle de items críticos
      const tabla = container.querySelector('#tabla-stock-critico-mongo');
      expect(tabla).toBeInTheDocument();
      expect(tabla).toHaveTextContent('BA001');
      expect(tabla).toHaveTextContent('AC001');
      expect(tabla).not.toHaveTextContent('GA001'); // GA001 tiene stock 10 (>3)
    });

    it('permite interactuar con items de la alerta mediante onSelectCritico', () => {
      const onSelectCriticoMock = vi.fn();
      const { container } = render(
        <AdminMongoKpis
          productos={MOCK_PRODUCTOS}
          onSelectCritico={onSelectCriticoMock}
        />
      );

      const filaBA001 = container.querySelector('#critico-BA001');
      expect(filaBA001).toBeInTheDocument();
      fireEvent.click(filaBA001);

      expect(onSelectCriticoMock).toHaveBeenCalledTimes(1);
      expect(onSelectCriticoMock).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: 'BA001' })
      );
    });

    it('muestra el estado óptimo y oculta la alerta crítica cuando ningún producto tiene stock <= 3', () => {
      const { container } = render(
        <AdminMongoKpis productos={MOCK_PRODUCTOS_SIN_CRITICOS} />
      );

      // No debe existir el contenedor de alerta de stock crítico
      expect(container.querySelector('#alerta-stock-critico')).not.toBeInTheDocument();

      // Debe mostrar el mensaje de inventario óptimo
      const alertaOk = container.querySelector('#alerta-stock-ok');
      expect(alertaOk).toBeInTheDocument();
      expect(alertaOk).toHaveTextContent(/Inventario en estado óptimo/i);

      // Card KPI stock crítico muestra 0
      const valorCritico = container.querySelector('#valor-stock-critico');
      expect(valorCritico).toHaveTextContent('0');
    });
  });

  describe('Integración con props directas de métricas y auto-carga', () => {
    it('renderiza correctamente cuando se provee el prop metricas precalculado', () => {
      const metricasPrecalculadas = {
        capitalTotal: 8500000,
        unidadesTotales: 65,
        categoriasActivas: 5,
        totalProductos: 20,
        productosCriticos: [
          { codigo: 'CR01', nombre: 'Platillo Crash', stock: 1, categoria: 'Baterías' },
        ],
        totalCriticos: 1,
      };

      const { container } = render(<AdminMongoKpis metricas={metricasPrecalculadas} />);

      expect(container.querySelector('#valor-capital-bodega')).toHaveTextContent('$8.500.000');
      expect(container.querySelector('#valor-unidades-totales')).toHaveTextContent('65');
      expect(container.querySelector('#valor-categorias-activas')).toHaveTextContent('5');
      expect(container.querySelector('#valor-stock-critico')).toHaveTextContent('1');
      expect(container.querySelector('#alerta-stock-critico')).toHaveTextContent('CR01');
    });

    it('ejecuta la función onRefresh al pulsar el botón de actualizar', () => {
      const onRefreshMock = vi.fn();
      render(<AdminMongoKpis productos={MOCK_PRODUCTOS} onRefresh={onRefreshMock} />);

      const btn = screen.getByRole('button', { name: /actualizar métricas/i });
      fireEvent.click(btn);

      expect(onRefreshMock).toHaveBeenCalledTimes(1);
    });

    it('consume getDashboardMetrics cuando no se suministran props de datos', async () => {
      vi.spyOn(productoService, 'getDashboardMetrics').mockResolvedValueOnce({
        capitalTotal: 3000000,
        unidadesTotales: 25,
        categoriasActivas: 4,
        totalProductos: 10,
        productosCriticos: [],
        totalCriticos: 0,
      });

      const { container } = render(<AdminMongoKpis />);

      const valorCapital = await screen.findByText('$3.000.000');
      expect(valorCapital).toBeInTheDocument();
      expect(container.querySelector('#valor-unidades-totales')).toHaveTextContent('25');
      expect(container.querySelector('#valor-categorias-activas')).toHaveTextContent('4');
    });
  });

  describe('Accesibilidad (a11y)', () => {
    it('cumple con los estándares de accesibilidad sin violaciones automáticas', async () => {
      const { container } = render(<AdminMongoKpis productos={MOCK_PRODUCTOS} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
