<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use SolarisNexus\Backend\Services\ModOrchestrator;
use SolarisNexus\Backend\Services\RamProfilerService;
use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Config\AppConfig;

final class ModController
{
    private ModOrchestrator $orchestrator;
    private RamProfilerService $ramProfiler;
    private LoggerService $logger;

    public function __construct(
        ?ModOrchestrator $orchestrator = null,
        ?RamProfilerService $ramProfiler = null,
        ?LoggerService $logger = null
    ) {
        $this->orchestrator = $orchestrator ?? new ModOrchestrator();
        $this->ramProfiler = $ramProfiler ?? new RamProfilerService();
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Escanea el directorio de mods configurado para identificar los disponibles.
     */
    public function scan(array $config): array
    {
        $modsPath = $config['sins']['mods_path'];
        // Resolver ruta si inicia con Documents
        if (!is_dir($modsPath) && isset($_SERVER['USERPROFILE'])) {
            $resolved = $_SERVER['USERPROFILE'] . DIRECTORY_SEPARATOR . $modsPath;
            if (is_dir($resolved)) {
                $modsPath = $resolved;
            }
        }

        $availableMods = [];
        if (is_dir($modsPath)) {
            $items = scandir($modsPath);
            if ($items !== false) {
                foreach ($items as $item) {
                    if ($item === '.' || $item === '..' || !is_dir($modsPath . DIRECTORY_SEPARATOR . $item)) {
                        continue;
                    }

                    $isMinimod = str_starts_with($item, '[ES]') || str_contains(strtolower($item), 'traduccion');
                    $availableMods[] = [
                        'name' => $item,
                        'isMinimod' => $isMinimod,
                        'estimatedRamMb' => $this->ramProfiler->estimateModRam($item),
                    ];
                }
            }
        }

        return [
            'modsPath' => $this->logger->sanitizePath($modsPath),
            'modsCount' => count($availableMods),
            'mods' => $availableMods,
        ];
    }

    /**
     * Obtiene los mods activos y el cálculo de presupuesto RAM.
     */
    public function getEnabled(string $enabledModsPath): array
    {
        if (!file_exists($enabledModsPath)) {
            return [
                'exists' => false,
                'mods' => [],
                'budget' => $this->ramProfiler->calculateBudget([]),
            ];
        }

        $raw = file_get_contents($enabledModsPath);
        if ($raw === false) {
            throw new \RuntimeException('READ_ERROR: Unable to read EnabledMods.txt.');
        }

        $parsed = $this->orchestrator->parseEnabledMods($raw);
        $budget = $this->ramProfiler->calculateBudget($parsed['mods']);

        $modsDir = dirname($enabledModsPath);
        $modsDetailed = [];
        $hasMissingDirs = false;

        foreach ($parsed['mods'] as $modName) {
            $fullDir = $modsDir . DIRECTORY_SEPARATOR . $modName;
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

            $modsDetailed[] = [
                'name' => $modName,
                'exists' => $dirExists,
                'hasContent' => $hasContent,
                'state' => $state
            ];
        }

        return [
            'exists' => true,
            'archiveVersion' => $parsed['archiveVersion'],
            'activeCount' => $parsed['actualCount'],
            'mods' => $parsed['mods'],
            'modsDetailed' => $modsDetailed,
            'hasMissingDirs' => $hasMissingDirs,
            'budget' => $budget,
        ];
    }

    /**
     * Guarda la lista de mods activos con inyección opcional de minimod de traducción y backup.
     */
    public function saveEnabled(array $payload, string $enabledModsPath, string $backupDir): array
    {
        $mods = $payload['mods'] ?? [];
        $injectMinimod = $payload['inject_minimod'] ?? null;

        if ($injectMinimod && is_string($injectMinimod)) {
            $mods = $this->orchestrator->injectTranslationMinimod($mods, $injectMinimod);
        }

        $budget = $this->ramProfiler->calculateBudget($mods);
        $serialized = $this->orchestrator->serializeEnabledMods($mods);

        ByteBufferHelper::safeAtomicWrite($enabledModsPath, $serialized, $backupDir);

        return [
            'success' => true,
            'activeCount' => count($mods),
            'budget' => $budget,
        ];
    }

    /**
     * Sintetiza dinámicamente un minimod JIT de idioma para la combinación activa de mods.
     */
    public function synthesizeSession(array $payload, array $config): array
    {
        $mods = $payload['mods'] ?? [];
        if (empty($mods)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "mods" array is required.');
        }

        $synthesizer = new \SolarisNexus\Backend\Services\LanguageSynthesizer(null, $this->orchestrator, $this->logger);
        $modsPath = $config['sins']['mods_path'];
        if (!is_dir($modsPath) && isset($_SERVER['USERPROFILE'])) {
            $resolved = $_SERVER['USERPROFILE'] . DIRECTORY_SEPARATOR . $modsPath;
            if (is_dir($resolved)) {
                $modsPath = $resolved;
            }
        }

        return $synthesizer->synthesizeSession($mods, $modsPath, $config['paths']['backups']);
    }

    /**
     * Detecta rutas estándar de mods en Steam, GOG, Stardock o VFS custom.
     */
    public function detectPlatforms(): array
    {
        $userProfile = $_SERVER['USERPROFILE'] ?? (getenv('USERPROFILE') ?: '');
        $candidates = [
            [
                'platform' => 'Steam / Oficial',
                'path' => $userProfile . '/Documents/My Games/Ironclad Games/Sins of a Solar Empire Rebellion/Mods-Rebellion v1.85',
                'description' => 'Directorio estándar de documentos para Sins Rebellion v1.85 (Steam/Retail)'
            ],
            [
                'platform' => 'GOG Galaxy / DRM-Free',
                'path' => $userProfile . '/Documents/My Games/Ironclad Games/Sins of a Solar Empire Rebellion/Mods',
                'description' => 'Directorio unificado de mods de edición independiente'
            ],
            [
                'platform' => 'Stardock Central',
                'path' => 'C:/ProgramData/Ironclad Games/Sins of a Solar Empire Rebellion/Mods',
                'description' => 'Repositorio global de perfiles compartidos multijugador'
            ],
            [
                'platform' => 'Steam App Local',
                'path' => 'C:/Program Files (x86)/Steam/steamapps/common/Sins of a Solar Empire Rebellion/Mods',
                'description' => 'Directorio raíz de instalación en biblioteca de Steam'
            ]
        ];

        $results = [];
        foreach ($candidates as $c) {
            $norm = str_replace('\\', '/', $c['path']);
            $exists = is_dir($norm);
            $results[] = [
                'platform' => $c['platform'],
                'path' => $norm,
                'description' => $c['description'],
                'exists' => $exists,
                'active' => $exists
            ];
        }

        return [
            'platforms' => $results,
            'defaultActive' => $results[0]['path']
        ];
    }

    /**
     * Valida y vincula un directorio físico personalizado de instalación del juego.
     */
    public function validateCustomPath(array $payload): array
    {
        $rawPath = trim($payload['path'] ?? '');
        if ($rawPath === '') {
            return [
                'success' => false,
                'message' => 'Ruta de directorio vacía.'
            ];
        }

        $normPath = str_replace('\\', '/', $rawPath);
        $normPath = rtrim($normPath, '/');

        if (!is_dir($normPath)) {
            return [
                'success' => false,
                'exists' => false,
                'path' => $this->logger->sanitizePath($normPath),
                'message' => 'El directorio especificado no existe en el sistema de archivos.'
            ];
        }

        $hasExe = file_exists($normPath . '/Sins of a Solar Empire Rebellion.exe') || file_exists($normPath . '/Rebellion.exe');
        $hasLocalizations = is_dir($normPath . '/Localizations');
        $hasGameInfo = is_dir($normPath . '/GameInfo');
        $hasMods = is_dir($normPath . '/Mods') || is_dir($normPath . '/Mods-Rebellion v1.85');
        $isWritable = is_writable($normPath);

        return [
            'success' => true,
            'exists' => true,
            'is_writable' => $isWritable,
            'has_exe' => $hasExe,
            'has_localizations' => $hasLocalizations,
            'has_gameinfo' => $hasGameInfo,
            'has_mods' => $hasMods,
            'path' => $this->logger->sanitizePath($normPath),
            'message' => $hasExe 
                ? 'Directorio canónico oficial detectado (Ejecutable Rebellion presente).'
                : 'Directorio verificado con permisos de lectura/escritura.'
        ];
    }
}
