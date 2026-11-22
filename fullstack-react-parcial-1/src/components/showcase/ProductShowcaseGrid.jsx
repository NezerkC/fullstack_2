import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { formatearPrecioCLP as formatearCLP } from '../../utils/finanzas';

const DEFAULT_BRAND_CONFIG = {
  nombre: 'Sonido Vivo',
  tagline: 'Instrumentos y Equipamiento Musical de Alta Gama',
  colorPrimario: '#121212',
  colorAcento: '#c5a059',
  logoUrl: '',
  ctaTexto: 'Agregar al Carrito',
};

function ProductShowcaseGrid({
  productos = [],
  brandConfig = DEFAULT_BRAND_CONFIG,
  onAddToCart,
  onSelectProduct,
  mostrarFiltros = true,
  categoriaInicial = 'Todas',
}) {
  const brand = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
  const [categoriaActiva, setCategoriaActiva] = useState(categoriaInicial);

  const categorias = useMemo(() => {
    const set = new Set();
    (productos || []).forEach((prod) => {
      if (prod && prod.categoria) {
        set.add(prod.categoria);
      }
    });
    return ['Todas', ...Array.from(set)];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!productos || productos.length === 0) return [];
    if (categoriaActiva === 'Todas') return productos;
    return productos.filter((p) => p.categoria === categoriaActiva);
  }, [productos, categoriaActiva]);

  return (
    <section
      className="product-showcase-grid container py-4"
      data-testid="product-showcase-grid"
      style={{
        '--showcase-primary': brand.colorPrimario,
        '--showcase-accent': brand.colorAcento,
      }}
    >
      <header className="showcase-header text-center mb-4" data-testid="showcase-header">
        {brand.logoUrl && (
          <img
            src={brand.logoUrl}
            alt={`Logo de ${brand.nombre}`}
            className="showcase-logo mb-3"
            style={{ maxHeight: '60px', objectFit: 'contain' }}
          />
        )}
        <h2 className="showcase-brand-title mb-1" style={{ color: 'var(--showcase-primary)' }}>
          {brand.nombre}
        </h2>
        {brand.tagline && (
          <p className="showcase-brand-tagline text-muted mb-0">
            {brand.tagline}
          </p>
        )}
      </header>

      {mostrarFiltros && categorias.length > 0 && (
        <nav
          className="showcase-categories d-flex flex-wrap justify-content-center gap-2 mb-4"
          aria-label="Filtro de categorías"
        >
          {categorias.map((cat) => {
            const isActive = categoriaActiva === cat;
            return (
              <Button
                key={cat}
                variant={isActive ? 'primary' : 'outline-secondary'}
                size="sm"
                className="rounded-pill px-3"
                data-testid={`filter-pill-${cat}`}
                onClick={() => setCategoriaActiva(cat)}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--showcase-accent)',
                        borderColor: 'var(--showcase-accent)',
                        color: '#ffffff',
                      }
                    : {}
                }
              >
                {cat}
              </Button>
            );
          })}
        </nav>
      )}

      {productosFiltrados.length === 0 ? (
        <div data-testid="showcase-empty" className="text-center py-5 text-muted">
          <p className="mb-0">No hay productos disponibles en esta categoría.</p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {productosFiltrados.map((producto) => {
            const idKey = producto.codigo || producto.id;
            const stockActual = Number(producto.stock ?? 0);
            const isOutOfStock = stockActual <= 0;

            return (
              <Col key={idKey}>
                <Card
                  as="article"
                  className="h-100 shadow-sm border-0 d-flex flex-column showcase-card"
                  data-testid={`showcase-card-${idKey}`}
                >
                  {producto.imagen ? (
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <Card.Img
                        variant="top"
                        src={producto.imagen}
                        alt={producto.nombre}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: onSelectProduct ? 'pointer' : 'default',
                        }}
                        onClick={() => onSelectProduct && onSelectProduct(producto)}
                      />
                    </div>
                  ) : null}
                  <Card.Body className="d-flex flex-column p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      {producto.categoria && (
                        <Badge bg="light" text="dark" className="border">
                          {producto.categoria}
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge bg="danger" data-testid={`stock-badge-${idKey}`}>
                          Agotado
                        </Badge>
                      )}
                    </div>
                    <Card.Title
                      as="h3"
                      className="h6 mb-2 text-truncate"
                      title={producto.nombre}
                      style={{ cursor: onSelectProduct ? 'pointer' : 'default' }}
                      onClick={() => onSelectProduct && onSelectProduct(producto)}
                    >
                      {producto.nombre}
                    </Card.Title>
                    <Card.Text
                      className="fw-bold fs-5 mt-auto mb-3"
                      style={{ color: 'var(--showcase-accent)' }}
                    >
                      {formatearCLP(producto.precio)}
                    </Card.Text>
                    <Button
                      variant="primary"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart && onAddToCart(producto)}
                      data-testid={`btn-add-${idKey}`}
                      style={{
                        backgroundColor: isOutOfStock ? undefined : 'var(--showcase-accent)',
                        borderColor: isOutOfStock ? undefined : 'var(--showcase-accent)',
                        color: isOutOfStock ? undefined : '#ffffff',
                      }}
                    >
                      {brand.ctaTexto || 'Agregar'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </section>
  );
}

ProductShowcaseGrid.propTypes = {
  productos: PropTypes.arrayOf(PropTypes.object),
  brandConfig: PropTypes.shape({
    nombre: PropTypes.string,
    tagline: PropTypes.string,
    colorPrimario: PropTypes.string,
    colorAcento: PropTypes.string,
    logoUrl: PropTypes.string,
    ctaTexto: PropTypes.string,
  }),
  onAddToCart: PropTypes.func,
  onSelectProduct: PropTypes.func,
  mostrarFiltros: PropTypes.bool,
  categoriaInicial: PropTypes.string,
};

export default ProductShowcaseGrid;
