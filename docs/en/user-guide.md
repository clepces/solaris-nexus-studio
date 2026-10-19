# Operational User Guide & Deployment Manual - Solaris Nexus (v1.0.0)

## 1. Native Spanish Language Setup in Base Game

### A. Directory Structure in `Localizations/es/`
For the game to run in Spanish natively without interfering with the clean English installation:
1. Ensure the Spanish language directory exists at:
   ```text
   C:\Games\Sins of a Solar Empire Rebellion\Localizations\es\
   ```
2. **Critical File Naming Rule:**
   - The file inside `String\` must be named **`English.str`** (e.g. `Localizations\es\String\English.str`).
   - **Why?** The game executable searches for the literal string `String\English.str` within the active language folder. If named `Spanish.str`, the engine will report a missing file and fail to display texts.
   - For complete safety, Solaris Nexus maintains both `English.str` and `Spanish.str` within that directory.

3. **Complementary Subdirectories:**
   - **`Font/`:** Contains `.font` definitions and TrueType fonts (`SinsAgencyBold.ttf`, `SinsOfficinaSans.ttf`). Copied from `en/`, it guarantees full support for accented characters (`á, é, í, ó, ú, ñ, ¿, ¡`).
   - **`Sound/`:** Contains speech audio and unit responses. Copied from `en/`, it prevents any silence during space combat.
   - **`Movie/`:** Contains `OpeningCinematic.bik`. If omitted, the game automatically plays the cinematic from `en/Movie/` without error.

### B. Activation in `steam_emu.ini`
To switch the game into Spanish:
1. Open the configuration file in the game's root directory:
   ```text
   C:\Games\Sins of a Solar Empire Rebellion\steam_emu.ini
   ```
2. Find the `Language` setting and change it to `spanish`:
   ```ini
   ### Language that will be used in the game
   Language=spanish
   ```
3. Save and launch the game. The engine will load all assets directly from [Localizations/es/](file:///C:/Games/Sins%20of%20a%20Solar%20Empire%20Rebellion/Localizations/es/).

---

## 2. Mod Orchestrator (`EnabledMods.txt`) Usage

The Mod Orchestrator module configures mod activation and priorities without manual text file editing.

### Mod File Location:
```text
C:\Users\<User>\Documents\My Games\Ironclad Games\Sins of a Solar Empire Rebellion\Mods-Rebellion v1.8x\EnabledMods.txt
```

### Step-by-Step Procedure:
1. **Select Main Conversion Mod:** Choose between a total conversion (e.g., *Star Wars: Interregnum*) or an overhaul mod (e.g., *Enhanced 4X Mod*).
2. **Select Gameplay Minimods:** Check desired options:
   - *Doubled Fleet Supply:* Doubles fleet and capital ship capacity.
   - *Faster Combat:* Increases weapon damage by 50%.
   - *Infinite Research:* Late-game credit sink for massive maps.
   - *Reset Titan Levels:* Rebuilding titans spawns them at level 1.
3. **Resolve Conflicts:** If two conflicting mods are checked simultaneously (e.g., *Deathmatch* and *Beskar*), the tool highlights the row in red and issues an incompatibility warning.
4. **Export Configuration:** Click **Save EnabledMods.txt**. The tool sorts mods in descending priority order and writes the canonical `TXT2 / SinsArchiveVersion 197` header.

---

## 3. Translating Mods with Standalone Translation Minimods

To translate complex total conversion mods without altering their original files:

1. **Step 1: Extract Mod Strings**
   - In Solaris Nexus, load the mod's `String\English.str`.
   - Load the base game Spanish string dictionary (`Localizations\es\String\English.str`).
   - The tool inherits base strings and isolates unique mod entries.
2. **Step 2: Translate Mod Entries**
   - Translate custom faction names, ship classes, and weapon descriptions in the virtual DataGrid.
3. **Step 3: Compile Translation Patch Minimod**
   - Click **Create Translation Patch Minimod**.
   - The tool automatically scaffolds:
     ```text
     Mods-Rebellion v1.8x\[ES] ModName Spanish Patch\String\English.str
     ```
4. **Step 4: Activate at Maximum Priority**
   - In the Mod Orchestrator, enable the newly generated patch mod.
   - The tool automatically assigns **Priority 999** (placing it at line 5 of `EnabledMods.txt`).
   - When launching the game, all 3D meshes and audio are loaded from the original mod, while all text displays cleanly in Spanish.

---

## 4. Troubleshooting Reference

| Symptom | Root Cause | Solution in Solaris Nexus |
| :--- | :--- | :--- |
| **Game crashes on startup** | `NumStrings` mismatch or unclosed quote in `.str`. | Pass the file through **Token Guard & Linter**; click Export. |
| **UI displays `IDS...` labels** | The string ID does not exist in the active `.str`. | Load master base file and run **Diff Analyzer** to add missing keys. |
| **Characters show as `Ã³` or `?`** | File was saved in ANSI or UTF-8 without BOM. | Export via Solaris Nexus; it strictly enforces `0xEF 0xBB 0xBF` BOM. |
| **MiniDump during large battles** | Total active mods exceeded the 32-bit RAM ceiling (~3.2 GB). | Review the **32-Bit Memory Load Meter** and deactivate non-essential minimods. |
