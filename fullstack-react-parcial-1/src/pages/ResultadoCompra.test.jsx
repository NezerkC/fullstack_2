import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import CompraExitosa from './CompraExitosa';
import PagoFallido from './PagoFallido';

const ORDEN = {
  numero: 'SV-654321',
  cliente: { nombre: 'Danilo', apellidos: 'Sepúlveda', correo: 'danilo@duoc.cl' },
  entrega: { tipo: 'retiro', direccion: '', departamento: '', region: '', comuna: '' },
  pago: {
    metodo: 'Transferencia',
    tipoDocumento: 'factura',
    rutFacturacion: '76.123.456-7',
    razonSocial: 'Música SpA',
  },
  items: [{ codigo: 'AC001', nombre: 'Cable Plug', precio: 10000, cantidad: 2 }],
  subtotal: 20000,
  iva: 3800,
  total: 23800,
};

function renderEn(ruta, estado) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: ruta, state: estado }]}>
      <Routes>
        <Route path="/compra-exitosa" element={<CompraExitosa />} />
        <Route path="/pago-fallido" element={<PagoFallido />} />
        <Route path="/carrito" element={<div>Carrito Mock</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Vistas de resultado de la compra', () => {
  it('CompraExitosa muestra el número de orden, la entrega y el resumen', () => {
    renderEn('/compra-exitosa', { orden: ORDEN });

    expect(screen.getByTestId('numero-orden')).toHaveTextContent('SV-654321');
    expect(screen.getByTestId('entrega-descripcion')).toHaveTextContent(/Retiro en tienda/i);
    expect(screen.getByTestId('comprobante-metodo-pago')).toHaveTextContent('Transferencia');
    expect(screen.getByTestId('comprobante-tipo-documento')).toHaveTextContent('Factura Electrónica');
    expect(screen.getByTestId('comprobante-rut-facturacion')).toHaveTextContent('76.123.456-7');
    expect(screen.getByTestId('comprobante-razon-social')).toHaveTextContent('Música SpA');
    expect(screen.getByTestId('resumen-total')).toHaveTextContent('$23.800');
  });

  it('PagoFallido muestra el aviso de rechazo y el resumen del pedido no pagado', () => {
    renderEn('/pago-fallido', { orden: ORDEN });

    expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo realizar el pago/i);
    expect(screen.getByRole('heading', { name: 'Pedido no pagado' })).toBeInTheDocument();
  });

  it('redirigen al carrito si se entra sin una orden', () => {
    renderEn('/compra-exitosa', null);
    expect(screen.getByText('Carrito Mock')).toBeInTheDocument();
  });
});
