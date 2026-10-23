# Estructura del Código Fuente y Árbol de Directorios - Solaris Nexus

## 1. Principios de Arquitectura Limpia y Gobernanza
- **Kebab-Case Obligatorio:** Todos los directorios y archivos de código se nombran estrictamente en minúsculas con guiones separadores (`token-guard-service.ts`, `mod-orchestrator.php`).
- **Blindaje del Código Compilado:** El equipo de desarrollo trabaja exclusivamente dentro de `/src`. Las carpetas `/dist` o `/build` son gestionadas de forma automatizada por los bundlers.
- **Tipado Estricto / Cero `any`:** Prohibición absoluta del tipo `any` en TypeScript. Todas las entradas y salidas de datos validan sus tipos en tiempo de compilación.
- **Blindaje de Entorno Fail-Fast:** Cualquier variable de entorno o conexión a base de datos ausente interrumpe el arranque inmediatamente para evitar fallos en tiempo de ejecución.

---

## 2. Árbol Exhaustivo de Directorios del Proyecto

```text
C:\wamp64\www\sins-of-sola-empire\
├── config/                                 # Configuraciones globales y de entorno
│   ├── app-config.php                      # Parámetros del servidor WAMP
│   ├── database-config.php                 # Conexión PDO / SQLite
│   └── .env.example                        # Plantilla de variables de entorno seguras
│
├── docs/                                   # Documentación Técnica del Sistema
│   ├── en/                                 # Documentación técnica completa en INGLÉS
│   │   ├── api-spec.md
│   │   ├── architecture-spec.md
│   │   ├── database-schema.md
│   │   ├── engineering-guidelines.md
│   │   ├── events-spec.md
│   │   ├── mod-system-spec.md
│   │   ├── project-structure.md
│   │   ├── ui-components.md
│   │   └── user-guide.md
│   │
│   └── es/                                 # Documentación técnica completa en ESPAÑOL
│       ├── api-spec.md
│       ├── architecture-spec.md
│       ├── database-schema.md
│       ├── engineering-guidelines.md
│       ├── events-spec.md
│       ├── mod-system-spec.md
│       ├── project-structure.md
│       ├── ui-components.md
│       └── user-guide.md
│
├── public/                                 # Raíz web pública accesible en Apache/WAMP
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main-theme.css              # Variables de diseño y tema oscuro
│   │   │   ├── datatable-virtual.css       # Estilos para scroll virtual de 8.000+ filas
│   │   │   └── mod-manager.css             # Estilos de la matriz de conflictos
│   │   └── img/
│   │       ├── nexus-banner.jpg
│   │       └── badges/
│   ├── index.html                          # Entrada SPA (Single Page Application)
│   └── .htaccess                           # Reescritura de URLs y cabeceras de seguridad
│
├── src/                                    # CÓDIGO FUENTE ACTIVO
│   ├── backend/                            # Núcleo del servidor (PHP 8+ / Node.js)
│   │   ├── controllers/
│   │   │   ├── string-controller.php       # Endpoints de ingesta, parseo, diff y export
│   │   │   ├── mod-controller.php          # Escaneo de mods y guardado de EnabledMods
│   │   │   └── system-controller.php       # Empaquetado y configuración de steam_emu
│   │   ├── services/
│   │   │   ├── str-parser-service.php      # Analizador de gramática de archivos .str
│   │   │   ├── token-guard-service.php     # Validador de expresiones regulares (*VALUE*)
│   │   │   ├── linter-service.php          # Verificador de comillas y NumStrings
│   │   │   ├── mod-orchestrator.php        # Cálculo de prioridades e incompatibilidades
│   │   │   ├── ram-profiler-service.php    # Estimador de memoria virtual de 32 bits
│   │   │   └── language-packager.php       # Despliegue de carpetas en Localizations/
│   │   ├── repositories/
│   │   │   ├── project-repository.php      # Persistencia de proyectos y cadenas
│   │   │   ├── translation-memory-repo.php # Búsqueda y guardado de hashes de TM
│   │   │   └── mod-repository.php          # Persistencia del catálogo y perfiles
│   │   └── utils/
│   │       ├── byte-buffer-helper.php      # Escritor de UTF-8 BOM y CRLF
│   │       ├── uuid-generator.php          # Generador de UUID v4 para trazabilidad
│   │       └── logger-service.php          # Registro seguro de incidencias en disco
│   │
│   ├── frontend/                           # Aplicación cliente (TypeScript)
│   │   ├── components/
│   │   │   ├── dashboard-header.ts         # Barra superior con estado y medidor RAM
│   │   │   ├── mode-switcher.ts            # Pestañas de la suite
│   │   │   ├── str-virtual-grid.ts         # Tabla virtualizada para 8.000+ entradas
│   │   │   ├── string-editor-modal.ts      # Editor modal flotante con Token Guard
│   │   │   ├── token-highlighter.ts        # Resaltador de sintaxis para C++ y motor
│   │   │   ├── mod-selector-panel.ts       # Selección de mods y minimods
│   │   │   ├── conflict-warning-box.ts     # Alerta visual de incompatibilidades
│   │   │   ├── status-badge.ts             # Badges: ACTIVO, BETA, EN_DESARROLLO
│   │   │   └── memory-load-meter.ts        # Medidor gráfico de memoria virtual LAA
│   │   ├── state/
│   │   │   ├── event-bus.ts                # Despachador Pub/Sub del cliente
│   │   │   ├── translation-store.ts        # Estado reactivo de cadenas activas
│   │   │   └── mod-store.ts                # Estado reactivo de mods seleccionados
│   │   └── api-client/
│   │       └── nexus-api-client.ts         # Cliente HTTP asíncrono para la API REST
│   │
│   └── shared/                             # Tipos y constantes universales
│       ├── types/
│       │   ├── localization-types.ts       # Esquema de StringInfo y AST
│       │   ├── mod-types.ts                # Esquema de ModItem y EnabledModsArchive
│       │   └── api-response-types.ts       # Esquema estándar de respuestas de API
│       └── constants/
│           ├── reserved-tokens.ts          # Expresiones regulares de tokens protegidos
│           └── engine-limits.ts            # Constantes de umbrales de memoria de 32 bits
│
├── storage/                                # Almacenamiento local en disco (Protegido)
│   ├── cache/                              # Caché de diferencias y AST parseados
│   ├── logs/                               # Registro de auditoría con trazabilidad UUID
│   └── backups/                            # Copias de seguridad automáticas de .str
│
├── tests/                                  # Suite de pruebas automatizadas
│   ├── unit/
│   │   ├── str-parser.test.ts              # Prueba secuencial de 7.828 entradas
│   │   ├── token-guard.test.ts             # Prueba de detección de variables rotas
│   │   ├── mod-priority.test.ts            # Verificación del orden descendente de mods
│   │   └── encoding-bom.test.ts            # Validación de firma binaria 0xEF 0xBB 0xBF
│   └── fixtures/
│       ├── sample-corrupted.str            # Archivo de prueba con comillas anómalas
│       └── sample-valid.str                # Archivo canónico English.str.back
│
└── readme.md                               # Manifiesto del proyecto y pilares técnicos
```
