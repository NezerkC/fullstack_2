import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CartProvider } from '../context/CartContext';
import Productos from './Productos';
import { obtenerProductosPublicos } from '../services/productoService';
import { PRODUCTOS_SONIDO_VIVO } from '../data/productos';

vi.mock('../services/productoService', async () => {
  const actual = await vi.importActual('../services/productoService');
  return {
    ...actual,
    obtenerProductosPublicos: vi.fn(),
  };
});

function renderConProviders(ui) {
  return render(
    <BrowserRouter>
      <CartProvider>{ui}</CartProvider>
    </BrowserRouter>
  );
}

describe('<Productos /> (Página de Catálogo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerProductosPublicos.mockResolvedValue(PRODUCTOS_SONIDO_VIVO);
  });

  it('renderiza el título, buscador y la grilla inicial de productos', async () => {
    renderConProviders(<Productos debounceMs={0} />);

    expect(
      screen.getByRole('heading', { name: /catálogo de instrumentos y audio/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('chip-todas')).toBeInTheDocument();
    expect(screen.getByTestId('products-grid')).toBeInTheDocument();
    await waitFor(() => expect(obtenerProductosPublicos).toHaveBeenCalled());
  });

  it('actualiza el catálogo y genera categorías dinámicas a partir de obtenerProductosPublicos', async () => {
    const catalogoRemoto = [
      {
        codigo: 'CUST01',
        nombre: 'Sintetizador Modular Pro',
        categoria: 'Sintetizadores Exclusivos',
        marca: 'Moog',
        modelo: 'Sub37',
        precio: 1500000,
        stock: 2,
        descripcion: 'Analógico puro',
      },
      {
        codigo: 'CUST02',
        nombre: 'Caja de Ritmos Vintage',
        categoria: 'Percusión Electrónica',
        marca: 'Roland',
        modelo: 'TR-808',
        precio: 900000,
        stock: 1,
        descripcion: 'Ritmos clásicos',
      },
    ];
    obtenerProductosPublicos.mockResolvedValueOnce(catalogoRemoto);

    renderConProviders(<Productos debounceMs={0} />);

    await waitFor(() => {
      expect(screen.getByTestId('chip-sintetizadores-exclusivos')).toBeInTheDocument();
      expect(screen.getByTestId('chip-percusión-electrónica')).toBeInTheDocument();
      expect(screen.getByText('Sintetizador Modular Pro')).toBeInTheDocument();
    });
  });

  it('filtra productos por texto ingresado con debounce', async () => {
    const user = userEvent.setup();
    renderConProviders(<Productos debounceMs={50} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'Yamaha');

    expect(input).toHaveValue('Yamaha');

    await waitFor(() => {
      const productos = screen.getAllByRole('article');
      expect(productos.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Yamaha/i).length).toBeGreaterThan(0);
    });
  });

  it('filtra por chip de categoría al hacer clic', async () => {
    const user = userEvent.setup();
    renderConProviders(<Productos debounceMs={0} />);

    const chipGuitarras = await screen.findByTestId('chip-guitarras-acústicas');
    await user.click(chipGuitarras);

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('muestra mensaje amigable cuando no hay resultados coincidentes', async () => {
    const user = userEvent.setup();
    renderConProviders(<Productos debounceMs={10} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'termino_inexistente_xyz_123');

    await waitFor(() => {
      expect(screen.getByTestId('no-products-message')).toBeInTheDocument();
      expect(
        screen.getByText(/no encontramos instrumentos para tu búsqueda/i)
      ).toBeInTheDocument();
    });
  });

  it('permite interactuar con el botón Añadir al Carro en las tarjetas', async () => {
    const user = userEvent.setup();
    renderConProviders(<Productos debounceMs={0} />);

    const botonesAgregar = await screen.findAllByRole('button', { name: /añadir al carro/i });
    expect(botonesAgregar.length).toBeGreaterThan(0);

    await user.click(botonesAgregar[0]);
  });
});
