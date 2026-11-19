import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import AdminMongoKpis from './AdminMongoKpis';

const METRICAS_MOCK = {
  capitalBodega: 1234567,
  unidadesTotales: 145,
  totalProductos: 32,
  totalCategorias: 8,
  productosCriticos: 3,
};

describe('<AdminMongoKpis />', () => {
  it('muestra indicador y texto de carga cuando cargando={true}', () => {
    render(<AdminMongoKpis metricas={null} cargando={true} error={null} />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/cargando/i);
  });

  it('muestra mensaje de error cuando error está presente y permite reintentar', () => {
    const onReintentar = vi.fn();
    render(
      <AdminMongoKpis
        metricas={null}
        cargando={false}
        error="No se pudo conectar con MongoDB"
        onReintentar={onReintentar}
      />
    );

    const alerta = screen.getByRole('alert');
    expect(alerta).toBeInTheDocument();
    expect(alerta).toHaveTextContent('No se pudo conectar con MongoDB');

    const botonReintentar = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(botonReintentar);
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it('renderiza las 4 cards de métricas con capital formateado en CLP cuando se pasan metricas', () => {
    render(<AdminMongoKpis metricas={METRICAS_MOCK} cargando={false} error={null} />);

    expect(screen.getByText(/capital en bodega/i)).toBeInTheDocument();
    expect(screen.getByText('$ 1.234.567')).toBeInTheDocument();

    expect(screen.getByText(/unidades totales/i)).toBeInTheDocument();
    expect(screen.getByText('145')).toBeInTheDocument();

    expect(screen.getByText(/total productos/i)).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText(/8 categorías/i)).toBeInTheDocument();

    expect(screen.getByText(/stock crítico/i)).toBeInTheDocument();
  });

  it('muestra badge o alerta destacada de stock crítico cuando metricas.productosCriticos > 0', async () => {
    const { container, rerender } = render(
      <AdminMongoKpis metricas={METRICAS_MOCK} cargando={false} error={null} />
    );

    const badgeAlerta = screen.getByTestId('badge-stock-critico');
    expect(badgeAlerta).toBeInTheDocument();
    expect(badgeAlerta).toHaveTextContent(/alerta/i);
    expect(badgeAlerta).toHaveTextContent('3');

    const resultadosA11y = await axe(container);
    expect(resultadosA11y).toHaveNoViolations();

    rerender(
      <AdminMongoKpis
        metricas={{ ...METRICAS_MOCK, productosCriticos: 0 }}
        cargando={false}
        error={null}
      />
    );

    expect(screen.queryByTestId('badge-stock-critico')).not.toBeInTheDocument();
    expect(screen.getByText(/stock saludable/i)).toBeInTheDocument();
  });
});
