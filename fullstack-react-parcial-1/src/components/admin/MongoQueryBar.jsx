// src/components/admin/MongoQueryBar.jsx
// Query Builder de Filtros Polimórficos NoSQL - Tarea 24 · [FE-03]

import { useState, useCallback } from 'react';
import { CATEGORIAS_HOMOLOGADAS_6, ESTADOS_DOCUMENTO, ICONOS_CATEGORIA, aplicarQueryMongo } from './mongoQueryUtils';

/**
 * Barra de consulta interactiva para filtrar la colección NoSQL de productos.
 *
 * @param {Object} props
 * @param {Array} [props.productos]           - Colección original de documentos
 * @param {Function} [props.onResultados]     - Callback (resultados, filtros) → emitido al cambiar filtros
 * @param {string} [props.textoBusqueda]      - Valor controlado externo del buscador
 * @param {string} [props.categoriaActiva]    - Valor controlado externo de categoría
 * @param {string} [props.estadoActivo]       - Valor controlado externo de estado
 * @param {Function} [props.onTextoCambio]    - Setter externo del buscador
 * @param {Function} [props.onCategoriaCambio]- Setter externo de categoría
 * @param {Function} [props.onEstadoCambio]   - Setter externo de estado
 * @param {boolean} [props.mostrarContador]   - Muestra el contador de resultados (default true)
 * @param {string} [props.placeholder]        - Placeholder del input de búsqueda
 */
