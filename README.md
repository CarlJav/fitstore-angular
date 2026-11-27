- INTEGRANTES: CARLOS JAVIER HIDALGO SOLIZ
- DESCRIPCION DEL PROYECTO
FitStore es una aplicación web desarrollada en Angular (con arquitectura standalone, estilos de Bootstrap y Css) orientada a la venta de equipamiento deportivo y accesorios fitness. Permite explorar el catálogo con filtros combinados de texto y categoría, consultar el detalle de productos, armar un carrito y registrar pedidos con validación de stock, revisar el historial filtrando por estado (Confirmado / Cancelado), inspeccionar el detalle de cada pedido por :id y cancelar pedidos confirmados devolviendo automáticamente las unidades al inventario, todo con persistencia local en IndexedDB.

## Tecnologías Utilizadas

* **Framework:** Angular (Standalone Components, Signals/Inputs/Outputs, Control Flow `@if` / `@for`)
* **Lenguaje:** TypeScript, HTML5, CSS3
* **Estilos y Diseño Responsivo:** Bootstrap 5
* **Persistencia de Datos:** IndexedDB (a través de `TiendaService`)
* **Enrutamiento:** Angular Router con rutas dinámicas (`:id`) y carga diferida (*Lazy Loading*)

## Funcionalidades Principales

* **Inicio (`/inicio`):** Pantalla de bienvenida con resumen y accesos rápidos a las secciones de la tienda.
* **Catálogo de Productos (`/catalogo`):** Visualización en tarjetas responsivas (`ProductoCardComponent`) con búsqueda por texto, filtro por categoría y control de stock en tiempo real.
* **Detalle de Producto (`/producto/:id`):** Vista individual con especificaciones, disponibilidad y opción de compra.
* **Registro de Pedido (`/registrar`):** Formulario reactivo con validaciones, selección de productos según stock disponible y cálculo automático de subtotales y total en Bolivianos (`Bs.`).
* **Historial de Pedidos (`/historial`):** Listado de pedidos registrados con formato de fecha (`date`) y moneda (`currency`), filtro por estado (`Confirmado` / `Cancelado`) y acceso al detalle.
* **Detalle y Cancelación (`/pedidos/:id`):** Consulta persistente por identificador (soporta recarga con `F5`), manejo de ID inexistente y cancelación con devolución automática de unidades al stock.

## Instalación y Ejecución Local
Clonar el repositorio:
git clone https://github.com/CarlJav/fitstore-angular.git

Entrar a la carpeta del proyecto e instalar dependencias:
cd fitstore-angular
npm install

Levantar el servidor de desarrollo:
ng serve

Abrir en el navegador:
Ingresa a http://localhost:4200/ en tu computadora, o ejecuta ng serve --host 0.0.0.0 para probar la aplicación desde un dispositivo móvil conectado a la misma red Wi-Fi.

## Estructura del Proyecto

```text
src/app/
├── components/     # Componentes visuales (Catalogo, ProductoCard, Registro, Historial, Detalle, etc.)
├── models/         # Interfaces y tipos de datos (Producto, Pedido, ItemPedido)
├── services/       # TiendaService (lógica de negocio y conexión con IndexedDB)
├── app.routes.ts   # Definición de rutas y navegación
└── app.ts / .html  # Componente raíz con barra de navegación responsiva y footer

