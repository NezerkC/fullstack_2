import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import MongoQueryBar, {
  CATEGORIAS_HOMOLOGADAS,
  ESTADOS_DOCUMENTO,
} from './MongoQueryBar';

describe('<MongoQueryBar />', () => {
  it('renderiza input de búsqueda, las 6 categorías homologadas como chips + chip Todas, y selector con estados de documento', () => {
    render(
      <MongoQueryBar
        busqueda=""
        categoriaSeleccionada=""
        estadoSeleccionado=""
        totalResultados={42}
      />
    );

    // 1. Buscador full-text accesible
    const inputBusqueda = screen.getByLabelText(/buscar en colección productos/i);
    expect(inputBusqueda).toBeInTheDocument();
    expect(inputBusqueda).toHaveAttribute('type', 'search');
    expect(inputBusqueda).toHaveAttribute(
      'placeholder',
      'Buscar por nombre, marca o código...'
    );

    // 2. Chips de categoría
    const chipTodas = screen.getByRole('button', { name: /^todas$/i });
    expect(chipTodas).toBeInTheDocument();
    expect(chipTodas).toHaveAttribute('aria-pressed', 'true');

    CATEGORIAS_HOMOLOGADAS.forEach((cat) => {
      const chipCat = screen.getByRole('button', { name: new RegExp(`^${cat}$`, 'i') });
      expect(chipCat).toBeInTheDocument();
      expect(chipCat).toHaveAttribute('aria-pressed', 'false');
    });

    // 3. Selector de estado de documento
    const selectEstado = screen.getByLabelText(/estado/i);
    expect(selectEstado).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /todos los estados/i })).toBeInTheDocument();

    ESTADOS_DOCUMENTO.forEach((estado) => {
      expect(screen.getByRole('option', { name: estado })).toBeInTheDocument();
    });
  });

  it('escribir en el buscador llama a onBusquedaChange; hacer clic en un chip llama a onCategoriaChange; cambiar el select llama a onEstadoChange', () => {
    const onBusquedaChange = vi.fn();
    const onCategoriaChange = vi.fn();
    const onEstadoChange = vi.fn();

    render(
      <MongoQueryBar
        busqueda=""
        categoriaSeleccionada=""
        estadoSeleccionado=""
        onBusquedaChange={onBusquedaChange}
        onCategoriaChange={onCategoriaChange}
        onEstadoChange={onEstadoChange}
      />
    );

    // Buscador
    const inputBusqueda = screen.getByLabelText(/buscar en colección productos/i);
    fireEvent.change(inputBusqueda, { target: { value: 'Fender' } });
    expect(onBusquedaChange).toHaveBeenCalledWith('Fender');

    // Chip de categoría
    const chipCuerdas = screen.getByRole('button', { name: /^cuerdas$/i });
    fireEvent.click(chipCuerdas);
    expect(onCategoriaChange).toHaveBeenCalledWith('Cuerdas');

    // Selector de estado
    const selectEstado = screen.getByLabelText(/estado/i);
    fireEvent.change(selectEstado, { target: { value: 'AGOTADO' } });
    expect(onEstadoChange).toHaveBeenCalledWith('AGOTADO');
  });

  it('muestra contador totalResultados y botón "Limpiar filtros" ejecuta onLimpiar', () => {
    const onLimpiar = vi.fn();

    const { rerender } = render(
      <MongoQueryBar
        busqueda="Guitarra"
        categoriaSeleccionada="Cuerdas"
        estadoSeleccionado="ACTIVO"
        totalResultados={12}
        onLimpiar={onLimpiar}
      />
    );

    expect(screen.getByText(/12 documentos/i)).toBeInTheDocument();

    const botonLimpiar = screen.getByRole('button', { name: /limpiar filtros/i });
    expect(botonLimpiar).toBeInTheDocument();
    expect(botonLimpiar).toBeEnabled();

    fireEvent.click(botonLimpiar);
    expect(onLimpiar).toHaveBeenCalledTimes(1);

    // Rerender sin filtros activos: botón debe estar deshabilitado o no visible
    rerender(
      <MongoQueryBar
        busqueda=""
        categoriaSeleccionada=""
        estadoSeleccionado=""
        totalResultados={0}
        onLimpiar={onLimpiar}
      />
    );

    const botonLimpiarInactivo = screen.queryByRole('button', { name: /limpiar filtros/i });
    if (botonLimpiarInactivo) {
      expect(botonLimpiarInactivo).toBeDisabled();
    }
  });

  it('pasa auditoría de accesibilidad axe sin violaciones', async () => {
    const { container } = render(
      <MongoQueryBar
        busqueda="cable"
        categoriaSeleccionada="Accesorios"
        estadoSeleccionado="ACTIVO"
        totalResultados={5}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
