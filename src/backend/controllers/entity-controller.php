<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use SolarisNexus\Backend\Services\EntityInspectorService;
use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;

final class EntityController
{
    private EntityInspectorService $inspector;
    private LoggerService $logger;

    public function __construct(
        ?EntityInspectorService $inspector = null,
        ?LoggerService $logger = null
    ) {
        $this->inspector = $inspector ?? new EntityInspectorService();
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Inspecciona una entidad extrayendo sus atributos de combate, casco y antimateria.
     */
    public function inspect(array $payload): array
    {
        if (isset($payload['raw_content']) && is_string($payload['raw_content'])) {
            return $this->inspector->parseEntityContent($payload['raw_content']);
        }

        if (isset($payload['file_path']) && is_string($payload['file_path'])) {
            return $this->inspector->parseEntityFile($payload['file_path']);
        }

        throw new \InvalidArgumentException('INVALID_PAYLOAD: "raw_content" or "file_path" must be provided.');
    }

    /**
     * Modifica parámetros de una entidad y guarda con respaldo atómico.
     */
    public function update(array $payload, string $backupDir): array
    {
        $filePath = $payload['file_path'] ?? null;
        $parameters = $payload['parameters'] ?? [];

        if (!is_string($filePath) || empty($filePath) || !file_exists($filePath)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: Valid "file_path" is required.');
        }

        if (!is_array($parameters) || empty($parameters)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "parameters" array is required.');
        }

        $raw = file_get_contents($filePath);
        if ($raw === false) {
            throw new \RuntimeException('READ_ERROR: Unable to read entity file.');
        }

        $updatedContent = $this->inspector->updateEntityParameters($raw, $parameters);
        ByteBufferHelper::safeAtomicWrite($filePath, $updatedContent, $backupDir);

        $this->logger->info('Parámetros de entidad actualizados con éxito.', [
            'file' => $this->logger->sanitizePath($filePath),
            'modified_params_count' => count($parameters),
        ]);

        return [
            'success' => true,
            'checksumWarning' => EntityInspectorService::WARNING_CHECKSUM_MUTATION,
            'updatedParameters' => $parameters,
        ];
    }

    /**
     * Devuelve el catálogo multientidad de Sins Rebellion con estados Beta / En Desarrollo.
     */
    public function getCatalog(): array
    {
        return [
            'entities' => [
                [
                    'id' => 'CAPITALSHIP_TECHBATTLESHIP',
                    'name' => 'Acorazado Kol (TEC)',
                    'faction' => 'TEC Loyalists / Rebels',
                    'role' => 'Nave Insignia de Combate Pesado',
                    'status' => 'BETA',
                    'isAvailable' => true,
                    'shieldPoints' => 1250.0,
                    'hullPoints' => 3000.0,
                    'antiMatter' => 250.0,
                    'armorPoints' => 8.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHBATTLESHIP.entity'
                ],
                [
                    'id' => 'CAPITALSHIP_TECHSUPPORT',
                    'name' => 'Crucero de Batalla Dunov (TEC)',
                    'faction' => 'TEC Loyalists / Rebels',
                    'role' => 'Nave de Soporte Táctico y Drenaje de Escudos',
                    'status' => 'BETA',
                    'isAvailable' => true,
                    'shieldPoints' => 1100.0,
                    'hullPoints' => 2600.0,
                    'antiMatter' => 380.0,
                    'armorPoints' => 7.5,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHSUPPORT.entity'
                ],
                [
                    'id' => 'CAPITALSHIP_TECHSIEGE',
                    'name' => 'Dreadnought Marza (TEC)',
                    'faction' => 'TEC Loyalists',
                    'role' => 'Nave de Asedio Planetario y Bombardeo',
                    'status' => 'DEV',
                    'isAvailable' => false,
                    'shieldPoints' => 950.0,
                    'hullPoints' => 2400.0,
                    'antiMatter' => 220.0,
                    'armorPoints' => 6.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHSIEGE.entity'
                ],
                [
                    'id' => 'CAPITALSHIP_PSIBATTLESHIP',
                    'name' => 'Acorazado Radiance (Advent)',
                    'faction' => 'Advent Unity',
                    'role' => 'Nave de Proyección Psiónica y Purificación',
                    'status' => 'DEV',
                    'isAvailable' => false,
                    'shieldPoints' => 1800.0,
                    'hullPoints' => 2100.0,
                    'antiMatter' => 320.0,
                    'armorPoints' => 5.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_PSIBATTLESHIP.entity'
                ],
                [
                    'id' => 'CAPITALSHIP_PHASECARRIER',
                    'name' => 'Portanaves Skirantra (Vasari)',
                    'faction' => 'Vasari Empire',
                    'role' => 'Nave Nodo de Hangar Nanotecnológico',
                    'status' => 'DEV',
                    'isAvailable' => false,
                    'shieldPoints' => 1400.0,
                    'hullPoints' => 2800.0,
                    'antiMatter' => 290.0,
                    'armorPoints' => 7.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_PHASECARRIER.entity'
                ]
            ]
        ];
    }
}
