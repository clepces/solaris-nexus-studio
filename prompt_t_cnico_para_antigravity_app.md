# Refactorización del Sistema

**Objetivo General:**

Ejecutar un plan integral de corrección de errores de estado, optimización de UI/UX, arquitectura de CSS modular (SASS 7-1), paginación global, rediseño modular del **Editor de Traducción (.STR)** y preparación gradual para la nueva vista unificada **Studio Edition**, manteniendo la compatibilidad con las vistas Legacy.

## FASE 0: Diagnóstico Previo e Informe Impacto (Obligatorio)

> **REQUERIMIENTO PREVIO:** Antes de ejecutar cualquier cambio en el código fuente, la IA/Agente debe generar un **Informe Detallado de Impacto y Mapa de Cambios** especificando los componentes, archivos de estilo y funciones de estado que serán modificados.

## 1. Corrección de Bugs y Componentes Globales de Búsqueda y Paginación

### 1.1 Bug de Estado en Buscador (`Search Input State Bug`)

* **Problema:** Al ingresar un término de búsqueda (ej. `xxx`), cambiar de pestaña y luego limpiar el input (borrar el texto), el filtro sigue aplicado a la lista. Esto ocurre por una desincronización entre el estado local del input visual (`input value`), el estado global de filtrado (`filterState`) y el evento de actualización al cambiar de pestaña (`tabChange`).

* **Instrucción:**

  * Corregir el ciclo de vida del estado de búsqueda. Asegurar que al borrar el texto del input (`onChange` / `onInput` vacío), el filtro se resetee inmediatamente y renderice el dataset completo.

  * Sincronizar correctamente los eventos de cambio de pestaña para que reseteen o mantengan coherentemente el estado del filtro sin dejar datos huérfanos filtrados.

### 1.2 Estado Vacío en Búsquedas (`Empty Search State`)

* **Instrucción:**

  * Diseñar e implementar un componente reutilizable de **"Sin Resultados" (Empty State)** para cuando la búsqueda no coincida con ningún elemento.

  * El diseño debe mantener la estética general del sistema y aceptar mensajes contextuales por vista/pestaña (ej. en *Dashboard > Executions*: *"No se encontraron ejecuciones que coincidan con el término ingresado"*).

### 1.3 Módulo de Paginación Reutilizable

* **Instrucción:**

  * Crear un componente de paginación global y desglosado (p. ej. en *Dashboard > Executions* con 44 resultados).

  * La lógica y los estilos CSS/SASS de la paginación deben ser **totalmente independientes y desacoplados**, de manera que el componente pueda insertarse en cualquier tabla o vista de la aplicación sin duplicar código.

## 2. Refactorización e Infraestructura CSS/SASS (Gradual)

### 2.1 Arquitectura SASS (Patrón 7-1)

* **Instrucción:**

  * Migrar la hoja de estilos global hacia una arquitectura SASS basada en la estructura **7-1 Pattern** (`abstracts/`, `base/`, `components/`, `layout/`, `pages/`, `themes/`, `vendors/`).

  * La transición debe realizarse de forma **gradual por fases** para evitar romper la interfaz actual.

### 2.2 Eliminación de Estilos Inline (`style=""`)

* **Instrucción:**

  * Extraer gradualmente todos los atributos `style="..."` incrustados en los archivos HTML/JSX y moverlos a clases modulares SASS.

### 2.3 Estandarización de Campos de Entrada (`Inputs Globales`)

* **Instrucción:**

  * Rediseñar globalmente todos los inputs del sistema para garantizar consistencia visual moderna (foco, border-radius, background, placeholder y tipografía uniformes).

### 2.4 Responsividad y Navegación Horizontal de Pestañas (`Tab Carousel System`)

* **Problema:** En pantallas pequeñas o cuando hay muchas pestañas, estas se apilan verticalmente rompiendo el layout.

* **Instrucción:**

  * Implementar un sistema global de pestañas tipo **cinta / carrusel continuo** con desplazamiento horizontal (*overflow-x*) y flechas de navegación a los extremos.

  * **Soporte de Entrada Multiplataforma:** Permitir desplazamiento con:

    1. Flechas laterales interactivos.

    2. Rueda del ratón (`scrollHorizontal` / `wheel event`).

    3. Teclas de dirección del teclado (`ArrowLeft` / `ArrowRight`).

    4. Gestos táctiles (*swipe / touch drag*).

## 3. Rediseño Completo del Módulo: Editor de Traducción (.STR)

Transformar el antiguo `virtual-grid-container` en un espacio de trabajo por capas y guiado.

### 3.1 Flujo Inicial de Carga y Telemetría Vacía

1. **Workspace Inicial:** Al ingresar sin datos cargados, se muestra un *Workspace* en blanco con telemetría en `0` (Cadenas procesadas, Tokens, Progreso, Errores).

