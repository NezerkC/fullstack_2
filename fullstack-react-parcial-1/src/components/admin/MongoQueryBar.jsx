/* eslint-disable react-refresh/only-export-components */
export const CATEGORIAS_HOMOLOGADAS = [
  'Cuerdas',
  'Audio Pro',
  'Percusion',
  'Teclados',
  'Vientos',
  'Accesorios',
];

export const ESTADOS_DOCUMENTO = ['ACTIVO', 'AGOTADO', 'DESCONTINUADO'];

/**
 * Barra de consulta y filtros polimórficos para colecciones MongoDB en vista admin.
 *
 * @param {Object} props
 * @param {string} [props.busqueda=''] - Término de búsqueda de texto completo.
 * @param {(valor: string) => void} [props.onBusquedaChange] - Callback al cambiar búsqueda.
 * @param {string} [props.categoriaSeleccionada=''] - Categoría seleccionada ('': todas).
 * @param {(categoria: string) => void} [props.onCategoriaChange] - Callback al cambiar categoría.
 * @param {string} [props.estadoSeleccionado=''] - Estado seleccionado ('': todos).
 * @param {(estado: string) => void} [props.onEstadoChange] - Callback al cambiar estado.
 * @param {string[]} [props.categorias=CATEGORIAS_HOMOLOGADAS] - Lista de categorías.
 * @param {number} [props.totalResultados] - Total de documentos encontrados.
 * @param {() => void} [props.onLimpiar] - Callback para limpiar filtros.
 */
export default function MongoQueryBar({
  busqueda = '',
  onBusquedaChange,
  categoriaSeleccionada = '',
  onCategoriaChange,
  estadoSeleccionado = '',
  onEstadoChange,
  categorias = CATEGORIAS_HOMOLOGADAS,
  totalResultados,
  onLimpiar,
}) {
  const tieneFiltrosActivos = Boolean(
    busqueda || categoriaSeleccionada || estadoSeleccionado
  );

  const handleLimpiar = () => {
    if (typeof onLimpiar === 'function') {
      onLimpiar();
    } else {
      onBusquedaChange?.('');
      onCategoriaChange?.('');
      onEstadoChange?.('');
    }
  };

  const handleChipClick = (cat) => {
    // Si hace clic en la categoría ya seleccionada, la deselecciona (vuelve a '')
    const nueva = cat === categoriaSeleccionada ? '' : cat;
    onCategoriaChange?.(nueva);
  };

  return (
    <div
      className="card mb-3"
      style={{
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        border: '1px solid var(--color-border, #E2DDD0)',
        borderRadius: 'var(--radius-md, 8px)',
      }}
    >
      <div className="card-body p-3">
        {/* Fila 1: Buscador full-text y Selector de Estado */}
        <div className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-8">
            <label
              htmlFor="input-busqueda-admin"
              className="form-label mb-1"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-main, #1A2413)',
              }}
            >
              Buscar en colección productos
            </label>
            <input
              id="input-busqueda-admin"
              type="search"
              className="form-control form-control-sm"
              placeholder="Buscar por nombre, marca o código..."
              value={busqueda}
              onChange={(e) => onBusquedaChange?.(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="select-estado-mongo"
              className="form-label mb-1"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-main, #1A2413)',
              }}
            >
              Estado
            </label>
            <select
              id="select-estado-mongo"
              className="form-select form-select-sm"
              value={estadoSeleccionado}
              onChange={(e) => onEstadoChange?.(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_DOCUMENTO.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Chips de categorías */}
        <div className="mb-3">
          <span
            className="d-block mb-1"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-text-muted, #615E54)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Categorías
          </span>
          <div
            role="group"
            aria-label="Filtrar por categoría"
            className="d-flex flex-wrap gap-1"
          >
            <button
              type="button"
              className={`btn btn-sm ${
                categoriaSeleccionada === '' ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              aria-pressed={categoriaSeleccionada === ''}
              onClick={() => onCategoriaChange?.('')}
              style={{ fontSize: '0.8rem' }}
            >
              Todas
            </button>
            {categorias.map((cat) => {
              const activa = categoriaSeleccionada === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${
                    activa ? 'btn-dark' : 'btn-outline-secondary'
                  }`}
                  aria-pressed={activa}
                  onClick={() => handleChipClick(cat)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila 3: Contador de documentos y Botón de Limpiar */}
        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
          <div>
            {typeof totalResultados === 'number' && (
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--color-surface, #FFFFFF)',
                  color: 'var(--color-text-main, #1A2413)',
                  border: '1px solid var(--color-border, #E2DDD0)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  padding: '0.35rem 0.65rem',
                }}
              >
                {totalResultados} documentos
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none"
            onClick={handleLimpiar}
            disabled={!tieneFiltrosActivos}
            style={{
              color: tieneFiltrosActivos
                ? 'var(--color-accent, #D49B28)'
                : 'var(--color-text-muted, #615E54)',
              fontWeight: 500,
              fontSize: '0.8rem',
              padding: '0.2rem 0.5rem',
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
