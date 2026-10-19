# Guía de Usuario y Manual de Despliegue - Solaris Nexus (v1.0.0)

## 1. Configuración del Idioma Español Nativo en el Juego Base

### A. Estructura de Carpetas en `Localizations/es/`
Para que el juego funcione en español de forma nativa e independiente de la instalación en inglés:
1. El directorio del idioma español debe ubicarse en:
   ```text
   C:\Games\Sins of a Solar Empire Rebellion\Localizations\es\
   ```
2. **Requisito Crítico del Nombre de Archivo:**
   - El archivo dentro de `String\` debe llamarse obligatoriamente **`English.str`** (ejemplo: `Localizations\es\String\English.str`).
   - **¿Por qué?** El ejecutable del juego busca de forma interna y fija la ruta `String\English.str` dentro de la carpeta del idioma activo. Si se nombra `Spanish.str`, el motor no lo encontrará y el juego no mostrará los textos.
   - Para máxima seguridad, Solaris Nexus mantiene tanto `English.str` como `Spanish.str` dentro de dicha carpeta.

3. **Subdirectorios Complementarios:**
   - **`Font/`:** Contiene las definiciones `.font` y fuentes TrueType (`SinsAgencyBold.ttf`, `SinsOfficinaSans.ttf`). Copiar esta carpeta desde `en/` asegura que todos los caracteres (`á, é, í, ó, ú, ñ, ¿, ¡`) se muestren correctamente.
   - **`Sound/`:** Aloja las voces y efectos de sonido de naves y alertas del imperio. Al copiarse desde `en/`, previene silencios durante las batallas.
   - **`Movie/`:** Contiene `OpeningCinematic.bik`. Si no se incluye, el juego utiliza automáticamente la cinemática de `en/Movie/` sin fallos.

### B. Activación en `steam_emu.ini`
Para activar el idioma español:
1. Abre el archivo de configuración en la raíz del juego:
   ```text
   C:\Games\Sins of a Solar Empire Rebellion\steam_emu.ini
   ```
2. Localiza el parámetro `Language` y establécelo en `spanish`:
   ```ini
   ### Language that will be used in the game
   Language=spanish
   ```
3. Guarda el archivo e inicia el juego. El motor cargará directamente los recursos desde [Localizations/es/](file:///C:/Games/Sins%20of%20a%20Solar%20Empire%20Rebellion/Localizations/es/).

---

## 2. Uso del Orquestador de Mods (`EnabledMods.txt`)

El módulo del Orquestador de Mods permite configurar la activación y prioridades de mods sin editar archivos de texto manualmente.

### Ubicación del Archivo de Mods:
```text
C:\Users\<TuUsuario>\Documents\My Games\Ironclad Games\Sins of a Solar Empire Rebellion\Mods-Rebellion v1.8x\EnabledMods.txt
```

### Procedimiento Paso a Paso:
1. **Seleccionar Mod Principal:** Elige entre una conversión total (ej. *Star Wars: Interregnum*) o un mod de expansión (ej. *Enhanced 4X Mod*).
2. **Seleccionar Minimods de Jugabilidad:** Marca las opciones deseadas:
   - *Suministro de Flota Duplicado:* Aumenta al doble el límite de naves y naves capitales.
   - *Combate Más Rápido:* Incrementa el daño de armas un 50%.
   - *Investigación Infinita:* Sumidero de créditos para partidas extensas en mapas gigantes.
   - *Reinicio de Niveles de Titán:* Los titanes reconstruidos reaparecen en nivel 1.
3. **Resolución de Conflictos:** Si activas dos mods incompatibles (por ejemplo, *Deathmatch* y *Beskar*), la herramienta resalta la fila en rojo y emite una advertencia de incompatibilidad.
4. **Guardar Configuración:** Pulsa **Guardar EnabledMods.txt**. La herramienta ordenará los mods por prioridad descendente y escribirá la cabecera canónica `TXT2 / SinsArchiveVersion 197`.

---

## 3. Traducción de Mods con Minimods Independientes

Para traducir mods complejos de conversión total sin alterar sus archivos originales:

1. **Paso 1: Extraer Cadenas del Mod**
   - En Solaris Nexus, carga el archivo `String\English.str` del Mod.
   - Carga el diccionario base en español (`Localizations\es\String\English.str`).
   - La herramienta asocia las cadenas comunes y aísla las cadenas exclusivas del Mod.
2. **Paso 2: Traducir Entradas Específicas**
   - Traduce los textos de facciones, armas y naves del mod en el DataGrid virtualizado.
3. **Paso 3: Compilar Minimod de Traducción**
   - Haz clic en **Crear Minimod de Traducción**.
   - La herramienta generará automáticamente la estructura:
     ```text
     Mods-Rebellion v1.8x\[ES] NombreMod Traduccion\String\English.str
     ```
4. **Paso 4: Activar con Máxima Prioridad**
   - En el Orquestador de Mods, activa el nuevo parche de traducción generado.
   - La herramienta le asignará automáticamente la **Prioridad 999** (se ubicará en la primera línea de `EnabledMods.txt`).
   - Al iniciar el juego, todos los modelos 3D y texturas se cargarán desde el mod original en inglés, pero todos los textos se mostrarán en español.

---

## 4. Tabla de Resolución de Problemas Frecuentes

| Síntoma | Causa Raíz | Solución en Solaris Nexus |
| :--- | :--- | :--- |
| **El juego se cierra al iniciar** | Desincronización de `NumStrings` o comillas sin cerrar en `.str`. | Pasa el archivo por el **Token Guard & Linter** y pulsa Exportar. |
| **La interfaz muestra textos `IDS...`** | El ID no existe en el archivo `.str` activo. | Carga el archivo base maestro y ejecuta el **Analizador de Diferencias** para agregar las claves faltantes. |
| **Los caracteres muestran `Ã³` o `?`** | El archivo se guardó en ANSI o UTF-8 sin BOM. | Exporta a través de Solaris Nexus; fuerza siempre la firma `0xEF 0xBB 0xBF`. |
| **Cierre abrupto (MiniDump) en batallas** | Los mods activos superaron el límite de RAM de 32 bits (~3.2 GB). | Revisa el **Medidor de Memoria RAM** y desactiva minimods que duplican flotas o texturas HD. |
