import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'jest-axe';
import BsonDocumentDrawer from './BsonDocumentDrawer';

const PRODUCTO_MOCK = {
  _id: '6543210987abcdef01234567',
  codigo: 'PROD-BSON-01',
  nombre: 'Taza Cerámica Artesanal',
  precio_clp: 8990,
  tags: ['artesanal', 'cocina', 'destacado'],
  especificaciones: {
    material: 'Gres cerámico',
    capacidad: '350ml',
    aptoMicroondas: 'Sí',
  },
  resenas: [
    {
      cliente: 'Valeria Solar',
      calificacion: 5,
      fecha: '2026-03-15',
      comentario: 'Excelente terminación y peso.',
    },
    {
      cliente: 'Carlos Pérez',
      calificacion: 4,
      fecha: '2026-03-20',
      comentario: 'Muy bonita aunque el color varía ligeramente.',
    },
  ],
};

describe('<BsonDocumentDrawer />', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no renderiza diálogo cuando abierto={false} o producto={null}', () => {
    const { container: c1 } = render(
      <BsonDocumentDrawer abierto={false} producto={PRODUCTO_MOCK} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      <BsonDocumentDrawer abierto={true} producto={null} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(c2).toBeEmptyDOMElement();
  });

  it('renderiza diálogo, JSON BSON (_id, codigo, precio_clp), tags y especificaciones dinámicas cuando abierto={true}', () => {
    render(<BsonDocumentDrawer abierto={true} producto={PRODUCTO_MOCK} />);

    const dialog = screen.getByRole('dialog', { name: /inspector de documento bson/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    expect(screen.getByText('PROD-BSON-01')).toBeInTheDocument();
    expect(screen.getByText('Taza Cerámica Artesanal')).toBeInTheDocument();

    expect(screen.getByText('artesanal')).toBeInTheDocument();
    expect(screen.getByText('cocina')).toBeInTheDocument();
    expect(screen.getByText('destacado')).toBeInTheDocument();

    const preViewer = screen.getByTestId('bson-json-viewer');
    expect(preViewer).toBeInTheDocument();
    expect(preViewer.textContent).toContain('"_id": "6543210987abcdef01234567"');
    expect(preViewer.textContent).toContain('"codigo": "PROD-BSON-01"');
    expect(preViewer.textContent).toContain('"precio_clp": 8990');

    expect(screen.getByText(/especificaciones polimórficas/i)).toBeInTheDocument();
    expect(screen.getByText('material')).toBeInTheDocument();
    expect(screen.getByText('Gres cerámico')).toBeInTheDocument();
    expect(screen.getByText('capacidad')).toBeInTheDocument();
    expect(screen.getByText('350ml')).toBeInTheDocument();
  });

  it('botón "Copiar BSON" invoca navigator.clipboard.writeText con el JSON formateado y muestra confirmación /copiado/i', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<BsonDocumentDrawer abierto={true} producto={PRODUCTO_MOCK} />);

    const copyBtn = screen.getByRole('button', { name: /copiar bson/i });
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(PRODUCTO_MOCK, null, 2));

    expect(await screen.findByText(/copiado/i)).toBeInTheDocument();
  });

  it('renderiza timeline de resenas[] existentes, estado vacío cuando no hay reseñas, y envía onAgregarResena si se provee', () => {
    const onAgregarResena = vi.fn();

    const { rerender } = render(
      <BsonDocumentDrawer
        abierto={true}
        producto={PRODUCTO_MOCK}
        onAgregarResena={onAgregarResena}
      />
    );

    expect(screen.getByText(/reseñas embebidas \(\$push\)/i)).toBeInTheDocument();
    expect(screen.getByText('Valeria Solar')).toBeInTheDocument();
    expect(screen.getByText('Excelente terminación y peso.')).toBeInTheDocument();
    expect(screen.getByText(/5\/5/)).toBeInTheDocument();
    expect(screen.getByText('Carlos Pérez')).toBeInTheDocument();

    // Formulario de reseña accesible
    const clienteInput = screen.getByLabelText(/nombre del cliente/i);
    const calificacionInput = screen.getByLabelText(/calificación/i);
    const comentarioInput = screen.getByLabelText(/comentario/i);
    const agregarBtn = screen.getByRole('button', { name: /agregar reseña/i });

    fireEvent.change(clienteInput, { target: { value: 'Daniela Montes' } });
    fireEvent.change(calificacionInput, { target: { value: '5' } });
    fireEvent.change(comentarioInput, { target: { value: 'Completamente recomendada.' } });
    fireEvent.click(agregarBtn);

    expect(onAgregarResena).toHaveBeenCalledTimes(1);
    expect(onAgregarResena).toHaveBeenCalledWith('PROD-BSON-01', {
      cliente: 'Daniela Montes',
      calificacion: 5,
      comentario: 'Completamente recomendada.',
    });

    // Test estado vacío de reseñas
    const productoSinResenas = { ...PRODUCTO_MOCK, resenas: [] };
    rerender(
      <BsonDocumentDrawer
        abierto={true}
        producto={productoSinResenas}
        onAgregarResena={onAgregarResena}
      />
    );

    expect(
      screen.getByText(/aún no hay reseñas embebidas en este documento/i)
    ).toBeInTheDocument();
  });

  it('cierra llamando onCerrar con clic en botón "Cerrar inspector", con tecla Escape, y pasa auditoría axe', async () => {
    const onCerrar = vi.fn();
    const { container } = render(
      <BsonDocumentDrawer
        abierto={true}
        producto={PRODUCTO_MOCK}
        onCerrar={onCerrar}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar inspector/i });
    fireEvent.click(closeBtn);
    expect(onCerrar).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