export default function MongoQueryBar({
  productos = [],
  onResultados,
  textoBusqueda: textoProp,
  categoriaActiva: categoriaProp,
  estadoActivo: estadoProp,
  onTextoCambio,
  onCategoriaCambio,
  onEstadoCambio,
  mostrarContador = true,
  placeholder = 'Buscar por nombre, marca o código...',
}) {
  // Modo controlado si se pasan props, interno si no
  const [textoInterno, setTextoInterno] = useState('');
  const [categoriaInterna, setCategoriaInterna] = useState('');
  const [estadoInterno, setEstadoInterno] = useState('');

  const texto = textoProp !== undefined ? textoProp : textoInterno;
  const categoria = categoriaProp !== undefined ? categoriaProp : categoriaInterna;
  const estado = estadoProp !== undefined ? estadoProp : estadoInterno;

  const setTexto = onTextoCambio ?? setTextoInterno;
  const setCategoria = onCategoriaCambio ?? setCategoriaInterna;
  const setEstado = onEstadoCambio ?? setEstadoInterno;

  const emitir = useCallback(
    (nuevoTexto, nuevaCategoria, nuevoEstado) => {
      if (!onResultados) return;
      const filtros = { texto: nuevoTexto, categoria: nuevaCategoria, estado: nuevoEstado };
      const resultados = aplicarQueryMongo(productos, filtros);
      onResultados(resultados, filtros);
    },
    [productos, onResultados]
  );

  const handleTexto = (valor) => {
    setTexto(valor);
    emitir(valor, categoria, estado);
  };

  const handleCategoria = (valor) => {
    const nuevo = valor === categoria ? '' : valor;
    setCategoria(nuevo);
    emitir(texto, nuevo, estado);
  };

  const handleEstado = (valor) => {
    const nuevo = valor === estado ? '' : valor;
    setEstado(nuevo);
    emitir(texto, categoria, nuevo);
  };

  const handleLimpiar = () => {
    setTexto('');
    setCategoria('');
    setEstado('');
    emitir('', '', '');
  };

  const hayFiltrosActivos = texto.trim() || categoria || estado;
  const resultadosActivos = aplicarQueryMongo(productos, { texto, categoria, estado });

  // Colores semánticos por estado
  const colorEstado = {
    ACTIVO: { bg: '#D1FAE5', border: '#6EE7B7', color: '#065F46', active: { bg: '#10B981', color: '#fff', border: '#10B981' } },
    AGOTADO: { bg: '#FEE2E2', border: '#FCA5A5', color: '#991B1B', active: { bg: '#EF4444', color: '#fff', border: '#EF4444' } },
    DESCONTINUADO: { bg: '#F3F4F6', border: '#D1D5DB', color: '#374151', active: { bg: '#6B7280', color: '#fff', border: '#6B7280' } },
  };

  return (
    <div
      id="mongo-query-bar"
      data-testid="mongo-query-bar"
      role="search"
      aria-label="Query Builder de Filtros NoSQL"
      style={{
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
        background: 'var(--color-surface, #FFFFFF)',
        border: '1px solid var(--color-border, #E2DDD0)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Encabezado con badge NoSQL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>🔍</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main, #1A2413)' }}>
            Query Builder
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: '#E0F2FE',
              color: '#0369A1',
              border: '1px solid #BAE6FD',
              letterSpacing: '0.03em',
            }}
          >
            NoSQL · $text · $match
          </span>
        </div>

        {hayFiltrosActivos && (
          <button
            id="btn-limpiar-query"
            data-testid="btn-limpiar-query"
            onClick={handleLimpiar}
            style={{
              background: 'none',
              border: '1px solid var(--color-border, #E2DDD0)',
              borderRadius: 'var(--radius-sm, 4px)',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted, #615E54)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
            aria-label="Limpiar todos los filtros"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Buscador full-text: nombre, marca y codigo */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="input-query-texto"
          style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #615E54)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}
        >
          $text · Búsqueda Full-Text (nombre, marca, código)
        </label>
        <div style={{ position: 'relative' }}>
          <span
            aria-hidden="true"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', color: 'var(--color-text-muted, #615E54)', pointerEvents: 'none' }}
          >
            🔍
          </span>
          <input
            id="input-query-texto"
            data-testid="input-query-texto"
            type="search"
            value={texto}
            onChange={(e) => handleTexto(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            aria-label="Buscar por nombre, marca o código"
            style={{
              width: '100%',
              padding: '0.65rem 2.5rem 0.65rem 2.4rem',
              border: `1px solid ${texto.trim() ? 'var(--color-accent, #D49B28)' : 'var(--color-border, #E2DDD0)'}`,
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: '0.9rem',
              color: 'var(--color-text-main, #1A2413)',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          {texto && (
            <button
              aria-label="Limpiar búsqueda"
              onClick={() => handleTexto('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted, #615E54)',
                fontSize: '1rem',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chips de categorías homologadas (6 principales) */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #615E54)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          $match · Categoría (6 familias homologadas)
        </span>
        <div
          id="chips-categorias"
          data-testid="chips-categorias"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
          role="group"
          aria-label="Filtrar por categoría"
        >
          {CATEGORIAS_HOMOLOGADAS_6.map((cat) => {
            const activa = categoria === cat;
            return (
              <button
                key={cat}
                id={`chip-cat-${cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-')}`}
                data-testid={`chip-cat-${cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleCategoria(cat)}
                aria-pressed={activa}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: activa ? 700 : 500,
                  cursor: 'pointer',
                  border: `1px solid ${activa ? 'var(--color-primary, #1A2413)' : 'var(--color-border, #E2DDD0)'}`,
                  background: activa ? 'var(--color-primary, #1A2413)' : 'var(--color-surface, #FFFFFF)',
                  color: activa ? 'var(--color-bg, #FAF8F2)' : 'var(--color-text-main, #1A2413)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span aria-hidden="true">{ICONOS_CATEGORIA[cat] || '🎵'}</span>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de estado del documento (ACTIVO / AGOTADO / DESCONTINUADO) */}
      <div style={{ marginBottom: mostrarContador ? '1rem' : 0 }}>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #615E54)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          $match · Estado del Documento
        </span>
        <div
          id="chips-estado"
          data-testid="chips-estado"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
          role="group"
          aria-label="Filtrar por estado del documento"
        >
          {ESTADOS_DOCUMENTO.map((est) => {
            const activo = estado === est;
            const colores = colorEstado[est];
            return (
              <button
                key={est}
                id={`chip-estado-${est.toLowerCase()}`}
                data-testid={`chip-estado-${est.toLowerCase()}`}
                onClick={() => handleEstado(est)}
                aria-pressed={activo}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: activo ? 700 : 500,
                  cursor: 'pointer',
                  border: `1px solid ${activo ? colores.active.border : colores.border}`,
                  background: activo ? colores.active.bg : colores.bg,
                  color: activo ? colores.active.color : colores.color,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: activo ? colores.active.color : colores.color,
                    display: 'inline-block',
                    opacity: 0.75,
                  }}
                />
                {est}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contador de resultados del query */}
      {mostrarContador && (
        <div
          id="contador-query-resultados"
          data-testid="contador-query-resultados"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--color-border, #E2DDD0)',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted, #615E54)',
          }}
        >
          <span>
            <strong style={{ color: 'var(--color-text-main, #1A2413)' }}>
              {resultadosActivos.length}
            </strong>
            {' '}
            {resultadosActivos.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
            {productos.length > 0 && (
              <span style={{ marginLeft: '0.4rem', opacity: 0.6 }}>
                de {productos.length}
              </span>
            )}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light, #8C887B)', fontFamily: 'monospace' }}>
            db.productos.find(&#123;
            {texto.trim() ? ` $text: "${texto.trim()}"` : ''}
            {categoria ? ` categoria: "${categoria}"` : ''}
            {estado ? ` estado: "${estado}"` : ''}
            {!texto.trim() && !categoria && !estado ? ' *' : ''}
            {' '}&#125;)
          </span>
        </div>
      )}
    </div>
  );
}
