<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../src/backend/services/str-parser-service.php';
require_once __DIR__ . '/../../src/backend/services/mod-orchestrator.php';
require_once __DIR__ . '/../../src/backend/services/language-synthesizer.php';

use SolarisNexus\Backend\Services\LanguageSynthesizer;
use SolarisNexus\Backend\Utils\ByteBufferHelper;

echo "=== TEST SUITE: JIT LANGUAGE SYNTHESIZER & SHA-256 COLLISION ENGINE ===" . PHP_EOL;

$synthesizer = new LanguageSynthesizer();

// 1. Probar huellas semánticas SHA-256
$fp1 = LanguageSynthesizer::computeSemanticFingerprint("Attack enemy forces.");
$fp2 = LanguageSynthesizer::computeSemanticFingerprint("  attack enemy   forces.  ");
$fpDiff = LanguageSynthesizer::computeSemanticFingerprint("TIE Interceptor Fighter");

assert($fp1 === $fp2, 'Cadenas con variaciones menores de espacios y mayúsculas deben tener huellas idénticas');
assert($fp1 !== $fpDiff, 'Cadenas con lore diferente deben tener huellas distintas');
echo "[OK] LanguageSynthesizer: Hashing semántico SHA-256 verificado." . PHP_EOL;

// 2. Probar Detección de Colisiones
$mockEntries = [
    // Caso AUTO_TRANSLATE: Mismo ID y mismo texto base
    ['id' => 'IDS_BUTTON_ATTACK', 'value' => 'Attack', 'sourceMod' => 'ModA'],
    ['id' => 'IDS_BUTTON_ATTACK', 'value' => 'attack ', 'sourceMod' => 'ModB'],

    // Caso MANUAL_REVIEW: Mismo ID pero conceptos divergentes de lore
    ['id' => 'IDS_FIGHTER_NAME', 'value' => 'TIE Fighter', 'sourceMod' => 'StarWarsInterregnum'],
    ['id' => 'IDS_FIGHTER_NAME', 'value' => 'Valkyrie Heavy Fighter', 'sourceMod' => 'BattlestarMod'],

    // Caso Único: Sin colisión
    ['id' => 'IDS_UNIQUE_ABILITY', 'value' => 'Ion Cannon Pulse', 'sourceMod' => 'ModA'],
];

$collisions = $synthesizer->detectCollisions($mockEntries);
assert(count($collisions) === 2, 'Debe detectar 2 IDs con colisiones');

$autoResolveReport = array_values(array_filter($collisions, static fn($c) => $c['id'] === 'IDS_BUTTON_ATTACK'))[0];
assert($autoResolveReport['verdict'] === 'AUTO_TRANSLATE', 'Debe clasificar como AUTO_TRANSLATE');
assert($autoResolveReport['uniqueFingerprints'] === 1, '1 sola huella única');

$manualReviewReport = array_values(array_filter($collisions, static fn($c) => $c['id'] === 'IDS_FIGHTER_NAME'))[0];
assert($manualReviewReport['verdict'] === 'MANUAL_REVIEW', 'Debe clasificar como MANUAL_REVIEW');
assert($manualReviewReport['uniqueFingerprints'] === 2, '2 huellas divergentes de lore');
echo "[OK] LanguageSynthesizer: Matriz de colisiones (AUTO_TRANSLATE vs MANUAL_REVIEW) validada." . PHP_EOL;

// 3. Probar Síntesis JIT completa con sistema de archivos temporal
$tempModsDir = __DIR__ . '/../fixtures/temp_mods_pool';
$tempBackupDir = __DIR__ . '/../../storage/backups';

// Crear mod 1 simulado
$mod1Dir = $tempModsDir . '/ModAlpha/String';
@mkdir($mod1Dir, 0755, true);
$mod1Content = "TXT\r\nNumStrings 2\r\nStringInfo\r\n\tID \"IDS_ALPHA_1\"\r\n\tValue \"Alpha Unit\"\r\nStringInfo\r\n\tID \"IDS_SHARED\"\r\n\tValue \"Common Hull\"\r\n";
ByteBufferHelper::safeAtomicWrite($mod1Dir . '/English.str', $mod1Content, $tempBackupDir);

// Crear mod 2 simulado (mayor prioridad)
$mod2Dir = $tempModsDir . '/ModBeta/String';
@mkdir($mod2Dir, 0755, true);
$mod2Content = "TXT\r\nNumStrings 2\r\nStringInfo\r\n\tID \"IDS_BETA_1\"\r\n\tValue \"Beta Unit\"\r\nStringInfo\r\n\tID \"IDS_SHARED\"\r\n\tValue \"Common Hull\"\r\n";
ByteBufferHelper::safeAtomicWrite($mod2Dir . '/English.str', $mod2Content, $tempBackupDir);

$activeModsList = [
    ['name' => 'ModBeta', 'priority' => 50],
    ['name' => 'ModAlpha', 'priority' => 10],
];

// Síntesis en caliente
$synthesisResult = $synthesizer->synthesizeSession($activeModsList, $tempModsDir, $tempBackupDir);

assert($synthesisResult['success'] === true, 'Síntesis exitosa');
assert($synthesisResult['totalStrings'] === 3, 'Debe haber 3 cadenas únicas consolidadas');
assert($synthesisResult['collisions']['autoResolved'] === 1, 'Colisión IDS_SHARED resuelta automáticamente');

$generatedStr = $tempModsDir . '/[ES] Active Session Translation/String/English.str';
$generatedMeta = $tempModsDir . '/[ES] Active Session Translation/meta.json';
$generatedEnabled = $tempModsDir . '/EnabledMods.txt';

assert(file_exists($generatedStr), 'Archivo English.str compilado');
assert(file_exists($generatedMeta), 'Manifiesto meta.json generado');
assert(file_exists($generatedEnabled), 'EnabledMods.txt actualizado');

$manifestData = json_decode(file_get_contents($generatedMeta), true);
assert($manifestData['totalStrings'] === 3, 'Manifiesto reporta 3 cadenas');
assert($manifestData['generator'] === 'solaris-nexus-studio', 'Generador corporativo');

$enabledContent = ByteBufferHelper::stripBom(file_get_contents($generatedEnabled));
assert(str_starts_with($enabledContent, "TXT2\r\nSinsArchiveVersion 197\r\nVersion 0\r\nenabledModNameCount 3\r\nenabledModName \"[ES] Active Session Translation\"\r\n"), 'Inyección de minimod en Prioridad 999');
echo "[OK] LanguageSynthesizer: Compilación JIT de minimod y manifiesto meta.json verificados." . PHP_EOL;

// Limpieza de directorio temporal
@unlink($generatedStr);
@unlink($generatedMeta);
@unlink($generatedEnabled);
@rmdir($tempModsDir . '/[ES] Active Session Translation/String');
@rmdir($tempModsDir . '/[ES] Active Session Translation');
@unlink($mod1Dir . '/English.str');
@rmdir($mod1Dir);
@rmdir($tempModsDir . '/ModAlpha');
@unlink($mod2Dir . '/English.str');
@rmdir($mod2Dir);
@rmdir($tempModsDir . '/ModBeta');
@rmdir($tempModsDir);

// Limpieza de backups de prueba
$baks = glob($tempBackupDir . '/*.bak');
foreach ($baks as $b) {
    @unlink($b);
}

echo "=== TODOS LOS TESTS DE LA FASE 9 PASARON EXITOSAMENTE ===" . PHP_EOL;
