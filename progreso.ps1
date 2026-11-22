# ==============================================================================
# Sonido Vivo - Asistente Local de Progreso y AI Task Coach
# Evalua el codigo fuente y muestra el estado del proyecto en tiempo real
# ==============================================================================

[CmdletBinding()]
param()

$baseDir = Join-Path $PSScriptRoot "fullstack-react-parcial-1"

function Test-FileRel($relPath) {
    return Test-Path (Join-Path $baseDir $relPath)
}

function Test-ContentRel($relPath, $text) {
    $fullPath = Join-Path $baseDir $relPath
    if (-not (Test-Path $fullPath)) { return $false }
    $content = Get-Content -Path $fullPath -Raw -ErrorAction SilentlyContinue
    return ($content -and $content.Contains($text))
}

$tasks = @(
    # --- UNIDAD 2: FRONTEND REACT Y PRUEBAS ---
    @{
        Id = 1
        Tag = "Tarea 01"
        Title = "Setup de Arquitectura, Vite, Vitest y Bootstrap"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "vite.config.js") -and (Test-FileRel "src/setupTests.js") -and (Test-FileRel "package.json") }
        Tip = "Configura Vite con el plugin de React, Vitest para jsdom y carga los estilos de Bootstrap en src/main.jsx."
    },
    @{
        Id = 2
        Tag = "Tarea 02"
        Title = "Motor de Utilidades y Reglas de Negocio (RUT, IVA y Stock)"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/utils/validaciones.js") -and (Test-FileRel "src/utils/finanzas.js") -and (Test-FileRel "src/utils/stock.js") }
        Tip = "Implementa el algoritmo Modulo 11 en validaciones.js, el calculo de IVA 19% en finanzas.js y el stock critico en stock.js con sus tests."
    },
    @{
        Id = 3
        Tag = "Tarea 03"
        Title = "Estado Global del Carrito con CartContext y Custom Hook useContador"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/context/CartContext.jsx") -and (Test-FileRel "src/hooks/useContador.js") }
        Tip = "Crea el CartProvider con persistencia en localStorage y el custom hook useContador con limites de stock minimo y maximo."
    },
    @{
        Id = 4
        Tag = "Tarea 04"
        Title = "Capa de Servicios HTTP y Catalogo de Datos Maestro"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/services/api.js") -and (Test-FileRel "src/data/productos.js") }
        Tip = "Configura la instancia de Axios en api.js y exporta el catalogo de 51 productos en src/data/productos.js."
    },
    @{
        Id = 5
        Tag = "Tarea 05"
        Title = "Navegacion Global (Navbar, Footer) y Landing Page Home"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/components/Navbar.jsx") -and (Test-FileRel "src/pages/Home.jsx") }
        Tip = "Construye la barra de navegacion con el badge reactivo del carrito, el Footer y la vista Home con sus secciones modulares."
    },
    @{
        Id = 6
        Tag = "Tarea 06"
        Title = "Catalogo de Productos Completo con Filtros y Buscador"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/pages/Productos.jsx") -and (Test-ContentRel "src/App.jsx" "Productos") }
        Tip = "Construye src/pages/Productos.jsx con buscador en tiempo real, filtros por categoria con chips y conecta la ruta /productos en App.jsx."
    },
    @{
        Id = 7
        Tag = "Tarea 07"
        Title = "Ficha Tecnica de Producto Individual (ProductDetail)"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/pages/ProductoDetalle.jsx") -and (Test-ContentRel "src/App.jsx" "ProductoDetalle") }
        Tip = "Crea src/pages/ProductoDetalle.jsx usando useParams para obtener el :codigo del producto, integrando selector de cantidad useContador y boton de agregar."
    },
    @{
        Id = 8
        Tag = "Tarea 08"
        Title = "Carrito de Compras Interactivo y Resumen Fiscal"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/Carrito.jsx") -and (Test-ContentRel "src/App.jsx" "Carrito") }
        Tip = "Crea src/pages/Carrito.jsx conectado al CartContext, con tabla interactiva, desglose de IVA 19% y total CLP, estado vacio amigable y boton de checkout."
    },
    @{
        Id = 9
        Tag = "Tarea 09"
        Title = "Formularios de Autenticacion (Login) y Registro con Validacion Reactiva"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/Login.jsx") -and (Test-FileRel "src/pages/Registro.jsx") -and (Test-ContentRel "src/App.jsx" "Login") }
        Tip = "Crea src/pages/Login.jsx y src/pages/Registro.jsx con validacion reactiva de RUT (Modulo 11) y selectores en cascada Region-Comuna."
    },
    @{
        Id = 10
        Tag = "Tarea 10"
        Title = "Paginas Institucionales (Nosotros, Contacto y Blogs)"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/pages/Nosotros.jsx") -and (Test-FileRel "src/pages/Contacto.jsx") -and (Test-ContentRel "src/App.jsx" "Contacto") }
        Tip = "Implementa Nosotros.jsx y Contacto.jsx con contador reactivo de caracteres (limite 500) y conecta sus enlaces en el Navbar y Footer."
    },
    @{
        Id = 11
        Tag = "Tarea 11"
        Title = "Modulo Administrativo (Dashboard y CRUD de Inventario)"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/pages/admin/AdminDashboard.jsx") -and (Test-FileRel "src/pages/admin/AdminProductos.jsx") }
        Tip = "Construye el panel administrativo con metricas de catalogo, stock critico y tabla CRUD interactiva para administrar productos."
    },
    @{
        Id = 12
        Tag = "Tarea 12"
        Title = "Suite Integral de Pruebas Unitarias, Cobertura y Accesibilidad"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/pages/Productos.test.jsx") -and (Test-FileRel "src/pages/Carrito.test.jsx") -and (Test-FileRel "src/components/ProductCard.a11y.test.jsx") }
        Tip = "Escribe pruebas de componentes con Testing Library para las paginas principales y valida accesibilidad con jest-axe hasta superar el 80% de cobertura."
    },
    @{
        Id = 13
        Tag = "Tarea 13"
        Title = "Vistas de Categorias y Ofertas con Grid Filtrado"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/pages/Categorias.jsx") -and (Test-FileRel "src/pages/Ofertas.jsx") }
        Tip = "Crear vistas especializadas de Categorias y Ofertas con grilla responsiva reutilizando ProductCard."
    },
    @{
        Id = 14
        Tag = "Tarea 14"
        Title = "Checkout con Formulario de Envio y Validaciones"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/Checkout.jsx") -and (Test-FileRel "src/components/checkout/ResumenPedido.jsx") }
        Tip = "Implementar vista Checkout con selectores dependientes de region/comuna y resumen tributario de pedido."
    },
    @{
        Id = 15
        Tag = "Tarea 15"
        Title = "Vistas de Compra Exitosa y Pago Fallido con Comprobante"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/CompraExitosa.jsx") -and (Test-FileRel "src/pages/PagoFallido.jsx") }
        Tip = "Crear paginas de confirmacion y fallo de transaccion con desglose de orden."
    },
    @{
        Id = 16
        Tag = "Tarea 16"
        Title = "Mantenedor de Usuarios con Roles y Permisos en Admin"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/admin/AdminUsuarios.jsx") -and (Test-ContentRel "src/App.jsx" "AdminUsuarios") }
        Tip = "Desarrollar mantenedor CRUD de cuentas de usuario con roles de Administrador, Vendedor y Cliente."
    },
    @{
        Id = 17
        Tag = "Tarea 17"
        Title = "Pruebas de Paginas Institucionales y Ficha de Producto"
        Responsable = "Daakhen"
        Check = { (Test-FileRel "src/pages/Nosotros.test.jsx") -and (Test-FileRel "src/pages/Blogs.test.jsx") -and (Test-FileRel "src/pages/ProductoDetalle.test.jsx") }
        Tip = "Escribir suites de pruebas para vistas institucionales y detalle de producto."
    },
    @{
        Id = 18
        Tag = "Tarea 18"
        Title = "Pruebas del Panel Administrativo de Productos y Usuarios"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/pages/admin/AdminProductos.test.jsx") -and (Test-FileRel "src/pages/admin/AdminUsuarios.test.jsx") }
        Tip = "Crear pruebas unitarias para flujos de alta, modificacion y eliminacion de usuarios y productos."
    },
    @{
        Id = 19
        Tag = "Tarea 19"
        Title = "Validacion de Autenticacion en Checkout y Redireccion"
        Responsable = "NezerkC"
        Check = { (Test-ContentRel "src/pages/Checkout.jsx" "useAuth") }
        Tip = "Conectar Checkout al estado de sesion para autocompletar datos del comprador y proteger la orden."
    },
    @{
        Id = 20
        Tag = "Tarea 20"
        Title = "Persistencia de Ordenes y Almacenamiento Local"
        Responsable = "NezerkC"
        Check = { (Test-ContentRel "src/utils/checkout.js" "sonido_vivo_ordenes") -or (Test-ContentRel "src/pages/Checkout.jsx" "localStorage") }
        Tip = "Registrar ordenes confirmadas en almacenamiento local con fecha, items, datos de entrega y total fiscal."
    },
    @{
        Id = 21
        Tag = "Tarea 21"
        Title = "Pruebas Integrales de Checkout, Auth y Despliegue Docker"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/pages/Checkout.test.jsx") -and (Test-Path (Join-Path $PSScriptRoot "Dockerfile")) }
        Tip = "Validar el flujo de compra simulado con pruebas unitarias y verificar el empaquetado OCI multi-stage."
    },

    # --- UNIDAD 3: FRONTEND OMNICANAL, MONGODB REST Y MODULARIZACION ---
    @{
        Id = 22
        Tag = "Tarea 22"
        Title = "[FE-01] Adaptador HTTP y Cliente NoSQL (productoService.js)"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/services/productoService.js") -and (Test-FileRel "src/services/productoService.test.js") }
        Tip = "Implementa productoService.js con JWT Bearer, mapeo DTO MongoDB, mutaciones atomicas y fallback offline con tests."
    },
    @{
        Id = 23
        Tag = "Tarea 23"
        Title = "[FE-02] Metricas de Agregacion MongoDB (AdminMongoKpis.jsx)"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/components/admin/AdminMongoKpis.jsx") -and (Test-FileRel "src/components/admin/AdminMongoKpis.test.jsx") }
        Tip = "Crea AdminMongoKpis.jsx con capital total CLP, unidades/categorias activas, alerta de stock critico <= 3 y tests."
    },
    @{
        Id = 24
        Tag = "Tarea 24"
        Title = "[FE-03] Query Builder Polimorfico NoSQL (MongoQueryBar.jsx)"
        Responsable = "dysandoval"
        Check = { (Test-FileRel "src/components/admin/MongoQueryBar.jsx") -and (Test-FileRel "src/components/admin/MongoQueryBar.test.jsx") }
        Tip = "Crea MongoQueryBar.jsx con busqueda full-text, chips de categorias, filtro por estado de documento y tests."
    },
    @{
        Id = 25
        Tag = "Tarea 25"
        Title = "[FE-04] Inspector Lateral BSON & Resenas (BsonDocumentDrawer)"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/components/admin/BsonDocumentDrawer.jsx") -and (Test-FileRel "src/components/admin/BsonDocumentDrawer.test.jsx") }
        Tip = "Implementa BsonDocumentDrawer.jsx para inspeccionar documentos BSON y gestionar resenas embebidas."
    },
    @{
        Id = 26
        Tag = "Tarea 26"
        Title = "[FE-05] Integracion AdminProductos y Suite de Regresion"
        Responsable = "NezerkC"
        Check = { (Test-ContentRel "src/pages/admin/AdminProductos.jsx" "AdminMongoKpis") -and (Test-ContentRel "src/pages/admin/AdminProductos.jsx" "MongoQueryBar") -and (Test-ContentRel "src/pages/admin/AdminProductos.jsx" "BsonDocumentDrawer") }
        Tip = "Integra AdminMongoKpis, MongoQueryBar y BsonDocumentDrawer en AdminProductos.jsx con tests de regresion."
    },
    @{
        Id = 27
        Tag = "Tarea 27"
        Title = "[FE-06] Filtro Dinamico y Busqueda Publica (Productos.jsx)"
        Responsable = "Daakhen"
        Check = { (Test-ContentRel "src/services/productoService.js" "/api/v1/public/products") -and (Test-ContentRel "src/pages/Productos.jsx" "productoService") }
        Tip = "Conecta Productos.jsx a /api/v1/public/products con fallback offline, categorias dinamicas y busqueda con debounce."
    },
    @{
        Id = 28
        Tag = "Tarea 28"
        Title = "[FE-07] Confirmacion Visual y Simulacion de Pago (Checkout)"
        Responsable = "NezerkC"
        Check = { ((Test-ContentRel "src/pages/Checkout.jsx" "/api/v1/store/sales") -or (Test-ContentRel "src/services/ventaService.js" "/api/v1/store/sales") -or (Test-ContentRel "src/services/productoService.js" "/api/v1/store/sales")) -and ((Test-ContentRel "src/pages/Checkout.jsx" "WebPay") -or (Test-ContentRel "src/pages/Checkout.jsx" "metodoPago")) }
        Tip = "Agrega seleccion de metodo de pago (WebPay/Transferencia), facturacion, validacion de stock y POST /api/v1/store/sales en Checkout.jsx."
    },
    @{
        Id = 29
        Tag = "Tarea 29"
        Title = "[FE-08] Modularizacion Landing Independiente (showcase/)"
        Responsable = "NezerkC"
        Check = { (Test-FileRel "src/components/showcase/ProductShowcaseGrid.jsx") -and (Test-FileRel "src/components/showcase/MiniCartDrawer.jsx") }
        Tip = "Desacopla ProductShowcaseGrid y MiniCartDrawer en src/components/showcase/ y documenta su integracion en README.md."
    }
)