2. **Modal de Carga Interactiva:**

   * Botón superior de acciones para desplegar un modal de carga.

   * Opciones del Modal:

     * *Cargar Demo para Pruebas.*

     * *Seleccionar Idioma Base del Juego:* Como la ruta del juego ya está vinculada, el sistema autodetectará los archivos `.str` instalados (por defecto preselecciona Inglés `EN`).

3. **Paso Intermedio del Archivo:** Una vez seleccionado el `.str`, el ítem aparece en el Workspace dividido en 2 grupos visuales con metadata de la cadena y tokens. Le da la opción al usuario de:

   * *Paso a Edición Manual / Asistida.*

   * *Generar Respaldos / Backup.*

### 3.2 Estructura de 4 Pestañas Internas del Editor de Traducción

El Editor de Traducción se estructurará en 4 pestañas:

1. **Pestaña 1: Workspace (Gestión General):**

   * Gestión general del archivo `.str` activo, panel de importación/exportación de idiomas y módulos de traducción.

   * **Sección de Módulos Separados y Explicados:**

     * Separar claramente los **Módulos Experimentales** de los **Traductores Neurales (IA)**.

     * Agregar cards informativas / tooltips con descripciones detalladas de cada módulo para educar al usuario sobre su funcionamiento.

2. **Pestaña 2: Editor en Vivo (Live Editor Refactored):**

   * Rediseño de la antigua lista simple.

   * Columnas optimizadas: `ID de Cadena`, `Texto Original (EN)`, `Traducción Activa (ES)`, `Tokens`, `Acciones`.

   * **Mejoras del Editor:** Paginación integrada para evitar sobrecarga de rendimiento del DOM, badges descriptivos, etiquetas de estado, iconos contextuales y panel de acciones asistidas por IA.

3. **Pestaña 3: Telemetría y Diagnóstico:**

   * Métricas en tiempo real: datos cargados, historial de modificaciones, registro de errores, advertencias de formato y estado sintáctico del `.str`.

4. **Pestaña 4: \[En Discusión / Reserva\]:**

   * Estructura reservada para expansiones futuras.

## 4. Ajustes en "Gestor VFS & Mods"

### 4.1 Simplificación de Nombres y Reestructuración de Pestañas

* **Renombrado y Desacoplamiento:**

  * Los nombres de las pestañas actuales (`Jerarquía EnabledMods.txt | Detección & Rutas Personalizadas | Auditoría de Colisiones VFS | Inyector Minimod & Monitor RAM`) son demasiado largos.

  * Simplificar los títulos a etiquetas concisas y ejecutivas.

  * **Separar funcionalidades:** Mover el **Inyector Minimod** a una pestaña independiente y colocar el **Monitor RAM** en su propia pestaña dedicada para mejorar la carga de datos.

## 5. Preparación Arquitectónica: Vistas Legacy vs. Studio Edition

### 5.1 Creación de la Vista Master `Studio Edition`

* **Instrucción:**

  * Agregar una nueva pestaña/sección en el menú lateral de navegación justo debajo del *Dashboard*: **`Studio Edition`**.

  * Esta vista unificará progresivamente tres módulos:

    1. **Editor de Entidades**

    2. **Editor de Traducción**

    3. **Editor de Galaxy**

### 5.2 Mantenimiento de Coexistencia ("Legacy Views")

* **ADVERTENCIA TÉCNICA:** No eliminar las vistas individuales existentes (`Traducción (.str)`, `Shared Entities`, `Galaxy Forge`). Se mantendrán como vistas **Legacy** durante las fases de prueba mientras `Studio Edition` completa su integración por etapas.

## Checklist de Entregables Requeridos

1. \[ \] **Documento previo:** Informe técnico de impacto y plan de refactorización.

2. \[ \] **Bug Fix:** Estado del buscador y reseteo de filtros resuelto.

3. \[ \] **UI Kit:** Componente Empty State + Paginador modular CSS/JS + Estilo de Inputs Globales.

4. \[ \] **Core CSS:** Configuración inicial del patrón SASS 7-1 y eliminación por fases de `style=""`.

5. \[ \] **Navegación:** Carrusel continuo con desplazamiento por teclado/scroll/touch para pestañas.

6. \[ \] **Módulo STR:** Rediseño con las 4 pestañas en el Editor de Traducción, sistema de detección de idiomas e integración de módulos IA/Neurales explicados.

7. \[ \] **VFS & Mods:** Reestructuración de pestañas y simplificación de nombres.

8. \[ \] **Layout:** Menú lateral actualizado con la vista previa de `Studio Edition` (unificando Editor de Entidades, Editor de Traducción y Editor de Galaxy) coexistiendo con Vistas Legacy.