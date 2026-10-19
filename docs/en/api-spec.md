# REST API Specification - Solaris Nexus Engine (v1.0.0)

## 1. Protocol Standards & Security Governance
- **Base Endpoint:** `http://localhost/sins-of-sola-empire/api/v1`
- **Transport Security:** HTTP/1.1 local WAMP runtime. Restricted to local loopback `127.0.0.1` / `localhost`.
- **Payload Encoding:** Strict `application/json; charset=utf-8` and `multipart/form-data` for file uploads.
- **Zero Stack Traces (UUID Safety):** No server response exposes physical disk directories, internal code exceptions, or memory traces. Every error generates a tracked `error_uuid` linked to backend audit logs.

---

## 2. API Endpoints Catalog

### 2.1. String Ingestion & Processing (`/strings`)

#### `POST /api/v1/strings/parse`
Parses raw `.str` files into a typed Abstract Syntax Tree (AST) with encoding and metadata validation.
- **Request:** `multipart/form-data` with `file` field, or JSON `{ "raw_content": "..." }`.
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
Executes an index-and-key comparison between Master Base (English) and Target (Localized/Mod).
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
Linter and token integrity engine (`token-guard`) for syntax and parameter verification.
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
Compiles, sanitizes quotes, verifies `NumStrings`, and writes UTF-8 BOM (`0xEF, 0xBB, 0xBF`) with CRLF.
- **Request Body:** `{ "project_id": "PRJ_REBELLION_BASE", "entries": [...] }`.
- **Response:** Binary stream with header `Content-Disposition: attachment; filename="English.str"`.

---

### 2.2. Mod Management & Priority Engine (`/mods`)

#### `GET /api/v1/mods/catalog`
Scans the user's active mod directory (`Documents/My Games/.../Mods-Rebellion v1.8x/`).
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
Parses the current `EnabledMods.txt` file and returns the active priority list.
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
Calculates priority sorting, runs conflict matrix checks, and writes `EnabledMods.txt`.
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
Compiles a standalone, high-priority (Priority 999) translation minimod.
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

### 2.3. System & Native Packaging (`/system`)

#### `POST /api/v1/system/configure-native-language`
Scaffolds native directory in `Localizations/<lang_code>/` and sets emulator config.
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

## 3. Error Standard Response (UUID Safety)

```json
{
  "success": false,
  "error": {
    "code": "SYNTAX_LINTER_FAILURE",
    "message": "Quotation delimiter corruption detected in target string entries.",
    "error_uuid": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "timestamp": "2026-10-18T19:10:00Z"
  }
}
```
*Technical stack traces and disk absolute paths are stored exclusively in server-side logs using `error_uuid`.*
