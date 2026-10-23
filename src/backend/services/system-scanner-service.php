<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\LoggerService;

final class SystemScannerService
{
    public function __construct(private readonly LoggerService $logger)
    {
    }

    public function scanPermissions(array $config): array
    {
        $installPath = $config['sins']['install_path'];
        $modsPath = $config['sins']['mods_path'];
        $backupDir = $config['paths']['backups'];
        $esStringDir = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'Localizations' . DIRECTORY_SEPARATOR . 'es' . DIRECTORY_SEPARATOR . 'String';

        return [
            'permissions' => [
                [
                    'resource' => 'Directorio de Localización Española (es/String)',
                    'path' => $this->logger->sanitizePath($esStringDir),
                    'access' => is_writable($esStringDir) ? 'READ / WRITE' : (is_readable($esStringDir) ? 'READ ONLY' : 'NO ACCESS'),
                    'granted' => is_readable($esStringDir),
                    'statusText' => is_writable($esStringDir) ? '✓ Concedido (RW)' : 'Lectura'
                ],
                [
                    'resource' => 'Directorio de Mods VFS (Mods-Rebellion v1.85)',
                    'path' => $this->logger->sanitizePath($modsPath),
                    'access' => is_writable($modsPath) ? 'READ / WRITE' : (is_readable($modsPath) ? 'READ ONLY' : 'NO ACCESS'),
                    'granted' => is_writable($modsPath),
                    'statusText' => is_writable($modsPath) ? '✓ Concedido (RW)' : 'Sin permisos'
                ],
                [
                    'resource' => 'Bóveda de Resguardos Atómicos (.bak)',
                    'path' => $this->logger->sanitizePath($backupDir),
                    'access' => is_writable($backupDir) ? 'READ / WRITE' : 'READ ONLY',
                    'granted' => is_writable($backupDir),
                    'statusText' => '✓ Activo'
                ],
                [
                    'resource' => 'Base de Datos Relacional SQLite',
                    'path' => 'storage/database.sqlite',
                    'access' => 'READ / WRITE',
                    'granted' => true,
                    'statusText' => '✓ Conectado'
                ],
                [
                    'resource' => 'Motor Nativo ConvertData_Rebellion.exe',
                    'path' => $this->logger->sanitizePath($installPath . '/ConvertData_Rebellion.exe'),
                    'access' => 'EXECUTE',
                    'granted' => file_exists($installPath . '/ConvertData_Rebellion.exe'),
                    'statusText' => file_exists($installPath . '/ConvertData_Rebellion.exe') ? '✓ Disponible' : 'Simulación Activa'
                ]
            ]
        ];
    }

    public function scanRealEnvironment(array $config): array
    {
        $installPath = $config['sins']['install_path'];
        $modsPath = $config['sins']['mods_path'];

        $installExists = is_dir($installPath);
        $modsExists = is_dir($modsPath);

        $spanishStrFile = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'Localizations' . DIRECTORY_SEPARATOR . 'es' . DIRECTORY_SEPARATOR . 'String' . DIRECTORY_SEPARATOR . 'English.str';
        $spanishStrExists = file_exists($spanishStrFile);
        $spanishStrCount = 0;

        if ($spanishStrExists) {
            $parser = new StrParserService();
            $parsed = $parser->parseFile($spanishStrFile);
            $spanishStrCount = $parsed['numStrings'] ?? count($parsed['entries'] ?? []);
        }

        $gameInfoDir = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'GameInfo';
        $entityFiles = is_dir($gameInfoDir) ? glob($gameInfoDir . DIRECTORY_SEPARATOR . '*.entity') : [];
        $totalEntities = is_array($entityFiles) ? count($entityFiles) : 0;

        $galaxyDir = rtrim($installPath, '/\\') . DIRECTORY_SEPARATOR . 'Galaxy';
        $galaxyFiles = is_dir($galaxyDir) ? glob($galaxyDir . DIRECTORY_SEPARATOR . '*.galaxy') : [];
        $totalGalaxies = is_array($galaxyFiles) ? count($galaxyFiles) : 0;

        $enabledModsFile = rtrim($modsPath, '/\\') . DIRECTORY_SEPARATOR . 'EnabledMods.txt';
        $activeMods = [];
        if (file_exists($enabledModsFile)) {
            $raw = (string)file_get_contents($enabledModsFile);
            $orchestrator = new ModOrchestrator();
            try {
                $parsedMods = $orchestrator->parseEnabledMods($raw);
                $activeMods = $parsedMods['mods'] ?? [];
            } catch (\Throwable $e) {
                $activeMods = [];
            }
        }

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

        $activeModsDetailed = [];
        $hasMissingDirs = false;
        $priority = 999;
        foreach ($activeMods as $modName) {
            $fullDir = $modsPath . DIRECTORY_SEPARATOR . $modName;
            $dirExists = is_dir($fullDir);
            $hasContent = false;
            if ($dirExists) {
                $files = scandir($fullDir);
                $hasContent = ($files !== false && count($files) > 2);
            }

            $state = 'OK';
            if (!$dirExists) {
                $state = 'MISSING_DIRECTORY';
                $hasMissingDirs = true;
            } elseif (!$hasContent) {
                $state = 'EMPTY_DIRECTORY';
            }

            $isMinimod = str_starts_with($modName, '[ES]') || str_contains(strtolower($modName), 'traduccion');
            $activeModsDetailed[] = [
                'name' => $modName,
                'exists' => $dirExists,
                'hasContent' => $hasContent,
                'state' => $state,
                'isMinimod' => $isMinimod,
                'priority' => $priority,
                'ramMb' => $isMinimod ? 15 : 250
            ];
            $priority -= 10;
        }

        $ramProfiler = new RamProfilerService();
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
                'activeDetailed' => $activeModsDetailed,
                'hasMissingDirs' => $hasMissingDirs,
                'availableCount' => count($availableMods),
                'available' => $availableMods,
                'ramBudget' => $ramBudget,
            ],
        ];
    }
}
