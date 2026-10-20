<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use SolarisNexus\Backend\Services\GalaxyForgeService;
use SolarisNexus\Backend\Utils\LoggerService;

final class GalaxyController
{
    private GalaxyForgeService $forge;
    private LoggerService $logger;

    public function __construct(
        ?GalaxyForgeService $forge = null,
        ?LoggerService $logger = null
    ) {
        $this->forge = $forge ?? new GalaxyForgeService();
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Parsea un escenario galáctico (.galaxy).
     */
    public function parse(array $payload): array
    {
        if (isset($payload['raw_content']) && is_string($payload['raw_content'])) {
            return $this->forge->parseGalaxyContent($payload['raw_content']);
        }

        if (isset($payload['file_path']) && is_string($payload['file_path'])) {
            if (!file_exists($payload['file_path'])) {
                throw new \InvalidArgumentException('FILE_NOT_FOUND: Galaxy file path not found.');
            }
            $raw = file_get_contents($payload['file_path']);
            return $this->forge->parseGalaxyContent($raw ?: '');
        }

        throw new \InvalidArgumentException('INVALID_PAYLOAD: "raw_content" or "file_path" must be provided.');
    }

    /**
     * Genera un escenario galáctico balanceado procedural.
     */
    public function generate(array $payload): array
    {
        $name = $payload['scenario_name'] ?? 'Solaris Procedural Map';
        $planetCount = (int)($payload['planet_count'] ?? 10);

        $galaxy = $this->forge->generateProceduralGalaxy($name, $planetCount);
        $serialized = $this->forge->serializeGalaxy($galaxy);

        $this->logger->info('Escenario galáctico procedural generado con éxito.', [
            'name' => $name,
            'planets' => $planetCount,
        ]);

        return [
            'scenarioName' => $name,
            'galaxy' => $galaxy,
            'serializedContent' => $serialized,
        ];
    }
}
