// src/components/admin/AdminMongoKpis.jsx
// Visualizador de Métricas de Agregación MongoDB ($group / $facet)
// Tarea 23 · [FE-02]

import { useState, useEffect, useMemo } from 'react';
import { evaluarNivelStock } from '../../utils/stock';
import { obtenerCatalogoActivo } from '../../data/productos';
import { getDashboardMetrics } from '../../services/productoService';
import { formatearCapitalCLP, calcularAgregacionesMongo } from './adminMongoUtils';

/**
 * Componente Visualizador de Métricas de Agregación MongoDB
 *
 * @param {Object} props
 * @param {Object} [props.metricas] - Métricas precalculadas desde API / MongoDB
 * @param {Array} [props.productos] - Lista de productos para cálculo reactivo en tiempo real
 * @param {boolean} [props.cargando] - Estado de carga visual
 * @param {string|null} [props.error] - Mensaje de error si la consulta falló
 * @param {Function} [props.onRefresh] - Callback para recargar métricas
 * @param {Function} [props.onSelectCritico] - Callback al interactuar con un item crítico
 * @param {string} [props.titulo] - Título personalizado para la sección
 */
export default function AdminMongoKpis({
  metricas: metricasProp,
  productos: productosProp,
  cargando: cargandoProp = false,
  error: errorProp = null,
  onRefresh,
  onSelectCritico,
  titulo = 'Métricas de Agregación MongoDB ($group / $facet)',
}) {
  const [metricasLocales, setMetricasLocales] = useState(null);
  const [cargandoLocal, setCargandoLocal] = useState(
    () => metricasProp === undefined && productosProp === undefined
  );
  const [errorLocal, setErrorLocal] = useState(null);

  // Si no se suministran props de datos, realizar carga resiliente automática
  useEffect(() => {
    if (metricasProp !== undefined || productosProp !== undefined) {
      return;
    }

    let isMounted = true;

    getDashboardMetrics({ fallback: true })
      .then((datos) => {
        if (!isMounted) return;
        // Si la respuesta contiene métricas calculadas completas, normalizar
        if (datos && (datos.capitalTotal !== undefined || datos.valoracionTotal !== undefined)) {
          const normalizadas = {
            ...datos,
            capitalTotal: datos.capitalTotal ?? datos.valoracionTotal ?? 0,
            unidadesTotales: datos.unidadesTotales ?? datos.totalUnidades ?? 0,
            categoriasActivas: datos.categoriasActivas ?? datos.totalCategorias ?? 0,
            productosCriticos: Array.isArray(datos.detalleCriticos)
              ? datos.detalleCriticos
              : Array.isArray(datos.productosCriticos)
              ? datos.productosCriticos
              : [],
            totalCriticos:
              typeof datos.productosCriticos === 'number'
                ? datos.productosCriticos
                : Array.isArray(datos.productosCriticos)
                ? datos.productosCriticos.length
                : datos.alertasStockCritico ?? 0,
          };
          setMetricasLocales(normalizadas);
        } else {
          setMetricasLocales(calcularAgregacionesMongo(obtenerCatalogoActivo()));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Fallo al obtener métricas, usando catálogo activo:', err);
        setErrorLocal(err?.message || 'Error de conexión');
        setMetricasLocales(calcularAgregacionesMongo(obtenerCatalogoActivo()));
      })
      .finally(() => {
        if (isMounted) {
          setCargandoLocal(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [metricasProp, productosProp]);

  // Resolución unificada de datos
  const datos = useMemo(() => {
    if (metricasProp) {
      const criticos = Array.isArray(metricasProp.productosCriticos)
        ? metricasProp.productosCriticos
        : Array.isArray(metricasProp.detalleCriticos)
        ? metricasProp.detalleCriticos
        : [];
      const totalCriticos =
        typeof metricasProp.productosCriticos === 'number'
          ? metricasProp.productosCriticos
          : typeof metricasProp.totalCriticos === 'number'
          ? metricasProp.totalCriticos
          : typeof metricasProp.alertasStockCritico === 'number'
          ? metricasProp.alertasStockCritico
          : criticos.length;

      return {
        capitalTotal: Number(metricasProp.capitalTotal ?? metricasProp.valoracionTotal ?? 0),
        unidadesTotales: Number(metricasProp.unidadesTotales ?? metricasProp.totalUnidades ?? 0),
        categoriasActivas: Number(metricasProp.categoriasActivas ?? metricasProp.totalCategorias ?? 0),
        totalProductos: Number(metricasProp.totalProductos ?? 0),
        productosCriticos: criticos,
        totalCriticos,
      };
    }

    if (productosProp) {
      return calcularAgregacionesMongo(productosProp);
    }

    if (metricasLocales) {
      return metricasLocales;
    }

    // Default seguro mientras resuelve
    return {
      capitalTotal: 0,
      unidadesTotales: 0,
      categoriasActivas: 0,
      totalProductos: 0,
      productosCriticos: [],
      totalCriticos: 0,
    };
  }, [metricasProp, productosProp, metricasLocales]);

  const cargando = cargandoProp || cargandoLocal;
  const error = errorProp || errorLocal;
  const itemsCriticos = Array.isArray(datos.productosCriticos) ? datos.productosCriticos : [];
  const hayStockCritico = datos.totalCriticos > 0 || itemsCriticos.length > 0;

  return (
    <section
      id="seccion-admin-mongo-kpis"
      data-testid="admin-mongo-kpis"
      aria-label="Métricas de Inventario MongoDB"
      style={{
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
        margin: '1.5rem 0 2rem',
      }}
    >
      {/* Encabezado con badge del pipeline NoSQL */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🍃</span>
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-text-main, #1A2413)',
              }}
            >
              {titulo}
            </h2>
          </div>
          <p
            style={{
              margin: '0.2rem 0 0',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted, #615E54)',
            }}
          >
            Métricas de bodega calculadas mediante agregación en tiempo real ($group / $facet)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            id="badge-mongo-pipeline"
            data-testid="badge-mongo-pipeline"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              background: '#E8F5E9',
              color: '#1B5E20',
              border: '1px solid #A5D6A7',
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E7D32' }} />
            MongoDB $facet Pipeline
          </span>

          {onRefresh && (
            <button
              id="btn-refrescar-kpis"
              data-testid="btn-refrescar-kpis"
              onClick={onRefresh}
              disabled={cargando}
              style={{
                background: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #E2DDD0)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-main, #1A2413)',
                cursor: cargando ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              aria-label="Actualizar métricas"
            >
              🔄 {cargando ? 'Calculando...' : 'Actualizar'}
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de error si existiese */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-bg, #FDF0F0)',
            border: '1px solid var(--color-danger, #A33A3A)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.75rem 1rem',
            color: 'var(--color-danger, #A33A3A)',
            fontSize: '0.88rem',
            marginBottom: '1rem',
          }}
        >
          ⚠️ Error al cargar métricas de MongoDB: {String(error)}
        </div>
      )}

      {/* Grilla Principal de Tarjetas (Cards) */}
      <div
        id="grilla-kpis-mongo"
        data-testid="grilla-kpis-mongo"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Capital Total en Bodega formateada en $ CLP */}
        <div
          id="kpi-capital-bodega"
          data-testid="kpi-capital-bodega"
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2DDD0)',
            borderTop: '4px solid var(--color-success, #4E632E)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card, 0 1px 3px rgba(26, 36, 19, 0.05))',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-text-muted, #615E54)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Capital Total en Bodega
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.4rem',
                background: 'var(--color-success-bg, #EEF4E6)',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              💰
            </span>
          </div>
          <div>
            <div
              id="valor-capital-bodega"
              data-testid="valor-capital-bodega"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--color-success, #4E632E)',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading, Georgia, serif)',
              }}
            >
              {formatearCapitalCLP(datos.capitalTotal)}
            </div>
            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #615E54)',
              }}
            >
              Valoración agregada ($group / $sum)
            </p>
          </div>
        </div>

        {/* Card 2: Unidades Físicas Totales */}
        <div
          id="kpi-unidades-totales"
          data-testid="kpi-unidades-totales"
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2DDD0)',
            borderTop: '4px solid #1D4ED8',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card, 0 1px 3px rgba(26, 36, 19, 0.05))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-text-muted, #615E54)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Unidades Físicas Totales
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.4rem',
                background: '#EFF6FF',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              📦
            </span>
          </div>
          <div>
            <div
              id="valor-unidades-totales"
              data-testid="valor-unidades-totales"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#1D4ED8',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading, Georgia, serif)',
              }}
            >
              {Number(datos.unidadesTotales).toLocaleString('es-CL')}
            </div>
            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #615E54)',
              }}
            >
              Stock físico total en depósito
            </p>
          </div>
        </div>

        {/* Card 3: Categorías Activas */}
        <div
          id="kpi-categorias-activas"
          data-testid="kpi-categorias-activas"
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #E2DDD0)',
            borderTop: '4px solid #6D28D9',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card, 0 1px 3px rgba(26, 36, 19, 0.05))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-text-muted, #615E54)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Categorías Activas
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.4rem',
                background: '#F5F3FF',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🏷️
            </span>
          </div>
          <div>
            <div
              id="valor-categorias-activas"
              data-testid="valor-categorias-activas"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#6D28D9',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading, Georgia, serif)',
              }}
            >
              {datos.categoriasActivas}
            </div>
            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #615E54)',
              }}
            >
              Líneas de producto registradas
            </p>
          </div>
        </div>

        {/* Card 4: Alertas Stock Crítico */}
        <div
          id="kpi-stock-critico"
          data-testid="kpi-stock-critico"
          style={{
            background: hayStockCritico
              ? 'var(--color-danger-bg, #FDF0F0)'
              : 'var(--color-surface, #FFFFFF)',
            border: `1px solid ${
              hayStockCritico ? 'rgba(163, 58, 58, 0.4)' : 'var(--color-border, #E2DDD0)'
            }`,
            borderTop: `4px solid ${
              hayStockCritico ? 'var(--color-danger, #A33A3A)' : 'var(--color-success, #4E632E)'
            }`,
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card, 0 1px 3px rgba(26, 36, 19, 0.05))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: hayStockCritico ? 'var(--color-danger, #A33A3A)' : 'var(--color-text-muted, #615E54)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Alertas Stock Crítico
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.4rem',
                background: hayStockCritico ? 'rgba(163, 58, 58, 0.15)' : 'var(--color-success-bg, #EEF4E6)',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {hayStockCritico ? '⚠️' : '✅'}
            </span>
          </div>
          <div>
            <div
              id="valor-stock-critico"
              data-testid="valor-stock-critico"
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: hayStockCritico ? 'var(--color-danger, #A33A3A)' : 'var(--color-success, #4E632E)',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading, Georgia, serif)',
              }}
            >
              {datos.totalCriticos}
            </div>
            <p
              style={{
                margin: '0.4rem 0 0',
                fontSize: '0.75rem',
                color: hayStockCritico ? 'var(--color-danger, #A33A3A)' : 'var(--color-text-muted, #615E54)',
                fontWeight: hayStockCritico ? 600 : 400,
              }}
            >
              {hayStockCritico ? 'Items con stock ≤ 3 un.' : 'Inventario en nivel óptimo'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor consolidado de verificación: Card Unidades Físicas Totales y Categorías Activas */}
      <div
        id="card-unidades-categorias"
        data-testid="card-unidades-categorias"
        style={{
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border, #E2DDD0)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.88rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span aria-hidden="true">📊</span>
          <span style={{ color: 'var(--color-text-muted, #615E54)' }}>
            Resumen de Existencias:
          </span>
          <strong style={{ color: 'var(--color-text-main, #1A2413)' }}>
            Card Unidades Físicas Totales y Categorías Activas
          </strong>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span>
            Unidades Físicas Totales:{' '}
            <strong style={{ color: '#1D4ED8' }}>{datos.unidadesTotales}</strong>
          </span>
          <span style={{ color: 'var(--color-border, #E2DDD0)' }}>|</span>
          <span>
            Categorías Activas:{' '}
            <strong style={{ color: '#6D28D9' }}>{datos.categoriasActivas}</strong>
          </span>
        </div>
      </div>

      {/* ALERTA VISUAL DESTACADA CUANDO EXISTAN ITEMS CON STOCK <= 3 */}
      {hayStockCritico ? (
        <div
          id="alerta-stock-critico"
          data-testid="alerta-stock-critico"
          role="alert"
          style={{
            background: 'var(--color-danger-bg, #FDF0F0)',
            border: '2px solid var(--color-danger, #A33A3A)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem 1.5rem',
            color: 'var(--color-text-main, #1A2413)',
            boxShadow: '0 4px 12px rgba(163, 58, 58, 0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden="true">
              ⚠️
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--color-danger, #A33A3A)',
                }}
              >
                Alerta de Stock Crítico: {datos.totalCriticos}{' '}
                {datos.totalCriticos === 1 ? 'producto requiere' : 'productos requieren'}{' '}
                reabastecimiento urgente (stock ≤ 3)
              </h3>
              <p
                style={{
                  margin: '0.2rem 0 0',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted, #615E54)',
                }}
              >
                Identificados por el filtro de agregación MongoDB ($match: &#123; stock_disponible: &#123; $lte: 3 &#125; &#125;)
              </p>
            </div>
          </div>

          {/* Listado interactivo de productos críticos */}
          {itemsCriticos.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                overflowX: 'auto',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid rgba(163, 58, 58, 0.25)',
              }}
            >
              <table
                id="tabla-stock-critico-mongo"
                data-testid="tabla-stock-critico-mongo"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--color-surface-hover, #F3EFE3)',
                      borderBottom: '1px solid var(--color-border, #E2DDD0)',
                      textAlign: 'left',
                      color: 'var(--color-text-muted, #615E54)',
                    }}
                  >
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Código</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Producto</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Categoría</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Stock Actual</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCriticos.map((prod) => {
                    const evalStock = evaluarNivelStock(prod.stock, prod.stockCritico);
                    const esAgotado = Number(prod.stock) <= 0;
                    return (
                      <tr
                        key={prod.codigo}
                        id={`critico-${prod.codigo}`}
                        data-testid={`critico-${prod.codigo}`}
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle, #EBE7DC)',
                          cursor: onSelectCritico ? 'pointer' : 'default',
                        }}
                        onClick={() => onSelectCritico && onSelectCritico(prod)}
                      >
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                          {prod.codigo}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-main, #1A2413)' }}>
                          {prod.nombre}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted, #615E54)' }}>
                          {prod.categoria}
                        </td>
                        <td
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontWeight: 800,
                            color: esAgotado ? 'var(--color-danger, #A33A3A)' : 'var(--color-warning, #94783B)',
                          }}
                        >
                          {prod.stock} un.
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: esAgotado ? 'var(--color-danger, #A33A3A)' : '#FEF3C7',
                              color: esAgotado ? '#FFFFFF' : '#92400E',
                            }}
                          >
                            {evalStock.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div
          id="alerta-stock-ok"
          data-testid="alerta-stock-ok"
          style={{
            background: 'var(--color-success-bg, #EEF4E6)',
            border: '1px solid var(--color-success, #4E632E)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.9rem 1.25rem',
            color: 'var(--color-success, #4E632E)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span aria-hidden="true">✅</span>
          <strong>Inventario en estado óptimo:</strong>
          <span>No se registran productos en nivel crítico (todos los ítems superan las 3 unidades).</span>
        </div>
      )}
    </section>
  );
}
