import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MiniCartDrawer from './MiniCartDrawer';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

const mockItems = [
  {
    codigo: 'ITEM-01',
    nombre: 'Set Cuerdas D’Addario',
    precio: 10000,
    cantidad: 2,
  },
  {
    codigo: 'ITEM-02',
    nombre: 'Afinador Clip Cromático',
    precio: 15000,
    cantidad: 1,
  },
];

describe('<MiniCartDrawer />', () => {
  it('no muestra el contenido visible cuando isOpen es false', () => {
    render(
      <MiniCartDrawer
        isOpen={false}
        onClose={vi.fn()}
        items={mockItems}
      />
    );

    expect(screen.queryByTestId('mini-cart-drawer')).not.toBeInTheDocument();
  });

  it('se abre correctamente y renderiza el título y los ítems', () => {
    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        titulo="Resumen de tu Pedido"
      />
    );

    expect(screen.getByTestId('mini-cart-drawer')).toBeInTheDocument();
    expect(screen.getByText('Resumen de tu Pedido')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cart-item-ITEM-01')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cart-item-ITEM-02')).toBeInTheDocument();
  });

  it('calcula y desglosa el subtotal neto, IVA 19% y total CLP', () => {
    // Subtotal: 10000 * 2 + 15000 * 1 = 35000
    // IVA (19%): Math.round(35000 * 0.19) = 6650
    // Total: 35000 + 6650 = 41650
    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
      />
    );

    const subtotalEl = screen.getByTestId('mini-cart-subtotal');
    const ivaEl = screen.getByTestId('mini-cart-iva');
    const totalEl = screen.getByTestId('mini-cart-total');

    expect(subtotalEl).toHaveTextContent('$35.000');
    expect(ivaEl).toHaveTextContent('$6.650');
    expect(totalEl).toHaveTextContent('$41.650');
  });

  it('permite modificar cantidad y eliminar ítems invocando los callbacks', () => {
    const handleUpdateQuantity = vi.fn();
    const handleRemoveItem = vi.fn();

    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    );

    // Disminuir cantidad ITEM-01 (de 2 a 1)
    const btnDec = screen.getByTestId('btn-qty-dec-ITEM-01');
    fireEvent.click(btnDec);
    expect(handleUpdateQuantity).toHaveBeenCalledWith('ITEM-01', 1);

    // Aumentar cantidad ITEM-01 (de 2 a 3)
    const btnInc = screen.getByTestId('btn-qty-inc-ITEM-01');
    fireEvent.click(btnInc);
    expect(handleUpdateQuantity).toHaveBeenCalledWith('ITEM-01', 3);

    // Eliminar ITEM-02
    const btnRemove = screen.getByTestId('btn-remove-ITEM-02');
    fireEvent.click(btnRemove);
    expect(handleRemoveItem).toHaveBeenCalledWith('ITEM-02');
  });

  it('ejecuta onCheckout al hacer clic en Iniciar Pago', () => {
    const handleCheckout = vi.fn();

    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onCheckout={handleCheckout}
      />
    );

    const btnCheckout = screen.getByTestId('mini-cart-checkout');
    expect(btnCheckout).toBeEnabled();
    fireEvent.click(btnCheckout);

    expect(handleCheckout).toHaveBeenCalledTimes(1);
  });

  it('permite vaciar el carrito cuando onClearCart está definido', () => {
    const handleClearCart = vi.fn();

    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onClearCart={handleClearCart}
      />
    );

    const btnClear = screen.getByTestId('mini-cart-clear');
    expect(btnClear).toBeInTheDocument();
    fireEvent.click(btnClear);

    expect(handleClearCart).toHaveBeenCalledTimes(1);
  });

  it('renderiza estado vacío cuando no hay ítems y deshabilita checkout', () => {
    render(
      <MiniCartDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={[]}
      />
    );

    expect(screen.getByTestId('mini-cart-empty')).toBeInTheDocument();
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();

    const btnCheckout = screen.getByTestId('mini-cart-checkout');
    expect(btnCheckout).toBeDisabled();
  });
});
