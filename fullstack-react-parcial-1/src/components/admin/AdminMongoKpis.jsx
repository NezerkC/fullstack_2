/**
 * Formatea un monto numérico en pesos chilenos con el formato "$ 1.234.567".
 * @param {number | string | null | undefined} monto
 * @returns {string}
 */
function formatearCapitalCLP(monto) {
  const numero = Math.round(Number(monto) || 0);
  return `$ ${numero.toLocaleString('es-CL')}`;
}

/**
 * Normaliza los campos provenientes de la agregación MongoDB o del fallback local.
 * @param {Record<string, any> | null | undefined} metricas
 */
function normalizarMetricas(metricas) {
  if (!metricas || typeof metricas !== 'object') {
    return null;
  }

  const capitalBodega =
    metricas.capitalBodega ??
    metricas.valoracionTotal ??
    metricas.capitalEnBodega ??
    metricas.capitalTotal ??
    0;

  const unidadesTotales =
    metricas.unidadesTotales ??
    metricas.unidadesStock ??
    metricas.totalUnidades ??
    0;

  const totalProductos = metricas.totalProductos ?? 0;

  const totalCategorias =
    metricas.totalCategorias ??
    (Array.isArray(metricas.categorias) ? metricas.categorias.length : metricas.categorias ?? null);

  const productosCriticos =
    metricas.productosCriticos ?? metricas.stockCritico ?? 0;

  return {
    capitalBodega: Number(capitalBodega) || 0,
    unidadesTotales: Number(unidadesTotales) || 0,
    totalProductos: Number(totalProductos) || 0,
    totalCategorias: totalCategorias != null ? Number(totalCategorias) || 0 : null,
    productosCriticos: Number(productosCriticos) || 0,
  };
}

/**
 * Visualizador de KPIs de agregación de inventario desde MongoDB.
 * @param {{
 *   metricas?: Record<string, any> | null,
 *   cargando?: boolean,
 *   error?: string | Error | null,
 *   onReintentar?: () => void
 * }} props
 */
