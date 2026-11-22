import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import ProductShowcaseGrid from './ProductShowcaseGrid';

const mockProductos = [
  {
    codigo: 'PROD-01',
    nombre: 'Guitarra Eléctrica Custom',
    categoria: 'Guitarras',
    precio: 250000,
    stock: 5,
    imagen: 'https://images.unsplash.com/photo-guitar.jpg',
  },
  {
    codigo: 'PROD-02',
    nombre: 'Bajo Profesional 5 Cuerdas',
    categoria: 'Bajos',
    precio: 350000,
    stock: 0,
    imagen: 'https://images.unsplash.com/photo-bass.jpg',
  },
  {
    codigo: 'PROD-03',
    nombre: 'Amplificador Valvular 50W',
    categoria: 'Amplificadores',
    precio: 450000,
    stock: 2,
    imagen: 'https://images.unsplash.com/photo-amp.jpg',
  },
];

describe('<ProductShowcaseGrid />', () => {
  it('aplica brandConfig por defecto y renderiza productos', () => {
    render(<ProductShowcaseGrid productos={mockProductos} />);

    const rootSection = screen.getByTestId('product-showcase-grid');
    expect(rootSection).toBeInTheDocument();
    expect(rootSection.style.getPropertyValue('--showcase-primary')).toBe('#121212');
    expect(rootSection.style.getPropertyValue('--showcase-accent')).toBe('#c5a059');

    expect(screen.getByText('Sonido Vivo')).toBeInTheDocument();
    expect(
      screen.getByText('Instrumentos y Equipamiento Musical de Alta Gama')
    ).toBeInTheDocument();

    expect(screen.getByTestId('showcase-card-PROD-01')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-card-PROD-02')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-card-PROD-03')).toBeInTheDocument();
  });

  it('personaliza la marca mediante brandConfig (colores, logo, textos)', () => {
    const customBrand = {
      nombre: 'Olivini Master Series',
      tagline: 'Edición limitada para luthiers',
      colorPrimario: '#002244',
      colorAcento: '#ff6600',
      logoUrl: 'https://example.com/logo-luthier.png',
      ctaTexto: 'Comprar Ahora',
    };

    render(
      <ProductShowcaseGrid productos={mockProductos} brandConfig={customBrand} />
    );

    const rootSection = screen.getByTestId('product-showcase-grid');
    expect(rootSection.style.getPropertyValue('--showcase-primary')).toBe('#002244');
    expect(rootSection.style.getPropertyValue('--showcase-accent')).toBe('#ff6600');

    expect(screen.getByText('Olivini Master Series')).toBeInTheDocument();
    expect(screen.getByText('Edición limitada para luthiers')).toBeInTheDocument();

    const logo = screen.getByAltText('Logo de Olivini Master Series');
    expect(logo).toHaveAttribute('src', 'https://example.com/logo-luthier.png');

    const ctaButtons = screen.getAllByRole('button', { name: /Comprar Ahora/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it('permite filtrar dinámicamente por categorías', () => {
    render(<ProductShowcaseGrid productos={mockProductos} />);

    expect(screen.getByTestId('filter-pill-Todas')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-Guitarras')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-Bajos')).toBeInTheDocument();
    expect(screen.getByTestId('filter-pill-Amplificadores')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-pill-Guitarras'));

    expect(screen.getByTestId('showcase-card-PROD-01')).toBeInTheDocument();
    expect(screen.queryByTestId('showcase-card-PROD-02')).not.toBeInTheDocument();
    expect(screen.queryByTestId('showcase-card-PROD-03')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-pill-Todas'));
    expect(screen.getByTestId('showcase-card-PROD-01')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-card-PROD-02')).toBeInTheDocument();
    expect(screen.getByTestId('showcase-card-PROD-03')).toBeInTheDocument();
  });

  it('respeta categoriaInicial y oculta filtros cuando mostrarFiltros es false', () => {
    const { rerender } = render(
      <ProductShowcaseGrid
        productos={mockProductos}
        categoriaInicial="Bajos"
      />
    );

    expect(screen.queryByTestId('showcase-card-PROD-01')).not.toBeInTheDocument();
    expect(screen.getByTestId('showcase-card-PROD-02')).toBeInTheDocument();

    rerender(
      <ProductShowcaseGrid
        productos={mockProductos}
        mostrarFiltros={false}
      />
    );

    expect(screen.queryByTestId('filter-pill-Todas')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-pill-Guitarras')).not.toBeInTheDocument();
  });

  it('ejecuta onAddToCart al hacer clic en el botón de agregar', () => {
    const handleAddToCart = vi.fn();
    render(
      <ProductShowcaseGrid
        productos={mockProductos}
        onAddToCart={handleAddToCart}
      />
    );

    const btnAdd = screen.getByTestId('btn-add-PROD-01');
    fireEvent.click(btnAdd);

    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith(mockProductos[0]);
  });

  it('deshabilita el botón de agregar y muestra insignia cuando el stock es 0', () => {
    render(<ProductShowcaseGrid productos={mockProductos} />);

    const badgeAgotado = screen.getByTestId('stock-badge-PROD-02');
    expect(badgeAgotado).toHaveTextContent('Agotado');

    const btnDisabled = screen.getByTestId('btn-add-PROD-02');
    expect(btnDisabled).toBeDisabled();
  });

  it('ejecuta onSelectProduct al hacer clic en la tarjeta o título', () => {
    const handleSelectProduct = vi.fn();
    render(
      <ProductShowcaseGrid
        productos={mockProductos}
        onSelectProduct={handleSelectProduct}
      />
    );

    const titulo = screen.getByText('Guitarra Eléctrica Custom');
    fireEvent.click(titulo);

    expect(handleSelectProduct).toHaveBeenCalledTimes(1);
    expect(handleSelectProduct).toHaveBeenCalledWith(mockProductos[0]);
  });

  it('muestra estado vacío data-testid="showcase-empty" cuando no hay productos', () => {
    render(<ProductShowcaseGrid productos={[]} />);

    expect(screen.getByTestId('showcase-empty')).toBeInTheDocument();
  });

  it('cumple con las normas de accesibilidad (jest-axe)', async () => {
    const { container } = render(
      <ProductShowcaseGrid productos={mockProductos} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
