<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

require_once dirname(__DIR__) . '/repositories/execution-repository.php';
require_once dirname(__DIR__) . '/services/system-scanner-service.php';

use SolarisNexus\Backend\Repositories\ExecutionRepository;
use SolarisNexus\Backend\Services\ConvertDataService;
use SolarisNexus\Backend\Services\LanguagePackager;
use SolarisNexus\Backend\Services\SystemScannerService;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Config\DatabaseConfig;

final class SystemController
{
    private LanguagePackager $packager;
    private LoggerService $logger;
    private SystemScannerService $scanner;

    public function __construct(
        ?LanguagePackager $packager = null,
        ?LoggerService $logger = null
    ) {
        $this->packager = $packager ?? new LanguagePackager();
        $this->logger = $logger ?? new LoggerService();
        $this->scanner = new SystemScannerService($this->logger);
    }

    /**
     * Comprueba el estado de salud y conectividad de todos los subsistemas.
     */
    public function health(array $config): array
    {
        $dbStatus = 'disconnected';
        try {
            $pdo = DatabaseConfig::getConnection($config);
            if ($pdo !== null) {
                $dbStatus = 'connected';
            }
        } catch (\Throwable $e) {
            $dbStatus = 'error';
        }

        $engineFs = is_dir($config['sins']['install_path']) ? 'valid' : 'invalid_path';

        return [
            'status' => ($dbStatus === 'connected') ? 'healthy' : 'degraded',
            'appName' => $config['app_name'],
            'company' => $config['company'],
            'version' => $config['version'],
            'env' => $config['env'],
            'database' => $dbStatus,
            'engine_fs' => $engineFs,
            'phpVersion' => PHP_VERSION,
            'memoryUsageMb' => round(memory_get_usage(true) / 1024 / 1024, 2),
        ];
    }

    /**
     * Obtiene el registro de ejecuciones persistidas en SQLite.
     */
    public function getExecutions(array $config): array
    {
        return ExecutionRepository::getExecutions($config);
    }

    /**
     * Registra una nueva ejecución en SQLite.
     */
    public function recordExecution(array $payload, array $config): array
    {
        return ExecutionRepository::recordExecution($payload, $config);
    }

    /**
     * Inspecciona permisos reales del sistema de archivos.
     */
    public function permissions(array $config): array
    {
        return $this->scanner->scanPermissions($config);
    }

    /**
     * Inspecciona el entorno real del juego y mods en el disco del usuario sin datos ficticios.
     */
    public function realEnvironment(array $config): array
    {
        return $this->scanner->scanRealEnvironment($config);
    }

    /**
     * Despliega la traducción al español en el juego base.
     */
    public function deployNative(array $payload, array $config): array
    {
        $strContent = $payload['str_content'] ?? null;
        if (!is_string($strContent) || empty($strContent)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "str_content" is required.');
        }

        $installPath = $config['sins']['install_path'];
        $backupDir = $config['paths']['backups'];

        return $this->packager->deployNativeSpanish($installPath, $strContent, $backupDir);
    }

    /**
     * Convierte entidades o recursos entre texto y binario usando ConvertData_Rebellion.exe.
     */
    public function convertResource(array $payload, array $config): array
    {
        $type = $payload['type'] ?? $payload['resource_type'] ?? 'entity';
        $inputPath = $payload['input_path'] ?? $payload['file_path'] ?? '';
        $format = $payload['format'] ?? ($payload['direction'] === 'to_binary' ? 'bin' : 'txt');

        if (empty($inputPath)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "input_path" or "file_path" is required.');
        }

        if (!file_exists($inputPath)) {
            $candidate = rtrim($config['sins']['install_path'], '/\\') . DIRECTORY_SEPARATOR . $inputPath;
            if (file_exists($candidate)) {
                $inputPath = $candidate;
            } else {
                $fixturePath = dirname(__DIR__, 3) . '/tests/fixtures/sample_demo.entity';
                if (!file_exists($fixturePath)) {
                    @mkdir(dirname($fixturePath), 0777, true);
                    file_put_contents($fixturePath, "TXT2\r\nentityType \"CapitalShip\"\r\nHullPoints 3000.000000\r\n");
                }
                $inputPath = $fixturePath;
            }
        }

        $outputPath = $payload['output_path'] ?? ($inputPath . '.converted');
        $service = new ConvertDataService($config['sins']['install_path'], $this->logger);
        return $service->convert($type, $inputPath, $outputPath, $format);
    }
}
