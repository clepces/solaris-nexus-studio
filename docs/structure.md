# Estructura de Arquitectura y Árbol de Directorios Maestro - Solaris Nexus Studio (v0.4.1.0-alpha)

## 1. Principios de Aislamiento y Gobernanza de Código
1. **Aislamiento Estricto de Fuentes:** Ningún archivo `.ts`, `.scss` o plantilla bruta de desarrollo reside en `public/`. Las plantillas maestras habitan exclusivamente en `src/frontend/templates/`.
2. **Regla de Cero Monolitos:** Ningún script de lógica, controlador o módulo supera las 300 líneas de código. Toda responsabilidad está estrictamente desacoplada.
3. **Kebab-Case Obligatorio:** Todos los nombres de archivos y directorios siguen la convención kebab-case en minúsculas.
4. **Protocolo UUID Safety:** Toda respuesta de error en la API REST enmascara rutas físicas de disco y retorna un código `UUID v4` con registro en `storage/logs/`.
5. **Patrón App Shell SPA:** La interfaz web opera cargando una única plantilla base en `public/index.php` con despacho desacoplado mediante el enrutador cliente `ViewNavigatorRouter`.

---

## 2. Árbol de Directorios y Archivos Maestro

```text
solaris-nexus-studio/
├── .env                                        # [ACTIVO] Variables de entorno seguras (Fail-Fast: DB, Paths, Debug)
├── .env.example                                # [ACTIVO] Plantilla de variables obligatorias
├── .gitignore                                  # [ACTIVO] Exclusiones de Git (node_modules, vendor, dist, storage/logs)
├── composer.json                               # [ACTIVO] Autoloader PSR-4 y dependencias backend PHP
├── package.json                                # [ACTIVO] Dependencias frontend, scripts de compilación TS y SASS
├── tsconfig.json                               # [ACTIVO] Configuración estricta de TypeScript (Strict Mode, No-Any)
├── vite.config.js                              # [ACTIVO] Configuración de empaquetado y alias (@/)
├── readme.md                                   # [ACTIVO] Documento maestro corporativo de la plataforma
├── game-engine-and-localization-audit.md       # [ACTIVO] Auditoría del motor IronEngine e ingeniería inversa
│
├── .github/                                    # [ACTIVO] Workflows CI/CD de automatización
│   └── workflows/
│       ├── php-unit-tests.yml                  # Runner de pruebas unitarias backend PHP
│       └── ts-build-lint.yml                   # Verificación de compilación estricta TypeScript/SASS
│
├── config/                                     # [ACTIVO] Configuraciones globales seguras (PHP)
│   ├── app-config.php                          # Configuración Fail-Fast, zonas horarias y rutas WAMP/Steam
│   └── database-config.php                     # Conexión Singleton PDO SQLite / Prepared Statements
│
├── docs/                                       # [ACTIVO] Documentación técnica y especificaciones de arquitectura
│   ├── readme.md                               # Índice de documentación
│   ├── structure.md                            # Esta especificación arquitectónica y aislamiento de directorios
│   ├── interface.md                            # Guía de diseño atómico, BEM y SASS 7-1
│   ├── events.md                               # Especificación del Bus Pub/Sub reactivo
│   ├── database.md                             # Esquemas SQLite, ERD y Memoria de Traducción (TM)
│   ├── api.md                                  # Contratos REST, seguridad y protocolo UUID Safety
│   ├── components.md                           # Catálogo de componentes UI y skeletons
│   ├── migration-roadmap.md                    # Hoja de ruta de evolución de la plataforma
│   │
│   └── legacy/                                 # [LEGACY] Archivo histórico no destructivo
│       ├── agy_app.md
│       ├── readme-dev.md
│       ├── en/                                 # 9 especificaciones históricas en inglés
│       └── es/                                 # 9 especificaciones históricas en español
│
├── src/                                        # [CÓDIGO FUENTE DE DESARROLLO PRINCIPAL]
│   ├── backend/                                # [ACTIVO] Arquitectura MVC Limpia / Domain-Driven (PHP 8.2+)
│   │   ├── controllers/                        # Controladores REST (<300 líneas cada uno)
│   │   │   ├── entity-controller.php           # [85 líneas] API para entidades y naves (.entity)
│   │   │   ├── galaxy-controller.php           # [64 líneas] API topológica de galaxias (.galaxy)
│   │   │   ├── mod-controller.php              # [268 líneas] API para gestión VFS y colisiones
│   │   │   ├── string-controller.php           # [81 líneas] API para diccionarios léxicos (.str)
│   │   │   └── system-controller.php           # [140 líneas] Telemetría LAA, salud WAMP y permisos
│   │   ├── middleware/                         # Capas intermedias de seguridad y validación
│   │   │   ├── cors-middleware.php             # Cabeceras de control de acceso e integración local
│   │   │   ├── error-handler-middleware.php    # Middleware UUID Safety (Cero Stack Traces expuestos)
│   │   │   └── security-headers.php            # Sanitización de peticiones y protección XSS/CSRF
│   │   ├── repositories/                       # Capa de Persistencia a Base de Datos (SQLite)
│   │   │   ├── entity-catalog-repo.php         # Catálogo canónico de naves con datos reales
│   │   │   ├── execution-repository.php        # Persistencia de auditorías y ejecuciones
│   │   │   ├── mod-repository.php              # Persistencia de metadatos y perfiles de mods
│   │   │   ├── project-repository.php          # Persistencia de proyectos de traducción
│   │   │   └── translation-memory-repo.php     # Repositorio LRU de Memoria de Traducción (TM)
│   │   ├── services/                           # Lógica de Negocio y Dominio del Motor IronEngine
│   │   │   ├── convert-data-service.php        # Wrapper seguro de ConvertData CLI (BIN ↔ TXT)
│   │   │   ├── database-migrator.php           # Migrador DDL automático e idempotente de SQLite
│   │   │   ├── entity-inspector-service.php    # Inspector y calculador de EHP/DPS de entidades
│   │   │   ├── galaxy-forge-service.php        # Generador de topología galáctica y carriles de salto
│   │   │   ├── language-packager.php           # Empaquetador y creador de parches de localización
│   │   │   ├── language-synthesizer.php        # Sintetizador JIT de diccionarios multilingües
│   │   │   ├── linter-service.php              # Linter sintáctico de comillas y formato .str
│   │   │   ├── mod-orchestrator.php            # Resolutor de colisiones VFS en EnabledMods.txt
│   │   │   ├── ram-profiler-service.php        # Predictor y monitor de memoria virtual 32-bit (LAA)
│   │   │   ├── str-parser-service.php          # Parser bidireccional .str (TXT/BIN UTF-16LE BOM)
│   │   │   ├── system-scanner-service.php      # Escáner de permisos y entorno físico del juego
│   │   │   └── token-guard-service.php         # Blindaje algorítmico de variables protegidas {0}, {1}
│   │   └── utils/                              # Utilidades de bajo nivel
│   │       ├── byte-buffer-helper.php          # Manipulación de buffers binarios y BOM UTF-16LE
│   │       ├── logger-service.php              # Log estructurado con UUID y enmascaramiento de rutas
│   │       ├── router.php                      # Enrutador HTTP centralizado de clases (Sustituye if/elseif)
│   │       ├── uuid-generator.php              # Generador de identificadores criptográficos UUID v4
│   │       └── view-renderer.php               # Despachador de plantillas y layouts parciales
│   │
│   ├── frontend/                               # [ACTIVO] Lógica cliente desacoplada en TypeScript
│   │   ├── api-client/                         # Clientes REST HTTP tipados (Sin tipo 'any')
│   │   │   ├── base-api.client.ts              # Cliente base con fetch tipado y gestión de errores
│   │   │   ├── entity-api.client.ts            # Cliente para inspección de entidades y HUD
│   │   │   ├── galaxy-api.client.ts            # Cliente para mapas estelares y topología
│   │   │   ├── mod-api.client.ts               # Cliente para perfiles VFS y colisiones de mods
│   │   │   ├── string-api.client.ts            # Cliente para diccionarios .str y memoria TM
│   │   │   └── system-api.client.ts            # Cliente para telemetría WAMP y monitor LAA
│   │   ├── components/                         # Componentes UI reutilizables (Patrón Hollow)
│   │   │   ├── empty-state.component.ts        # Renderizador de estados vacíos contextuales
│   │   │   ├── modal.component.ts              # Diálogos modales accesibles (Focus Trap)
│   │   │   ├── pagination.component.ts         # Paginador universal desacoplado
│   │   │   ├── tab-carousel.component.ts       # Carrusel horizontal de pestañas con scroll fluido
│   │   │   └── telemetry-card.component.ts     # Tarjeta de métrica reactiva con alertas de umbral
│   │   ├── router/                             # Router cliente SPA (Cero recargas de página)
│   │   │   └── view-navigator.router.ts        # Navegador de vistas y despachador de plantillas
│   │   ├── state/                              # Estado global y bus de comunicaciones
│   │   │   ├── app-store.state.ts              # Almacén de estado reactivo global
│   │   │   └── event-bus.ts                    # Bus central de eventos Pub/Sub tipado
│   │   ├── templates/                          # Plantillas HTML semánticas y accesibles (con label for)
│   │   │   ├── layouts/
│   │   │   │   ├── app-shell.template.html     # Marco HTML raíz de la aplicación (SPA Shell)
│   │   │   │   ├── dock.template.html          # Barra inferior fija de consola y telemetría
│   │   │   │   ├── header.template.html        # Cabecera universal, buscador global y salud
│   │   │   │   ├── modal-edit.template.html    # Diálogo modal de edición de cadenas
│   │   │   │   └── sidebar.template.html       # Menú lateral unificado (Maestro / Legacy)
│   │   │   └── views/                          # Fragmentos de vistas puros (Solo Skeletons / Slots)
│   │   │       ├── convert.template.html       # Interface CLI ConvertData
│   │   │       ├── dashboard.template.html     # Panel maestro de métricas e historial
│   │   │       ├── entities.template.html      # Inspector de entidades y EHP
│   │   │       ├── galaxy.template.html        # Canvas topológico de galaxias
│   │   │       ├── mods.template.html          # Gestor VFS y jerarquía de mods
│   │   │       ├── network.template.html       # Monitor de red y workshop
│   │   │       ├── pipeline.template.html      # Pipeline de shaders y materiales
│   │   │       ├── studio.template.html        # Vista unificada Studio Edition
│   │   │       ├── swarm.template.html         # Monitor de clúster P2P
│   │   │       ├── system.template.html        # Diagnóstico de entorno y permisos WAMP
│   │   │       ├── translation.template.html   # Editor de diccionarios .str en 4 pestañas
│   │   │       └── vault.template.html         # Bóveda de respaldos automáticos
│   │   └── main.ts                             # Punto de entrada principal y bootstrap del frontend
│   │
│   ├── shared/                                 # [ACTIVO] Contratos tipados compartidos (TypeScript)
│   │   ├── constants/
│   │   │   ├── engine-limits.constants.ts      # Límites de RAM LAA (2048/4096MB) y constantes de motor
│   │   │   └── reserved-tokens.constants.ts    # Patrones de variables protegidas {0}, {1}
│   │   └── types/
│   │       ├── api-response.types.ts           # Overlays canónicos de respuesta JSON {success, data, error, uuid}
│   │       ├── entity-inspection.types.ts      # Interfaces de propiedades de entidades (.entity)
│   │       ├── localization.types.ts           # Interfaces para entradas léxicas, diccionarios y TM
│   │       └── mod-vfs.types.ts                # Interfaces para manifiestos de mods, VFS y colisiones
│   │
│   ├── interface/                              # [ACTIVO] Fuentes de Diseño e Interfaz de Usuario
│   │   └── scss/                               # [ACTIVO] Arquitectura de estilos SASS (Patrón 7-1)
│       ├── abstracts/
│       │   ├── _functions.scss                 # Funciones de cálculo px a rem y contraste
│       │   ├── _mixins.scss                    # Mixins de flexbox, grid, breakpoints y glassmorphism
│       │   └── _variables.scss                 # Paleta sci-fi espacial, tipografías y sombras
│       ├── base/
│       │   ├── _reset.scss                     # Reset universal y box-sizing: border-box
│       │   ├── _typography.scss                # Fuentes sans-serif limpias y monospace
│       │   └── _utilities.scss                 # Clases de apoyo (.u-text-center, .u-hidden, .sr-only)
│       ├── components/
│       │   ├── _buttons.scss                   # Botones primarios, secundarios, peligro y acciones
│       │   ├── _cards.scss                     # Contenedores de métricas y paneles neumórficos
│       │   ├── _empty-state.scss               # Estilos del estado vacío contextual
│       │   ├── _inputs.scss                    # Inputs unificados (.reagle-input) y textareas
│       │   ├── _modals.scss                    # Ventanas modales accesibles con backdrop
│       │   ├── _pagination.scss                # Barra de paginación universal
│       │   └── _tabs-carousel.scss             # Carrusel de pestañas horizontal con flechas
│       ├── layout/
│       │   ├── _dock.scss                      # Barra inferior de consola
│       │   ├── _grid.scss                      # Sistema de rejilla responsivo
│       │   ├── _header.scss                    # Barra superior de navegación
│       │   └── _sidebar.scss                   # Menú lateral unificado
│       ├── pages/
│       │   ├── _dashboard.scss                 # Estilos específicos del Dashboard
│       │   ├── _entities.scss                  # Inspector de entidades
│       │   ├── _galaxy.scss                    # Canvas de galaxias
│       │   ├── _mods.scss                      # Gestor VFS y jerarquía
│       │   ├── _studio.scss                    # Vista insignia Studio Edition
│       │   └── _translation.scss               # Editor de diccionarios .str
│       ├── themes/
│       │   ├── _dark.scss                      # Tema predeterminado espacio profundo (Nexus Dark)
│       │   └── _light.scss                     # Tema de alto contraste accesibilidad
│       └── main.scss                           # Archivo agregador central (Compila a public/assets/css/)
│
├── public/                                     # [DISTRIBUCIÓN PÚBLICA EN PRODUCCIÓN]
│   ├── .htaccess                               # Reescritura de URL hacia index.php (Front Controller)
│   ├── index.php                               # Punto de entrada HTTP y arranque del App Shell OOP (<100 líneas)
│   └── assets/                                 # Artefactos compilados y módulos JS (<300 líneas cada uno)
│       ├── css/
│       │   ├── main-theme.css                  # CSS global base neumórfico
│       │   ├── datatable-virtual.css           # Grillas virtuales
│       │   └── modules/                        # Estilos modulares auxiliares
│       │       ├── animations.css              # Keyframes GPU
│       │       ├── entity-editor.css           # Editor de entidades
│       │       ├── galaxy-forge.css            # Canvas galaxias
│       │       ├── mods-manager.css            # Gestor de mods
│       │       └── nexus-components.css        # Componentes UI
│       ├── js/                                 # Scripts modulares y bundle empaquetado
│       │   ├── bundle.js                       # Bundle compilado de TypeScript
│       │   ├── nexus-core.js                   # Núcleo de estado
│       │   ├── nexus-ui.js                     # Renderizador de toasts/modales
│       │   └── modules/                        # Módulos desacoplados (<300 líneas)
│       │       ├── contextual-actions.js       # [73 líneas] Botones de acción de cabecera
│       │       ├── convert-cli.js              # [59 líneas] CLI ConvertData
│       │       ├── dashboard-handler.js        # [242 líneas] Ejecuciones, paginación y búsqueda
│       │       ├── entity-editor.js            # [355 líneas] Editor e inspector de naves
│       │       ├── galaxy-forge.js             # [242 líneas] Topología galáctica
│       │       ├── minimod-injector.js         # [80 líneas] Inyector quirúrgico P999
│       │       ├── mod-manager.js              # [269 líneas] Gestor VFS y colisiones
│       │       ├── nexus-components.js         # [215 líneas] Paginador y estados vacíos
│       │       ├── platform-detector.js        # [65 líneas] Detección de plataformas y validación
│       │       ├── sidebar-tree.js             # [101 líneas] Árbol de archivos VFS
│       │       ├── system-health.js            # [55 líneas] Diagnóstico de salud
│       │       ├── translation-studio.js       # [330 líneas] Editor de diccionarios .str
│       │       └── view-navigator.js           # [297 líneas] Enrutador y gestor de layouts
│       └── media/                              # Estructura multimedia organizada
│           ├── avatars/                        # [.gitkeep]
│           ├── banners/                        # [.gitkeep]
│           ├── fonts/                          # [.gitkeep]
│           ├── icons/                          # [.gitkeep]
│           ├── sounds/                         # [.gitkeep]
│           ├── svg/                            # [.gitkeep]
│           └── videos/                         # [.gitkeep]
│
├── storage/                                    # Persistencia local, caché y registros de seguridad
│   ├── database.sqlite                         # Base de datos relacional local SQLite 3
│   ├── backups/                                # Copias de seguridad automáticas de proyectos (.bak)
│   ├── cache/                                  # Caché JIT de compilación de diccionarios
│   └── logs/                                   # Registros de auditoría con UUID Safety (nexus-YYYY-MM-DD.log)
│
└── tests/                                      # [ACTIVO] Suite de Pruebas Automatizadas (11 Fases de Certificación)
    ├── run-all-tests.php                       # Runner centralizado de la suite de pruebas
    ├── fixtures/                               # Archivos estáticos de muestra para pruebas
    │   ├── sample_demo.entity
    │   ├── sample_demo.entity.converted
    │   ├── sample-corrupted.str
    │   └── sample-valid.str
    └── unit/                                   # Pruebas unitarias de las 11 fases de la arquitectura
        ├── test-bootstrap.php                  # Fase 0: Bootstrap de entorno y verificación Fail-Fast
        ├── str-parser.test.php                 # Fase 1: Parser .str, UTF-16LE BOM y buffers
        ├── token-guard.test.php                # Fase 2: Blindaje de variables {0}, {1}
        ├── mod-priority.test.php               # Fase 3: Resolutor de colisiones VFS y EnabledMods.txt
        ├── ram-profiler.test.php               # Fase 4: Telemetría de memoria virtual de 32 bits (LAA)
        ├── api-safety.test.php                 # Fase 5: Protocolo UUID Safety y sobre envelope REST
        ├── database-persistence.test.php       # Fase 8: Persistencia SQLite y Memoria de Traducción (TM)
        ├── language-synthesizer.test.php       # Fase 9: Sintetizador JIT de diccionarios
        ├── convert-data.test.php               # Fase 10: Integración CLI ConvertData_Rebellion.exe
        ├── entity-inspector.test.php           # Fase 11: Inspector de propiedades de entidades
        └── galaxy-forge.test.php               # Fase 12: Generación topológica galáctica
```