# Evaluacion
$completedCount = 0
$firstPending = $null
$evaluatedTasks = @()

foreach ($t in $tasks) {
    $isDone = & $t.Check
    $status = ""
    if ($isDone) {
        $status = "[LISTO]"
        $completedCount++
    } elseif (-not $firstPending) {
        $status = "[EN CURSO]"
        $firstPending = $t
    } else {
        $status = "[PENDIENTE]"
    }
    $evaluatedTasks += [PSCustomObject]@{
        Tag = $t.Tag
        Estado = $status
        Tarea = $t.Title
        Responsable = $t.Responsable
        Tip = $t.Tip
    }
}

$totalTasks = $tasks.Count
$percentage = [math]::Round(($completedCount / $totalTasks) * 100, 1)

# Renderizado en consola
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " SONIDO VIVO :: AUTOPILOT DE PROGRESO Y SEGUIMIENTO DE PROYECTO               " -ForegroundColor Cyan
Write-Host " Repositorio: NezerkC/fullstack_2 | DSY1104 FullStack II - Duoc UC             " -ForegroundColor DarkCyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Barra de progreso
$barTotal = 30
$barFilled = [math]::Floor(($completedCount / $totalTasks) * $barTotal)
$barEmpty = $barTotal - $barFilled
$bar = ("=" * $barFilled) + ("-" * $barEmpty)

