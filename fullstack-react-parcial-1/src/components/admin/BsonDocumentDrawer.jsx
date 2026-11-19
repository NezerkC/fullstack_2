import { useState, useEffect } from 'react';

/**
 * Inspector lateral derecho en formato Drawer para visualizar la estructura
 * cruda BSON/JSON de un documento MongoDB, sus especificaciones polimórficas
 * y la línea de tiempo de reseñas embebidas ($push).
 *
 * @param {Object} props
 * @param {Object|null} props.producto - Documento del producto a inspeccionar.
 * @param {boolean} [props.abierto=false] - Indica si el drawer está visible.
 * @param {() => void} [props.onCerrar] - Callback al cerrar el drawer.
 * @param {(codigo: string, resena: { cliente: string, calificacion: number, comentario: string }) => void} [props.onAgregarResena] - Callback para registrar una nueva reseña embebida.
 */
export default function BsonDocumentDrawer({
  producto,
  abierto = false,
  onCerrar,
  onAgregarResena,
}) {
  const [copiado, setCopiado] = useState(false);
  const [cliente, setCliente] = useState('');
  const [calificacion, setCalificacion] = useState('5');
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (!abierto) return;

    const manejarTeclaEscape = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar?.();
      }
    };

    document.addEventListener('keydown', manejarTeclaEscape);
    return () => {
      document.removeEventListener('keydown', manejarTeclaEscape);
    };
  }, [abierto, onCerrar]);

  useEffect(() => {
    if (!copiado) return;

    const timer = setTimeout(() => {
      setCopiado(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copiado]);

  if (!abierto || !producto) {
    return null;
  }

  const jsonTexto = JSON.stringify(producto, null, 2);

  const handleCopiarBson = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonTexto);
        setCopiado(true);
      }
    } catch {
      // Ignorar errores en entornos con permisos restrictivos
    }
  };

  const handleSubmitResena = (e) => {
    e.preventDefault();
    if (!cliente.trim() || !comentario.trim()) return;

    onAgregarResena?.(producto.codigo, {
      cliente: cliente.trim(),
      calificacion: Number(calificacion) || 5,
      comentario: comentario.trim(),
    });

    setCliente('');
    setComentario('');
    setCalificacion('5');
  };

  const especificacionesEntradas =
    producto.especificaciones && typeof producto.especificaciones === 'object'
      ? Object.entries(producto.especificaciones)
      : [];

  const resenasLista = Array.isArray(producto.resenas) ? producto.resenas : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCerrar?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Inspector de Documento BSON"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: 'var(--color-bg, #FAF8F2)',
          boxShadow: 'var(--shadow-elevated, 0 10px 25px rgba(0,0,0,0.2))',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          borderLeft: '1px solid var(--color-border, #E2DDD0)',
        }}
      >
        {/* Cabecera del Drawer */}
        <header
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--color-surface, #FFFFFF)',
            borderBottom: '1px solid var(--color-border, #E2DDD0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--color-primary, #1A2413)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                }}
              >
                {producto.codigo}
              </span>
              {Array.isArray(producto.tags) &&
                producto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge"
                    style={{
                      backgroundColor: 'var(--color-success-bg, #EEF4E6)',
                      color: 'var(--color-success, #4E632E)',
                      border: '1px solid var(--color-border, #E2DDD0)',
                      fontSize: '0.75rem',
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <h2
              className="h5 mb-0"
              style={{
                color: 'var(--color-text-main, #1A2413)',
                fontWeight: 600,
              }}
            >
              {producto.nombre}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            aria-label="Cerrar inspector"
            onClick={() => onCerrar?.()}
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            ✕
          </button>
        </header>

        {/* Contenido Principal */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Visor BSON/JSON crudo */}
          <section
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              padding: '1rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #E2DDD0)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3
                className="h6 mb-0"
                style={{ color: 'var(--color-text-main, #1A2413)', fontWeight: 600 }}
              >
                Documento BSON
              </h3>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleCopiarBson}
                style={{
                  backgroundColor: copiado
                    ? 'var(--color-success, #4E632E)'
                    : 'var(--color-accent, #D49B28)',
                  color: '#FFFFFF',
                  fontWeight: 500,
                }}
              >
                {copiado ? '¡Copiado!' : 'Copiar BSON'}
              </button>
            </div>
            <pre
              data-testid="bson-json-viewer"
              style={{
                backgroundColor: '#1E1E1E',
                color: '#D4D4D4',
                padding: '0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                maxHeight: '260px',
                overflow: 'auto',
                margin: 0,
              }}
            >
              <code>{jsonTexto}</code>
            </pre>
          </section>

          {/* Especificaciones Polimórficas */}
          <section
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              padding: '1rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #E2DDD0)',
            }}
          >
            <h3
              className="h6 mb-3"
              style={{ color: 'var(--color-text-main, #1A2413)', fontWeight: 600 }}
            >
              Especificaciones Polimórficas
            </h3>
            {especificacionesEntradas.length > 0 ? (
              <dl className="row mb-0" style={{ fontSize: '0.875rem' }}>
                {especificacionesEntradas.map(([clave, valor]) => (
                  <div key={clave} className="col-12 d-flex py-1 border-bottom">
                    <dt
                      className="text-capitalize"
                      style={{
                        width: '40%',
                        color: 'var(--color-text-muted, #615E54)',
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {clave}
                    </dt>
                    <dd
                      style={{
                        width: '60%',
                        color: 'var(--color-text-main, #1A2413)',
                        margin: 0,
                      }}
                    >
                      {typeof valor === 'object' && valor !== null
                        ? JSON.stringify(valor)
                        : String(valor)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p
                className="mb-0 text-muted"
                style={{ fontSize: '0.875rem', fontStyle: 'italic' }}
              >
                Sin especificaciones adicionales registradas.
              </p>
            )}
          </section>

          {/* Reseñas Embebidas ($push) */}
          <section
            style={{
              backgroundColor: 'var(--color-surface, #FFFFFF)',
              padding: '1rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #E2DDD0)',
            }}
          >
            <h3
              className="h6 mb-3"
              style={{ color: 'var(--color-text-main, #1A2413)', fontWeight: 600 }}
            >
              Reseñas embebidas ($push)
            </h3>

            {resenasLista.length > 0 ? (
              <ul className="list-unstyled mb-3" style={{ fontSize: '0.875rem' }}>
                {resenasLista.map((r, idx) => (
                  <li
                    key={idx}
                    className="p-2 mb-2 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg, #FAF8F2)',
                      border: '1px solid var(--color-border, #E2DDD0)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong style={{ color: 'var(--color-text-main, #1A2413)' }}>
                        {r.cliente || 'Anónimo'}
                      </strong>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--color-accent, #D49B28)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                        }}
                      >
                        {r.calificacion ?? 5}/5
                      </span>
                    </div>
                    {r.fecha && (
                      <small
                        className="d-block mb-1"
                        style={{ color: 'var(--color-text-muted, #615E54)', fontSize: '0.75rem' }}
                      >
                        {r.fecha}
                      </small>
                    )}
                    <p className="mb-0" style={{ color: 'var(--color-text-main, #1A2413)' }}>
                      {r.comentario}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="mb-3 text-muted"
                style={{ fontSize: '0.875rem', fontStyle: 'italic' }}
              >
                Aún no hay reseñas embebidas en este documento.
              </p>
            )}

            {/* Formulario para agregar reseña ($push) */}
            {typeof onAgregarResena === 'function' && (
              <form
                onSubmit={handleSubmitResena}
                style={{
                  borderTop: '1px solid var(--color-border, #E2DDD0)',
                  paddingTop: '1rem',
                }}
              >
                <h4
                  className="h6 mb-2"
                  style={{
                    color: 'var(--color-text-main, #1A2413)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  Nueva reseña
                </h4>
                <div className="mb-2">
                  <label
                    htmlFor="drawer-cliente-input"
                    className="form-label mb-1"
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Nombre del cliente
                  </label>
                  <input
                    id="drawer-cliente-input"
                    type="text"
                    required
                    className="form-control form-control-sm"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ej. Constanza Silva"
                  />
                </div>
                <div className="mb-2">
                  <label
                    htmlFor="drawer-calificacion-select"
                    className="form-label mb-1"
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Calificación
                  </label>
                  <select
                    id="drawer-calificacion-select"
                    className="form-select form-select-sm"
                    value={calificacion}
                    onChange={(e) => setCalificacion(e.target.value)}
                  >
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas</option>
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="drawer-comentario-input"
                    className="form-label mb-1"
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Comentario
                  </label>
                  <textarea
                    id="drawer-comentario-input"
                    required
                    rows="2"
                    className="form-control form-control-sm"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe la reseña del cliente..."
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-sm w-100"
                  style={{
                    backgroundColor: 'var(--color-primary, #1A2413)',
                    color: '#FFFFFF',
                    fontWeight: 500,
                  }}
                >
                  Agregar reseña
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
