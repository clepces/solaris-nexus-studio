<?php
declare(strict_types=1);

// Cero exposición de errores PHP directos en la salida HTTP (UUID Safety)
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Autoloading y utilidades base
require_once dirname(__DIR__) . '/src/backend/utils/uuid-generator.php';
require_once dirname(__DIR__) . '/src/backend/utils/logger-service.php';
require_once dirname(__DIR__) . '/src/backend/utils/byte-buffer-helper.php';
require_once dirname(__DIR__) . '/src/backend/utils/router.php';
require_once dirname(__DIR__) . '/src/backend/utils/view-renderer.php';
require_once dirname(__DIR__) . '/src/backend/middleware/cors-middleware.php';
require_once dirname(__DIR__) . '/src/backend/middleware/error-handler-middleware.php';
require_once dirname(__DIR__) . '/src/backend/middleware/security-headers.php';
require_once dirname(__DIR__) . '/config/app-config.php';
require_once dirname(__DIR__) . '/config/database-config.php';

// Repositorios y Servicios de Dominio
require_once dirname(__DIR__) . '/src/backend/repositories/project-repository.php';
require_once dirname(__DIR__) . '/src/backend/repositories/translation-memory-repo.php';
require_once dirname(__DIR__) . '/src/backend/repositories/entity-catalog-repo.php';
require_once dirname(__DIR__) . '/src/backend/repositories/execution-repository.php';
require_once dirname(__DIR__) . '/src/backend/services/system-scanner-service.php';
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

// Controladores REST
require_once dirname(__DIR__) . '/src/backend/controllers/string-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/mod-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/system-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/entity-controller.php';
require_once dirname(__DIR__) . '/src/backend/controllers/galaxy-controller.php';

use SolarisNexus\Backend\Middleware\CorsMiddleware;
use SolarisNexus\Backend\Middleware\ErrorHandlerMiddleware;
use SolarisNexus\Backend\Middleware\SecurityHeaders;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\Router;
use SolarisNexus\Backend\Utils\ViewRenderer;
use SolarisNexus\Config\AppConfig;
use SolarisNexus\Backend\Controllers\StringController;
use SolarisNexus\Backend\Controllers\ModController;
use SolarisNexus\Backend\Controllers\SystemController;
use SolarisNexus\Backend\Controllers\EntityController;
use SolarisNexus\Backend\Controllers\GalaxyController;

$logger = new LoggerService();
CorsMiddleware::handle();
SecurityHeaders::apply();

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Si no es llamada a la API, servir la SPA ensamblada
if (!str_contains($uri, '/api/')) {
    header('Content-Type: text/html; charset=UTF-8');
    echo ViewRenderer::renderSpa();
    exit(0);
}

header('Content-Type: application/json; charset=UTF-8');

try {
    $config = AppConfig::load();
    $rawInput = file_get_contents('php://input');
    $payload = !empty($rawInput) ? json_decode($rawInput, true) ?? [] : [];

    $router = new Router($logger);

    // Endpoints del Sistema y Telemetría
    $router->get('/api/system/health', fn() => json((new SystemController(null, $logger))->health($config)));
    $router->get('/api/system/environment', fn() => json((new SystemController(null, $logger))->realEnvironment($config)));
    $router->get('/api/system/executions', fn() => json((new SystemController(null, $logger))->getExecutions($config)));
    $router->post('/api/system/executions', fn() => json((new SystemController(null, $logger))->recordExecution($payload, $config)));
    $router->get('/api/system/permissions', fn() => json((new SystemController(null, $logger))->permissions($config)));
    $router->post('/api/system/deploy-native', fn() => json((new SystemController(null, $logger))->deployNative($payload, $config)));
    $router->post('/api/engine/convert', fn() => json((new SystemController(null, $logger))->convertResource($payload, $config)));

    // Endpoints de Cadenas y Localización (.str)
    $router->get('/api/strings/workspace', fn() => json((new StringController(null, null, $logger))->workspace($config)));
    $router->get('/api/strings/project-strings', fn() => json((new StringController(null, null, $logger))->getProjectStrings($_GET, $config)));
    $router->post('/api/strings/save-entry', fn() => json((new StringController(null, null, $logger))->saveEntry($payload, $config)));
    $router->get('/api/strings/tm-stats', fn() => json((new StringController(null, null, $logger))->getTmStats($config)));
    $router->get('/api/strings/tm-search', fn() => json((new StringController(null, null, $logger))->searchTm($_GET, $config)));
    $router->post('/api/strings/tm-search', fn() => json((new StringController(null, null, $logger))->searchTm($payload, $config)));
    $router->post('/api/strings/suggest-tm', fn() => json((new StringController(null, null, $logger))->suggestTm($payload, $config)));
    $router->post('/api/strings/auto-propagate', fn() => json((new StringController(null, null, $logger))->autoPropagate($payload, $config)));
    $router->post('/api/strings/parse', fn() => json((new StringController(null, null, $logger))->parse($payload)));
    $router->post('/api/strings/validate', fn() => json((new StringController(null, null, $logger))->validateEntry($payload)));
    $router->post('/api/strings/export', fn() => json((new StringController(null, null, $logger))->export($payload)));

    // Endpoints del Gestor de Mods y VFS
    $router->get('/api/mods/detect-platforms', fn() => json((new ModController(null, null, $logger))->detectPlatforms()));
    $router->post('/api/mods/validate-custom-path', fn() => json((new ModController(null, null, $logger))->validateCustomPath($payload)));
    $router->get('/api/mods/scan', fn() => json((new ModController(null, null, $logger))->scan($config)));
    $router->get('/api/mods/enabled', fn() => json((new ModController(null, null, $logger))->getEnabled($config['sins']['mods_path'] . '/EnabledMods.txt')));
    $router->post('/api/mods/save', fn() => json((new ModController(null, null, $logger))->saveEnabled($payload, $config['sins']['mods_path'] . '/EnabledMods.txt', $config['paths']['backups'])));
    $router->post('/api/mods/synthesize-session', fn() => json((new ModController(null, null, $logger))->synthesizeSession($payload, $config)));

    // Endpoints de Entidades y Naves (.entity)
    $router->get('/api/entities/catalog', fn() => json((new EntityController(null, $logger))->getCatalog()));
    $router->post('/api/entities/inspect', fn() => json((new EntityController(null, $logger))->inspect($payload)));
    $router->post('/api/entities/update', fn() => json((new EntityController(null, $logger))->update($payload, $config['paths']['backups'])));

    // Endpoints de Galaxias (.galaxy)
    $router->post('/api/galaxy/parse', fn() => json((new GalaxyController(null, $logger))->parse($payload)));
    $router->post('/api/galaxy/generate', fn() => json((new GalaxyController(null, $logger))->generate($payload)));

    $router->dispatch($method, $uri);

} catch (\Throwable $e) {
    ErrorHandlerMiddleware::handle($e, $logger);
}

/**
 * Emite una respuesta JSON exitosa cumpliendo el sobre envelope canónico.
 */
function json(mixed $data): void
{
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP'),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
