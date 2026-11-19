import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminProductos from './AdminProductos';
import { CLAVE_INVENTARIO_STORAGE } from '../../data/productos';
import * as productoService from '../../services/productoService';

const INVENTARIO_PRUEBA = [
  {
    codigo: 'GA001',
    nombre: 'Guitarra Acústica Folk',
    marca: 'Yamaha',
    modelo: 'F310',
    categoria: 'Guitarras Acústicas',
    precio: 150000,
    stock: 10,
    stockCritico: 3,
    imagen: 'GA001.jpg',
  },
  {
    codigo: 'BA001',
    nombre: 'Bajo Eléctrico Jazz',
    marca: 'Fender',
    modelo: 'Jazz Bass',
    categoria: 'Bajos Eléctricos',
    precio: 600000,
    stock: 2,
    stockCritico: 3,
    imagen: 'BA001.jpg',
  },
];

function inventarioGuardado() {
  return JSON.parse(localStorage.getItem(CLAVE_INVENTARIO_STORAGE));
}

function renderAdmin() {
  return render(<AdminProductos />);
}

function escribir(container, id, valor) {
  fireEvent.change(container.querySelector(`#${id}`), { target: { value: valor } });
}

function completarFormulario(container, datos) {
  Object.entries(datos).forEach(([id, valor]) => escribir(container, id, valor));
}