export default function AdminMongoKpis({ metricas, cargando = false, error = null, onReintentar }) {
  if (cargando) {
    return (
      <section aria-label="Métricas de inventario MongoDB" aria-busy="true" className="mb-4">
        <div
          role="status"
          aria-live="polite"
          className="d-flex align-items-center gap-3 p-4 rounded border"
          style={{
            backgroundColor: 'var(--color-surface, #FFFFFF)',
            borderColor: 'var(--color-border, #E2DDD0)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--color-text-muted, #615E54)',
          }}
        >
          <div className="spinner-border spinner-border-sm text-secondary" aria-hidden="true" />
          <span className="fw-semibold">Cargando métricas de inventario...</span>
        </div>
      </section>
    );
  }

  if (error) {
    const mensajeError =
      typeof error === 'string'
        ? error
        : error?.message || 'No se pudieron cargar las métricas de inventario.';

    return (
      <section aria-label="Métricas de inventario MongoDB" className="mb-4">
        <div
          role="alert"
          className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-3 mb-0"
          style={{
            backgroundColor: 'var(--color-danger-bg, #FDF0F0)',
            borderColor: 'var(--color-danger, #A33A3A)',
            color: 'var(--color-danger, #A33A3A)',
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          <div>
            <strong className="d-block">Error al cargar métricas</strong>
            <span>{mensajeError}</span>
          </div>
          {typeof onReintentar === 'function' && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm fw-semibold"
              onClick={onReintentar}
            >
              Reintentar
            </button>
          )}
        </div>
      </section>
    );
  }

  const datos = normalizarMetricas(metricas);

  if (!datos) {
    return (
      <section aria-label="Métricas de inventario MongoDB" className="mb-4">
        <div
          className="p-4 rounded border text-center"
          style={{
            backgroundColor: 'var(--color-surface, #FFFFFF)',
            borderColor: 'var(--color-border, #E2DDD0)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--color-text-muted, #615E54)',
          }}
        >
          No hay métricas de inventario disponibles.
        </div>
      </section>
    );
  }

  const hayCriticos = datos.productosCriticos > 0;

  const cards = [
    {
      id: 'mongo-kpi-capital',
      titulo: 'Capital en bodega',
      valor: formatearCapitalCLP(datos.capitalBodega),
      subtitulo: 'Valorización total de inventario',
      icono: '💰',
      accentColor: 'var(--color-success, #4E632E)',
      iconBg: 'var(--color-success-bg, #EEF4E6)',
      borderColor: 'var(--color-border, #E2DDD0)',
      cardBg: 'var(--color-surface, #FFFFFF)',
    },
    {
      id: 'mongo-kpi-unidades',
      titulo: 'Unidades totales',
      valor: datos.unidadesTotales.toLocaleString('es-CL'),
      subtitulo: 'Stock físico disponible',
      icono: '📦',
      accentColor: 'var(--color-primary, #1A2413)',
      iconBg: 'var(--color-surface-hover, #F3EFE3)',
      borderColor: 'var(--color-border, #E2DDD0)',
      cardBg: 'var(--color-surface, #FFFFFF)',
    },
    {
      id: 'mongo-kpi-productos',
      titulo: 'Total productos',
      valor: datos.totalProductos.toLocaleString('es-CL'),
      subtitulo:
        datos.totalCategorias != null
          ? `${datos.totalCategorias.toLocaleString('es-CL')} categorías activas`
          : 'Catálogo registrado',
      icono: '🎸',
      accentColor: 'var(--color-accent-hover, #B8831B)',
      iconBg: 'var(--color-warning-bg, #FAF4E4)',
      borderColor: 'var(--color-border, #E2DDD0)',
      cardBg: 'var(--color-surface, #FFFFFF)',
    },
    {
      id: 'mongo-kpi-criticos',
      titulo: 'Stock crítico',
      valor: datos.productosCriticos.toLocaleString('es-CL'),
      subtitulo: hayCriticos ? 'Requiere reposición prioritaria' : 'Sin quiebres de stock',
      icono: hayCriticos ? '⚠️' : '✅',
      accentColor: hayCriticos ? 'var(--color-danger, #A33A3A)' : 'var(--color-success, #4E632E)',
      iconBg: hayCriticos ? 'var(--color-danger-bg, #FDF0F0)' : 'var(--color-success-bg, #EEF4E6)',
      borderColor: hayCriticos ? 'var(--color-danger, #A33A3A)' : 'var(--color-border, #E2DDD0)',
      cardBg: hayCriticos ? 'var(--color-danger-bg, #FDF0F0)' : 'var(--color-surface, #FFFFFF)',
      esCritico: true,
    },
  ];

  return (
    <section aria-label="Métricas de inventario MongoDB" className="mb-4">
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
        {cards.map((card) => (
          <div key={card.id} className="col">
            <article
              id={card.id}
              className="card h-100"
              style={{
                backgroundColor: card.cardBg,
                borderColor: card.borderColor,
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-card, 0 1px 3px rgba(26, 36, 19, 0.05))',
              }}
            >
              <div className="card-body d-flex align-items-start gap-3">
                <div
                  aria-hidden="true"
                  className="d-flex align-items-center justify-content-center flex-shrink-0 rounded"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: card.iconBg,
                    fontSize: '1.5rem',
                  }}
                >
                  {card.icono}
                </div>
                <div className="min-w-0 flex-grow-1">
                  <h2
                    className="h6 mb-1 fw-semibold"
                    style={{
                      color: 'var(--color-text-muted, #615E54)',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {card.titulo}
                  </h2>
                  <p
                    className="mb-1 fw-bold"
                    style={{
                      color: card.accentColor,
                      fontSize: '1.45rem',
                      lineHeight: 1.15,
                    }}
                  >
                    {card.valor}
                  </p>
                  <p
                    className="mb-0"
                    style={{
                      color: 'var(--color-text-muted, #615E54)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {card.subtitulo}
                  </p>
                  {card.esCritico && (
                    <div className="mt-2">
                      {hayCriticos ? (
                        <span
                          className="badge text-bg-danger"
                          data-testid="badge-stock-critico"
                        >
                          Alerta: {datos.productosCriticos}{' '}
                          {datos.productosCriticos === 1 ? 'crítico' : 'críticos'}
                        </span>
                      ) : (
                        <span className="badge text-bg-success">Stock saludable</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
