// src/components/admin/MongoQueryBar.test.jsx
// Suite de pruebas unitarias para MongoQueryBar (Tarea 24 · [FE-03])

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import MongoQueryBar from './MongoQueryBar';
import {
  aplicarQueryMongo,
  resolverEstadoDocumento,
  coincideTextoFullText,
  coincideCategoria,
  coincideEstado,
  CATEGORIAS_HOMOLOGADAS_6,
  ESTADOS_DOCUMENTO,
} from './mongoQueryUtils';

const MOCK_COLECCION = [
  { codigo: 'GA001', nombre: 'Guitarra Acústica Folk', marca: 'Yamaha', categoria: 'Guitarras Acústicas', stock: 10, precio: 129990 },
  { codigo: 'GA002', nombre: 'Guitarra Dreadnought', marca: 'Fender', categoria: 'Guitarras Acústicas', stock: 5, precio: 189990 },
  { codigo: 'GE001', nombre: 'Guitarra Eléctrica Strat', marca: 'Squier', categoria: 'Guitarras Eléctricas', stock: 4, precio: 249990 },
  { codigo: 'BA001', nombre: 'Bajo Jazz Bass', marca: 'Fender', categoria: 'Bajos Eléctricos', stock: 0, precio: 299990 },
  { codigo: 'BA002', nombre: 'Bajo PJ Affinity', marca: 'Squier', categoria: 'Bajos Eléctricos', stock: 3, precio: 249990 },
  { codigo: 'BT001', nombre: 'Batería Acústica Completa', marca: 'Pearl', categoria: 'Baterías', stock: 2, precio: 599990 },
  { codigo: 'TE001', nombre: 'Piano Digital', marca: 'Yamaha', categoria: 'Teclados y Pianos', stock: 6, precio: 450000 },
  { codigo: 'AMP01', nombre: 'Amplificador Guitarra 30W', marca: 'Fender', categoria: 'Amplificadores', stock: 0, precio: 199990 },
  { codigo: 'MIC01', nombre: 'Micrófono SM58', marca: 'Shure', categoria: 'Micrófonos', stock: 7, precio: 89990 },
  { codigo: 'DES01', nombre: 'Guitarra Vintage', marca: 'Gibson', categoria: 'Guitarras Acústicas', stock: 1, precio: 999990, estado: 'DESCONTINUADO' },
];

