<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../config/app-config.php';
require_once __DIR__ . '/../../config/database-config.php';

use SolarisNexus\Config\AppConfig;
use SolarisNexus\Config\DatabaseConfig;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;

echo "=== TEST BOOTSTRAP SOLARIS NEXUS STUDIO ===" . PHP_EOL;

// 1. Validar UuidGenerator
$uuid1 = UuidGenerator::v4();
$uuid2 = UuidGenerator::v4();
assert(strlen($uuid1) === 36, 'UUID length invalid');
assert($uuid1 !== $uuid2, 'UUIDs must be unique');
echo "[OK] UuidGenerator: " . $uuid1 . PHP_EOL;

// 2. Validar AppConfig (Fail-Fast)
$config = AppConfig::load();
assert($config['app_name'] === 'Solaris Nexus Studio', 'App name mismatch');
assert($config['version'] === '0.1.1.0-alpha', 'Version mismatch');
echo "[OK] AppConfig loaded: " . $config['app_name'] . " v" . $config['version'] . PHP_EOL;

// 3. Validar LoggerService & UUID Safety
$logger = new LoggerService($config['logging']['dir']);
$logger->info('Inicialización del sistema de logging completada.');
$errUuid = $logger->error('Prueba controlada de captura de error sanitizado.', new \RuntimeException('Excepción de prueba para trazabilidad'));
assert(strlen($errUuid) === 36, 'Error UUID invalid');
echo "[OK] LoggerService: UUID generado " . $errUuid . PHP_EOL;

// 4. Validar DatabaseConfig (SQLite)
$pdo = DatabaseConfig::getConnection($config);
assert($pdo instanceof PDO, 'PDO instance invalid');
echo "[OK] DatabaseConfig: Conexión SQLite PDO verificada con éxito." . PHP_EOL;

echo "=== TODOS LOS TESTS DE BOOTSTRAP PASARON EXITOSAMENTE ===" . PHP_EOL;