Write-Host "  AVANCE GLOBAL: [$bar] $percentage% ($completedCount/$totalTasks Tareas)" -ForegroundColor Yellow
Write-Host ""
Write-Host ("  {0,-10} {1,-12} {2,-50} {3,-12}" -f "CODIGO", "ESTADO", "TAREA", "RESPONSABLE") -ForegroundColor Gray
Write-Host ("  {0,-10} {1,-12} {2,-50} {3,-12}" -f "------", "------", "-----", "-----------") -ForegroundColor Gray

foreach ($et in $evaluatedTasks) {
    $color = "Gray"
    if ($et.Estado -eq "[LISTO]") { $color = "Green" }
    elseif ($et.Estado -eq "[EN CURSO]") { $color = "Yellow" }

    $shortTitle = $et.Tarea
    if ($shortTitle.Length -gt 48) { $shortTitle = $shortTitle.Substring(0, 45) + "..." }

    Write-Host ("  {0,-10} {1,-12} {2,-50} {3,-12}" -f $et.Tag, $et.Estado, $shortTitle, $et.Responsable) -ForegroundColor $color
}

Write-Host ""
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray

if ($firstPending) {
    Write-Host " [!] QUE TOCA HACER AHORA (UNIDAD 3 - FRONTEND OMNICANAL):" -ForegroundColor Magenta
    Write-Host "     Tarea Activa: " -NoNewline -ForegroundColor White
    Write-Host "$($firstPending.Tag) - $($firstPending.Title)" -ForegroundColor Yellow
    Write-Host "     Asignado a:   " -NoNewline -ForegroundColor White
    Write-Host "$($firstPending.Responsable)" -ForegroundColor Cyan
    Write-Host "     Instruccion:  " -NoNewline -ForegroundColor White
    Write-Host "$($firstPending.Tip)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "     Para avanzar en el chat, solo di: 'avancemos'." -ForegroundColor DarkYellow
} else {
    Write-Host " [V] FELICITACIONES: Todas las tareas estan completadas al 100%!" -ForegroundColor Green
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
