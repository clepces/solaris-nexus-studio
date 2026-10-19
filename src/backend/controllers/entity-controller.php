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
}
