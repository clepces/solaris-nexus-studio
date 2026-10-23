# Modelado de Componentes de Interfaz de Usuario (UI/UX) - Solaris Nexus

## 1. Filosofía de Diseño y Tokens de Estilo
Solaris Nexus implementa una consola de mando espacial de alto rendimiento, optimizada para sesiones prolongadas de localización, precisión técnica y máxima ergonomía visual.

```css
:root {
  --nexus-bg-root: #0a0e17;
  --nexus-bg-surface: #111827;
  --nexus-bg-card: #1f2937;
  --nexus-border: #374151;
  --nexus-text-primary: #f9fafb;
  --nexus-text-secondary: #9ca3af;
  --nexus-accent-cyan: #06b6d4;
  --nexus-accent-emerald: #10b981;
  --nexus-status-error: #ef4444;
  --nexus-status-warning: #f59e0b;
}
```

---

## 2. Navegación Global y Sistema de Badges de Estado

```text
+---------------------------------------------------------------------------------------------------------+
| SOLARIS NEXUS | Engine Studio v1.0.0                      [ Memoria: 1.8 GB / 3.2 GB ] [ Estado: Seguro ]|
+---------------------------------------------------------------------------------------------------------+
| [ Estudio de Traducción ]  [ Gestor de Mods ]  [ Paquete Nativo ]  [ Editor Entidades ]* [ Galaxy Forge ]* |
|                                                                    *(EN DESARROLLO)      *(PRÓXIMAMENTE) |
+---------------------------------------------------------------------------------------------------------+
```

### Clasificación de Badges de Estado:
- `ACTIVO` (Verde esmeralda `#10b981`): Módulo 100% operativo y verificado contra las especificaciones del motor.
- `BETA` (Azul cian `#06b6d4`): Módulo operativo en fase de pruebas con mods complejos de conversión total.
- `EN DESARROLLO` (Ámbar `#f59e0b`): Renderizado como modelo estático desactivado, con tooltip explicativo de su alcance futuro.
- `PRÓXIMAMENTE` (Púrpura `#8b5cf6`): Funcionalidad planificada en la hoja de ruta de ingeniería.
- `CONFLICTO` (Rojo carmesí `#ef4444`): Alerta activa de corrupción de comillas o colisión de archivos entre mods.

---

## 3. Desglose de Componentes Principales

### 3.1. DataGrid Virtualizado de Cadenas (`str-virtual-grid`) [ESTADO: ACTIVO]
- **Renderizado por Virtual DOM:** Mantiene en el DOM del navegador únicamente las filas visibles en pantalla (25-35 elementos), permitiendo un desplazamiento fluido a través de las 7.828+ cadenas sin congelar la pestaña.
- **Barra de Filtro y Búsqueda:** Filtrado por expresiones regulares en tiempo real por ID de cadena, texto original en inglés o traducción.
- **Resaltado de Diferencias:** Cadenas sin traducir en color ámbar; errores de comillas en rojo; entradas verificadas en verde esmeralda.

```text
+---------------------------------------------------------------------------------------------------------+
| Filtros: [ Todos (7.828) | Faltantes (214) | Errores (4) ]           Búsqueda: [ Ability_Armor         ] |
+---------------------------------------------------------------------------------------------------------+
| ÍNDICE | IDENTIFICADOR (ID)                         | TEXTO BASE (EN)         | TRADUCCIÓN (ES)  | ESTADO |
+--------+--------------------------------------------+-------------------------+------------------+--------+
| 0001   | IDSPlayerAINameTech0                       | Nitheim Rebels          | Rebeldes Nitheim | [ OK ] |
| 0740   | IDS_INFOCARD_LABEL_ABILITYSHIPSLOTCOST     | Supply cost             | Coste suministro | [ OK ] |
| 11639  | IDSGameOverDialogHasLostPhraseTechMilitary | Our empire, once...     | "Nuestro imperi..| [REPAR]|
| 7825   | IDSOptionsScreenUserInterfaceOptionsLangu..| Language                | Idioma           | [ OK ] |
+---------------------------------------------------------------------------------------------------------+
| [ Cargar Base (.back) ]  [ Cargar Destino (.str) ]  [ Validar Token Guard ]  [ Exportar English.str (BOM) ] |
+---------------------------------------------------------------------------------------------------------+
```

---

