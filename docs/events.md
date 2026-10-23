# Bus de Eventos y Ciclo de Vida Reactivo - Solaris Nexus Studio

## 1. Principio de Gobernanza de Eventos
Para evitar dependencias circulares y código espagueti entre controladores visuales y módulos de datos, todos los componentes se comunican exclusivamente a través del **Bus Central de Eventos**. Ningún componente invoca directamente métodos internos de otro componente.

```
       +-----------------------------------------+
       |       BUS CENTRAL DE EVENTOS (PUB/SUB)  |
       +----+-----------------+-------------+----+
            ▲                 ▲             │
            │ Publica         │ Publica     │ Notifica
            │                 │             ▼
     +------+------+   +------+------+  +---+-----------+
     | Búsqueda /  |   | Gestor VFS /|  | Grilla /      |
     | Inputs UI   |   | Mods        |  | Paginador     |
     +-------------+   +-------------+  +---------------+
```

---

## 2. Implementación del Bus en Frontend (`src/frontend/state/event-bus.ts`)

```typescript
type EventCallback<T = unknown> = (payload: T) => void;

export class NexusEventBus {
  private static instance: NexusEventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public static getInstance(): NexusEventBus {
    if (!NexusEventBus.instance) {
      NexusEventBus.instance = new NexusEventBus();
    }
    return NexusEventBus.instance;
  }

  public on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    // Retorna función de desuscripción automática
    return () => this.off(event, callback as EventCallback);
  }

  public off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  public emit<T>(event: string, payload: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(cb => cb(payload));
    }
  }
}

export const eventBus = NexusEventBus.getInstance();
```

---

## 3. Catálogo Canónico de Eventos del Sistema

### 3.1 Canales de Búsqueda y Navegación UI
| Canal de Evento | Emisor | Payload | Descripción |
| :--- | :--- | :--- | :--- |
| `search:input` | Inputs de búsqueda | `{ query: string, targetTable: string }` | Disparado al teclear en el input de búsqueda. |
| `search:cleared` | Inputs de búsqueda | `{ targetTable: string }` | Disparado cuando el input se vacía. Provoca reseteo instantáneo de filtros. |
| `pagination:change` | Barra de paginación | `{ page: number, target: string }` | Notifica cambio de página para rebanar el dataset visual. |
| `tab:change` | Navegación y Carrusel | `{ tabId: string, previousTab: string }` | Notifica alternancia de vista activa. |

### 3.2 Canales de Localización y Diccionarios (.STR)
| Canal de Evento | Emisor | Payload | Descripción |
| :--- | :--- | :--- | :--- |
| `str:loaded` | Parser `.str` | `{ fileName: string, totalStrings: number, strings: [] }` | Notifica que un archivo léxico fue cargado y verificado. |
| `str:updated` | Live Editor | `{ id: string, originalText: string, translatedText: string }` | Notifica modificación de una cadena individual. |
| `str:token-violation` | Token Guard | `{ id: string, expectedTokens: string[], missing: string[] }` | Notifica que una traducción alteró variables protegidas (`{0}`, `{1}`). |
| `str:saved` | Synthesizer | `{ filePath: string, count: number, timestamp: string }` | Notifica exportación exitosa a disco en formato TXT/TXT2. |

### 3.3 Canales de Mods y Archivos Virtuales (VFS)
| Canal de Evento | Emisor | Payload | Descripción |
| :--- | :--- | :--- | :--- |
| `mod:status-toggled` | Gestor de Mods | `{ modName: string, enabled: boolean }` | Notifica activación o desactivación de un mod. |
| `mod:priority-changed` | Jerarquía VFS | `{ order: string[] }` | Notifica reordenamiento en `EnabledMods.txt`. |
| `mod:collision-detected` | Auditor VFS | `{ file: string, conflictingMods: string[] }` | Notifica que múltiples mods sobrescriben el mismo asset del juego. |
| `mod:installed` | Inyector Minimod | `{ modId: string, level: 1 \| 2 \| 3 }` | Notifica instalación de un mod con su nivel de impacto. |

### 3.4 Canales de Telemetría y Rendimiento
| Canal de Evento | Emisor | Payload | Descripción |
| :--- | :--- | :--- | :--- |
| `ram:telemetry-update` | RAM Profiler | `{ usedMb: number, limitMb: 3500, riskLevel: string }` | Actualiza el indicador de memoria virtual de 32 bits (LAA). |
| `ram:threshold-alert` | RAM Profiler | `{ currentMb: number, message: string }` | Alerta de proximidad al techo crítico de 3.2 GB - 3.8 GB. |
| `system:health-check` | System Health | `{ phpVersion: string, wampStatus: string, gameFound: boolean }` | Notifica diagnóstico general del entorno local. |
