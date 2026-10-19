# Especificación de API REST - Solaris Nexus Engine (v1.0.0)

## 1. Estándares de Protocolo y Gobernanza de Seguridad
- **Endpoint Base:** `http://localhost/sins-of-sola-empire/api/v1`
- **Seguridad de Transporte:** HTTP/1.1 sobre servidor local WAMP, restringido al bucle local `127.0.0.1` / `localhost`.
- **Codificación de Carga Útil:** Estricto `application/json; charset=utf-8` y `multipart/form-data` para subida de archivos binarios.
- **Protocolo de Cero Stack Traces (UUID Safety):** Ninguna respuesta expone rutas absolutas de disco, excepciones internas de código o volcados de memoria. Todos los errores generan un código `error_uuid` registrado en los logs internos del servidor.

---

## 2. Catálogo de Endpoints

### 2.1. Ingesta y Procesamiento de Cadenas (`/strings`)

#### `POST /api/v1/strings/parse`
Analiza archivos `.str` binarios o de texto y genera su árbol de sintaxis abstracta (AST) con validación de metadatos.
- **Request:** `multipart/form-data` con campo `file`, o JSON `{ "raw_content": "..." }`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "file_type": "TXT",
    "num_strings_declared": 7828,
    "num_strings_parsed": 7828,
    "encoding": "utf-8-sig",
    "line_endings": "CRLF",
    "has_bom": true,
    "entries": [
      {
        "index": 0,
        "id": "IDSPlayerAINameTech0",
        "value": "Nitheim Rebels",
        "tokens": []
      }
    ]
  }
}
```

#### `POST /api/v1/strings/diff`
Ejecuta una comparación secuencial entre el archivo base maestro (Inglés) y el archivo traducido (Español o Mod).
- **Request Body:**
```json
{
  "base_entries": [{ "id": "IDS_ABILITY_NAME", "value": "Energy Burst" }],
  "target_entries": [{ "id": "IDS_ABILITY_NAME", "value": "Ráfaga de Energía" }]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_base": 7828,
      "total_target": 7627,
      "missing_count": 214,
      "untranslated_count": 85,
      "syntax_errors_count": 4
    },
    "missing_keys": ["IDS_INFOCARD_LABEL_ABILITYSHIPSLOTCOST"],
    "syntax_anomalies": [
      {
        "id": "IDSGameOverDialogHasLostPhraseTechMilitary",
        "line": 11639,
        "error_type": "MISSING_OPENING_QUOTE",
        "raw_line": "Value Nuestro imperio...",
        "suggested_fix": "\"Nuestro imperio...\""
      }
    ]
  }
}
```

#### `POST /api/v1/strings/validate`
Linter y analizador de integridad de variables (`token-guard`) para verificación de parámetros de motor.
- **Request Body:**
```json
{
  "id": "IDS_RESEARCHSUBJECT_SHIPBOARD_LABS_DESCRIPTION",
  "base_value": "Grants *VALUE0* weapons per %s ships.",
  "translated_value": "Otorga *VALUE0* armas por cada %s naves."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "character_ratio": 1.15,
    "overflow_risk": "LOW",
    "token_preservation": {
      "status": "PASSED",
      "expected_tokens": ["*VALUE0*", "%s"],
      "found_tokens": ["*VALUE0*", "%s"]
    }
  }
}
```

#### `POST /api/v1/strings/export`
Compila, sanitiza comillas, verifica `NumStrings` y escribe con firma UTF-8 con BOM (`0xEF, 0xBB, 0xBF`) y saltos CRLF.
- **Request Body:** `{ "project_id": "PRJ_REBELLION_BASE", "entries": [...] }`.
- **Response:** Archivo binario para descarga (`attachment; filename="English.str"`).

---

### 2.2. Gestión del Sistema de Mods (`/mods`)

#### `GET /api/v1/mods/catalog`
Escanea de forma asíncrona la carpeta de instalación de mods (`Documents/My Games/.../Mods-Rebellion v1.8x/`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "mods_root": "C:/Users/<User>/Documents/My Games/.../Mods-Rebellion v1.8x/",
    "detected_mods": [
      {
        "id": "MOD_E4X",
        "folder_name": "Enhanced 4X Mod 1.881",
        "category": "OVERHAUL",
        "estimated_memory_mb": 420,
        "has_string_file": true
      },
      {
        "id": "MOD_INT",
        "folder_name": "Star Wars Interregnum Beta 2.51",
        "category": "TOTAL_CONVERSION",
        "estimated_memory_mb": 1250,
        "has_string_file": true
      }
    ]
  }
}
```

#### `GET /api/v1/mods/enabled`
Lee y analiza el archivo activo `EnabledMods.txt`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sins_archive_version": 197,
    "enabled_count": 2,
    "active_mods": [
      { "priority": 1, "name": "Star Wars Interregnum Beta 2.51" },
      { "priority": 0, "name": "Enhanced 4X Mod 1.881" }
    ],
    "total_estimated_ram_mb": 1670,
    "ram_ceiling_risk": "SAFE"
  }
}
```

#### `POST /api/v1/mods/enabled`
Calcula el orden descendente de prioridades, valida la matriz de incompatibilidades y escribe `EnabledMods.txt`.
- **Request Body:**
```json
{
  "selected_mods": [
    { "name": "Star Wars Interregnum Beta 2.51", "priority": 10 },
    { "name": "E4X Doubled Fleet Supply", "priority": 20 }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "file_written": true,
    "ordered_mods": [
      "E4X Doubled Fleet Supply",
      "Star Wars Interregnum Beta 2.51"
    ],
    "conflicts_detected": 0
  }
}
```

#### `POST /api/v1/mods/translation-patch`
Compila un minimod de traducción independiente con máxima prioridad (Prioridad 999).
- **Request Body:**
```json
{
  "target_mod_name": "Star Wars Interregnum Beta 2.51",
  "patch_mod_name": "[ES] Star Wars Interregnum Traduccion",
  "language_code": "es",
  "entries": [...]
}
```

---

### 2.3. Configuración y Empaquetado Nativo (`/system`)

#### `POST /api/v1/system/configure-native-language`
Genera el paquete de idioma en `Localizations/<código>/` y configura `steam_emu.ini`.
- **Request Body:**
```json
{
  "language_code": "es",
  "steam_language": "spanish",
  "copy_font": true,
  "copy_sound": true,
  "copy_movie": false
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scaffolded_path": "Localizations/es/",
    "string_file_active": "Localizations/es/String/English.str",
    "steam_emu_updated": true
  }
}
```

---

## 3. Formato Estándar de Errores (UUID Safety)

```json
{
  "success": false,
  "error": {
    "code": "SYNTAX_LINTER_FAILURE",
    "message": "Se detectó corrupción en los delimitadores de comillas de las cadenas procesadas.",
    "error_uuid": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "timestamp": "2026-10-18T19:25:00Z"
  }
}
```
*Las rutas de disco reales y excepciones internas de bajo nivel se guardan exclusivamente en los logs del servidor bajo la clave `error_uuid`.*
