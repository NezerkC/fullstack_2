# Sonido Vivo — Plataforma Web de E-commerce y Gestión (Migración a React)

**Asignatura:** DSY1104 FullStack II — Duoc UC  
**Equipo de Desarrollo:** NezerkC, Daakhen, dysandoval  
**Stack Tecnológico:** React 19 · Vite 8 · React-Bootstrap · React Router 7 · Vitest 5 · Testing Library · jest-axe · Axios · Docker (Multi-stage OCI) · Nginx Alpine  

---

> [!NOTE]
> ### 🏛️ ¿Dónde está el proyecto anterior (HTML / CSS / JS Vanilla)?
> Todo el código, estilos, scripts, informe ERS y presentación de la **Etapa 1 (HTML estático)** se encuentra respaldado e intacto en la rama dedicada:  
> 👉 **[`proyecto-html-base`](https://github.com/NezerkC/Prueba-Parcial-1/tree/proyecto-html-base)**
>
> La rama **`main`** contiene exclusivamente la **Migración a React** y la arquitectura de despliegue en contenedores.

---

## 1. Estructura del Repositorio (`main`)

```text
Prueba-Parcial-1/
│
├── fullstack-react-parcial-1/       # ⚛️ Aplicación Principal en React (SPA)
│   ├── public/assets/img/           # 56 recursos multimedia (instrumentos, logos SVG, videos MP4)
│   ├── src/
│   │   ├── components/              # Componentes UI reutilizables
│   │   │   ├── common/              # Navbar, Footer, ProductCard, ProductGrid, FiltrosCatalogo, CartToast
│   │   │   ├── home/                # HeroSection, FeaturedProducts, CustomObjectsSection, ModalCrearObjeto
│   │   │   ├── checkout/            # ResumenPedido y componentes del flujo de compra
│   │   │   ├── contacto/            # FormularioContacto (validación reactiva), DatosTienda, Horarios
│   │   │   └── blogs/               # BlogCard y VideoArticulo
│   │   ├── context/                 # Estado global transversal (React Context API)
│   │   │   ├── AuthContext.jsx      # Sesión, roles (Admin/Cliente/Vendedor) y persistencia en localStorage
│   │   │   └── CartContext.jsx      # Carrito, cálculo de IVA (19%), cantidades y storage reactivo
│   │   ├── data/                    # Catálogo simulado (productos.js) y división política (regiones.js)
│   │   ├── hooks/                   # Custom Hooks (useContador con cotas y límites de stock)
│   │   ├── pages/                   # Vistas principales / Contenedores (Smart Components)
│   │   │   ├── Home.jsx, Productos.jsx, ProductoDetalle.jsx, Categorias.jsx, Ofertas.jsx
│   │   │   ├── Login.jsx, Registro.jsx, Carrito.jsx, Checkout.jsx, CompraExitosa.jsx, PagoFallido.jsx
│   │   │   └── admin/               # Panel Administrativo protegido por roles
│   │   │       ├── AdminDashboard.jsx   # Resumen de métricas y accesos rápidos
│   │   │       ├── AdminProductos.jsx   # Mantenedor CRUD de catálogo e inventario
│   │   │       └── AdminUsuarios.jsx    # Mantenedor de cuentas, roles y estados
│   │   ├── services/                # Capa de consumo HTTP con Axios (api.js, ServicioAPI.js)
│   │   ├── utils/                   # Lógica pura de negocio (RUT Módulo 11, finanzas/IVA, stock, checkout)
│   │   ├── App.jsx                  # Enrutador principal y Route Guards (<RutaAdmin>)
│   │   └── index.css                # Sistema de diseño Olivini Gold + Bootstrap 5
│   ├── buildspec.yml                # Configuración CI/CD para AWS CodeBuild
│   ├── package.json                 # Dependencias y scripts de la app cliente
│   └── vite.config.js               # Configuración de Vite, Vitest (jsdom) y cobertura V8
│
├── docs/                            # 📚 Documentación Técnica, Arquitectura y Rúbricas
│   ├── arquitectura-docker-despliegue.md   # Especificación de contenedores OCI multi-stage y Nginx
│   ├── Defensa_Tecnica_Arquitectura_React_EP2.md  # Justificación técnica de patrones, Clean Architecture y a11y
│   ├── Informe_Cobertura_Testing_Sonido_Vivo_EP2.docx # Reporte formal de métricas de cobertura
│   └── migracion/                   # Guías de arquitectura, Atomic Design, TDD y Git
│
├── Dockerfile                       # Construcción multi-etapa: Builder (Node 20) -> Runner (Nginx Alpine)
├── docker-compose.yml               # Orquestación de contenedor con healthcheck (puerto 3050:80)
├── nginx.conf                       # Configuración Nginx de producción: compresión Gzip y fallback SPA
├── .github/workflows/ci.yml         # 🤖 Pipeline CI en GitHub Actions (Linter + Vitest + Build)
├── .devcontainer/                   # ☁️ Configuración lista para GitHub Codespaces
└── package.json                     # Orquestador raíz (npm workspaces)
```

---

## 2. Inicio Rápido

### Opción A: Entorno Local de Desarrollo (Node.js / Vite)

```bash
# 1. Clonar o sincronizar la rama principal
git switch main
git pull origin main

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo en http://localhost:5173
npm run dev
```

### Opción B: Ejecución Contenerizada (Docker & Docker Compose)

Construye una imagen ultraligera optimizada con Nginx Alpine (<30 MB) con compresión Gzip y soporte para enrutamiento SPA:

```bash
# Construir y levantar el contenedor en segundo plano
docker compose up --build -d

# Acceder en el navegador:
# http://localhost:3050
```

Para detener el servicio:
```bash
docker compose down
```

---

## 3. Pruebas Unitarias y Cobertura (Vitest + V8)

La suite cuenta con **más de 110 pruebas unitarias automatizadas** distribuidas en 30 archivos de prueba (`.test.jsx` / `.test.js`), ejecutadas en un entorno virtual DOM aislado (`jsdom`) con instrumentación V8 nativa:

```bash
# Ejecutar todas las pruebas unitarias en una sola pasada
npm run test:run

# Generar reporte completo de cobertura de código
npm run coverage

# Ejecutar el linter de código (ESLint)
npm run lint

# Compilar bundle estático para producción (/dist)
npm run build
```

### Métricas de Cobertura Obtenidas (V8):

| Métrica | Meta Rúbrica Duoc | Cobertura Obtenida | Estado |
| :--- | :---: | :---: | :---: |
| **Líneas** | 80% | **> 85%** | ✅ Cumplido |
| **Sentencias (Stmts)** | 80% | **> 84%** | ✅ Cumplido |
| **Funciones** | 70% | **> 77%** | ✅ Cumplido |
| **Ramas (Branches)** | 70% | **> 76%** | ✅ Cumplido |

---

## 4. Usuarios y Roles de Demostración

Para probar los flujos con control de acceso y roles (`AuthContext`):

| Rol | Correo Electrónico | Contraseña | Permisos y Vistas |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@profesor.duoc.cl` | `123456` | Acceso completo a `/admin`, mantenedor de productos e inventario, y mantenedor de usuarios y roles. |
| **Cliente** | `cliente@duoc.cl` | `pass12` | Catálogo, carrito, checkout con autocompletado de datos de envío y compra simulada. |
| **Cliente Alternativo** | `usuario@gmail.com` | `pass12` | Cuenta cliente con dirección en Región Metropolitana. |

---

## 5. Mapa de Ramas y Flujo Colaborativo en Git

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │ main (Rama de Producción / Estable / Solo Pull Requests)               │
 └───────▲───────────────────────▲────────────────────────▲───────────────┘
         │ PR                    │ PR                     │ PR
 ┌───────┴──────────────┐ ┌──────┴──────────────┐  ┌──────┴───────────────┐
 │ componentes          │ │ test                │  │ desing               │
 │ (Lógica JSX / Vistas)│ │ (Vitest / A11y)     │  │ (CSS / Olivini Gold) │
 └──────────────────────┘ └─────────────────────┘  └──────────────────────┘

 📦 proyecto-html-base  --> Rama histórica con el proyecto HTML/CSS/JS original intacto
```

### Asignación de Roles del Equipo (ver [`docs/migracion/06`](docs/migracion/06-flujo-colaborativo-git-ramas-y-trabajo-en-equipo.md))

| Integrante | Rol Principal | Entregables Clave |
| :--- | :--- | :--- |
| **NezerkC** | *Arquitectura, Auth, Carrito & Admin* | Enrutamiento en `App.jsx`, Setup Vite/Vitest, Login/Registro, Carrito/Checkout, Mantenedor de Usuarios (`AdminUsuarios`) e Infraestructura Docker. |
| **Daakhen** | *Catálogo, Vistas & Diseño* | Catálogo con filtros y ordenamiento (`Productos.jsx`), Ficha de Producto (`ProductoDetalle.jsx`), Instrumentos Personalizados, Nosotros y Blogs. |
| **dysandoval** | *Admin Productos, Validación & TDD* | Dashboard y mantenedor CRUD de Productos (`AdminProductos`), utilidades de cálculo tributario (IVA) y suite de pruebas unitarias. |

---

## 6. Estándar de Commits (Conventional Commits)

```bash
git commit -m "feat(catalogo): implementar filtro por categoria y buscador en vivo"
git commit -m "feat(carrito): construir tabla de productos y resumen de pago con IVA"
git commit -m "test(validaciones): agregar pruebas de borde para formulario de registro"
git commit -m "style(ui): ajustar espaciado responsive en tarjetas de producto"
git commit -m "feat(infra): agregar dockerfile multi-stage y compose con nginx"
```

---

## 7. Extracción Modular de Landing Comercial (Showcase)

Para facilitar la reutilización de componentes en sitios comerciales o páginas de aterrizaje independientes sin acoplamiento a enrutadores (`react-router-dom`) ni contextos globales (`CartContext`), el paquete incluye el módulo `showcase`:

```javascript
import { ProductShowcaseGrid, MiniCartDrawer } from './src/components/showcase';
```

### Componentes Disponibles

#### `<ProductShowcaseGrid />`
Catálogo en cuadrícula con diseño responsivo, soporte de tematización mediante variables CSS y filtrado dinámico por categorías.

- **Props:**
  - `productos` (`Array<Object>`): Lista de productos a renderizar (`codigo`, `nombre`, `precio`, `stock`, `categoria`, `imagen`).
  - `brandConfig` (`Object`): Configuración de marca (`nombre`, `tagline`, `colorPrimario`, `colorAcento`, `logoUrl`, `ctaTexto`).
  - `onAddToCart` (`Function`): Callback ejecutado al presionar el botón de compra `(producto) => void`.
  - `onSelectProduct` (`Function`, opcional): Callback al hacer clic en la tarjeta o título del producto.
  - `mostrarFiltros` (`Boolean`, default `true`): Habilita o deshabilita los botones de filtro por categoría.
  - `categoriaInicial` (`String`, default `'Todas'`): Categoría preseleccionada.

#### `<MiniCartDrawer />`
Panel lateral (`Offcanvas`) completamente controlado por props para visualizar el carrito, ajustar cantidades y calcular desglose tributario (Subtotal neto, IVA 19% y Total CLP).

- **Props:**
  - `isOpen` (`Boolean`, requerido): Controla la visibilidad del drawer.
  - `onClose` (`Function`, requerido): Callback ejecutado al cerrar el panel.
  - `items` (`Array<Object>`): Artículos en el carrito (`codigo`, `nombre`, `precio`, `cantidad`).
  - `onUpdateQuantity` (`Function`): Callback `(codigo, nuevaCantidad) => void`.
  - `onRemoveItem` (`Function`): Callback `(codigo) => void`.
  - `onClearCart` (`Function`, opcional): Callback para vaciar el carrito completo.
  - `onCheckout` (`Function`): Callback ejecutado al presionar el botón de pago.
  - `brandConfig` (`Object`): Configuración de estilos (`nombre`, `colorPrimario`, `colorAcento`).
  - `titulo` (`String`, default `'Tu Carrito'`): Título del encabezado.

### Ejemplo de Integración en Landing Independiente

```jsx
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { ProductShowcaseGrid, MiniCartDrawer } from './src/components/showcase';

const CATALOGO = [
  {
    codigo: 'G-01',
    nombre: 'Guitarra Custom Luthier',
    precio: 350000,
    stock: 3,
    categoria: 'Guitarras',
    imagen: 'https://images.unsplash.com/photo-guitar.jpg',
  },
  {
    codigo: 'B-01',
    nombre: 'Bajo Jazz Master',
    precio: 420000,
    stock: 0,
    categoria: 'Bajos',
    imagen: 'https://images.unsplash.com/photo-bass.jpg',
  },
];

export default function LandingComercial() {
  const [cartItems, setCartItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const brandConfig = {
    nombre: 'Olivini Exclusive',
    tagline: 'Instrumentos y Alta Fidelidad Musical',
    colorPrimario: '#121212',
    colorAcento: '#c5a059',
    ctaTexto: 'Comprar',
  };

  const handleAddToCart = (producto) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.codigo === producto.codigo);
      if (exists) {
        return prev.map((item) =>
          item.codigo === producto.codigo
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    setIsDrawerOpen(true);
  };

  const handleUpdateQuantity = (codigo, nextQty) => {
    if (nextQty <= 0) {
      handleRemoveItem(codigo);
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.codigo === codigo ? { ...i, cantidad: nextQty } : i))
      );
    }
  };

  const handleRemoveItem = (codigo) => {
    setCartItems((prev) => prev.filter((i) => i.codigo !== codigo));
  };

  return (
    <main>
      <header className="p-3 d-flex justify-content-end bg-dark">
        <Button variant="warning" onClick={() => setIsDrawerOpen(true)}>
          Ver Carrito ({cartItems.reduce((acc, i) => acc + i.cantidad, 0)})
        </Button>
      </header>

      <ProductShowcaseGrid
        productos={CATALOGO}
        brandConfig={brandConfig}
        onAddToCart={handleAddToCart}
      />

      <MiniCartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={cartItems}
        brandConfig={brandConfig}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        onCheckout={() => alert('Redirigiendo a pasarela de pagos...')}
      />
    </main>
  );
}
```

