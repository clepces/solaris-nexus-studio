<?php
declare(strict_types=1);

// Cero exposición de errores PHP directos en la salida HTTP (UUID Safety)
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/src/backend/utils/uuid-generator.php';
require_once dirname(__DIR__) . '/src/backend/utils/logger-service.php';
require_once dirname(__DIR__) . '/src/backend/utils/byte-buffer-helper.php';
require_once dirname(__DIR__) . '/src/backend/utils/view-renderer.php';
require_once dirname(__DIR__) . '/config/app-config.php';
require_once dirname(__DIR__) . '/config/database-config.php';

require_once dirname(__DIR__) . '/src/backend/services/token-guard-service.php';
require_once dirname(__DIR__) . '/src/backend/services/linter-service.php';
require_once dirname(__DIR__) . '/src/backend/services/str-parser-service.php';
require_once dirname(__DIR__) . '/src/backend/services/ram-profiler-service.php';
require_once dirname(__DIR__) . '/src/backend/services/mod-orchestrator.php';
require_once dirname(__DIR__) . '/src/backend/services/language-packager.php';
require_once dirname(__DIR__) . '/src/backend/services/language-synthesizer.php';
require_once dirname(__DIR__) . '/src/backend/services/convert-data-service.php';
require_once dirname(__DIR__) . '/src/backend/services/entity-inspector-service.php';
require_once dirname(__DIR__) . '/src/backend/services/galaxy-forge-service.php';

require_once dirname(__DIR__) . '/src/backend/controllers/string-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/mod-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/system-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/entity-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/galaxy-controller.php';

use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;
use SolarisNexus\Config\AppConfig;
use SolarisNexus\Backend\Controllers\StringController;
use SolarisNexus\Backend\Controllers\ModController;
use SolarisNexus\Backend\Controllers\SystemController;
use SolarisNexus\Backend\Controllers\EntityController;
use SolarisNexus\Backend\Controllers\GalaxyController;

$logger = new LoggerService();

// Configuración global de cabeceras
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Si no es llamada a la API, servir la SPA modularizada
if (!str_contains($uri, '/api/')) {
    header('Content-Type: text/html; charset=UTF-8');
    echo \SolarisNexus\Backend\Utils\ViewRenderer::renderSpa(__DIR__ . '/views');
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

try {
    $config = AppConfig::load();
    $rawInput = file_get_contents('php://input');
    $payload = !empty($rawInput) ? json_decode($rawInput, true) ?? [] : [];

    $response = null;

    if (str_ends_with($uri, '/api/system/health') && $method === 'GET') {
        $controller = new SystemController(null, $logger);
        $response = $controller->health($config);
    } elseif (str_ends_with($uri, '/api/system/environment') && $method === 'GET') {
        $controller = new SystemController(null, $logger);
        $response = $controller->realEnvironment($config);
    } elseif (str_ends_with($uri, '/api/strings/parse') && $method === 'POST') {
        $controller = new StringController(null, null, $logger);
        $response = $controller->parse($payload);
    } elseif (str_ends_with($uri, '/api/strings/validate') && $method === 'POST') {
        $controller = new StringController(null, null, $logger);
        $response = $controller->validateEntry($payload);
    } elseif (str_ends_with($uri, '/api/strings/export') && $method === 'POST') {
        $controller = new StringController(null, null, $logger);
        $response = $controller->export($payload);
    } elseif (str_ends_with($uri, '/api/mods/detect-platforms') && $method === 'GET') {
        $controller = new ModController(null, null, $logger);
        $response = $controller->detectPlatforms();
    } elseif (str_ends_with($uri, '/api/mods/scan') && $method === 'GET') {
        $controller = new ModController(null, null, $logger);
        $response = $controller->scan($config);
    } elseif (str_ends_with($uri, '/api/mods/enabled') && $method === 'GET') {
        $controller = new ModController(null, null, $logger);
        $enabledPath = $config['sins']['mods_path'] . '/EnabledMods.txt';
        $response = $controller->getEnabled($enabledPath);
    } elseif (str_ends_with($uri, '/api/mods/save') && $method === 'POST') {
        $controller = new ModController(null, null, $logger);
        $enabledPath = $config['sins']['mods_path'] . '/EnabledMods.txt';
        $response = $controller->saveEnabled($payload, $enabledPath, $config['paths']['backups']);
    } elseif (str_ends_with($uri, '/api/mods/synthesize-session') && $method === 'POST') {
        $controller = new ModController(null, null, $logger);
        $response = $controller->synthesizeSession($payload, $config);
    } elseif (str_ends_with($uri, '/api/entities/catalog') && $method === 'GET') {
        $controller = new EntityController(null, $logger);
        $response = $controller->getCatalog();
    } elseif (str_ends_with($uri, '/api/system/deploy-native') && $method === 'POST') {
        $controller = new SystemController(null, $logger);
        $response = $controller->deployNative($payload, $config);
    } elseif (str_ends_with($uri, '/api/engine/convert') && $method === 'POST') {
        $controller = new SystemController(null, $logger);
        $response = $controller->convertResource($payload, $config);
    } elseif (str_ends_with($uri, '/api/entities/inspect') && $method === 'POST') {
        $controller = new EntityController(null, $logger);
        $response = $controller->inspect($payload);
    } elseif (str_ends_with($uri, '/api/entities/update') && $method === 'POST') {
        $controller = new EntityController(null, $logger);
        $response = $controller->update($payload, $config['paths']['backups']);
    } elseif (str_ends_with($uri, '/api/galaxy/parse') && $method === 'POST') {
        $controller = new GalaxyController(null, $logger);
        $response = $controller->parse($payload);
    } elseif (str_ends_with($uri, '/api/galaxy/generate') && $method === 'POST') {
        $controller = new GalaxyController(null, $logger);
        $response = $controller->generate($payload);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error_uuid' => UuidGenerator::v4(),
            'message' => 'ENDPOINT_NOT_FOUND: The requested API route does not exist.',
            'timestamp' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP'),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => $response,
        'timestamp' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP'),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (\Throwable $e) {
    http_response_code(500);
    $errorUuid = $logger->error('UNHANDLED_EXCEPTION: ' . $e->getMessage(), $e);

    echo json_encode([
        'success' => false,
        'error_uuid' => $errorUuid,
        'message' => 'INTERNAL_SERVER_ERROR: An unexpected error occurred. Reference the error UUID with support.',
        'timestamp' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP'),
    ], JSON_UNESCAPED_SLASHES);
}
