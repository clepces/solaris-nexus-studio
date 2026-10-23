# Estructura de Arquitectura y Árbol de Directorios - Solaris Nexus Studio

## 1. Principios de Aislamiento y Gobernanza de Código
1. **Regla de Cero Monolitos:** Ningún archivo de lógica o presentación superará las 300 líneas de código. Toda responsabilidad debe segmentarse en servicios, controladores o componentes desacoplados.
2. **Kebab-Case Obligatorio:** Todos los nombres de archivos y directorios deben seguir la convención kebab-case (`view-renderer.php`, `str-parser-service.php`, `nexus-pagination.ts`).
3. **Aislamiento de Código Compilado vs Fuentes:** El desarrollo se realiza en `/src` (TypeScript y PHP) y `/public/assets/scss/`. `/dist` o `/build` son exclusivamente para artefactos generados.
4. **Protección de Runtime Activo:** La reestructuración arquitectónica convive con el sistema actual en `public/` para no interrumpir el funcionamiento ni la suite de pruebas automatizadas.

---

## 2. Diagnóstico de la Discrepancia `src/frontend/` vs `public/`
* **Causa de Carpetas Vacías en `src/frontend/` (`api-client/`, `components/`, `state/`):**
  En la fase de andamiaje inicial se crearon esas carpetas anticipando una migración a TypeScript / SPA empaquetada. Sin embargo, durante el desarrollo acelerado de las fases 1 a 12 de backend, el frontend se implementó directamente en `public/assets/js/modules/` como scripts nativos ES6 y en `public/views/` como vistas HTML parciales.
* **Estrategia de Saneamiento sin Pérdida de Trabajo:**
  No se descarta el código existente en `public/assets/js/`. Se modulariza:
  1. Extraer los bloques gigantes de `view-navigator.js` (41 KB) hacia componentes modulares independientes.
  2. Implementar los contratos de TypeScript en `src/frontend/` para verificación estática.
  3. Compilar los módulos limpios hacia `public/assets/js/modules/` manteniendo compatibilidad 100% con los manejadores legacy.

---

## 3. Árbol de Directorios Exhaustivo

