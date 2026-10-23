# UI Component Specifications & Layouts - Solaris Nexus

## 1. Design Philosophy & Theme Tokens
Solaris Nexus implements a sci-fi command console interface optimized for prolonged localization sessions, technical precision, and zero visual clutter.

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

## 2. Global Navigation & Status Badges

```text
+---------------------------------------------------------------------------------------------------------+
| SOLARIS NEXUS | Engine Studio v1.0.0                      [ Memory: 1.8 GB / 3.2 GB ] [ Status: Safe ] |
+---------------------------------------------------------------------------------------------------------+
| [ Translation Studio ]  [ Mod Orchestrator ]  [ Native Packager ]  [ Entity Modifier ]* [ Galaxy Forge ]* |
|                                                                    *(IN DEVELOPMENT)   *(PLANNED)        |
+---------------------------------------------------------------------------------------------------------+
```

### Badge Classification System:
- `ACTIVE` (Emerald `#10b981`): 100% operational and verified against engine specifications.
- `BETA` (Cyan `#06b6d4`): Operational module undergoing real-world validation with complex mods.
- `IN DEVELOPMENT` (Amber `#f59e0b`): Rendered with static disabled controls and descriptive roadmap tooltip.
- `PLANNED` (Purple `#8b5cf6`): Scheduled in technical architecture roadmap.
- `CONFLICT` (Crimson `#ef4444`): Active alert for quotation corruption or mod incompatibility.

---

## 3. Core UI Components

### 3.1. Translation DataGrid (`str-virtual-grid`) [STATUS: ACTIVE]
- **Virtual DOM Scrolling:** Renders only visible table rows (typically 25-35 DOM elements) while scrolling smoothly through 7,828+ entries.
- **Search & Filter Toolbar:** Real-time regex filtering by String ID, English base text, or translation.
- **Diff Highlighting:** Untranslated lines in amber; quotation syntax errors in red; validated lines in emerald.

```text
+---------------------------------------------------------------------------------------------------------+
| Filter: [ All (7,828) | Missing (214) | Syntax Errors (4) ]     Search: [ Ability_Armor               ] |
+---------------------------------------------------------------------------------------------------------+
| INDEX | STRING IDENTIFIER                          | BASE VALUE (EN)         | TRANSLATION (ES) | STATUS |
+-------+--------------------------------------------+-------------------------+------------------+--------+
| 0001  | IDSPlayerAINameTech0                       | Nitheim Rebels          | Rebeldes Nitheim | [ OK ] |
| 0740  | IDS_INFOCARD_LABEL_ABILITYSHIPSLOTCOST     | Supply cost             | Coste suministro | [ OK ] |
| 11639 | IDSGameOverDialogHasLostPhraseTechMilitary | Our empire, once...     | "Nuestro imperi..| [REPAR]|
| 7825  | IDSOptionsScreenUserInterfaceOptionsLangu..| Language                | Idioma           | [ OK ] |
+---------------------------------------------------------------------------------------------------------+
| [ Load Base (.back) ]  [ Load Target (.str) ]  [ Run Token Guard ]  [ Export English.str (UTF-8 BOM) ]  |
+---------------------------------------------------------------------------------------------------------+
```

---

### 3.2. Mod Orchestrator Panel (`mod-selector-panel`) [STATUS: ACTIVE]
- **Main Mod Exclusive Selector:** Radio group switching between total conversions (e.g. *Star Wars: Interregnum*) and overhaul mods (e.g. *Enhanced 4X*).
- **Minimod Checklist with Interactive Drag & Drop:** Allows manual reordering of mods, dynamically recalculating VFS execution priorities.
- **Profile / Preset Manager:** Save and restore complete mod setups with a single click (e.g., "Star Wars Profile", "Halo Sins of the Prophets Profile", "E4X Competitive Profile").
- **Real-Time Conflict Matrix:** Reactive blocking of incompatible mod combinations.
- **ModDB Community Explorer / Local Catalog:** Dedicated tab to discover popular mods from [ModDB](https://www.moddb.com/games/sins-of-a-solar-empire-rebellion/mods), check version updates, and inspect whether mods include custom `String/` folders for translation.

```text
+---------------------------------------------------------------------------------------------------------+
| ACTIVE MOD ORCHESTRATOR (EnabledMods.txt)          [ Profile: Star Wars Interregnum v2.51 [v] ] [ Save ] |
+---------------------------------------------------------------------------------------------------------+
| [ Local Mods (12) ]  [ ModDB Community Explorer ]  [ Version History ]                                  |
+---------------------------------------------------------------------------------------------------------+
| 1. Main Conversion Mod:                                                                                 |
|    ( ) Enhanced 4X Mod 1.881                (o) Star Wars Interregnum Beta 2.51                         |
|                                                                                                         |
| 2. Gameplay & Balance Minimods (Drag to adjust VFS priority):                                           |
|    ::: [X] [ES] Interregnum Spanish Localization  (Priority: 999 - PINNED TOP)                          |
|    ::: [X] E4X Doubled Fleet Supply                (Priority: 20)                                       |
|    ::: [X] PFX Deathmatch Mode                     (Priority: 20) [!] Conflict with Beskar              |
|    ::: [ ] Beskar Armor Overhaul                   (Priority: 15) [DISABLED DUE TO CONFLICT]            |
|    ::: [X] PFX Faster Combat                       (Priority: 10)                                       |
+---------------------------------------------------------------------------------------------------------+
| LIVE PREVIEW OF EnabledMods.txt:                                                                        |
|   TXT2 / SinsArchiveVersion 197 / Version 0 / enabledModNameCount 4                                     |
|   1. "[ES] Interregnum Spanish Localization"                                                            |
|   2. "E4X Doubled Fleet Supply"                                                                         |
|   3. "PFX Deathmatch Mode"                                                                              |
|   4. "Star Wars Interregnum Beta 2.51"                                                                  |
+---------------------------------------------------------------------------------------------------------+
| [ Rescan Mods Directory ]     [ Validate Incompatibilities ]     [ Write to EnabledMods.txt ]           |
+---------------------------------------------------------------------------------------------------------+
```

---

### 3.3. Extended Modules (Static Models with Feature Badges)

#### A. 32-Bit Memory Load Meter [BADGE: IN DEVELOPMENT]
- **Visual Meter:** Segmented gauge displaying estimated virtual address allocation (`0 MB` to `3,500 MB`).
- **Safety Tiers:**
  - `0 - 2,200 MB` (Green / Optimal): Vanilla game + standard balance minimods.
  - `2,200 - 2,900 MB` (Yellow / Caution): Total conversion mods with custom ship models.
  - `2,900 - 3,200+ MB` (Red / Extreme Danger): Overloaded mod combinations nearing 32-bit crash ceiling.

#### B. Entity & Gameplay Attribute Modifier [BADGE: IN DEVELOPMENT]
- **Purpose:** Interactive editor for game entity files (`.entity`) using sliders for starting credits, research duration scalar, and fleet supply coefficients.
- **Fair Play Guard:** Displays a visual watermark distinguishing standard balance tweaks from single-player sandbox modifications.

#### C. Galaxy Forge Companion [BADGE: PLANNED]
- **Purpose:** Canvas-based interactive galactic cartography viewer for inspecting planet positions and phase lane topology in `.galaxy` files.
