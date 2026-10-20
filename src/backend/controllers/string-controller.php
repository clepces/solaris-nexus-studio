<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use SolarisNexus\Backend\Services\StrParserService;
use SolarisNexus\Backend\Services\LinterService;
use SolarisNexus\Backend\Services\TokenGuardService;
use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;

final class StringController
{
    private StrParserService $parser;
    private LinterService $linter;
    private LoggerService $logger;

    public function __construct(
        ?StrParserService $parser = null,
        ?LinterService $linter = null,
        ?LoggerService $logger = null
    ) {
        $this->parser = $parser ?? new StrParserService();
        $this->linter = $linter ?? new LinterService();
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Parsea un archivo de cadenas enviado o indicado por ruta.
     */
    public function parse(array $payload): array
    {
        if (isset($payload['raw_content']) && is_string($payload['raw_content'])) {
            return $this->parser->parseContent($payload['raw_content']);
        }

        if (isset($payload['file_path']) && is_string($payload['file_path'])) {
            return $this->parser->parseFile($payload['file_path']);
        }

        throw new \InvalidArgumentException('INVALID_PAYLOAD: "raw_content" or "file_path" must be provided.');
    }

    /**
     * Valida una traducción individual con Token Guard y Linter.
     */
    public function validateEntry(array $payload): array
    {
        $id = $payload['id'] ?? '';
        $original = $payload['original'] ?? '';
        $translated = $payload['translated'] ?? '';

        $issues = $this->linter->lintStringValue($id, $original, $translated);
        $expansion = $this->linter->checkTextExpansionRisk($original, $translated);

        return [
            'isValid' => empty(array_filter($issues, static fn($i) => $i['severity'] === 'CRITICAL')),
            'expansionRisk' => $expansion,
            'issues' => $issues,
        ];
    }

    /**
     * Serializa un conjunto de cadenas a formato canónico .str con BOM UTF-8 y CRLF.
     */
    public function export(array $payload): array
    {
        $entries = $payload['entries'] ?? null;
        if (!is_array($entries)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "entries" array is required.');
        }

        $serialized = ByteBufferHelper::UTF8_BOM . $this->parser->serialize($entries);

        return [
            'numStrings' => count($entries),
            'content' => $serialized,
            'sizeBytes' => strlen($serialized),
        ];
    }
}
