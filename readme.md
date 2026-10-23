# Solaris Nexus Studio

Plataforma empresarial de ingeniería inversa, orquestación de mods (VFS multi-capa), edición léxica (`.str`) y gestión de mapas/entidades para **Sins of a Solar Empire: Rebellion** y **Sins of a Solar Empire II**.

---

## 1. Visión General y Estado del Proyecto
* **Versión Actual:** `v0.3.1.0-alpha`
* **Versión Objetivo Inmediata:** `v0.4.0.0-alpha`
* **Arquitectura:** PHP 8.2+ MVC Backend + Vanilla/TypeScript Frontend Modular + SASS 7-1 Design System.
* **Certificación:** Suite de pruebas automatizada 11/11 en estado **VERDE** ([tests/run-all-tests.php](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/tests/run-all-tests.php)).

---

## 2. Mapa de Documentación Técnica

La documentación del sistema se encuentra completamente modularizada en el directorio [`docs/`](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/):

| Documento | Enlace | Propósito |
| :--- | :--- | :--- |
| **Estructura del Proyecto** | [structure.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/structure.md) | Árbol exhaustivo de carpetas, responsabilidades de capas y reglas de aislamiento. |
| **Sistema de Interfaces (UI)** | [interface.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/interface.md) | Componentes esqueleto (huecos), SASS 7-1, contratos visuales y diseño atómico. |
| **Bus de Eventos y Estado** | [events.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/events.md) | Arquitectura pub/sub desacoplada, ciclo de vida y eventos del VFS/Editor. |
| **Modelado de Datos (DB)** | [database.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/database.md) | Esquemas relacionales SQLite/MySQL, Memoria de Traducción (TM) y catálogos de mods. |
| **Especificación de API REST** | [api.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/api.md) | Contratos HTTP, códigos de error, UUID Safety y payloads JSON tipados. |
| **Componentes Modulares** | [components.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/components.md) | Catálogo de componentes UI reutilizables (Paginación, Empty States, Modales, Grids). |
| **Hoja de Ruta de Migración** | [migration-roadmap.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/docs/migration-roadmap.md) | Plan de ejecución por fases para transición segura sin romper funcionalidad activa. |
| **Auditoría del Motor y Localización** | [game-engine-and-localization-audit.md](file:///c:/wamp64/www/Clepces/projects/solaris-nexus-studio/game-engine-and-localization-audit.md) | Ingeniería inversa del motor IronEngine, problema del idioma `es` y tablas binarias. |

---

## 3. Guía de Inicio Rápido (Entorno Local WAMP)

### Requisitos Previos
* Servidor Web Apache 2.4+ (WAMP64 o equivalente).
* PHP 8.2+ con extensiones: `pdo_sqlite`, `pdo_mysql`, `mbstring`, `json`, `fileinfo`.
* Motor del juego: Sins of a Solar Empire Rebellion v1.85 / v1.974 instalado en el sistema.

### Verificación de Suite de Pruebas
Ejecutar el validador integral desde consola PowerShell:
```powershell
& 'C:\wamp64\bin\php\php8.2.29\php.exe' tests/run-all-tests.php
```

### Acceso a la Interfaz Web
Asegurar que el VirtualHost apunte al directorio `public/`:
```text
http://localhost/solaris-nexus-studio/public/
```
