import PropTypes from 'prop-types';
import { Offcanvas, Button, Badge, ListGroup } from 'react-bootstrap';
import {
  calcularTotalesFinancieros as calcularTotales,
  formatearPrecioCLP as formatearCLP,
} from '../../utils/finanzas';

const DEFAULT_BRAND_CONFIG = {
  nombre: 'Sonido Vivo',
  colorPrimario: '#121212',
  colorAcento: '#c5a059',
};

function MiniCartDrawer({
  isOpen = false,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  brandConfig = DEFAULT_BRAND_CONFIG,
  titulo = 'Tu Carrito',
}) {
  const brand = { ...DEFAULT_BRAND_CONFIG, ...brandConfig };
  const { subtotalNeto, iva, total } = calcularTotales(items);
  const totalArticulos = items.reduce((acc, item) => acc + (Number(item.cantidad) || 1), 0);

  return (
    <Offcanvas
      show={isOpen}
      onHide={onClose}
      placement="end"
      data-testid="mini-cart-drawer"
      style={{
        '--showcase-primary': brand.colorPrimario,
        '--showcase-accent': brand.colorAcento,
      }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <span>{titulo}</span>
          {items.length > 0 && (
            <Badge
              pill
              bg="secondary"
              data-testid="mini-cart-badge-count"
              style={{ backgroundColor: 'var(--showcase-accent)' }}
            >
              {totalArticulos}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
        {items.length === 0 ? (
          <div data-testid="mini-cart-empty" className="text-center py-5 text-muted my-auto">
            <p className="fs-5 mb-1">Tu carrito está vacío</p>
            <p className="small mb-0">Explora nuestro catálogo y agrega productos para comenzar.</p>
          </div>
        ) : (
          <div className="flex-grow-1 overflow-auto">
            <ListGroup variant="flush">
              {items.map((item) => {
                const itemKey = item.codigo || item.id;
                const cantidadActual = Number(item.cantidad) || 1;

                return (
                  <ListGroup.Item
                    key={itemKey}
                    className="px-0 py-3 border-bottom"
                    data-testid={`mini-cart-item-${itemKey}`}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="me-2">
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                          {item.nombre}
                        </div>
                        <small className="text-muted">
                          {formatearCLP(item.precio)} c/u
                        </small>
                      </div>
                      <div className="fw-bold" style={{ color: 'var(--showcase-accent)' }}>
                        {formatearCLP((Number(item.precio) || 0) * cantidadActual)}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="btn-group btn-group-sm" role="group" aria-label="Control de cantidad">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() =>
                            onUpdateQuantity &&
                            onUpdateQuantity(itemKey, Math.max(0, cantidadActual - 1))
                          }
                          aria-label="Disminuir cantidad"
                          data-testid={`btn-qty-dec-${itemKey}`}
                        >
                          -
                        </Button>
                        <span
                          className="px-3 py-1 border-top border-bottom text-center"
                          style={{ minWidth: '36px' }}
                          data-testid={`item-qty-${itemKey}`}
                        >
                          {cantidadActual}
                        </span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() =>
                            onUpdateQuantity &&
                            onUpdateQuantity(itemKey, cantidadActual + 1)
                          }
                          aria-label="Aumentar cantidad"
                          data-testid={`btn-qty-inc-${itemKey}`}
                        >
                          +
                        </Button>
                      </div>

                      <Button
                        variant="link"
                        className="text-danger p-0 text-decoration-none small"
                        onClick={() => onRemoveItem && onRemoveItem(itemKey)}
                        aria-label="Eliminar producto"
                        data-testid={`btn-remove-${itemKey}`}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </div>
        )}

        <div className="mini-cart-footer border-top pt-3 mt-3">
          {items.length > 0 && (
            <div className="mini-cart-financials mb-3" data-testid="mini-cart-breakdown">
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>Subtotal neto:</span>
                <span data-testid="mini-cart-subtotal">{formatearCLP(subtotalNeto)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>IVA (19%):</span>
                <span data-testid="mini-cart-iva">{formatearCLP(iva)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                <span>Total CLP:</span>
                <span data-testid="mini-cart-total" style={{ color: 'var(--showcase-accent)' }}>
                  {formatearCLP(total)}
                </span>
              </div>
            </div>
          )}

          {onClearCart && items.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="w-100 mb-2"
              onClick={onClearCart}
              data-testid="mini-cart-clear"
            >
              Vaciar Carrito
            </Button>
          )}

          <Button
            variant="primary"
            className="w-100 py-2 fw-semibold"
            disabled={items.length === 0}
            onClick={onCheckout}
            data-testid="mini-cart-checkout"
            style={{
              backgroundColor: items.length === 0 ? undefined : 'var(--showcase-accent)',
              borderColor: items.length === 0 ? undefined : 'var(--showcase-accent)',
              color: items.length === 0 ? undefined : '#ffffff',
            }}
          >
            Iniciar Pago
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

MiniCartDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  onUpdateQuantity: PropTypes.func,
  onRemoveItem: PropTypes.func,
  onClearCart: PropTypes.func,
  onCheckout: PropTypes.func,
  brandConfig: PropTypes.shape({
    nombre: PropTypes.string,
    colorPrimario: PropTypes.string,
    colorAcento: PropTypes.string,
  }),
  titulo: PropTypes.string,
};

export default MiniCartDrawer;
