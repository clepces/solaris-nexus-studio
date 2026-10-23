# Especificación de la API REST - Solaris Nexus Studio

## 1. Protocolo de Comunicación y Estándar de Seguridad

1. **Protocolo Cero Stack Traces (UUID Safety):**
   Queda estrictamente prohibido exponer rutas de disco físico, nombres de usuario de Windows o trazas de depuración de PHP en respuestas HTTP. Cualquier excepción no controlada genera un UUID v4 criptográfico, almacena el volcado completo en `storage/logs/` y responde al cliente con un mensaje genérico seguro:
   ```json
   {
     "success": false,
     "error": "Error interno del servidor procesando la solicitud.",
     "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
     "timestamp": "2026-10-22T21:10:00Z"
   }
   ```
2. **Sobre Envelope Estándar de Respuesta:**
   Todas las respuestas JSON exitosas implementan la siguiente estructura canónica:
   ```json
   {
     "success": true,
     "data": {},
     "meta": {
       "total": 7828,
       "page": 1,
       "per_page": 50
     },
     "uuid": "8b5f3a12-68bb-4e6f-9cc1-5a3d0f7b11a2",
     "timestamp": "2026-10-22T21:10:00Z"
   }
   ```

---

## 2. Catálogo Exhaustivo de Endpoints

### 2.1 Subsistema de Diagnóstico y Entorno (`/api/system`)

#### `GET /api/system/health`
* **Descripción:** Retorna el estado del entorno WAMP, versión de PHP, conectividad de base de datos y memoria asignada.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "php_version": "8.2.29",
      "os": "Windows",
      "database": "sqlite",
      "memory_usage_mb": 14.2
    }
  }
  ```

#### `GET /api/system/game-detection`
* **Descripción:** Escanea el sistema para localizar la instalación de Sins of a Solar Empire Rebellion.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "installed": true,
      "base_path": "C:\\Games\\Sins of a Solar Empire Rebellion",
      "version": "1.974",
      "has_dev_exe": true,
      "languages_found": ["de", "en", "es", "fr", "it", "ja", "pl", "ru", "zh-CN"]
    }
  }
  ```

---

### 2.2 Subsistema de Cadenas Léxicas y Traducción (`/api/strings`)

#### `GET /api/strings/list`
* **Descripción:** Obtiene la lista de cadenas del proyecto activo con soporte de paginación y búsqueda.
* **Parámetros Query:**
  * `page` (int, default: 1): Número de página.
  * `per_page` (int, default: 50): Registros por página.
  * `query` (string, opcional): Término de búsqueda por ID o texto original/traducido.
  * `filter` (string, opcional): `all`, `pending`, `translated`, `has_error`.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "IDSPlayerAINameTech0",
        "original": "Nitheim Rebels",
        "translated": "Rebeldes Nitheim",
        "tokens": [],
        "status": "translated"
      }
    ],
    "meta": { "total": 7828, "page": 1, "per_page": 50 }
  }
  ```

#### `POST /api/strings/update`
* **Descripción:** Actualiza la traducción de una clave léxica individual validando tokens protegidos (`Token Guard`).
* **Cuerpo de Solicitud (JSON):**
  ```json
  {
    "string_id": "IDSFleetCapacityExceeded",
    "translated_text": "Límite de flota excedido ({0}/{1})."
  }
  ```
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "string_id": "IDSFleetCapacityExceeded",
      "valid_tokens": true,
      "status": "translated"
    }
  }
  ```
* **Error de Validación (422 Unprocessable Entity):**
  ```json
  {
    "success": false,
    "error": "Violación de Token Guard: se eliminó la variable requerida {1}.",
    "uuid": "e3b0c442-98fc-1c14-9afb-4c7fa3b9b4f2"
  }
  ```

#### `POST /api/strings/export`
* **Descripción:** Genera y exporta el archivo `English.str` validando el encabezado `TXT` y `NumStrings`.
* **Cuerpo de Solicitud (JSON):**
  ```json
  {
    "target_path": "Localizations/es/String/English.str",
    "format": "TXT"
  }
  ```

---

### 2.3 Subsistema de Mods y VFS (`/api/mods`)

#### `GET /api/mods/catalog`
* **Descripción:** Lista los mods detectados en `Documents\My Games\Ironclad Games\...\Mods-Rebellion v1.85`.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "mod_name": "[ES] Sins Rebellion Traduccion Espanol",
        "level": 1,
        "is_active": true,
        "priority": 1,
        "estimated_ram_mb": 42.5
      }
    ]
  }
  ```

#### `POST /api/mods/toggle`
* **Descripción:** Activa o desactiva un mod modificando de forma atómica `EnabledMods.txt`.
* **Cuerpo de Solicitud (JSON):**
  ```json
  {
    "mod_name": "[ES] Sins Rebellion Traduccion Espanol",
    "enabled": true
  }
  ```

#### `POST /api/mods/reorder`
* **Descripción:** Actualiza la jerarquía de prioridad del VFS en `EnabledMods.txt`.
* **Cuerpo de Solicitud (JSON):**
  ```json
  {
    "priority_order": [
      "[ES] Sins Rebellion Traduccion Espanol",
      "Tactical Expansion Mod"
    ]
  }
  ```

#### `GET /api/mods/ram-profiler`
* **Descripción:** Retorna la telemetría estimada de memoria virtual de 32 bits (LAA) para los mods activos.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "active_mods_count": 2,
      "total_estimated_mb": 1150.0,
      "laa_limit_mb": 3500.0,
      "headroom_mb": 2350.0,
      "risk_level": "LOW"
    }
  }
  ```

---

### 2.4 Subsistema de Entidades e Inspector (`/api/entities`)

#### `GET /api/entities/inspect`
* **Descripción:** Parsea un archivo `.entity` desde `GameInfo/` y retorna sus propiedades estructuradas.
* **Parámetros Query:**
  * `entity_name` (string): ej. `FrigateTechAntiFighter.entity`.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "entity_type": "Frigate",
      "mesh_name": "Frigate_TechAntiFighter.mesh",
      "weapon_banks_count": 2,
      "armor_type": "Medium",
      "shield_capacity": 450.0
    }
  }
  ```
