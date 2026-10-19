<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;

final class LanguageSynthesizer
{
    private StrParserService $parser;
    private ModOrchestrator $orchestrator;
    private LoggerService $logger;

    public function __construct(
        ?StrParserService $parser = null,
        ?ModOrchestrator $orchestrator = null,
        ?LoggerService $logger = null
    ) {
        $this->parser = $parser ?? new StrParserService();
        $this->orchestrator = $orchestrator ?? new ModOrchestrator();
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Calcula una huella SHA-256 normalizada del texto base.
     * Mismo concepto (ej. "Attack") => misma huella.
     * Lore divergente (ej. "TIE Fighter" vs "Seraph Fighter") => huellas distintas.
     */
    public static function computeSemanticFingerprint(string $value): string
    {
        $normalized = trim(preg_replace('/\s+/', ' ', mb_strtolower($value, 'UTF-8')));
        return hash('sha256', $normalized);
    }

    /**
     * Detecta colisiones léxicas y semánticas entre cadenas de múltiples mods activos.
     */
    public function detectCollisions(array $allEntries): array
    {
        $grouped = [];
        foreach ($allEntries as $entry) {
            $id = $entry['id'];
            $grouped[$id][] = $entry;
        }

        $reports = [];
        foreach ($grouped as $id => $entries) {
            if (count($entries) <= 1) {
                continue;
            }

            $fingerprints = [];
            foreach ($entries as $e) {
                $fingerprints[self::computeSemanticFingerprint($e['value'])] = true;
            }

            $uniqueCount = count($fingerprints);
            $verdict = ($uniqueCount === 1) ? 'AUTO_TRANSLATE' : 'MANUAL_REVIEW';

            $reports[] = [
                'id' => $id,
                'entries' => $entries,
                'verdict' => $verdict,
                'uniqueFingerprints' => $uniqueCount,
                'fingerprints' => array_keys($fingerprints),
            ];
        }

        return $reports;
    }

    /**
     * Sintetiza en caliente (JIT) un minimod de traducción consolidado para la sesión activa.
     */
    public function synthesizeSession(
        array $activeMods,
        string $sinsModsPath,
        string $backupDir,
        ?array $translationMemory = null
    ): array {
        $this->logger->info('Iniciando síntesis dinámica JIT de sesión de idioma.', [
            'active_mods_count' => count($activeMods),
        ]);

        $collectedEntries = [];
        $modContributions = [];

        // 1. Recolectar diccionarios de mods en orden de prioridad VFS
        foreach ($activeMods as $mod) {
            $modName = is_array($mod) ? $mod['name'] : (string)$mod;
            
            // Ignorar minimods de traducción previos para evitar redundancia circular
            if (str_starts_with($modName, '[ES]') || str_contains(strtolower($modName), 'traduccion')) {
                continue;
            }

            $modStrPath = rtrim($sinsModsPath, '/\\') . DIRECTORY_SEPARATOR . $modName . DIRECTORY_SEPARATOR . 'String' . DIRECTORY_SEPARATOR . 'English.str';
            if (file_exists($modStrPath)) {
                $parsed = $this->parser->parseFile($modStrPath);
                $count = 0;
                foreach ($parsed['entries'] as $e) {
                    $collectedEntries[] = [
                        'id' => $e['id'],
                        'value' => $e['value'],
                        'sourceMod' => $modName,
                        'priority' => $mod['priority'] ?? 10,
                    ];
                    $count++;
                }
                $modContributions[] = [
                    'mod' => $modName,
                    'stringsContributed' => $count,
                ];
            }
        }

        // 2. Analizar colisiones semánticas
        $collisionReports = $this->detectCollisions($collectedEntries);
        $autoResolved = 0;
        $manualPending = 0;

        foreach ($collisionReports as $report) {
            if ($report['verdict'] === 'AUTO_TRANSLATE') {
                $autoResolved++;
            } else {
                $manualPending++;
            }
        }

        // 3. Resolución VFS en cascada (mayor prioridad sobrescribe a menor)
        // Ordenar entradas: menor prioridad primero para que las de mayor prioridad sobrescriban el mapa
        usort($collectedEntries, static fn(array $a, array $b): int => ($a['priority'] ?? 0) <=> ($b['priority'] ?? 0));

        $consolidatedMap = [];
        foreach ($collectedEntries as $entry) {
            $id = $entry['id'];
            $val = $entry['value'];
            
            // Si existe traducción en la memoria de traducción, aplicarla
            $transVal = $val;
            if ($translationMemory !== null) {
                $hash = self::computeSemanticFingerprint($val);
                if (isset($translationMemory[$hash])) {
                    $transVal = $translationMemory[$hash];
                }
            }

            $consolidatedMap[$id] = [
                'id' => $id,
                'value' => $transVal,
            ];
        }

        $finalEntries = array_values($consolidatedMap);

        // 4. Compilar minimod JIT [ES] Active Session Translation
        $targetMinimodName = '[ES] Active Session Translation';
        $targetDir = rtrim($sinsModsPath, '/\\') . DIRECTORY_SEPARATOR . $targetMinimodName;
        $stringDir = $targetDir . DIRECTORY_SEPARATOR . 'String';

        if (!is_dir($stringDir)) {
            @mkdir($stringDir, 0755, true);
        }

        $serializedStr = $this->parser->serialize($finalEntries);
        $targetFile = $stringDir . DIRECTORY_SEPARATOR . 'English.str';
        ByteBufferHelper::safeAtomicWrite($targetFile, $serializedStr, $backupDir);

        // 5. Generar Manifiesto de Compilación (meta.json)
        $manifest = [
            'generator' => 'solaris-nexus-studio',
            'version' => '0.1.2.0-alpha',
            'targetLanguage' => 'es',
            'buildTimestamp' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP'),
            'sourceMods' => $modContributions,
            'totalStrings' => count($finalEntries),
            'collisionsAutoResolved' => $autoResolved,
            'collisionsManualPending' => $manualPending,
        ];

        @file_put_contents($targetDir . DIRECTORY_SEPARATOR . 'meta.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 6. Inyectar en EnabledMods.txt en Prioridad 999
        $updatedMods = $this->orchestrator->injectTranslationMinimod($activeMods, $targetMinimodName);
        $serializedEnabled = $this->orchestrator->serializeEnabledMods($updatedMods);
        $enabledModsPath = rtrim($sinsModsPath, '/\\') . DIRECTORY_SEPARATOR . 'EnabledMods.txt';
        ByteBufferHelper::safeAtomicWrite($enabledModsPath, $serializedEnabled, $backupDir);

        return [
            'success' => true,
            'minimodName' => $targetMinimodName,
            'manifest' => $manifest,
            'totalStrings' => count($finalEntries),
            'collisions' => [
                'total' => count($collisionReports),
                'autoResolved' => $autoResolved,
                'manualPending' => $manualPending,
            ],
            'reports' => $collisionReports,
        ];
    }
}
