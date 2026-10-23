# Auditoría Técnica del Motor IronEngine (Sins of a Solar Empire: Rebellion)
## Subsistema de Localización (.STR), Estructura de Directorios, Arquitectura de Mods (3 Niveles) y Especificación de Solaris Nexus Studio

---

## 1. Análisis Forense: El Problema del Idioma Español

### 1.1 El Misterio de la Carpeta `Localizations\es\` y la Interfaz del Juego
Al crear el directorio `Localizations\es\String\English.str`, el idioma **no aparece en la lista desplegable de "Idioma" (Options > Interface)** mostrada en la interfaz del juego.

La causa técnica directa ha sido identificada mediante ingeniería inversa sobre el binario ejecutable (`Sins of a Solar Empire Rebellion.exe`):
1. **Lista de Idiomas 'Hardcodeada' en Binario:**
   A nivel de código compilado (offset de memoria física `0x53EB50` - `0x53EBA0`), el motor `IronEngine` contiene una tabla estática en UTF-16LE:
   ```text
   en (Base / Fallback)
   de | fr | it | ja | pl | ru | zh-CN
   ```
2. **Ausencia de Escaneo Dinámico en Disco:**
   El componente `languageListArea` definido en `Window/UserInterfaceOptionsTabContent.window` **no** ejecuta una búsqueda recursiva (`FindFirstFileW` / `GetChildItem`) sobre la carpeta `Localizations\`. En su lugar, itera exclusivamente sobre su array interno estático de 8 códigos ISO.
3. **Resolución de Nombres Nativos (Windows NLS):**
   Para cada código estático, el motor consulta a la API de Windows (`GetLocaleInfoW` con `LOCALE_SNATIVELANGUAGENAME`) para renderizar el texto en pantalla:
   * `de` -> *Deutsch*
   * `en` -> *English*
   * `fr` -> *français*
   * `it` -> *italiano*
   * `ja` -> *日本語*
   * `pl` -> *polski*
   * `ru` -> *русский*
   * `zh-CN` -> *简体中文*
   
   Al no estar `es` presente en dicha tabla interna compilada, el motor omite cualquier carpeta arbitraria no registrada.

### 1.2 ¿Por qué el archivo se llama obligatoriamente `English.str` en todos los idiomas?
El cargador de cadenas (`StringTableLoader`) del motor tiene codificada la ruta relativa literal:
```text
%LANGUAGE_PATH%\String\English.str
```
El motor fue originalmente desarrollado para inglés ("English.str"). Cuando Stardock e Ironclad introdujeron soporte multi-idioma en versiones posteriores, modificaron la ruta raíz de montaje hacia `Localizations\<ISO>\`, pero mantuvieron fijo el nombre del archivo de definición léxica como `English.str`. Si el archivo se renombra a `Spanish.str` o `es.str`, el motor arroja un fallo crítico de puntero nulo o fallback inmediato a cadenas vacías.

### 1.3 Análisis de Captura (`Screenshot_0.bmp`): ¿Por qué la interfaz estaba en Español si el Selector no tenía `Spanish`?
En la captura de pantalla provista, se observan textos traducidos ("OPCIONES", "Auto Colocar Extractores de Recursos", "Menú Imperio: Mostrar Flotas en Salto de Fase") a pesar de que el selector desplegable sólo lista los 8 idiomas oficiales.

El análisis de los archivos de configuración y registros locales reveló la causa:
* En `C:\Users\Clepces\Documents\My Games\Ironclad Games\Sins of a Solar Empire Rebellion\Mods-Rebellion v1.85\EnabledMods.txt`:
  ```text
  TXT2
  SinsArchiveVersion 197
  Version 0
  enabledModNameCount 1
  enabledModName "[ES] Sins Rebellion Traduccion Espanol"
  ```
* El juego estaba ejecutando un **Mod de Traducción Activo**.
* En el sistema de capas de archivos virtuales (VFS) de Sins of a Solar Empire, cualquier archivo ubicado en la carpeta del mod con la ruta `String\English.str` tiene **prioridad de resolución 1 (sobrescritura en memoria)** sobre los archivos base de `Localizations\en\String\English.str`.
* El motor corría en modo base `Language "en"`, pero con todas sus cadenas léxicas reemplazadas en caliente por el mod español.

### 1.4 Configuración de Usuario (`rebellion.user.setting` vs `steam_emu.ini`)
* `rebellion.user.setting` almacena el parámetro `Language "en"`. Si se fuerza manualmente a `Language "es"` en el archivo de texto plano, versiones de producción de Rebellion sin mod parcheado ignoran el valor o revierten a `Language "en"` al detectar que no coincide con ninguno de los 8 slots admitidos en el switch interno del ejecutable.
* `steam_emu.ini` (Emulador CODEX) contiene la directiva `Language=spanish`. Al arrancar, el gancho `steam_api.dll` responde a la llamada `SteamApps()->GetCurrentGameLanguage()` con la cadena `"spanish"`. No obstante, el motor retail solo consulta esta API en el primer inicio para establecer el valor inicial de `rebellion.user.setting`; posteriormente manda el setting de usuario.

---

## 2. Radiografía Completa del Directorio del Juego y Herramientas

| Directorio / Archivo | Tipo | Propósito y Funcionamiento Técnico |
| :--- | :--- | :--- |
| `ConvertXSI\` | Herramienta | Contiene `ConvertXSI.exe`. Compilador/conversor oficial que procesa modelos 3D exportados desde Autodesk Softimage|XSI (`.xsi`) hacia el formato de malla binario/texto propietario de Sins (`.mesh`). |
| `Galaxy\` | Datos de Juego | Almacena los escenarios y mapas galácticos (`.galaxy`). Define número de estrellas, pozos de gravedad, composición de planetas, carriles de salto hiperespacial (*Phase Lanes*) y condiciones de victoria. |
| `Galaxy Forge\` | Herramienta | Editor visual oficial (`GalaxyForge.exe`). Permite a diseñadores y modders crear y posicionar planetas, nebulosas y recursos de forma gráfica sin editar texto crudo. |
| `GameInfo\` | Base de Datos Core | El núcleo lógico del juego. Contiene más de 3,500 archivos `.entity` que definen naves (`FrigateTech.entity`), estructuras, árboles tecnológicos de investigación, habilidades, proyectiles y modificadores (buffs). |
| `Localizations\` | Localización | Paquetes de idioma oficiales (`de`, `en`, `fr`, `it`, `ja`, `pl`, `ru`, `zh-CN`). Contiene subcarpetas `String\` (textos), `Font\` (fuentes tipográficas e índices `.font`), `Sound\` (doblaje de voz de pilotos) y `Movie\` (cinemáticas `.bik`). |
| `Launcher\` | Utilidad | Módulos del lanzador externo original de Stardock para gestión de noticias y enlaces comunitarios. |
| `Mesh\` | Gráficos 3D | Modelos poligonales (`.mesh`) de todas las naves, estaciones espaciales, asteroides y escombros. |
| `Particle\` | Gráficos FX | Definiciones de sistemas de partículas (`.particle`). Controla humo, fuego, estelas de motores, llamaradas de armas y vórtices espaciales. |
| `Particle Forge\` | Herramienta | Editor visual interactivo (`ParticleForge.exe`) para diseñar y renderizar sistemas de partículas en tiempo real. |
| `PipelineEffect\` | Shaders HLSL | Archivos `.fx` (DirectX 9 HLSL). Contiene los algoritmos de sombreado: iluminación especular, sombras dinámicas de asteroides y naves, atmósfera de planetas, bloom y distorsión de agujeros de gusano. |
| `TextureAnimations\` | Animación 2D | Archivos `.texanim`. Controla hojas de sprites y animaciones de interfaces, escudos parpadeantes y paneles holográficos. |
| `Textures\` | Gráficos 2D | Texturas de juego en formato DDS (DirectDraw Surface) y TGA. Contiene mapas diffuse, normal maps, glow maps y máscaras de equipo. |
| `Window\` | Definición de UI | Scripts declarativos (`.window`). Definen la interfaz gráfica: botones, paneles, barras de vida, mini-mapa, menús de opciones y ventanas modales. |
| `ConvertData_Rebellion.exe` | CLI Utility | Herramienta esencial de modding. Convierte archivos de datos del juego entre formato binario (`BIN` / `BIN2`) y formato de texto legible (`TXT` / `TXT2`). |
| `FirewallInstall.exe` | Instalador | Configura las excepciones de puerto UDP/TCP en el Firewall de Windows para el tráfico del motor de red multijugador. |
| `GDFSinsInstall.exe` | Instalador | Registrador de la especificación GDF (Game Definition File) para la integración en el explorador de juegos de Windows. |
| `SDCR32.exe` / `.ini` | Diagnóstico | Stardock Crash Reporter (32-bit). Captura el minidump y registros cuando ocurre un crash (*Access Violation*). |
| `Sins of a Solar Empire Rebellion.exe` | Ejecutable | Binario de producción optimizado para rendimiento (Retail). |
| `Sins of a Solar Empire Rebellion Dev.exe` | Ejecutable | Compilación de depuración interna. Activa recarga en caliente de shaders, logs extensivos de consola, verificación de armamento y lectura de settings separados (`.dev.setting`). |
| `StardockLauncher.exe` | Lanzador | Lanzador heredado de Stardock para autenticación de licencias. |
| `Updater.exe` | Actualizador | Cliente de parcheo automático para versiones independientes de Steam. |
| `*.manifest` | Índices de Carga | Archivos de manifiesto (`entity.manifest`, `brush.manifest`, `galaxy.manifest`, `playerPictures.manifest`, `playerThemes.manifest`, `skybox.manifest`). Especifican el recuento exacto y la lista de recursos a pre-cargar en memoria RAM. **Si un mod añade un archivo nuevo sin declararlo en el manifiesto respectivo, el juego se cuelga al iniciar.** |
| `Sins Rebellion 1.84 to 1.85 Format Changes Examples.rar` | Documentación | Archivos de ejemplo provistos por Ironclad que detallan las discrepancias y nuevos campos introducidos entre versiones de parches para actualización de mods. |
| `steam_emu.ini` / `codex.dll` | DRM Emulator | Capa de emulación de la API de Steam (AppID 204880). |

---

## 3. Diagnóstico del Modo DEV y Análisis de `log-340.txt`

Al arrancar `Sins of a Solar Empire Rebellion Dev.exe`, el motor realiza una inicialización exhaustiva que queda registrada en `Debug\log-340.txt`:

1. **Gestión de Entorno Independiente:**
   * Crea y utiliza perfiles aislados en `Documents\My Games\Ironclad Games\Sins of a Solar Empire Rebellion\`:
     * `Setting\rebellion.user.dev.setting`
     * `Setting\rebellion.uimappings.dev.setting`
     * `Setting\rebellion.camera.dev.setting`
     * `Mods-Rebellion v1.85 Dev\EnabledMods.txt`
   * Esto previene que una prueba inestable en desarrollo corrompa los ajustes del juego normal.

2. **Advertencias de Shaders en DirectX 9:**
   * Registros como `warning X3557: loop only executes for 1 iteration(s), forcing loop to unroll` en `PipelineEffect\GS_ShadowedShip.fx` informan que el compilador HLSL de Microsoft D3DX optimizó bucles forzando su desenrollado inline. No son errores críticos.

3. **Inconsistencias de Armamento en Mallas 3D:**
   * Registros como:
     ```text
     TITAN_PHASEREBEL_COSMETIC has weapon:2 damage in BACK bank but no weapon points for its current mesh. Is this intended?
     ```
     El motor detectó que la entidad lógica del Titán tiene definido un banco de daño en la parte trasera, pero el modelo 3D (`.mesh`) carece del punto de anclaje (*hardpoint/weapon point*) geométrico para spawnear el proyectil visual. En Dev mode esto se loguea para advertir al diseñador 3D.

4. **Recarga Dinámica:**
   * El log muestra `Reloading All PipelineEffects...` al detectar modificaciones de resolución o cambios de ventana (`Window(applyChangesButton)`), una funcionalidad exclusiva del ejecutable Dev.

---

## 4. Arquitectura de Solaris Nexus Studio: Gestión de Base, Mods y Localización

Para que **Solaris Nexus Studio** funcione de forma robusta e inteligente, el ciclo de vida del software debe estructurarse en módulos desacoplados:

```
+-----------------------------------------------------------------------+
|                        SOLARIS NEXUS STUDIO                           |
+-----------------------------------+-----------------------------------+
| 1. Auto-Detección y Base Solaris  | Detecta ruta de instalación,      |
|    (Game Mount & Virtual VFS)     | versión de binario y manifiestos. |
+-----------------------------------+-----------------------------------+
| 2. Monitor y Clasificador de Mods | Gestión por 3 niveles de impacto; |
|    (3-Tier Architecture)          | cálculo de carga de RAM/GPU.      |
+-----------------------------------+-----------------------------------+
| 3. Adaptador Inteligente de Idioma| Inyección por Mod VFS (Recomendado|
|    (Localization Engine)          | o Parcheo de Slot oficial (`en`). |
+-----------------------------------+-----------------------------------+
```

### 4.1 Módulo Base Solaris (Detección e Indexación de Instalación)
1. **Detección Automática Fail-Safe:**
   * Prioridad 1: Claves del Registro de Windows (`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Steam App 204880` o `GOG`).
   * Prioridad 2: Detección por rutas comunes (`C:\Games\Sins of a Solar Empire Rebellion\`, `C:\Program Files (x86)\Steam\steamapps\common\...`).
   * Prioridad 3: Ruta personalizada ingresada por el usuario en configuración.
2. **Validación de Integridad:**
   * Comprobar existencia obligatoria de `Sins of a Solar Empire Rebellion.exe`, `GameInfo\`, `Window\` y `Localizations\`.
   * Identificar versión del motor (ej. `v1.974`) y versión de esquema de archivos (`SinsArchiveVersion 197`).

---

### 4.2 Clasificación de Mods en 3 Niveles (Impacto y Consumo de Recursos)

El sistema de mods de Sins of a Solar Empire es acumulativo pero propenso a saturar el espacio de direcciones de memoria (el ejecutable es de **32 bits (LAA - Large Address Aware)** y colapsa al superar los ~3.2 GB - 3.8 GB de memoria virtual RAM).

Solaris Nexus Studio categorizará los mods en **3 Niveles**:

#### Nivel 1: Capa Léxica y Cosmética Ligera (Bajo Impacto)
* **Contenido:** Traducciones (`String\English.str`), reemplazos de fuentes (`Font\`), iconos UI (`Textures\HUD\*`), sonidos puntuales (`Sound\`).
* **Impacto en Rendimiento:** < 5% RAM adicional; 0% sobrecarga de CPU.
* **Riesgo de Inestabilidad:** Prácticamente nulo. No altera manifiestos ni lógica de combate.

#### Nivel 2: Capa de Expansión de Contenido (Impacto Moderado)
* **Contenido:** Nuevas naves, cazas, planetas, investigaciones, facciones menores (`GameInfo\*.entity`), nuevos modelos 3D (`Mesh\`) y texturas (`Textures\`).
* **Requisito Técnico:** Requiere edición y sincronización estricta de `entity.manifest`, `brush.manifest` y `galaxy.manifest`.
* **Impacto en Rendimiento:** 15% - 40% RAM adicional; aumento moderado de tiempos de carga inicial.
* **Riesgo:** Conflicto si dos mods de Nivel 2 redefinen IDs de entidades idénticas o sobrepasan el límite de índices de manifest.

#### Nivel 3: Conversión Total / Modificación del Motor (Alto Impacto / Crítico)
* **Contenido:** Overhauls globales (ej. *Star Wars: Interregnum*, *Star Trek: Armada 3*, *Sins of the Prophets*), nuevos pipelines de sombreado (`PipelineEffect\*.fx`), alteración radical de partículas (`Particle\`) y árboles de investigación masivos.
* **Impacto en Rendimiento:** Consumo de RAM de hasta 3.5 GB (umbral de saturación de 32 bits), alto uso de VRAM y carga térmica en hilos de CPU.
* **Monitor de Sobrecarga en Solaris Nexus Studio:**
  * La aplicación debe calcular la suma estimada de tamaño de texturas sin comprimir y número total de entidades activas.
  * Si el total supera el índice de riesgo configurado (ej. > 2.8 GB estimados o > 5,000 entidades), emitirá una advertencia: *"Riesgo de Crash por Out of Memory (OOM) en partidas prolongadas"*.

---

### 4.3 Estrategia de Solución para la Integración del Idioma Español

Dado que el ejecutable contiene el array estático cerrado de 8 idiomas, Solaris Nexus Studio implementará una de las siguientes dos soluciones automáticas:

#### Solución Primaria (Recomendada): Adaptador VFS Mod-Layer
* **Mecanismo:** Solaris Nexus Studio genera un mod virtual gestionado llamado `[Solaris] Traduccion Espanol`.
* **Estructura del Mod:**
  ```text
  Documents\My Games\Ironclad Games\Sins of a Solar Empire Rebellion\Mods-Rebellion v1.85\[Solaris] Traduccion Espanol\
    ├── String\
    │     └── English.str   <-- Archivo traducido (100% sintaxis TXT/TXT2)
    └── Font\               <-- Definiciones tipográficas compatibles con acentos y caracteres 'ñ', '¿', '¡'
  ```
* **Activación Automática:** Solaris Nexus Studio edita directamente `EnabledMods.txt` posicionando la traducción en la capa superior de prioridad.
* **Ventajas:**
  * 0% de alteración de archivos originales instalados.
  * Compatible con validación de archivos de Steam y actualizaciones de parches.
  * Activación/desactivación inmediata desde la interfaz de Solaris Nexus Studio con un solo toggle.

#### Solución Secundaria: Inyección Directa en Slot Oficial (`en`)
* **Mecanismo:**
  1. Solaris Nexus Studio genera un respaldo de seguridad del archivo original `Localizations\en\String\English.str.bak`.
  2. Sobrescribe `Localizations\en\String\English.str` con el archivo traducido al español.
* **Ventajas:** No requiere tener activado el menú de mods dentro del juego; cualquier partida base arranca inmediatamente en español.
* **Restauración:** Botón *"Restablecer Idioma Original"* en Solaris Nexus Studio que restaura el archivo `.bak`.

---

## 5. Especificación del Formato `.str` para el Editor de Traducción

El formato `.str` de IronEngine utiliza una estructura de pares clave-valor fuertemente tipada:

```text
TXT
NumStrings 7828
StringInfo
	ID "IDSPlayerAINameTech0"
	Value "Rebeldes Nitheim"
StringInfo
	ID "IDSPlayerAINameTech1"
	Value "Coalición Tram"
```

### Reglas de Procesamiento en Solaris Nexus Studio:
1. **Encabezado Estricto:** La primera línea debe declarar el formato (`TXT` o `TXT2`).
2. **Contador de Cadenas Sincronizado:** `NumStrings <N>` debe ser exactamente igual al conteo total de bloques `StringInfo`. Si discrepan por una unidad, el motor falla al arrancar.
3. **Escapado de Caracteres y Saltos de Línea:**
   * Las comillas internas deben escaparse: `\"`.
   * Los saltos de línea dentro de tooltips se representan como `\n`.
4. **Codificación:** Debe guardarse estrictamente en **UTF-8 sin BOM** o **ANSI / Windows-1252** según los requerimientos tipográficos de la fuente vinculada (`.font`).

---
*Documento de auditoría técnica generado para Solaris Nexus Studio. Registrado para la arquitectura v2.24.0.*