describe('<AdminProductos /> (CRUD de inventario)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(INVENTARIO_PRUEBA));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lista los productos guardados en el inventario', () => {
    const { container } = renderAdmin();

    expect(container.querySelector('#fila-GA001')).toBeInTheDocument();
    expect(container.querySelector('#fila-BA001')).toBeInTheDocument();
    expect(screen.getByText(/2 productos/)).toBeInTheDocument();
  });

  it('crea un producto nuevo, lo muestra en la tabla y lo guarda en localStorage', () => {
    const { container } = renderAdmin();

    fireEvent.click(container.querySelector('#btn-nuevo-producto'));
    completarFormulario(container, {
      'input-codigo': 'TC010',
      'input-nombre': 'Teclado Digital 61 teclas',
      'select-categoria': 'Teclados y Pianos',
      'input-precio': '199990',
      'input-stock': '4',
    });
    fireEvent.click(container.querySelector('#btn-guardar-modal'));

    expect(container.querySelector('#fila-TC010')).toBeInTheDocument();
    expect(inventarioGuardado()).toHaveLength(3);
    expect(inventarioGuardado().find((p) => p.codigo === 'TC010').precio).toBe(199990);
  });

  it('edita un producto existente y actualiza sus datos', () => {
    const { container } = renderAdmin();

    fireEvent.click(container.querySelector('#btn-editar-GA001'));
    escribir(container, 'input-stock', '25');
    fireEvent.click(container.querySelector('#btn-guardar-modal'));

    expect(inventarioGuardado().find((p) => p.codigo === 'GA001').stock).toBe(25);
    expect(inventarioGuardado()).toHaveLength(2);
  });

  it('elimina un producto tras confirmar', () => {
    const { container } = renderAdmin();

    fireEvent.click(container.querySelector('#btn-eliminar-BA001'));
    fireEvent.click(container.querySelector('#btn-confirmar-eliminar'));

    expect(container.querySelector('#fila-BA001')).not.toBeInTheDocument();
    expect(inventarioGuardado().map((p) => p.codigo)).toEqual(['GA001']);
  });

  it('muestra errores y no guarda cuando el código es corto, el nombre muy largo o el precio negativo', () => {
    const { container } = renderAdmin();

    fireEvent.click(container.querySelector('#btn-nuevo-producto'));
    completarFormulario(container, {
      'input-codigo': 'A',
      'input-nombre': 'x'.repeat(101),
      'select-categoria': 'Accesorios',
      'input-precio': '-1',
      'input-stock': '1',
    });
    fireEvent.click(container.querySelector('#btn-guardar-modal'));

    const modal = within(container.querySelector('#modal-producto-overlay'));
    expect(modal.getByText('Mínimo 3 caracteres')).toBeInTheDocument();
    expect(modal.getByText('Máximo 100 caracteres')).toBeInTheDocument();
    expect(modal.getByText('Precio inválido')).toBeInTheDocument();
    expect(inventarioGuardado()).toHaveLength(2);
  });

  it('acepta un producto con precio 0', () => {
    const { container } = renderAdmin();

    fireEvent.click(container.querySelector('#btn-nuevo-producto'));
    completarFormulario(container, {
      'input-codigo': 'AC099',
      'input-nombre': 'Púa de regalo',
      'select-categoria': 'Accesorios',
      'input-precio': '0',
      'input-stock': '100',
    });
    fireEvent.click(container.querySelector('#btn-guardar-modal'));

    expect(container.querySelector('#fila-AC099')).toBeInTheDocument();
  });

  it('renderiza AdminMongoKpis con métricas locales ($ 2.700.000) y MongoQueryBar (filtra por búsqueda y estado)', () => {
    const { container } = renderAdmin();

    // AdminMongoKpis debe calcular: 150000*10 + 600000*2 = 1500000 + 1200000 = 2700000
    expect(screen.getByText('$ 2.700.000')).toBeInTheDocument();

    // MongoQueryBar: Buscar por nombre
    const inputBusqueda = screen.getByLabelText(/buscar en colección productos/i);
    fireEvent.change(inputBusqueda, { target: { value: 'Bajo' } });

    expect(container.querySelector('#fila-BA001')).toBeInTheDocument();
    expect(container.querySelector('#fila-GA001')).not.toBeInTheDocument();

    // Limpiar búsqueda y filtrar por estado AGOTADO (ninguno debe aparecer pues ambos tienen stock > 0)
    fireEvent.change(inputBusqueda, { target: { value: '' } });
    const selectEstado = screen.getByLabelText(/estado/i);
    fireEvent.change(selectEstado, { target: { value: 'AGOTADO' } });

    expect(container.querySelector('#fila-GA001')).not.toBeInTheDocument();
    expect(container.querySelector('#fila-BA001')).not.toBeInTheDocument();
  });

  it('clic en btn-stock-inc-GA001 y btn-stock-dec-GA001 actualiza stock reactivamente y llama a ajustarStock', () => {
    const spyAjustar = vi.spyOn(productoService, 'ajustarStock').mockResolvedValue({});
    const { container } = renderAdmin();

    const btnInc = screen.getByTestId('btn-stock-inc-GA001');
    const btnDec = screen.getByTestId('btn-stock-dec-GA001');

    fireEvent.click(btnInc);

    expect(inventarioGuardado().find((p) => p.codigo === 'GA001').stock).toBe(11);
    expect(container.querySelector('#fila-GA001')).toHaveTextContent('11');
    expect(spyAjustar).toHaveBeenCalledWith(
      'GA001',
      1,
      'INGRESO_PROVEEDOR',
      undefined
    );

    fireEvent.click(btnDec);
    expect(inventarioGuardado().find((p) => p.codigo === 'GA001').stock).toBe(10);
    expect(container.querySelector('#fila-GA001')).toHaveTextContent('10');
    expect(spyAjustar).toHaveBeenCalledWith(
      'GA001',
      -1,
      'VENTA_DIRECTA_MOSTRADOR',
      undefined
    );
  });

  it('clic en btn-inspeccionar-GA001 abre BsonDocumentDrawer y agregar reseña invoca productoService.agregarResena', () => {
    const spyResena = vi.spyOn(productoService, 'agregarResena').mockResolvedValue({});
    renderAdmin();

    const btnInspeccionar = screen.getByTestId('btn-inspeccionar-GA001');
    fireEvent.click(btnInspeccionar);

    const dialog = screen.getByRole('dialog', { name: /inspector de documento bson/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('GA001');

    // Agregar reseña
    const inputCliente = screen.getByLabelText(/nombre del cliente/i);
    const selectCalif = screen.getByLabelText(/calificación/i);
    const inputComentario = screen.getByLabelText(/comentario/i);
    const btnAgregar = screen.getByRole('button', { name: /agregar reseña/i });

    fireEvent.change(inputCliente, { target: { value: 'Laura M.' } });
    fireEvent.change(selectCalif, { target: { value: '5' } });
    fireEvent.change(inputComentario, { target: { value: 'Excelente guitarra acústica.' } });
    fireEvent.click(btnAgregar);

    expect(spyResena).toHaveBeenCalledWith(
      'GA001',
      {
        cliente: 'Laura M.',
        calificacion: 5,
        comentario: 'Excelente guitarra acústica.',
      },
      undefined
    );

    const prodActualizado = inventarioGuardado().find((p) => p.codigo === 'GA001');
    expect(prodActualizado.resenas).toHaveLength(1);
    expect(prodActualizado.resenas[0].cliente).toBe('Laura M.');
  });
});
