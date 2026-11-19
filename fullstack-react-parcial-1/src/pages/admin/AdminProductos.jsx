import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  PRODUCTOS_SONIDO_VIVO,
  CATEGORIAS_SONIDO_VIVO,
  CLAVE_INVENTARIO_STORAGE,
  formatearPrecioCLP,
  obtenerRutaImagen,
} from '../../data/productos';
import AdminMongoKpis from '../../components/admin/AdminMongoKpis';
import MongoQueryBar, { CATEGORIAS_HOMOLOGADAS } from '../../components/admin/MongoQueryBar';
import BsonDocumentDrawer from '../../components/admin/BsonDocumentDrawer';
import {
  obtenerProductos,
  obtenerMetricas,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  ajustarStock,
  agregarResena,
} from '../../services/productoService';

const PRODUCTO_VACIO = {
  codigo: '',
  nombre: '',
  marca: '',
  modelo: '',
  categoria: '',
  precio: '',
  stock: '',
  stockCritico: 3,
  descripcion: '',
  icono: '🎸',
};

function ModalProducto({ producto, onGuardar, onCerrar }) {
  const esNuevo = !producto?.codigo || producto._esNuevo;
  const [form, setForm] = useState(producto || PRODUCTO_VACIO);
  const [errores, setErrores] = useState({});

  const validar = () => {
    const e = {};
    const codigo = form.codigo.trim();
    const nombre = form.nombre.trim();
    const precio = form.precio.toString().trim();
    if (!codigo) e.codigo = 'Requerido';
    else if (codigo.length < 3) e.codigo = 'Mínimo 3 caracteres';
    if (!nombre) e.nombre = 'Requerido';
    else if (nombre.length > 100) e.nombre = 'Máximo 100 caracteres';
    if (!form.categoria) e.categoria = 'Requerido';
    if (!precio || isNaN(Number(precio)) || Number(precio) < 0)
      e.precio = 'Precio inválido';
    if (!form.stock.toString().trim() || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      e.stock = 'Stock inválido';
    return e;
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) { setErrores(e2); return; }
    onGuardar({
      ...form,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stockCritico: Number(form.stockCritico) || 3,
      imagen: form.imagen || `${form.codigo}.jpg`,
    });
  };

  const inputStyle = (campo) => ({
    width: '100%',
    background: '#ffffff',
    border: `1px solid ${errores[campo] ? 'var(--color-danger, #A33A3A)' : 'var(--color-border, #E2DDD0)'}`,
    borderRadius: 'var(--radius-sm, 4px)',
    padding: '0.65rem 0.9rem',
    color: 'var(--color-text-main, #1A2413)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  });

  const labelStyle = {
    color: 'var(--color-text-main, #1A2413)',
    fontSize: '0.82rem',
    fontWeight: 700,
    marginBottom: '0.35rem',
    display: 'block',
  };

  return (
    <div
      id="modal-producto-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
      onClick={(e) => e.target.id === 'modal-producto-overlay' && onCerrar()}
    >
      <div
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '2rem',
          width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-elevated)',
          border: '1px solid var(--color-border, #E2DDD0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border, #E2DDD0)', paddingBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, color: 'var(--color-text-main, #1A2413)', fontSize: '1.25rem', fontWeight: 800 }}>
            {esNuevo ? '✨ Agregar Nuevo Producto' : `✏️ Editar: ${producto.nombre}`}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'none', border: 'none', fontSize: '1.25rem',
              cursor: 'pointer', color: 'var(--color-text-muted, #615E54)',
              lineHeight: 1, padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Código */}
            <div>
              <label style={labelStyle}>Código (SKU) *</label>
              <input
                id="input-codigo"
                type="text"
                disabled={!esNuevo}
                value={form.codigo}
                onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                placeholder="EJ: GA001"
                style={{
                  ...inputStyle('codigo'),
                  background: !esNuevo ? 'var(--color-surface-hover, #F3EFE3)' : '#ffffff',
                  cursor: !esNuevo ? 'not-allowed' : 'text',
                }}
              />
              {errores.codigo && <span style={{ color: 'var(--color-danger, #A33A3A)', fontSize: '0.75rem', fontWeight: 600 }}>{errores.codigo}</span>}
            </div>
            {/* Categoría */}
            <div>
              <label style={labelStyle}>Categoría *</label>
              <select
                id="select-categoria"
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                style={inputStyle('categoria')}
              >
                <option value="">Selecciona una categoría...</option>
                {CATEGORIAS_SONIDO_VIVO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errores.categoria && <span style={{ color: 'var(--color-danger, #A33A3A)', fontSize: '0.75rem', fontWeight: 600 }}>{errores.categoria}</span>}
            </div>
            {/* Nombre */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre del Producto *</label>
              <input
                id="input-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Guitarra Acústica Cutaway"
                style={inputStyle('nombre')}
              />
              {errores.nombre && <span style={{ color: 'var(--color-danger, #A33A3A)', fontSize: '0.75rem', fontWeight: 600 }}>{errores.nombre}</span>}
            </div>
            {/* Marca */}
            <div>
              <label style={labelStyle}>Marca</label>
              <input
                id="input-marca"
                type="text"
                value={form.marca}
                onChange={(e) => handleChange('marca', e.target.value)}
                placeholder="Fender, Gibson, etc."
                style={inputStyle('marca')}
              />
            </div>
            {/* Modelo */}
            <div>
              <label style={labelStyle}>Modelo</label>
              <input
                id="input-modelo"
                type="text"
                value={form.modelo}
                onChange={(e) => handleChange('modelo', e.target.value)}
                placeholder="Standard, Custom, etc."
                style={inputStyle('modelo')}
              />
            </div>
            {/* Precio */}
            <div>
              <label style={labelStyle}>Precio (CLP) *</label>
              <input
                id="input-precio"
                type="number"
                min="0"
                step="500"
                value={form.precio}
                onChange={(e) => handleChange('precio', e.target.value)}
                placeholder="129990"
                style={inputStyle('precio')}
              />
              {errores.precio && <span style={{ color: 'var(--color-danger, #A33A3A)', fontSize: '0.75rem', fontWeight: 600 }}>{errores.precio}</span>}
            </div>
            {/* Stock */}
            <div>
              <label style={labelStyle}>Stock Unidades *</label>
              <input
                id="input-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                placeholder="10"
                style={inputStyle('stock')}
              />
              {errores.stock && <span style={{ color: 'var(--color-danger, #A33A3A)', fontSize: '0.75rem', fontWeight: 600 }}>{errores.stock}</span>}
            </div>
            {/* Stock Crítico */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Umbral de Stock Crítico (Alerta)</label>
              <input
                id="input-stock-critico"
                type="number"
                min="0"
                value={form.stockCritico}
                onChange={(e) => handleChange('stockCritico', e.target.value)}
                style={inputStyle('stockCritico')}
              />
            </div>
            {/* Descripción */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                id="input-descripcion"
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                rows={3}
                style={{ ...inputStyle('descripcion'), resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border, #E2DDD0)', paddingTop: '1rem' }}>
            <button
              type="button"
              id="btn-cancelar-modal"
              onClick={onCerrar}
              style={{
                padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-sm, 4px)',
                background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #E2DDD0)',
                color: 'var(--color-text-muted, #615E54)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-guardar-modal"
              style={{
                padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-sm, 4px)',
                background: 'var(--color-primary, #1A2413)', border: 'none',
                color: 'var(--color-bg, #FAF8F2)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalConfirmarEliminar({ producto, onConfirmar, onCerrar }) {
  return (
    <div
      id="modal-eliminar-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
      onClick={(e) => e.target.id === 'modal-eliminar-overlay' && onCerrar()}
    >
      <div
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '2rem', width: '100%', maxWidth: '440px',
          boxShadow: 'var(--shadow-elevated)',
          border: '1px solid var(--color-border, #E2DDD0)',
        }}
      >
        <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-main, #1A2413)', fontSize: '1.15rem', textAlign: 'center', fontWeight: 800 }}>
          ¿Descontinuar este producto?
        </h3>
        <p style={{ color: 'var(--color-text-muted, #615E54)', fontSize: '0.88rem', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Vas a eliminar <strong>{producto.nombre}</strong> ({producto.codigo}). Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            id="btn-cancelar-eliminar"
            onClick={onCerrar}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm, 4px)',
              background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #E2DDD0)',
              color: 'var(--color-text-muted, #615E54)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirmar-eliminar"
            onClick={() => onConfirmar(producto)}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm, 4px)',
              background: 'var(--color-danger, #A33A3A)', border: 'none',
              color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductos() {
  const [inventario, setInventario] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_INVENTARIO_STORAGE);
      return guardado ? JSON.parse(guardado) : PRODUCTOS_SONIDO_VIVO;
    } catch {
      return PRODUCTOS_SONIDO_VIVO;
    }
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalProducto, setModalProducto] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Estados de integración NoSQL / MongoDB
  const [productoInspeccionado, setProductoInspeccionado] = useState(null);
  const [metricasBackend, setMetricasBackend] = useState(null);
  const [cargandoMetricas, setCargandoMetricas] = useState(false);
  const [errorMetricas, setErrorMetricas] = useState(null);

  const sincronizarBackend = useCallback(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setCargandoMetricas(true);
    setErrorMetricas(null);
    try {
      const [prodsRes, metricsRes] = await Promise.all([
        obtenerProductos({}, token),
        obtenerMetricas(token),
      ]);
      if (Array.isArray(prodsRes) && prodsRes.length > 0) {
        setInventario(prodsRes);
        try {
          localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(prodsRes));
        } catch {
          // ignore
        }
      }
      if (metricsRes) {
        setMetricasBackend(metricsRes);
      }
    } catch (err) {
      setErrorMetricas(err?.message || 'Error al conectar con MongoDB');
    } finally {
      setCargandoMetricas(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargandoMetricas(true);
    setErrorMetricas(null);

    Promise.all([
      obtenerProductos({}, token),
      obtenerMetricas(token),
    ])
      .then(([prodsRes, metricsRes]) => {
        if (cancelado) return;
        if (Array.isArray(prodsRes) && prodsRes.length > 0) {
          setInventario(prodsRes);
          try {
            localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(prodsRes));
          } catch {
            // ignore
          }
        }
        if (metricsRes) {
          setMetricasBackend(metricsRes);
        }
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorMetricas(err?.message || 'Error al conectar con MongoDB');
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoMetricas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const persistir = useCallback((nuevaLista) => {
    setInventario(nuevaLista);
    try {
      localStorage.setItem(CLAVE_INVENTARIO_STORAGE, JSON.stringify(nuevaLista));
    } catch {
      // ignore
    }
  }, []);

  const mostrarToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Métricas locales calculadas reactivamente a partir del inventario
  const metricasLocales = useMemo(() => {
    const capitalBodega = inventario.reduce(
      (acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0),
      0
    );
    const unidadesTotales = inventario.reduce(
      (acc, p) => acc + (Number(p.stock) || 0),
      0
    );
    const totalProductos = inventario.length;
    const categoriasSet = new Set(inventario.map((p) => p.categoria).filter(Boolean));
    const totalCategorias = categoriasSet.size;
    const productosCriticos = inventario.filter(
      (p) => (Number(p.stock) || 0) <= (p.stockCritico ?? 3)
    ).length;

    return {
      capitalBodega,
      unidadesTotales,
      totalProductos,
      totalCategorias,
      productosCriticos,
    };
  }, [inventario]);

  const metricasVisibles = metricasBackend || metricasLocales;

  // Categorías combinadas y deduplicadas
  const categoriasDisponibles = useMemo(() => {
    const set = new Set([
      ...CATEGORIAS_SONIDO_VIVO,
      ...CATEGORIAS_HOMOLOGADAS,
      ...inventario.map((p) => p.categoria).filter(Boolean),
    ]);
    return Array.from(set);
  }, [inventario]);

  const productosFiltrados = useMemo(() => {
    return inventario.filter((p) => {
      const coincideBusqueda =
        !busqueda.trim() ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideCat = !filtroCategoria || p.categoria === filtroCategoria;

      const estadoProd = p.estado || (Number(p.stock) === 0 ? 'AGOTADO' : 'ACTIVO');
      const coincideEstado = !filtroEstado || estadoProd === filtroEstado;

      return coincideBusqueda && coincideCat && coincideEstado;
    });
  }, [inventario, busqueda, filtroCategoria, filtroEstado]);

  const handleAjustarStock = useCallback(
    (prod, delta) => {
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null) || undefined;
      const nuevoStock = Math.max(0, (Number(prod.stock) || 0) + delta);
      const nuevaLista = inventario.map((p) =>
        p.codigo === prod.codigo ? { ...p, stock: nuevoStock } : p
      );
      persistir(nuevaLista);

      if (productoInspeccionado && productoInspeccionado.codigo === prod.codigo) {
        setProductoInspeccionado((prev) => (prev ? { ...prev, stock: nuevoStock } : null));
      }

      setMetricasBackend(null);

      const motivo = delta > 0 ? 'INGRESO_PROVEEDOR' : 'VENTA_DIRECTA_MOSTRADOR';
      ajustarStock(prod.codigo, delta, motivo, token).catch(() => {});
    },
    [inventario, persistir, productoInspeccionado]
  );

  const handleGuardar = useCallback(
    (productoEditado) => {
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null) || undefined;
      const esNuevo = !inventario.find((p) => p.codigo === productoEditado.codigo);
      const nuevaLista = esNuevo
        ? [...inventario, productoEditado]
        : inventario.map((p) => (p.codigo === productoEditado.codigo ? productoEditado : p));
      persistir(nuevaLista);
      setModalProducto(null);
      setMetricasBackend(null);
      mostrarToast(
        esNuevo
          ? `✅ "${productoEditado.nombre}" creado exitosamente`
          : `✅ "${productoEditado.nombre}" actualizado`
      );

      const llamada = esNuevo
        ? crearProducto(productoEditado, token)
        : actualizarProducto(productoEditado.codigo, productoEditado, token);
      llamada.catch(() => {});
    },
    [inventario, persistir, mostrarToast]
  );

  const handleEliminar = useCallback(
    (producto) => {
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null) || undefined;
      const nuevaLista = inventario.filter((p) => p.codigo !== producto.codigo);
      persistir(nuevaLista);
      setModalEliminar(null);
      setMetricasBackend(null);
      mostrarToast(`🗑️ "${producto.nombre}" eliminado`);

      eliminarProducto(producto.codigo, token).catch(() => {});
    },
    [inventario, persistir, mostrarToast]
  );

  const handleAgregarResena = useCallback(
    (codigo, resena) => {
      const token = (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null) || undefined;
      const resenaCompleta = {
        ...resena,
        fecha: new Date().toISOString().slice(0, 10),
      };

      const nuevaLista = inventario.map((p) => {
        if (p.codigo === codigo) {
          const resenasActuales = Array.isArray(p.resenas) ? p.resenas : [];
          return {
            ...p,
            resenas: [...resenasActuales, resenaCompleta],
          };
        }
        return p;
      });

      persistir(nuevaLista);

      setProductoInspeccionado((prev) => {
        if (prev && prev.codigo === codigo) {
          const resenasActuales = Array.isArray(prev.resenas) ? prev.resenas : [];
          return {
            ...prev,
            resenas: [...resenasActuales, resenaCompleta],
          };
        }
        return prev;
      });

      agregarResena(codigo, resena, token).catch(() => {});
    },
    [inventario, persistir]
  );

  const thStyle = {
    padding: '0.85rem 1rem', textAlign: 'left', color: 'var(--color-text-muted, #615E54)',
    fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #E2DDD0)',
    background: 'var(--color-surface-hover, #F3EFE3)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '0.85rem 1rem', borderBottom: '1px solid var(--color-border, #E2DDD0)',
    color: 'var(--color-text-main, #1A2413)', fontSize: '0.9rem', verticalAlign: 'middle',
  };

  return (
    <div style={{ fontFamily: 'var(--font-family)', padding: '1rem 0' }}>
      {/* Toast */}
      {toastMsg && (
        <div
          id="toast-admin"
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000,
            background: 'var(--color-primary, #1A2413)', border: '1px solid var(--color-accent, #D49B28)',
            borderRadius: 'var(--radius-sm, 4px)', padding: '1rem 1.5rem', color: 'var(--color-bg, #FAF8F2)',
            fontWeight: 700, fontSize: '0.9rem',
            boxShadow: 'var(--shadow-elevated)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--color-text-main, #1A2413)', fontSize: '1.85rem', fontWeight: 800 }}>
            📋 Gestión de Inventario
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted, #615E54)', fontSize: '0.92rem' }}>
            {inventario.length} productos registrados · {productosFiltrados.length} visibles en catálogo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-sync-mongo"
            onClick={sincronizarBackend}
            style={{
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #E2DDD0)',
              color: 'var(--color-text-main, #1A2413)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm, 4px)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            🔄 Sincronizar MongoDB
          </button>
          <button
            id="btn-nuevo-producto"
            onClick={() => setModalProducto({ ...PRODUCTO_VACIO, _esNuevo: true })}
            style={{
              background: 'var(--color-primary, #1A2413)',
              border: 'none', color: 'var(--color-bg, #FAF8F2)', padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm, 4px)', fontWeight: 700, cursor: 'pointer',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-hover, #29381E)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary, #1A2413)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* KPIs MongoDB */}
      <AdminMongoKpis
        metricas={metricasVisibles}
        cargando={cargandoMetricas}
        error={errorMetricas}
        onReintentar={sincronizarBackend}
      />

      {/* Query Bar NoSQL */}
      <MongoQueryBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        categoriaSeleccionada={filtroCategoria}
        onCategoriaChange={setFiltroCategoria}
        estadoSeleccionado={filtroEstado}
        onEstadoChange={setFiltroEstado}
        categorias={categoriasDisponibles}
        totalResultados={productosFiltrados.length}
        onLimpiar={() => {
          setBusqueda('');
          setFiltroCategoria('');
          setFiltroEstado('');
        }}
      />

      {/* Tabla */}
      <div
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--color-border, #E2DDD0)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table id="tabla-inventario" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Producto</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Precio</th>
                <th style={thStyle}>Stock</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-text-muted, #615E54)', padding: '3rem' }}>
                    Sin resultados para la búsqueda actual
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => {
                  const stockNum = Number(p.stock) || 0;
                  const critico = stockNum <= (p.stockCritico ?? 3);
                  return (
                    <tr
                      key={p.codigo}
                      id={`fila-${p.codigo}`}
                      style={{ transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover, #F3EFE3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={obtenerRutaImagen(p)}
                            alt={p.nombre}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{
                              width: '42px', height: '42px', objectFit: 'cover',
                              borderRadius: 'var(--radius-sm, 4px)',
                              border: '1px solid var(--color-border, #E2DDD0)',
                              background: 'var(--color-surface-hover, #F3EFE3)',
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main, #1A2413)', fontSize: '0.92rem' }}>
                              {p.nombre}
                            </div>
                            <div style={{ color: 'var(--color-text-muted, #615E54)', fontSize: '0.8rem' }}>
                              {p.codigo} · {p.marca}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: 'var(--color-surface-hover, #F3EFE3)',
                          color: 'var(--color-text-main, #1A2413)',
                          border: '1px solid var(--color-border, #E2DDD0)',
                          padding: '0.25rem 0.65rem', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 600,
                        }}>
                          {p.categoria}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--color-accent, #D49B28)', fontSize: '0.95rem' }}>
                        {formatearPrecioCLP(p.precio)}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            data-testid={`btn-stock-dec-${p.codigo}`}
                            aria-label={`Disminuir stock de ${p.nombre}`}
                            onClick={() => handleAjustarStock(p, -1)}
                            style={{
                              border: '1px solid var(--color-border, #E2DDD0)',
                              background: '#ffffff',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            -
                          </button>
                          <span style={{
                            background: critico ? 'var(--color-danger-bg, #FDF0F0)' : 'var(--color-success-bg, #EEF4E6)',
                            color: critico ? 'var(--color-danger, #A33A3A)' : 'var(--color-success, #4E632E)',
                            border: `1px solid ${critico ? 'rgba(163, 58, 58, 0.25)' : 'rgba(78, 99, 46, 0.25)'}`,
                            padding: '0.25rem 0.65rem', borderRadius: '20px',
                            fontWeight: 700, fontSize: '0.85rem',
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            minWidth: '40px', justifyContent: 'center',
                          }}>
                            {critico ? '⚠️ ' : ''}{stockNum}
                          </span>
                          <button
                            type="button"
                            data-testid={`btn-stock-inc-${p.codigo}`}
                            aria-label={`Aumentar stock de ${p.nombre}`}
                            onClick={() => handleAjustarStock(p, 1)}
                            style={{
                              border: '1px solid var(--color-border, #E2DDD0)',
                              background: '#ffffff',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            data-testid={`btn-inspeccionar-${p.codigo}`}
                            onClick={() => setProductoInspeccionado(p)}
                            style={{
                              background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #E2DDD0)',
                              color: 'var(--color-primary, #1A2413)', borderRadius: 'var(--radius-sm, 4px)', padding: '0.45rem 0.8rem',
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover, #F3EFE3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface, #ffffff)')}
                          >
                            🔍 BSON
                          </button>
                          <button
                            id={`btn-editar-${p.codigo}`}
                            onClick={() => setModalProducto({ ...p })}
                            style={{
                              background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #E2DDD0)',
                              color: 'var(--color-text-main, #1A2413)', borderRadius: 'var(--radius-sm, 4px)', padding: '0.45rem 0.8rem',
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover, #F3EFE3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface, #ffffff)')}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            id={`btn-eliminar-${p.codigo}`}
                            onClick={() => setModalEliminar(p)}
                            style={{
                              background: 'var(--color-danger-bg, #FDF0F0)', border: '1px solid rgba(163, 58, 58, 0.3)',
                              color: 'var(--color-danger, #A33A3A)', borderRadius: 'var(--radius-sm, 4px)', padding: '0.45rem 0.8rem',
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg, #FDF0F0)')}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {modalProducto && (
        <ModalProducto
          producto={modalProducto}
          onGuardar={handleGuardar}
          onCerrar={() => setModalProducto(null)}
        />
      )}
      {modalEliminar && (
        <ModalConfirmarEliminar
          producto={modalEliminar}
          onConfirmar={handleEliminar}
          onCerrar={() => setModalEliminar(null)}
        />
      )}

      {/* Drawer BSON */}
      <BsonDocumentDrawer
        producto={productoInspeccionado}
        abierto={Boolean(productoInspeccionado)}
        onCerrar={() => setProductoInspeccionado(null)}
        onAgregarResena={handleAgregarResena}
      />
    </div>
  );
}
