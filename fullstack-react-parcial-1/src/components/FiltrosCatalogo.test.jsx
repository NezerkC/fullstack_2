import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltrosCatalogo from './FiltrosCatalogo';

describe('<FiltrosCatalogo />', () => {
  const defaultProps = {
    busqueda: '',
    onBusquedaChange: vi.fn(),
    categoriaSeleccionada: 'Todas',
    onCategoriaChange: vi.fn(),
    orden: 'relevancia',
    onOrdenChange: vi.fn(),
    totalResultados: 51,
  };

  it('renderiza el buscador, selector de orden y categorías', () => {
    render(<FiltrosCatalogo {...defaultProps} />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    expect(screen.getByText(/51 productos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Todas$/i })).toBeInTheDocument();
  });

  it('llama a onBusquedaChange al escribir en el input', () => {
    const onBusquedaChange = vi.fn();
    render(<FiltrosCatalogo {...defaultProps} onBusquedaChange={onBusquedaChange} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Fender' } });

    expect(onBusquedaChange).toHaveBeenCalledWith('Fender');
  });

  it('muestra el botón para limpiar la búsqueda y la restablece al hacer clic', () => {
    const onBusquedaChange = vi.fn();
    render(
      <FiltrosCatalogo
        {...defaultProps}
        busqueda="Gibson"
        onBusquedaChange={onBusquedaChange}
      />
    );

    const clearBtn = screen.getByLabelText(/Limpiar búsqueda/i);
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onBusquedaChange).toHaveBeenCalledWith('');
  });

  it('llama a onOrdenChange al cambiar el selector de orden', () => {
    const onOrdenChange = vi.fn();
    render(<FiltrosCatalogo {...defaultProps} onOrdenChange={onOrdenChange} />);

    const select = screen.getByTestId('sort-select');
    fireEvent.change(select, { target: { value: 'precio-asc' } });

    expect(onOrdenChange).toHaveBeenCalledWith('precio-asc');
  });

  it('llama a onCategoriaChange al hacer clic en un pill de categoría', () => {
    const onCategoriaChange = vi.fn();
    render(<FiltrosCatalogo {...defaultProps} onCategoriaChange={onCategoriaChange} />);

    const btnGuitarras = screen.getByTestId('chip-guitarras-acústicas');
    fireEvent.click(btnGuitarras);

    expect(onCategoriaChange).toHaveBeenCalledWith('Guitarras Acústicas');
  });
});