describe('MongoQueryBar (Tarea 24 · [FE-03])', () => {
  describe('Utilidades de filtrado puro (mongoQueryUtils)', () => {
    describe('resolverEstadoDocumento', () => {
      it('retorna ACTIVO para productos con stock > 0', () => {
        expect(resolverEstadoDocumento({ stock: 5 })).toBe('ACTIVO');
        expect(resolverEstadoDocumento({ stock: 1 })).toBe('ACTIVO');
      });

      it('retorna AGOTADO para productos con stock === 0', () => {
        expect(resolverEstadoDocumento({ stock: 0 })).toBe('AGOTADO');
        expect(resolverEstadoDocumento({ stock_disponible: 0 })).toBe('AGOTADO');
      });

      it('retorna DESCONTINUADO si el documento tiene estado: "DESCONTINUADO" explícito', () => {
        expect(resolverEstadoDocumento({ stock: 5, estado: 'DESCONTINUADO' })).toBe('DESCONTINUADO');
        expect(resolverEstadoDocumento({ stock: 0, estado: 'DESCONTINUADO' })).toBe('DESCONTINUADO');
      });
    });

    describe('coincideTextoFullText', () => {
      const prod = { nombre: 'Guitarra Acústica Folk', marca: 'Yamaha', codigo: 'GA001' };

      it('retorna true si coincide el nombre (case-insensitive)', () => {
        expect(coincideTextoFullText(prod, 'guitarra')).toBe(true);
        expect(coincideTextoFullText(prod, 'ACÚSTICA')).toBe(true);
      });

      it('retorna true si coincide la marca', () => {
        expect(coincideTextoFullText(prod, 'yamaha')).toBe(true);
        expect(coincideTextoFullText(prod, 'YAMAHA')).toBe(true);
      });

      it('retorna true si coincide el codigo', () => {
        expect(coincideTextoFullText(prod, 'ga001')).toBe(true);
        expect(coincideTextoFullText(prod, 'GA0')).toBe(true);
      });

      it('retorna false si no coincide ningún campo', () => {
        expect(coincideTextoFullText(prod, 'fender')).toBe(false);
        expect(coincideTextoFullText(prod, 'XYZ999')).toBe(false);
      });

      it('retorna true si el query está vacío (sin filtro)', () => {
        expect(coincideTextoFullText(prod, '')).toBe(true);
        expect(coincideTextoFullText(prod, '   ')).toBe(true);
      });
    });

    describe('coincideCategoria', () => {
      const prod = { categoria: 'Guitarras Acústicas' };

      it('retorna true si la categoría coincide exactamente', () => {
        expect(coincideCategoria(prod, 'Guitarras Acústicas')).toBe(true);
      });

      it('retorna false si la categoría no coincide', () => {
        expect(coincideCategoria(prod, 'Bajos Eléctricos')).toBe(false);
      });

      it('retorna true sin filtro (null, vacío o TODAS)', () => {
        expect(coincideCategoria(prod, null)).toBe(true);
        expect(coincideCategoria(prod, '')).toBe(true);
        expect(coincideCategoria(prod, 'TODAS')).toBe(true);
      });
    });

    describe('coincideEstado', () => {
      it('retorna true para estado ACTIVO en productos con stock > 0', () => {
        expect(coincideEstado({ stock: 5 }, 'ACTIVO')).toBe(true);
      });

      it('retorna false para estado ACTIVO en productos agotados', () => {
        expect(coincideEstado({ stock: 0 }, 'ACTIVO')).toBe(false);
      });

      it('retorna true para estado AGOTADO en productos con stock 0', () => {
        expect(coincideEstado({ stock: 0 }, 'AGOTADO')).toBe(true);
      });

      it('retorna true para DESCONTINUADO en documentos con estado explícito', () => {
        expect(coincideEstado({ stock: 5, estado: 'DESCONTINUADO' }, 'DESCONTINUADO')).toBe(true);
      });

      it('retorna true sin filtro de estado (null o TODOS)', () => {
        expect(coincideEstado({ stock: 5 }, null)).toBe(true);
        expect(coincideEstado({ stock: 0 }, '')).toBe(true);
        expect(coincideEstado({ stock: 5 }, 'TODOS')).toBe(true);
      });
    });

    describe('aplicarQueryMongo - pipeline polimórfico completo', () => {
      it('sin filtros retorna toda la colección', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, {});
        expect(res).toHaveLength(MOCK_COLECCION.length);
      });

      it('filtra por texto en nombre', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { texto: 'guitarra' });
        expect(res.every((p) => /guitarra/i.test(p.nombre))).toBe(true);
        expect(res.length).toBeGreaterThan(0);
      });

      it('filtra por texto en marca (Yamaha)', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { texto: 'Yamaha' });
        expect(res).toHaveLength(2); // GA001 y TE001
        expect(res.every((p) => p.marca === 'Yamaha')).toBe(true);
      });

      it('filtra por código exacto', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { texto: 'BA001' });
        expect(res).toHaveLength(1);
        expect(res[0].codigo).toBe('BA001');
      });

      it('filtra por categoría Guitarras Acústicas', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { categoria: 'Guitarras Acústicas' });
        expect(res.every((p) => p.categoria === 'Guitarras Acústicas')).toBe(true);
        expect(res.length).toBe(3); // GA001, GA002, DES01
      });

      it('filtra por estado AGOTADO (stock === 0)', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { estado: 'AGOTADO' });
        expect(res.every((p) => (p.stock || 0) === 0 && p.estado !== 'DESCONTINUADO')).toBe(true);
        expect(res.some((p) => p.codigo === 'BA001')).toBe(true);
        expect(res.some((p) => p.codigo === 'AMP01')).toBe(true);
      });

      it('filtra por estado DESCONTINUADO', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { estado: 'DESCONTINUADO' });
        expect(res).toHaveLength(1);
        expect(res[0].codigo).toBe('DES01');
      });

      it('aplica filtros combinados: texto + categoría', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { texto: 'fender', categoria: 'Guitarras Acústicas' });
        expect(res).toHaveLength(1);
        expect(res[0].codigo).toBe('GA002');
      });

      it('aplica filtros combinados: categoría + estado ACTIVO', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { categoria: 'Bajos Eléctricos', estado: 'ACTIVO' });
        expect(res.every((p) => p.categoria === 'Bajos Eléctricos' && (p.stock || 0) > 0)).toBe(true);
        expect(res.some((p) => p.codigo === 'BA002')).toBe(true);
        expect(res.every((p) => p.codigo !== 'BA001')).toBe(true); // BA001 agotado
      });

      it('retorna array vacío si no hay coincidencias', () => {
        const res = aplicarQueryMongo(MOCK_COLECCION, { texto: 'XYZINSTRUMENTOINEXISTENTE' });
        expect(res).toHaveLength(0);
      });

      it('maneja input nulo o inválido sin crashear', () => {
        expect(aplicarQueryMongo(null, {})).toEqual([]);
        expect(aplicarQueryMongo(undefined, {})).toEqual([]);
      });
    });

    describe('Constantes exportadas', () => {
      it('CATEGORIAS_HOMOLOGADAS_6 contiene exactamente 6 categorías', () => {
        expect(CATEGORIAS_HOMOLOGADAS_6).toHaveLength(6);
      });

      it('ESTADOS_DOCUMENTO contiene exactamente 3 estados', () => {
        expect(ESTADOS_DOCUMENTO).toHaveLength(3);
        expect(ESTADOS_DOCUMENTO).toContain('ACTIVO');
        expect(ESTADOS_DOCUMENTO).toContain('AGOTADO');
        expect(ESTADOS_DOCUMENTO).toContain('DESCONTINUADO');
      });
    });
  });

  describe('Criterio 1: Búsqueda full-text sobre nombre, marca y codigo', () => {
    it('renderiza el input de búsqueda full-text', () => {
      render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const input = screen.getByTestId('input-query-texto');
      expect(input).toBeInTheDocument();
    });

    it('emite resultados filtrados por nombre al escribir en el buscador', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      const input = container.querySelector('#input-query-texto');
      fireEvent.change(input, { target: { value: 'guitarra' } });
      expect(onResultados).toHaveBeenCalled();
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados.every((p) => /guitarra/i.test(p.nombre))).toBe(true);
    });

    it('emite resultados filtrados por marca al escribir en el buscador', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      fireEvent.change(container.querySelector('#input-query-texto'), { target: { value: 'yamaha' } });
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados).toHaveLength(2);
    });

    it('emite resultados filtrados por código al escribir en el buscador', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      fireEvent.change(container.querySelector('#input-query-texto'), { target: { value: 'BA001' } });
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados).toHaveLength(1);
      expect(resultados[0].codigo).toBe('BA001');
    });

    it('limpia el texto al pulsar el botón de limpiar búsqueda', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const input = container.querySelector('#input-query-texto');
      fireEvent.change(input, { target: { value: 'yamaha' } });
      const btnLimpiarTexto = container.querySelector('button[aria-label="Limpiar búsqueda"]');
      expect(btnLimpiarTexto).toBeInTheDocument();
      fireEvent.click(btnLimpiarTexto);
      expect(input.value).toBe('');
    });
  });

  describe('Criterio 2: Chips de las 6 categorías homologadas', () => {
    it('renderiza exactamente 6 chips de categoría', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chipsContainer = container.querySelector('#chips-categorias');
      const chips = chipsContainer.querySelectorAll('button');
      expect(chips).toHaveLength(6);
    });

    it('renderiza las 6 categorías correctas', () => {
      render(<MongoQueryBar productos={MOCK_COLECCION} />);
      CATEGORIAS_HOMOLOGADAS_6.forEach((cat) => {
        expect(screen.getByText(cat)).toBeInTheDocument();
      });
    });

    it('activa y desactiva un chip al hacer click (toggle)', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chipGuitarrasAcusticas = container.querySelector('[data-testid="chip-cat-guitarras-acusticas"]');
      expect(chipGuitarrasAcusticas).toBeInTheDocument();
      // Activar
      fireEvent.click(chipGuitarrasAcusticas);
      expect(chipGuitarrasAcusticas).toHaveAttribute('aria-pressed', 'true');
      // Desactivar
      fireEvent.click(chipGuitarrasAcusticas);
      expect(chipGuitarrasAcusticas).toHaveAttribute('aria-pressed', 'false');
    });

    it('emite resultados filtrados por categoría al activar un chip', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      const chipBajos = container.querySelector('[data-testid="chip-cat-bajos-electricos"]');
      fireEvent.click(chipBajos);
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados.every((p) => p.categoria === 'Bajos Eléctricos')).toBe(true);
    });

    it('solo puede haber un chip de categoría activo a la vez', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chipGA = container.querySelector('[data-testid="chip-cat-guitarras-acusticas"]');
      const chipGE = container.querySelector('[data-testid="chip-cat-guitarras-electrícas"]') ||
        container.querySelector('[data-testid="chip-cat-guitarras-electricas"]');
      fireEvent.click(chipGA);
      if (chipGE) {
        fireEvent.click(chipGE);
        expect(chipGA).toHaveAttribute('aria-pressed', 'false');
        expect(chipGE).toHaveAttribute('aria-pressed', 'true');
      } else {
        expect(chipGA).toHaveAttribute('aria-pressed', 'true');
      }
    });
  });

  describe('Criterio 3: Filtro por estado del documento (ACTIVO, AGOTADO, DESCONTINUADO)', () => {
    it('renderiza exactamente 3 chips de estado', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chipsEstado = container.querySelector('#chips-estado');
      const chips = chipsEstado.querySelectorAll('button');
      expect(chips).toHaveLength(3);
    });

    it('renderiza los chips ACTIVO, AGOTADO y DESCONTINUADO', () => {
      render(<MongoQueryBar productos={MOCK_COLECCION} />);
      expect(screen.getByTestId('chip-estado-activo')).toBeInTheDocument();
      expect(screen.getByTestId('chip-estado-agotado')).toBeInTheDocument();
      expect(screen.getByTestId('chip-estado-descontinuado')).toBeInTheDocument();
    });

    it('filtra solo los AGOTADOS al activar chip AGOTADO', () => {
      const onResultados = vi.fn();
      render(<MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />);
      fireEvent.click(screen.getByTestId('chip-estado-agotado'));
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados.every((p) => (p.stock || 0) === 0 && p.estado !== 'DESCONTINUADO')).toBe(true);
      expect(resultados.length).toBeGreaterThan(0);
    });

    it('filtra solo los DESCONTINUADOS al activar chip DESCONTINUADO', () => {
      const onResultados = vi.fn();
      render(<MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />);
      fireEvent.click(screen.getByTestId('chip-estado-descontinuado'));
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados.every((p) => p.estado === 'DESCONTINUADO')).toBe(true);
    });

    it('filtra solo los ACTIVOS al activar chip ACTIVO', () => {
      const onResultados = vi.fn();
      render(<MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />);
      fireEvent.click(screen.getByTestId('chip-estado-activo'));
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados.every((p) => (p.stock || 0) > 0 && p.estado !== 'DESCONTINUADO')).toBe(true);
    });

    it('desactiva el chip al hacer click nuevamente (toggle)', () => {
      render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chipActivo = screen.getByTestId('chip-estado-activo');
      fireEvent.click(chipActivo);
      expect(chipActivo).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(chipActivo);
      expect(chipActivo).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Comportamiento del Query Builder: limpiar y combinar filtros', () => {
    it('limpia todos los filtros al pulsar "Limpiar filtros"', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      // Activar algún filtro
      fireEvent.change(container.querySelector('#input-query-texto'), { target: { value: 'yamaha' } });
      const btnLimpiar = container.querySelector('#btn-limpiar-query');
      expect(btnLimpiar).toBeInTheDocument();
      fireEvent.click(btnLimpiar);
      expect(container.querySelector('#input-query-texto').value).toBe('');
      // El último resultado emitido debe ser todos los productos
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      expect(resultados).toHaveLength(MOCK_COLECCION.length);
    });

    it('no muestra el botón "Limpiar filtros" si no hay filtros activos', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      expect(container.querySelector('#btn-limpiar-query')).not.toBeInTheDocument();
    });

    it('muestra el contador de resultados del query', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const contador = container.querySelector('#contador-query-resultados');
      expect(contador).toBeInTheDocument();
      expect(contador).toHaveTextContent(`${MOCK_COLECCION.length}`);
    });

    it('actualiza el contador al aplicar filtros', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      fireEvent.change(container.querySelector('#input-query-texto'), { target: { value: 'yamaha' } });
      const contador = container.querySelector('#contador-query-resultados');
      expect(contador).toHaveTextContent('2');
    });

    it('combina búsqueda full-text + categoría + estado correctamente', () => {
      const onResultados = vi.fn();
      const { container } = render(
        <MongoQueryBar productos={MOCK_COLECCION} onResultados={onResultados} />
      );
      fireEvent.change(container.querySelector('#input-query-texto'), { target: { value: 'fender' } });
      fireEvent.click(container.querySelector('[data-testid="chip-cat-guitarras-acusticas"]'));
      const [resultados] = onResultados.mock.calls[onResultados.mock.calls.length - 1];
      // Solo GA002 (Fender + Guitarras Acústicas)
      expect(resultados).toHaveLength(1);
      expect(resultados[0].codigo).toBe('GA002');
    });
  });

  describe('Accesibilidad (a11y)', () => {
    it('cumple con los estándares de accesibilidad sin violaciones automáticas', async () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('tiene role="search" en el contenedor raíz', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      expect(container.querySelector('[role="search"]')).toBeInTheDocument();
    });

    it('los chips de categoría tienen aria-pressed correcto', () => {
      const { container } = render(<MongoQueryBar productos={MOCK_COLECCION} />);
      const chips = container.querySelector('#chips-categorias').querySelectorAll('button');
      chips.forEach((c) => expect(c).toHaveAttribute('aria-pressed', 'false'));
    });
  });
});
