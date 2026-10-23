# Especificación de Interfaces (UI) y Arquitectura SASS (7-1) - Solaris Nexus Studio

## 1. Filosofía de Interfaz: Componentes Huecos (Skeleton Pattern)

Para erradicar la duplicación de código HTML, CSS y JavaScript en vistas repetitivas, Solaris Nexus Studio adopta el patrón de **Componentes Huecos (Hollow Components)**:

```
+-----------------------------------------------------------+
|                   COMPONENTE HUECO (ESQUELETO)            |
|   Contenedor semántico con slots mínimos y data-attributes|
+-----------------------------------------------------------+
                             ▲
                             │ Inyección de Datos y Contratos
+----------------------------┴------------------------------+
|                  HELPER / UTILIDAD UI                     |
|  Funciones puras de renderizado, paginación y formateo    |
+-----------------------------------------------------------+
```

### Reglas del Patrón:
1. **Reducción Drástica de HTML:** Las vistas `.html` contienen únicamente el marco estructural (`<div class="nexus-card" data-component="..."></div>`) sin maquetación repetitiva de filas, botones o paginadores quemados en el código.
2. **Inyección Dinámica por Helper:** Un helper de JavaScript o TypeScript (`NexusComponents`) recibe la configuración y los datos, e hidrata el esqueleto dinámicamente.
3. **Mantenibilidad Cero-Duplicación:** Si se actualiza el diseño de la paginación o el estado vacío, se modifica un solo archivo de helper y el cambio se propaga instantáneamente a todas las tablas del sistema.

---

## 2. Arquitectura de Estilos SASS (Patrón 7-1)

Los estilos se organizan bajo el estándar industrial SASS 7-1 dentro de `public/assets/scss/`:

```text
public/assets/scss/
├── abstracts/
│   ├── _variables.scss      # Paleta de colores sci-fi, tipografías, espaciados
│   ├── _mixins.scss         # Flexbox, Grid, breakpoints, scrollbars personalizados
│   └── _functions.scss      # Conversión px a rem, cálculo de contraste
├── base/
│   ├── _reset.scss          # Normalización de márgenes y box-sizing: border-box
│   ├── _typography.scss     # Fuentes sans-serif limpias y monospace para datos
│   └── _utilities.scss      # Clases de apoyo (.u-text-center, .u-hidden)
├── components/
│   ├── _buttons.scss        # Botones primarios, secundarios, de acción y peligro
│   ├── _inputs.scss         # Inputs estándar (.reagle-input), selects, textareas
│   ├── _pagination.scss     # Barra de paginación desacoplada
│   ├── _empty-state.scss    # Mensajes de sin resultados con icono y texto
│   ├── _modals.scss         # Ventanas modales accesibles y backdrop
│   ├── _cards.scss          # Contenedores modulares de métricas y datos
│   └── _tabs-carousel.scss  # Carrusel horizontal con botones flecha
├── layout/
│   ├── _header.scss         # Barra superior de navegación y estado de juego
│   ├── _sidebar.scss        # Menú lateral con secciones Maestro y Legacy
│   ├── _dock.scss           # Barra inferior fija de consola y telemetría
│   └── _grid.scss           # Sistema de columnas responsivo
├── pages/
│   ├── _dashboard.scss      # Métricas de ejecución y gráficos
│   ├── _studio.scss         # Vista unificada Studio Edition
│   ├── _translation.scss    # Grilla del editor .str en 4 pestañas
│   └── _mods.scss           # Gestor de VFS, colisiones y minimods
├── themes/
│   ├── _dark.scss           # Tema oscuro espacial predeterminado (Nexus Dark)
│   └── _light.scss          # Tema de alto contraste para accesibilidad
└── main.scss                # Archivo agregador central que compila a main-theme.css
```

---

## 3. Catálogo de Componentes Estándar

### 3.1 Input Unificado (`.reagle-input`)
* **Aspecto Visual:** Fondo semitransparente oscuro (`rgba(15, 23, 42, 0.65)`), borde sutil `#334155`, radio de curvatura de 6px.
* **Estado Focus:** Borde acentuado `#1a73e8` con anillo de brillo exterior (`box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.25)`).
* **Comportamiento Reactivo:** Al limpiar el texto del input (`value === ''`), dispara de inmediato el evento `input:cleared` para restaurar datasets sin requerir pulsar Enter ni clics extras.

### 3.2 Carrusel de Pestañas Horizontal (`Tab Carousel`)
* **Estructura:**
  ```html
  <div class="nexus-tabs-carousel" data-carousel-id="str-editor">
    <button class="carousel-nav-btn prev" aria-label="Desplazar izquierda">‹</button>
    <div class="tabs-track">
      <button class="tab-item active" data-tab="workspace">Workspace</button>
      <button class="tab-item" data-tab="live-editor">Editor en Vivo</button>
      <button class="tab-item" data-tab="telemetry">Telemetría & Diagnóstico</button>
      <button class="tab-item" data-tab="expansion">Reserva / Expansión</button>
    </div>
    <button class="carousel-nav-btn next" aria-label="Desplazar derecha">›</button>
  </div>
  ```
* **Eventos Soportados:**
  * Clic en flechas de navegación lateral (`scrollBy({ left: +/- 150, behavior: 'smooth' })`).
  * Rueda del ratón (`wheel`): transforma desplazamiento vertical en desplazamiento horizontal fluido.
  * Gestos táctiles y drag en pantallas táctiles o paneles portátiles.

### 3.3 Componente Empty State Reutilizable
* Renderiza cuando cualquier filtro o búsqueda devuelve 0 resultados:
  ```html
  <div class="nexus-empty-state">
    <div class="empty-state-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>
    <h3 class="empty-state-title">Sin Resultados</h3>
    <p class="empty-state-description">No se encontraron registros que coincidan con el término ingresado.</p>
  </div>
  ```

### 3.4 Paginación Universal (`NexusPagination`)
* **Diseño Desacoplado:** El componente recibe solo números (`totalItems`, `itemsPerPage`, `currentPage`) y un callback `onPageChange(pageNumber)`.
* **Controles Visuales:**
  * Botón `« Anterior` (deshabilitado en página 1).
  * Números de página interactivos con límite elíptico inteligente (ej. `1 ... 4 5 6 ... 44`).
  * Botón `Siguiente »` (deshabilitado en última página).
  * Rango informativo: `"Mostrando 21 - 30 de 44 registros"`.

---

## 4. Estructura de Navegación del Menú Lateral (`Sidebar`)

La navegación divide limpiamente la innovación central de las herramientas heredadas:

1. **Panel Superior (Navegación Maestro):**
   * 📊 **Dashboard:** Métricas generales, salud del sistema y últimas ejecuciones.
   * 🌟 **Studio Edition:** Nueva vista centralizada unificada (Entidades, Traducción y Galaxias en un solo espacio modular).
2. **Panel Intermedio (Vistas Especializadas / Legacy):**
   * 📝 **Traducción (.str):** Editor de diccionarios en 4 pestañas.
   * 🚀 **Shared Entities:** Inspector de archivos `.entity` de GameInfo.
   * 🪐 **Galaxy Forge:** Inspector de mapas estelares y carriles de salto.
   * 📦 **Library (VFS Mods):** Gestor de mods en 5 pestañas ejecutivas.
   * ⚙️ **ConvertData CLI:** Conversor binario/texto para archivos de Sins.
3. **Panel Inferior (Telemetría de Sistema):**
   * 📡 **Red & Puertos:** Estado de sockets y Firewall.
   * 🧠 **RAM Profiler:** Monitor de espacio de memoria 32 bits (LAA).
