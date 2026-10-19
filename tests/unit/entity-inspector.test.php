<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../src/backend/services/entity-inspector-service.php';
require_once __DIR__ . '/../../src/backend/controllers/entity-controller.php';

use SolarisNexus\Backend\Services\EntityInspectorService;
use SolarisNexus\Backend\Controllers\EntityController;

echo "=== TEST SUITE: GAME ENTITY INSPECTOR & CHECKSUM SAFETY ===" . PHP_EOL;

$inspector = new EntityInspectorService();

// 1. Probar parseo de archivo de entidad canónico
$sampleEntity = <<<EOD
TXT
entityType "CapitalShip"
ability:0 "AbilitySnipe"
ability:1 "AbilityVolley"
MaxAntiMatter 250.000000
AntiMatterRestoreRate 0.750000
HullPoints 3000.000000
ShieldPoints 1800.000000
maxShieldMitigation 0.650000
EOD;

$parsed = $inspector->parseEntityContent($sampleEntity);

assert($parsed['entityType'] === 'CapitalShip', 'Debe detectar entityType CapitalShip');
assert($parsed['attributes']['HullPoints'] == 3000.0, 'HullPoints debe ser 3000');
assert($parsed['attributes']['MaxAntiMatter'] == 250.0, 'MaxAntiMatter debe ser 250');
assert($parsed['attributes']['ability:0'] === 'AbilitySnipe', 'Habilidad 0 coincide');
assert(str_contains($parsed['checksumWarning'], 'MULTIPLAYER_CHECKSUM_MUTATION_WARNING'), 'Advertencia de checksum presente');
echo "[OK] EntityInspectorService: Parseo de entidad y extracción de atributos verificado." . PHP_EOL;

// 2. Probar actualización de parámetros
$updated = $inspector->updateEntityParameters($sampleEntity, [
    'HullPoints' => 4500.0,
    'MaxAntiMatter' => 350.0,
    'ability:0' => 'AbilitySuperSnipe',
]);

assert(str_contains($updated, 'HullPoints 4500.000000'), 'HullPoints actualizado a 4500');
assert(str_contains($updated, 'MaxAntiMatter 350.000000'), 'MaxAntiMatter actualizado a 350');
assert(str_contains($updated, 'ability:0 "AbilitySuperSnipe"'), 'Habilidad actualizada');
assert(str_contains($updated, 'ShieldPoints 1800.000000'), 'Parámetros no alterados se preservan');
echo "[OK] EntityInspectorService: Modificación y serialización de parámetros validada." . PHP_EOL;

// 3. Probar EntityController::inspect
$controller = new EntityController($inspector);
$controllerResult = $controller->inspect(['raw_content' => $sampleEntity]);
assert($controllerResult['entityType'] === 'CapitalShip', 'Controller inspect responde');
echo "[OK] EntityController: Endpoint inspect validado." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 11 PASARON EXITOSAMENTE ===" . PHP_EOL;
