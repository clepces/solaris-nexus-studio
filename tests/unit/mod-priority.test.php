<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../src/backend/services/mod-orchestrator.php';
require_once __DIR__ . '/../../src/backend/services/language-packager.php';

use SolarisNexus\Backend\Services\ModOrchestrator;
use SolarisNexus\Backend\Services\LanguagePackager;

echo "=== TEST SUITE: MOD ORCHESTRATOR & LANGUAGE PACKAGER ===" . PHP_EOL;

$orchestrator = new ModOrchestrator();

// 1. Validar parseo de EnabledMods.txt
$fixtureEnabled = "TXT2\r\nSinsArchiveVersion 197\r\nVersion 0\r\nenabledModNameCount 2\r\nenabledModName \"Star Wars Interregnum\"\r\nenabledModName \"Enhanced 4X Mod\"\r\n";
$parsed = $orchestrator->parseEnabledMods($fixtureEnabled);

assert($parsed['isValid'] === true, 'Estructura EnabledMods debe ser válida');
assert($parsed['actualCount'] === 2, 'Debe haber 2 mods activos');
assert($parsed['mods'][0]['name'] === 'Star Wars Interregnum', 'Primer mod SWINT');
assert($parsed['mods'][0]['priority'] === 999, 'Primer mod tiene prioridad más alta');
assert($parsed['mods'][1]['priority'] === 989, 'Segundo mod tiene prioridad 989');
echo "[OK] ModOrchestrator: Parseo y cálculo de jerarquía VFS verificado." . PHP_EOL;

// 2. Inyección de Minimod de Traducción (Prioridad 999)
$injected = $orchestrator->injectTranslationMinimod($parsed['mods'], '[ES] Interregnum Traduccion');
assert(count($injected) === 3, 'Ahora debe haber 3 mods');
assert($injected[0]['name'] === '[ES] Interregnum Traduccion', 'El minimod debe estar en la cima');
assert($injected[0]['priority'] === 999, 'Minimod asignado con prioridad 999');
assert($injected[0]['isMinimod'] === true, 'Marcado como minimod');
assert($injected[1]['name'] === 'Star Wars Interregnum', 'El mod original desplazado a prioridad 989');
assert($injected[1]['priority'] === 989, 'Prioridad desplazada');
echo "[OK] ModOrchestrator: Inyección de minimod en Prioridad 999 validada." . PHP_EOL;

// 3. Serialización de EnabledMods.txt
$serialized = $orchestrator->serializeEnabledMods($injected);
assert(str_contains($serialized, "enabledModNameCount 3\r\n"), 'Conteo serializado es 3');
assert(str_contains($serialized, "enabledModName \"[ES] Interregnum Traduccion\"\r\n"), 'Minimod serializado');
echo "[OK] ModOrchestrator: Serialización canónica con CRLF verificada." . PHP_EOL;

// 4. Probar LanguagePackager en directorio temporal
$packager = new LanguagePackager();
$tempGameDir = __DIR__ . '/../fixtures/temp_game';
$tempBackupDir = __DIR__ . '/../../storage/backups';

$strContent = "TXT\r\nNumStrings 1\r\nStringInfo\r\n\tID \"TEST\"\r\n\tValue \"Prueba\"\r\n";
$deployResult = $packager->deployNativeSpanish($tempGameDir, $strContent, $tempBackupDir);

assert(file_exists($tempGameDir . '/Localizations/es/String/English.str'), 'English.str canónico desplegado');
assert(file_exists($tempGameDir . '/Localizations/es/String/Spanish.str'), 'Spanish.str espejo desplegado');
echo "[OK] LanguagePackager: Despliegue nativo (English.str activo + Spanish.str espejo) verificado." . PHP_EOL;

// Limpieza de fixture temporal
@unlink($tempGameDir . '/Localizations/es/String/English.str');
@unlink($tempGameDir . '/Localizations/es/String/Spanish.str');
@rmdir($tempGameDir . '/Localizations/es/String');
@rmdir($tempGameDir . '/Localizations/es');
@rmdir($tempGameDir . '/Localizations');
@rmdir($tempGameDir);

echo "=== TODOS LOS TESTS DE LA FASE 3 PASARON EXITOSAMENTE ===" . PHP_EOL;
