<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;

final class EntityInspectorService
{
    public const WARNING_CHECKSUM_MUTATION = 'MULTIPLAYER_CHECKSUM_MUTATION_WARNING: Modifying entity values alters network checksums. Use exclusively in Single Player / Sandbox games.';

    private LoggerService $logger;

    public function __construct(?LoggerService $logger = null)
    {
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Parsea un archivo de entidad de Sins of a Solar Empire (.entity en formato TXT).
     */
    public function parseEntityContent(string $rawContent): array
    {
        $content = ByteBufferHelper::stripBom($rawContent);
        $lines = preg_split("/\r\n|\n|\r/", $content);
        if ($lines === false || count($lines) < 2) {
            throw new \RuntimeException('SYNTAX_ERROR: Entity content too short.');
        }

        $header = trim($lines[0]);
        if ($header !== 'TXT' && $header !== 'TXT2') {
            throw new \RuntimeException(sprintf('SYNTAX_ERROR: Invalid header "%s", expected "TXT".', $header));
        }

        $entityType = 'Unknown';
        $attributes = [];
        $rawLines = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            $rawLines[] = $line;

            if (preg_match('/^entityType\s+"(.*)"$/', $trimmed, $m)) {
                $entityType = $m[1];
            } elseif (preg_match('/^([a-zA-Z0-9_:]+)\s+([0-9\.\-]+)$/', $trimmed, $m)) {
                $key = $m[1];
                $val = is_numeric($m[2]) ? (float)$m[2] : $m[2];
                $attributes[$key] = $val;
            } elseif (preg_match('/^([a-zA-Z0-9_:]+)\s+"(.*)"$/', $trimmed, $m)) {
                $attributes[$m[1]] = $m[2];
            }
        }

        return [
            'header' => $header,
            'entityType' => $entityType,
            'attributes' => $attributes,
            'checksumWarning' => self::WARNING_CHECKSUM_MUTATION,
            'totalLines' => count($rawLines),
        ];
    }

    /**
     * Parsea un archivo .entity directamente desde disco.
     */
    public function parseEntityFile(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException(sprintf('FILE_NOT_FOUND: "%s" does not exist.', $filePath));
        }

        $raw = file_get_contents($filePath);
        if ($raw === false) {
            throw new \RuntimeException('READ_ERROR: Unable to read entity file.');
        }

        return $this->parseEntityContent($raw);
    }

    /**
     * Modifica parámetros clave en una entidad preservando la estructura y sangrado.
     */
    public function updateEntityParameters(string $rawContent, array $newParameters): string
    {
        $content = ByteBufferHelper::stripBom($rawContent);
        $lines = preg_split("/\r\n|\n|\r/", $content);
        if ($lines === false) {
            throw new \RuntimeException('SYNTAX_ERROR: Unable to split entity lines.');
        }

        $updatedLines = [];
        $modifiedKeys = [];

        foreach ($lines as $line) {
            $modified = false;
            foreach ($newParameters as $paramKey => $newVal) {
                // Coincidir con parámetro numérico
                if (preg_match('/^(\s*' . preg_quote($paramKey, '/') . '\s+)[0-9\.\-]+$/', $line, $m)) {
                    $formattedVal = is_float($newVal) ? sprintf('%.6f', $newVal) : (string)$newVal;
                    $updatedLines[] = $m[1] . $formattedVal;
                    $modifiedKeys[$paramKey] = true;
                    $modified = true;
                    break;
                }
                // Coincidir con parámetro string
                if (preg_match('/^(\s*' . preg_quote($paramKey, '/') . '\s+)"(.*)"$/', $line, $m)) {
                    $updatedLines[] = $m[1] . '"' . $newVal . '"';
                    $modifiedKeys[$paramKey] = true;
                    $modified = true;
                    break;
                }
            }

            if (!$modified) {
                $updatedLines[] = $line;
            }
        }

        return implode(ByteBufferHelper::CRLF, $updatedLines);
    }
}
