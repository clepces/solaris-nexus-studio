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

        return [
            'exists' => true,
            'archiveVersion' => $parsed['archiveVersion'],
            'activeCount' => $parsed['actualCount'],
            'mods' => $parsed['mods'],
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
}
