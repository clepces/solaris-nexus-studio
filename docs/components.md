# Catálogo de Componentes UI Modulares - Solaris Nexus Studio

## 1. Filosofía de Componentes Modulares
Cada componente en Solaris Nexus Studio opera como una unidad desacoplada que:
1. No contiene estilos embebidos (`style=""`); delega la presentación a las clases BEM de SASS 7-1.
2. Expone una API pública de inicialización, hidratación y destrucción.
3. Se comunica con el resto de la aplicación a través de eventos (`eventBus`) o callbacks declarativos.

---

## 2. Especificación Técnica de Componentes

### 2.1 `NexusPagination` (Paginador Universal)
* **Objetivo:** Controlar la navegación de grandes datasets (cadenas `.str`, entidades, mods, registros de auditoría) sin mutar la fuente de datos.
* **Interfaz de Configuración:**
  ```typescript
  export interface PaginationOptions {
    container: HTMLElement;
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    maxVisiblePages?: number;
    onPageChange: (newPage: number) => void;
  }
  ```
* **Comportamiento Lógico:**
  * Si `totalPages <= 1`, el contenedor oculta los controles automáticamente.
  * Genera elipses (`...`) cuando el número de páginas excede `maxVisiblePages` (predeterminado: 5).
  * Informa el rango activo: `Mostrando {(page-1)*limit + 1} - {Math.min(page*limit, total)} de {total}`.

---

### 2.2 `NexusEmptyState` (Estado Vacío Contextual)
* **Objetivo:** Mostrar retroalimentación clara cuando un dataset está vacío o una búsqueda no produce resultados.
* **Interfaz de Configuración:**
  ```typescript
  export interface EmptyStateOptions {
    container: HTMLElement;
    title: string;
    description: string;
    iconSvg?: string;
    actionButton?: {
      label: string;
      onClick: () => void;
    };
  }
  ```
* **Uso Típico:**
  * Buscador del Dashboard sin coincidencias.
  * Editor `.str` antes de cargar un diccionario.
  * Directorio de mods sin elementos instalados.

---

### 2.3 `NexusTabCarousel` (Carrusel Horizontal de Pestañas)
* **Objetivo:** Permitir navegación de pestañas en espacios estrechos sin quebrar el layout en múltiples líneas.
* **Características:**
  * Auto-detección de desbordamiento (`overflow-x: auto`).
  * Botones de desplazamiento suave lateral (`prev` / `next`) que se habilitan o deshabilitan según la posición del scroll (`scrollLeft === 0` o `scrollLeft + clientWidth >= scrollWidth`).
  * Soporte de rueda de ratón con aceleración suave.

---

### 2.4 `NexusModal` (Diálogo Modal Accesible)
* **Objetivo:** Presentar diálogos modales para edición rápida de cadenas, confirmaciones de eliminación o carga de diccionarios.
* **Características:**
  * Bloqueo de scroll en el `body` mientras el modal está activo.
  * Cierre al presionar la tecla `Escape` o clic en el backdrop oscurecido.
  * Foco atrapado (*focus trap*) dentro del diálogo para cumplimiento de estándares de accesibilidad.

---

### 2.5 `NexusTelemetryCard` (Tarjeta de Métrica Reactiva)
* **Objetivo:** Visualizar métricas del sistema (consumo de RAM, total de cadenas, mods activos, estado de la base de datos).
* **Estados Visuales:**
  * `NORMAL` (Verde / Cyan): Dentro de rangos seguros.
  * `WARNING` (Amarillo): Umbral de precaución (ej. RAM > 2.8 GB en motor de 32 bits).
  * `DANGER` (Rojo): Límite crítico (ej. colisión grave de archivos VFS o RAM > 3.4 GB).
