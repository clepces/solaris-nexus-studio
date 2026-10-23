# Asynchronous Events Specification - Solaris Nexus Architecture

## 1. Event-Driven Concurrency Model
Solaris Nexus implements a decoupled **Event Bus (Pub/Sub)** architecture. Real-time updates between the WAMP backend and the interactive web client are transported via **Server-Sent Events (SSE)** or **Local WebSockets**, providing immediate feedback during bulk parsing and mod ordering.

```mermaid
flowchart LR
    subgraph Producers ["Emitters"]
        E1["AST Parser"]
        E2["Token Guard"]
        E3["Mod Engine"]
        E4["RAM Profiler"]
    end

    subgraph Bus ["Solaris Event Bus"]
        EB["Async Dispatcher"]
    end

    subgraph Consumers ["Listeners"]
        L1["Virtual DataGrid"]
        L2["Live Linter Alert"]
        L3["Conflict Banner"]
        L4["Memory Meter Gauge"]
    end

    Producers --> EB
    EB --> Consumers
```

---

## 2. Standard Event Contract (`NexusEvent`)

Every event dispatched through the system conforms to the following TypeScript interface:

```typescript
export interface NexusEvent<T = Record<string, unknown>> {
  id: string;           // UUIDv4 unique event instance identifier
  type: string;         // Canonical namespace (category:action-state)
  timestamp: string;    // ISO 8601 UTC timestamp
  emitter: string;      // Emitting module name
  payload: T;           // Strictly-typed event payload
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
}
```

---

## 3. Comprehensive Event Catalog

### 3.1. Localization & String Parsing Events

#### `str:file-ingested`
Dispatched upon reading a string file from the filesystem.
```json
{
  "id": "1e9b2c34-8d4a-4f51-b8ef-5e729a1b0001",
  "type": "str:file-ingested",
  "timestamp": "2026-10-18T19:15:00Z",
  "emitter": "str-ingestion-service",
  "payload": {
    "source_path": "Localizations/en/String/English.str",
    "byte_size": 883532,
    "declared_num_strings": 7828,
    "has_bom": true
  }
}
```

#### `str:linter-violation-detected`
Dispatched in real-time when quotation anomalies or syntax corruptions are identified.
```json
{
  "id": "2b7a4c12-3f19-4a88-9cf1-0e192a8b0002",
  "type": "str:linter-violation-detected",
  "timestamp": "2026-10-18T19:15:01Z",
  "emitter": "linter-service",
  "severity": "ERROR",
  "payload": {
    "line_number": 11639,
    "entry_id": "IDSGameOverDialogHasLostPhraseTechMilitary",
    "violation_code": "MISSING_OPENING_QUOTE",
    "raw_value": "Nuestro imperio, antaño próspero, yace ahora en ruinas.\"",
    "suggested_fix": "\"Nuestro imperio, antaño próspero, yace ahora en ruinas.\""
  }
}
```

#### `str:token-guard-alert`
Dispatched when a translation modifies, removes, or incorrectly repositions engine variables.
```json
{
  "id": "3c8d1e23-4a56-4b77-8d99-1f283b9c0003",
  "type": "str:token-guard-alert",
  "timestamp": "2026-10-18T19:15:02Z",
  "emitter": "token-guard-service",
  "severity": "CRITICAL",
  "payload": {
    "entry_id": "IDS_RESEARCHSUBJECT_SHIPBOARD_LABS_DESCRIPTION",
    "missing_tokens": ["*VALUE0*"],
    "altered_tokens": ["%d"],
    "message": "Engine dynamic variable *VALUE0* was omitted in translation."
  }
}
```

---

### 3.2. Mod Management & Memory Profiler Events

#### `mod:catalog-updated`
Dispatched after completing an asynchronous scan of the user's mod repository.
```json
{
  "id": "4d9e0f34-5b67-4c88-9e00-2a394c0d0004",
  "type": "mod:catalog-updated",
  "timestamp": "2026-10-18T19:15:05Z",
  "emitter": "mod-scanner-service",
  "payload": {
    "total_detected": 14,
    "total_conversions": 2,
    "total_minimods": 12,
    "scan_duration_ms": 138
  }
}
```

#### `mod:conflict-detected`
Dispatched when mod selection conflicts are detected in the incompatibility matrix.
```json
{
  "id": "5e0f1a45-6c78-4d99-af11-3b405d1e0005",
  "type": "mod:conflict-detected",
  "timestamp": "2026-10-18T19:15:06Z",
  "emitter": "priority-orchestrator",
  "severity": "WARNING",
  "payload": {
    "source_mod": "PFX Deathmatch Mode",
    "conflicting_mod": "Beskar",
    "conflict_reason": "Both mods alter shield recharge rates and planetary tax coefficients."
  }
}
```

#### `mod:memory-threshold-exceeded`
Dispatched when the cumulative estimated memory footprint of active mods approaches the 32-bit limit.
```json
{
  "id": "6a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "type": "mod:memory-threshold-exceeded",
  "timestamp": "2026-10-18T19:15:08Z",
  "emitter": "ram-profiler-service",
  "severity": "CRITICAL",
  "payload": {
    "total_estimated_ram_mb": 3350,
    "max_safe_ram_mb": 3100,
    "risk_level": "EXTREME_DANGER",
    "message": "Selected mods exceed the 32-bit LAA memory budget (~3.2 GB). In-game MiniDump crash is imminent."
  }
}
```

#### `mod:enabled-order-committed`
Dispatched when `EnabledMods.txt` is validated and serialized to disk.
```json
{
  "id": "7f1a2b56-7d89-4eaa-b022-4c516e2f0007",
  "type": "mod:enabled-order-committed",
  "timestamp": "2026-10-18T19:15:10Z",
  "emitter": "fs-writer-service",
  "payload": {
    "target_path": "Mods-Rebellion v1.8x/EnabledMods.txt",
    "mods_active_count": 4,
    "checksum": "e3b0c44298fc1c14"
  }
}
```

---

### 3.3. Translation Memory (TM) Events

#### `tm:suggestion-found`
Dispatched when the translation memory identifies an identical or fuzzy match for an untranslated string.
```json
{
  "id": "8a3c5e79-0b2d-4f68-a1c3-e5g7i9k10008",
  "type": "tm:suggestion-found",
  "timestamp": "2026-10-18T19:15:12Z",
  "emitter": "translation-memory-service",
  "payload": {
    "str_key": "IDS_ABILITY_CUSTOM_SHIELD_DESC",
    "match_confidence": 0.98,
    "suggested_text": "Aumenta la capacidad del escudo un 20%."
  }
}
```