```text
solaris-nexus-studio/
├── .env                                  # Variables de entorno seguras (Fail-Fast)
├── .env.example                          # Plantilla de variables obligatorias
├── .gitignore                            # Exclusiones de Git (logs, backups, temporales)
├── readme.md                             # Documento maestro y guía rápida
├── game-engine-and-localization-audit.md # Auditoría de motor IronEngine e idiomas
│
├── config/                               # Configuraciones globales
│   ├── app-config.php                    # Parámetros del servidor WAMP y rutas
│   └── database-config.php               # Conexión PDO SQLite/MySQL
│
├── docs/                                 # Documentación técnica modular
│   ├── readme.md                         # Índice de la documentación
│   ├── structure.md                      # Esta especificación arquitectónica
│   ├── interface.md                      # UI, SASS 7-1 y diseño atómico
│   ├── events.md                         # Bus de Eventos y ciclo de vida pub/sub
│   ├── database.md                       # Esquemas y tablas relacionales
│   ├── api.md                            # Endpoints REST y contratos JSON
│   ├── components.md                     # Catálogo de componentes modulares
│   ├── migration-roadmap.md              # Plan de ejecución por fases
│   ├── en/                               # Documentación legacy en inglés
│   └── es/                               # Documentación legacy en español
│
├── public/                               # Raíz web pública accesible en Apache/WAMP
│   ├── .htaccess                         # Enrutamiento frontal hacia index.php
│   ├── index.php                         # Front Controller central (Router HTTP)
│   ├── assets/
│   │   ├── css/                          # CSS compilado y módulos de estilo
│   │   │   ├── main-theme.css            # Hoja de estilo global unificada
│   │   │   ├── datatable-virtual.css     # Estilos de grilla y paginación
│   │   │   └── modules/                  # Estilos específicos por módulo
│   │   │       ├── entity-editor.css
│   │   │       ├── galaxy-forge.css
│   │   │       ├── mods-manager.css
│   │   │       └── nexus-components.css
│   │   ├── scss/                         # Arquitectura SASS (Patrón 7-1)
│   │   │   ├── abstracts/                # _variables.scss, _mixins.scss, _functions.scss
│   │   │   ├── base/                     # _reset.scss, _typography.scss, _utilities.scss
│   │   │   ├── components/               # _buttons.scss, _inputs.scss, _pagination.scss, _empty-state.scss
│   │   │   ├── layout/                   # _sidebar.scss, _header.scss, _tabs-carousel.scss, _dock.scss
│   │   │   ├── pages/                    # _dashboard.scss, _translation.scss, _mods.scss, _studio.scss
│   │   │   ├── themes/                   # _dark.scss, _light.scss
│   │   │   └── main.scss                 # Agregador central compilador
│   │   ├── js/
│   │   │   ├── nexus-core.js             # Núcleo de estado y bus de eventos cliente
│   │   │   ├── nexus-ui.js               # Renderizador UI, modales y toasts
│   │   │   └── modules/                  # Módulos JS desacoplados
│   │   │       ├── convert-cli.js        # Integración con ConvertData_Rebellion.exe
│   │   │       ├── entity-editor.js      # Inspector y editor de entidades .entity
│   │   │       ├── galaxy-forge.js       # Visualizador topológico de galaxias
│   │   │       ├── mod-manager.js        # Gestor VFS y perfiles EnabledMods.txt
│   │   │       ├── nexus-components.js   # Componentes modulares (Paginación, Empty States)
│   │   │       ├── system-health.js      # Telemetría de memoria RAM LAA (32 bits)
│   │   │       ├── translation-studio.js # Editor de diccionarios .str
│   │   │       └── view-navigator.js     # Enrutador de pestañas y layouts
│   │   └── img/                          # Iconografía e imágenes estáticas
│   └── views/                            # Vistas y plantillas HTML modulares
│       ├── header.partial.html           # Cabecera universal y estado de conexión
│       ├── sidebar.partial.html          # Barra lateral con navegación unificada
│       ├── dock.partial.html             # Panel de telemetría y consola inferior
│       ├── modal-edit.partial.html       # Modal genérico reutilizable
│       ├── dashboard.view.html           # Vista principal de métricas y ejecuciones
│       ├── studio.view.html              # Vista Master Studio Edition (Entidades + STR + Galaxy)
│       ├── translation.view.html         # Editor de cadenas .str (4 pestañas)
│       ├── mods.view.html                # Gestor de VFS, colisiones y minimods
│       ├── entities.view.html            # Inspector de GameInfo
│       ├── galaxy.view.html              # Visor de mapas estelares
│       ├── convert.view.html             # Interfaz CLI ConvertData
│       ├── network.view.html             # Monitor de puertos y red
│       ├── pipeline.view.html            # Telemetría de shaders y pipelines
│       ├── swarm.view.html               # Monitor de agentes y procesos concurrentes
│       ├── system.view.html              # Diagnóstico del entorno WAMP/PHP
│       └── vault.view.html               # Almacén de memorias de traducción
│
├── src/                                  # Código Fuente del Núcleo Empresarial
│   ├── backend/                          # Backend PHP (Arquitectura MVC Limpia)
│   │   ├── controllers/                  # Controladores REST
│   │   │   ├── entity-controller.php
│   │   │   ├── galaxy-controller.php
│   │   │   ├── mod-controller.php
│   │   │   ├── string-controller.php
│   │   │   └── system-controller.php
│   │   ├── repositories/                 # Capa de Persistencia y Acceso a Datos
│   │   │   ├── mod-repository.php
│   │   │   ├── project-repository.php
│   │   │   └── translation-memory-repo.php
│   │   ├── services/                     # Lógica de Negocio y Dominio
│   │   │   ├── convert-data-service.php  # Wrapper de ConvertData CLI
│   │   │   ├── database-migrator.php     # Migraciones automáticas SQLite/MySQL
│   │   │   ├── entity-inspector-service.php # Parser de archivos .entity
│   │   │   ├── galaxy-forge-service.php  # Parser topológico .galaxy
│   │   │   ├── language-packager.php     # Empaquetador de parches de idioma
│   │   │   ├── language-synthesizer.php  # Sintetizador JIT de traducción
│   │   │   ├── linter-service.php        # Validador léxico y comillas
│   │   │   ├── mod-orchestrator.php      # Resolutor VFS y EnabledMods.txt
│   │   │   ├── ram-profiler-service.php  # Monitor de memoria 32 bits (LAA)
│   │   │   ├── str-parser-service.php    # Parser bidireccional .str (TXT/BIN)
│   │   │   └── token-guard-service.php   # Blindaje de variables {0}, {1}
│   │   └── utils/                        # Utilidades y Helpers
│   │       ├── byte-buffer-helper.php    # Manipulación binaria de strings
│   │       ├── logger-service.php        # Logger con enmascaramiento de rutas (UUID)
│   │       ├── uuid-generator.php        # Generador de UUID v4 criptográfico
│   │       └── view-renderer.php         # Renderizador de plantillas HTML
│   │
│   ├── frontend/                         # Código Fuente Frontend (TypeScript)
│   │   ├── api-client/                   # Clientes HTTP tipados hacia los controladores
│   │   │   ├── entity-api.ts
│   │   │   ├── mod-api.ts
│   │   │   ├── string-api.ts
│   │   │   └── system-api.ts
│   │   ├── components/                   # Componentes Huecos (Skeletons) y UI
│   │   │   ├── empty-state.ts            # Componente de estado vacío contextual
│   │   │   ├── modal-dialog.ts           # Modal accesible desacoplado
│   │   │   ├── pagination-bar.ts         # Paginador universal sin mutación de datos
│   │   │   ├── tab-carousel.ts           # Carrusel de pestañas horizontal con scroll
│   │   │   └── telemetry-card.ts         # Tarjeta de métricas con indicador de estado
│   │   └── state/                        # Almacén de Estado Global Reactivo
│   │       ├── event-bus.ts              # Bus de eventos tipado
│   │       └── studio-store.ts           # Estado centralizado inmutable
│   │
│   └── shared/                           # Contratos Compartidos (Full-Stack Types)
│       ├── constants/
│       │   ├── engine-limits.ts          # Constantes de límites de RAM y entidades
│       │   └── reserved-tokens.ts        # Tokens protegidos de localización
│       └── types/
│           ├── api-response-types.ts     # Respuestas estándar {success, data, error, uuid}
│           ├── localization-types.ts     # Tipos para Strings, Diccionarios y TM
│           └── mod-types.ts              # Tipos para Mods, Manifiestos y VFS
│
├── storage/                              # Almacenamiento Seguro del Sistema
│   ├── database.sqlite                   # Base de datos relacional local
│   ├── backups/                          # Copias de seguridad temporales automáticas
│   ├── logs/                             # Registros de eventos y auditoría (UUID Safety)
│   └── temp/                             # Archivos temporales de conversión
│
└── tests/                                # Suite Automatizada de Pruebas (11 Fases)
    ├── run-all-tests.php                 # Runner unificado de pruebas
    └── phases/                           # Suites de pruebas por fase (Fase 0 a 12)
```
