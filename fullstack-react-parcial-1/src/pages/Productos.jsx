import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import FiltrosCatalogo from '../components/FiltrosCatalogo';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { obtenerCatalogoActivo } from '../data/productos';
import { extraerCategoriasUnicas, obtenerProductosPublicos } from '../services/productoService';

function Productos({ debounceMs = 200 } = {}) {
  const { addToCart } = useCart();
  const [catalogo, setCatalogo] = useState(() => obtenerCatalogoActivo());

  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [orden, setOrden] = useState('relevancia');

  useEffect(() => {
    let activo = true;

    async function cargarCatalogo() {
      try {
        const productosRemotos = await obtenerProductosPublicos();
        if (activo && Array.isArray(productosRemotos) && productosRemotos.length > 0) {
          setCatalogo(productosRemotos);
        }
      } catch {
        // Fallback manejado internamente o conserva catálogo local activo
      }
    }

    cargarCatalogo();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setBusquedaDebounced(busqueda);
      },
      busqueda.trim() === '' ? 0 : debounceMs
    );

    return () => {
      clearTimeout(timer);
    };
  }, [busqueda, debounceMs]);

  const categoriasDisponibles = useMemo(
    () => extraerCategoriasUnicas(catalogo),
    [catalogo]
  );

  const productosFiltrados = useMemo(() => {
    let resultado = [...catalogo];

    // Filtro por categoría
    if (categoriaSeleccionada !== 'Todas') {
      resultado = resultado.filter(
        (p) => (p.categoria || '').toLowerCase() === categoriaSeleccionada.toLowerCase()
      );
    }

    // Filtro por búsqueda de texto debounced
    const query = busquedaDebounced.trim().toLowerCase();
    if (query) {
      resultado = resultado.filter((p) => {
        const texto = `${p.nombre || ''} ${p.categoria || ''} ${p.marca || ''} ${p.modelo || ''} ${p.codigo || ''} ${p.descripcion || ''}`.toLowerCase();
        return texto.includes(query);
      });
    }

    // Ordenamiento
    if (orden === 'precio-asc') {
      resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (orden === 'precio-desc') {
      resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
    } else if (orden === 'nombre-asc') {
      resultado.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else if (orden === 'nombre-desc') {
      resultado.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    }

    return resultado;
  }, [catalogo, categoriaSeleccionada, busquedaDebounced, orden]);

  return (
    <Container className="py-4 catalogo-page" as="section" aria-label="Catálogo completo de productos">
      <header className="mb-4">
        <h1 className="h2 fw-bold">Catálogo de Instrumentos y Audio</h1>
        <p className="text-muted mb-0">
          Explora nuestra selección completa de guitarras, teclados, amplificadores y accesorios con garantía oficial.
        </p>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <FiltrosCatalogo
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        categoriaSeleccionada={categoriaSeleccionada}
        onCategoriaChange={setCategoriaSeleccionada}
        orden={orden}
        onOrdenChange={setOrden}
        totalResultados={productosFiltrados.length}
        categorias={categoriasDisponibles}
      />

      {/* Grilla de Productos */}
      {productosFiltrados.length > 0 ? (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4" data-testid="products-grid">
          {productosFiltrados.map((producto) => (
            <Col key={producto.codigo}>
              <ProductCard producto={producto} onAddToCart={addToCart} />
            </Col>
          ))}
        </Row>
      ) : (
        <div
          className="text-center py-5 border rounded bg-white shadow-sm my-4"
          data-testid="no-products-message"
        >
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h2 className="h4 mt-3">No encontramos instrumentos para tu búsqueda</h2>
          <p className="text-muted">
            Intenta cambiar los términos o restablece los filtros por categoría.
          </p>
        </div>
      )}
    </Container>
  );
}

Productos.propTypes = {
  debounceMs: PropTypes.number,
};

export default Productos;
