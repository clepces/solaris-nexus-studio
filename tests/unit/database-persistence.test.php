<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../config/app-config.php';
require_once __DIR__ . '/../../config/database-config.php';
require_once __DIR__ . '/../../src/backend/services/database-migrator.php';
require_once __DIR__ . '/../../src/backend/repositories/project-repository.php';
require_once __DIR__ . '/../../src/backend/repositories/translation-memory-repo.php';
require_once __DIR__ . '/../../src/backend/repositories/mod-repository.php';

use SolarisNexus\Config\AppConfig;
use SolarisNexus\Config\DatabaseConfig;
use SolarisNexus\Backend\Services\DatabaseMigrator;
use SolarisNexus\Backend\Repositories\ProjectRepository;
use SolarisNexus\Backend\Repositories\TranslationMemoryRepo;
use SolarisNexus\Backend\Repositories\ModRepository;

echo "=== TEST SUITE: DATABASE PERSISTENCE & TRANSLATION MEMORY ===" . PHP_EOL;

$config = AppConfig::load();
$pdo = DatabaseConfig::getConnection($config);

// 1. Ejecutar migración DDL idempotente
$migrator = new DatabaseMigrator($pdo);
$migrationResult = $migrator->migrate();

assert($migrationResult['success'] === true, 'Migración debe completarse con éxito');
assert(count($migrationResult['tables']) >= 7, 'Debe migrar al menos 7 tablas');
echo "[OK] DatabaseMigrator: Migración DDL relacional completada en " . $migrationResult['driver'] . " (" . count($migrationResult['tables']) . " tablas)." . PHP_EOL;

// 2. Probar ProjectRepository
$projectRepo = new ProjectRepository($pdo);
$testProjectId = 'prj_sins_base_es';

// Limpieza de datos previos de prueba para garantizar idempotencia
$pdo->prepare("DELETE FROM tbl_string_entries WHERE project_id = :id")->execute([':id' => $testProjectId]);
$pdo->prepare("DELETE FROM tbl_projects WHERE project_id = :id")->execute([':id' => $testProjectId]);

$projectRepo->saveProject([
    'project_id' => $testProjectId,
    'name' => 'Sins of a Solar Empire Base (Spanish)',
    'version' => 'v1.85',
    'base_file_path' => 'Localizations/en/String/English.str',
    'target_file_path' => 'Localizations/es/String/English.str',
    'total_strings' => 3,
]);

$fetchedProject = $projectRepo->getProject($testProjectId);
assert($fetchedProject !== null, 'Proyecto debe existir');
assert($fetchedProject['name'] === 'Sins of a Solar Empire Base (Spanish)', 'Nombre coincide');
echo "[OK] ProjectRepository: Persistencia y consulta de proyecto verificada." . PHP_EOL;

// 3. Inserción por lotes de cadenas
$entries = [
    ['id' => 'IDS_SHIP_KOL', 'value' => 'Kol Battleship', 'translated' => null],
    ['id' => 'IDS_PLANET_TEC', 'value' => 'TEC Capital Planet', 'translated' => null],
    ['id' => 'IDS_AMMO_DEPOT', 'value' => 'Antimatter Recharge Depot', 'translated' => null],
];
$inserted = $projectRepo->batchInsertEntries($testProjectId, $entries);
assert($inserted === 3, 'Debe insertar 3 cadenas');
echo "[OK] ProjectRepository: Inserción por lotes de cadenas validada." . PHP_EOL;

// 4. Probar TranslationMemoryRepo & Auto-Propagación
$tmRepo = new TranslationMemoryRepo($pdo);

// Sembrar memoria de traducción con equivalencias conocidas
$tmRepo->storeTranslation('Kol Battleship', 'Acorazado Kol', 'MILITARY', true);
$tmRepo->storeTranslation('TEC Capital Planet', 'Planeta Capital del TEC', 'PLANETS', true);

// Búsqueda exacta
$match = $tmRepo->lookupExact('Kol Battleship');
assert($match !== null, 'Debe encontrar coincidencia exacta en TM');
assert($match['translated_text'] === 'Acorazado Kol', 'Traducción recuperada');
echo "[OK] TranslationMemoryRepo: Registro de memoria y búsqueda exacta SHA-256 verificados." . PHP_EOL;

// Ejecutar autopropagación masiva
$propResult = $tmRepo->autoPropagate($testProjectId);
assert($propResult['propagatedCount'] === 2, 'Debe autopropagar exactamente 2 coincidencias');
assert($propResult['remainingPending'] === 1, 'Debe restar 1 cadena pendiente (Antimatter Depot)');
echo "[OK] TranslationMemoryRepo: Autopropagación inteligente validada (2 cadenas autocompletadas)." . PHP_EOL;

// Verificar que las cadenas en el proyecto fueron actualizadas
$updatedEntries = $projectRepo->getStrings($testProjectId, 10, 0, 'TRANSLATED');
assert(count($updatedEntries) === 2, 'Hay 2 entradas en estado TRANSLATED');
assert($updatedEntries[0]['translated_value'] === 'Acorazado Kol', 'Valor traducido en base de datos');
echo "[OK] ProjectRepository: Estado de cadenas persistido y confirmado." . PHP_EOL;

// 5. Probar ModRepository & Matriz de Incompatibilidad
$modRepo = new ModRepository($pdo);
$modRepo->saveMod([
    'mod_id' => 'mod_interregnum',
    'folder_name' => 'Star Wars Interregnum',
    'display_name' => 'Star Wars: Interregnum',
    'category' => 'TOTAL_CONVERSION',
    'default_priority' => 0,
    'estimated_ram_mb' => 1250,
    'has_strings' => 1,
]);

$modRepo->saveMod([
    'mod_id' => 'mod_armada',
    'folder_name' => 'Star Trek Armada III',
    'display_name' => 'Star Trek: Armada III',
    'category' => 'TOTAL_CONVERSION',
    'default_priority' => 0,
    'estimated_ram_mb' => 1300,
    'has_strings' => 1,
]);

$modRepo->declareIncompatibility('mod_interregnum', 'mod_armada', 'Ambas son conversiones totales incompatibles que reemplazan los mismos archivos de interfaz y entidades.');

$conflicts = $modRepo->findConflicts(['mod_interregnum', 'mod_armada']);
assert(count($conflicts) === 1, 'Debe detectar 1 conflicto cruzado');
assert(str_contains($conflicts[0]['conflict_reason'], 'conversiones totales incompatibles'), 'Motivo de conflicto detectado');
echo "[OK] ModRepository: Detección relacional de incompatibilidades cruzadas verificada." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 8 PASARON EXITOSAMENTE ===" . PHP_EOL;
