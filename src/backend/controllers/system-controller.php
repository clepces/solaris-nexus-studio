<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use SolarisNexus\Backend\Services\LanguagePackager;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Config\AppConfig;
use SolarisNexus\Config\DatabaseConfig;

final class SystemController
{
    private LanguagePackager $packager;
    private LoggerService $logger;

    public function __construct(
        ?LanguagePackager $packager = null,
        ?LoggerService $logger = null
    ) {
        $this->packager = $packager ?? new LanguagePackager();
        $this->logger = $logger ?? new LoggerService();
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
}
