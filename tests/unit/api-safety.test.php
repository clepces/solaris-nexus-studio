<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../config/app-config.php';
require_once __DIR__ . '/../../config/database-config.php';
require_once __DIR__ . '/../../src/backend/services/token-guard-service.php';
require_once __DIR__ . '/../../src/backend/services/linter-service.php';
require_once __DIR__ . '/../../src/backend/services/str-parser-service.php';
require_once __DIR__ . '/../../src/backend/services/ram-profiler-service.php';
require_once __DIR__ . '/../../src/backend/services/mod-orchestrator.php';
require_once __DIR__ . '/../../src/backend/services/language-packager.php';
require_once __DIR__ . '/../../src/backend/controllers/string-controller.php';
require_once __DIR__ . '/../../src/backend/controllers/system-controller.php';

use SolarisNexus\Config\AppConfig;
use SolarisNexus\Backend\Controllers\SystemController;
use SolarisNexus\Backend\Controllers\StringController;

echo "=== TEST SUITE: API CONTROLLERS & UUID SAFETY ===" . PHP_EOL;

$config = AppConfig::load();

// 1. Probar SystemController::health
$systemController = new SystemController();
$health = $systemController->health($config);

assert($health['appName'] === 'Solaris Nexus Studio', 'App name correcto');
assert($health['version'] === '0.3.0.0-alpha', 'Versión coincide con el hito v0.3.0.0-alpha');
assert($health['database'] === 'connected', 'Database conectada');
echo "[OK] SystemController: Health check exitoso (Versión " . $health['version'] . " | DB: " . $health['database'] . ")." . PHP_EOL;

// 2. Probar StringController::parse
$stringController = new StringController();
$parseResult = $stringController->parse([
    'raw_content' => "TXT\r\nNumStrings 1\r\nStringInfo\r\n\tID \"IDS_TITAN\"\r\n\tValue \"Ragnarov Titan\"\r\n"
]);

assert($parseResult['numStrings'] === 1, 'Parseó 1 cadena');
assert($parseResult['entries'][0]['id'] === 'IDS_TITAN', 'ID coincide');
echo "[OK] StringController: Ingestión y parseo de cadenas validado." . PHP_EOL;

// 3. Probar StringController::validateEntry con Token Guard
$validationResult = $stringController->validateEntry([
    'id' => 'IDS_TITAN_ABILITY',
    'original' => 'Fires cannon dealing [VALUE] damage to %s.',
    'translated' => 'Dispara el cañón infligiendo daño masivo.',
]);

assert($validationResult['isValid'] === false, 'Debe fallar por tokens faltantes');
assert(count($validationResult['issues']) > 0, 'Debe reportar incidencias');
assert($validationResult['issues'][0]['severity'] === 'CRITICAL', 'Gravedad crítica');
echo "[OK] StringController: Validación de tokens faltantes ([VALUE], %s) interceptada." . PHP_EOL;

// 4. Probar Serialización / Export
$exportResult = $stringController->export([
    'entries' => [
        ['id' => 'IDS_KEY1', 'value' => 'Val1'],
        ['id' => 'IDS_KEY2', 'value' => 'Val2'],
    ]
]);
assert($exportResult['numStrings'] === 2, 'Exportó 2 cadenas');
assert(str_starts_with($exportResult['content'], "TXT\r\nNumStrings 2\r\n"), 'Cabecera canónica');
echo "[OK] StringController: Exportación de cadenas canónicas validada." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 5 PASARON EXITOSAMENTE ===" . PHP_EOL;
