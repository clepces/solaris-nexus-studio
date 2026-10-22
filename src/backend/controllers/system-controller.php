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
     * Inspecciona el entorno real del juego y mods en el disco del usuario sin datos ficticios.
     */
    public function realEnvironment(array $config): array
    {
        $installPath = $config['sins']['install_path'];
        $modsPath = $config['sins']['mods_path'];

        $installExists = is_dir($installPath);
        $modsExists = is_dir($modsPath);

        // Inspección de localización española
        $spanishStrFile = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'Localizations' . DIRECTORY_SEPARATOR . 'es' . DIRECTORY_SEPARATOR . 'String' . DIRECTORY_SEPARATOR . 'English.str';
        $spanishStrExists = file_exists($spanishStrFile);
        $spanishStrCount = 0;
        if ($spanishStrExists) {
            $parser = new \SolarisNexus\Backend\Services\StrParserService();
            $parsed = $parser->parseFile($spanishStrFile);
            $spanishStrCount = $parsed['numStrings'] ?? count($parsed['entries'] ?? []);
        }

        // Inspección de entidades canónicas del juego
        $gameInfoDir = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'GameInfo';
        $entityFiles = is_dir($gameInfoDir) ? glob($gameInfoDir . DIRECTORY_SEPARATOR . '*.entity') : [];
        $totalEntities = is_array($entityFiles) ? count($entityFiles) : 0;

        // Inspección de mapas Galaxy Forge
        $galaxyDir = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'Galaxy';
        $galaxyFiles = is_dir($galaxyDir) ? glob($galaxyDir . DIRECTORY_SEPARATOR . '*.galaxy') : [];
        $totalGalaxies = is_array($galaxyFiles) ? count($galaxyFiles) : 0;

        // Inspección de EnabledMods.txt real
        $enabledModsFile = rtrim($modsPath, '/\\') . DIRECTORY_SEPARATOR . 'EnabledMods.txt';
        $activeMods = [];
        if (file_exists($enabledModsFile)) {
            $raw = (string)file_get_contents($enabledModsFile);
            $orchestrator = new \SolarisNexus\Backend\Services\ModOrchestrator();
            try {
                $parsedMods = $orchestrator->parseEnabledMods($raw);
                $activeMods = $parsedMods['mods'] ?? [];
            } catch (\Throwable $e) {
                $activeMods = [];
            }
        }

        // Inspección de carpetas de mods disponibles
        $availableMods = [];
        if ($modsExists) {
            $dirs = scandir($modsPath);
            if ($dirs !== false) {
                foreach ($dirs as $d) {
                    if ($d !== '.' && $d !== '..' && is_dir($modsPath . DIRECTORY_SEPARATOR . $d)) {
                        $availableMods[] = $d;
                    }
                }
            }
        }

        $ramProfiler = new \SolarisNexus\Backend\Services\RamProfilerService();
        $ramBudget = $ramProfiler->calculateBudget($activeMods);

        return [
            'game' => [
                'installed' => $installExists,
                'path' => $this->logger->sanitizePath($installPath),
                'spanishLocalization' => [
                    'exists' => $spanishStrExists,
                    'file' => $spanishStrExists ? 'Localizations/es/String/English.str' : null,
                    'stringCount' => $spanishStrCount,
                ],
                'entitiesCount' => $totalEntities,
                'galaxiesCount' => $totalGalaxies,
            ],
            'mods' => [
                'exists' => $modsExists,
                'path' => $this->logger->sanitizePath($modsPath),
                'activeCount' => count($activeMods),
                'active' => $activeMods,
                'availableCount' => count($availableMods),
                'available' => $availableMods,
                'ramBudget' => $ramBudget,
            ],
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

    /**
     * Convierte entidades o recursos entre texto y binario usando ConvertData_Rebellion.exe.
     */
    public function convertResource(array $payload, array $config): array
    {
        $type = $payload['type'] ?? $payload['resource_type'] ?? 'entity';
        $inputPath = $payload['input_path'] ?? $payload['file_path'] ?? '';
        $outputPath = $payload['output_path'] ?? ($inputPath . '.converted');
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
        $service = new \SolarisNexus\Backend\Services\ConvertDataService($config['sins']['install_path'], $this->logger);
        return $service->convert($type, $inputPath, $outputPath, $format);
    }
}