### 3.2. Panel del Orquestador de Mods (`mod-selector-panel`) [ESTADO: ACTIVO]
- **Selector Excluyente de Mod Principal:** Grupo de botones de radio para alternar entre conversiones totales (ej. *Star Wars: Interregnum*) y overhauls (ej. *Enhanced 4X*).
- **Lista de Minimods con Reordenamiento por Arrastre (Drag & Drop):** Permite subir y bajar mods interactivamente, recalculando los pesos y reflejando de inmediato el orden en el VFS.
- **Gestor de Perfiles / Presets:** Guarda y carga perfiles completos con un clic (ej. "Perfil Star Wars", "Perfil Halo Sins of the Prophets", "Perfil Competitivo E4X").
- **Matriz de Incompatibilidad en Tiempo Real:** Bloqueo reactivo de combinaciones incompatibles.
- **Explorador Comunitario ModDB / Catálogo Local:** Pestaña para explorar mods populares de [ModDB](https://www.moddb.com/games/sins-of-a-solar-empire-rebellion/mods), detectar actualizaciones de versiones y validar la presencia de la carpeta `String/` para traducción.

```text
+---------------------------------------------------------------------------------------------------------+
| ORQUESTADOR DE MODS ACTIVOS (EnabledMods.txt)      [ Perfil: Star Wars Interregnum v2.51 [v] ] [ Guardar] |
+---------------------------------------------------------------------------------------------------------+
| [ Mis Mods Locales (12) ]  [ Explorador ModDB / Comunidad ]  [ Historial de Versiones ]                 |
+---------------------------------------------------------------------------------------------------------+
| 1. Mod Principal de Conversión:                                                                         |
|    ( ) Enhanced 4X Mod 1.881                (o) Star Wars Interregnum Beta 2.51                         |
|                                                                                                         |
| 2. Minimods de Jugabilidad y Balance (Arrastrar para reordenar prioridad VFS):                          |
|    ::: [X] [ES] Interregnum Traducción en Español  (Prioridad: 999 - FIJADA ARRIBA)                     |
|    ::: [X] E4X Doubled Fleet Supply                (Prioridad: 20)                                      |
|    ::: [X] PFX Deathmatch Mode                     (Prioridad: 20) [!] Conflicto con Beskar             |
|    ::: [ ] Beskar Armor Overhaul                   (Prioridad: 15) [DESACTIVADO POR CONFLICTO]          |
|    ::: [X] PFX Faster Combat                       (Prioridad: 10)                                      |
+---------------------------------------------------------------------------------------------------------+
| VISTA PREVIA EN TIEMPO REAL DE EnabledMods.txt:                                                         |
|   TXT2 / SinsArchiveVersion 197 / Version 0 / enabledModNameCount 4                                     |
|   1. "[ES] Interregnum Traducción en Español"                                                           |
|   2. "E4X Doubled Fleet Supply"                                                                         |
|   3. "PFX Deathmatch Mode"                                                                              |
|   4. "Star Wars Interregnum Beta 2.51"                                                                  |
+---------------------------------------------------------------------------------------------------------+
| [ Re-escanear Directorio ]    [ Validar Incompatibilidades ]    [ Guardar en EnabledMods.txt ]          |
+---------------------------------------------------------------------------------------------------------+
```


---

### 3.3. Módulos Futuros Extendidos (Modelos Estáticos con Badges)

#### A. Medidor de Memoria RAM de 32 Bits [BADGE: EN DESARROLLO]
- **Medidor Gráfico:** Barra segmentada que calcula el direccionamiento virtual acumulado (`0 MB` a `3.500 MB`).
- **Niveles de Seguridad:**
  - `0 - 2.200 MB` (Verde / Óptimo): Juego base + minimods de balance ligeros.
  - `2.200 - 2.900 MB` (Amarillo / Precaución): Mods de conversión total con nuevos modelos de naves.
  - `2.900 - 3.200+ MB` (Rojo / Peligro Extremo): Combinaciones masivas de mods al borde del colapso del motor (*MiniDump*).

#### B. Editor de Parámetros de Entidades [BADGE: EN DESARROLLO]
- **Propósito:** Editor interactivo para archivos `.entity` con deslizadores (*sliders*) para créditos iniciales, multiplicadores de investigación y coeficientes de suministro de flota.
- **Aviso de Juego Limpio:** Muestra un distintivo que diferencia ajustes de balance estándar de modificaciones de partidas locales (*Sandbox*).

#### C. Compañero Galaxy Forge [BADGE: PRÓXIMAMENTE]
- **Propósito:** Visualizador interactivo en HTML5 Canvas de mapas `.galaxy` para modificar estrellas, planetas y carriles de salto de fase.
