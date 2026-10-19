<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\UuidGenerator;

final class ModOrchestrator
{
    public const CANONICAL_HEADER = 'TXT2';
    public const CANONICAL_ARCHIVE_VERSION = 197;
    public const CANONICAL_VERSION = 0;
    public const TRANSLATION_PRIORITY = 999;

    /**
     * Parsea el contenido o archivo EnabledMods.txt respetando la gramática del motor.
     */
    public function parseEnabledMods(string $content): array
    {
        $lines = preg_split("/\r\n|\n|\r/", trim(ByteBufferHelper::stripBom($content)));
        if ($lines === false || count($lines) < 4) {
            throw new \RuntimeException('SYNTAX_ERROR: Invalid EnabledMods.txt structure.');
        }

        $header = trim($lines[0]);
        if ($header !== self::CANONICAL_HEADER) {
            throw new \RuntimeException(sprintf('SYNTAX_ERROR: Header "%s" is invalid, expected "%s".', $header, self::CANONICAL_HEADER));
        }

        $count = 0;
        if (preg_match('/^enabledModNameCount\s+(\d+)$/', trim($lines[3]), $m)) {
            $count = (int)$m[1];
        }

        $mods = [];
        $totalLines = count($lines);
        $priority = self::TRANSLATION_PRIORITY;

        for ($i = 4; $i < $totalLines; $i++) {
            $line = trim($lines[$i]);
            if ($line === '') {
                continue;
            }

            if (preg_match('/^enabledModName\s+"(.*)"$/', $line, $modMatch)) {
                $modName = $modMatch[1];
                $isMinimod = str_starts_with($modName, '[ES]') || str_contains(strtolower($modName), 'traduccion') || str_contains(strtolower($modName), 'translation');
                
                $mods[] = [
                    'name' => $modName,
                    'priority' => $priority,
                    'isMinimod' => $isMinimod,
                    'orderIndex' => count($mods),
                ];
                $priority -= 10;
            }
        }

        return [
            'header' => self::CANONICAL_HEADER,
            'archiveVersion' => self::CANONICAL_ARCHIVE_VERSION,
            'declaredCount' => $count,
            'actualCount' => count($mods),
            'isValid' => $count === count($mods),
            'mods' => $mods,
        ];
    }

    /**
     * Inserta un minimod de traducción en la posición de máxima prioridad (orden 0 / prioridad 999).
     */
    public function injectTranslationMinimod(array $activeMods, string $minimodName): array
    {
        // Filtrar si ya existía para evitar duplicados
        $filtered = array_values(array_filter($activeMods, static fn(array $m): bool => $m['name'] !== $minimodName));

        // Insertar en la primera posición
        array_unshift($filtered, [
            'name' => $minimodName,
            'priority' => self::TRANSLATION_PRIORITY,
            'isMinimod' => true,
            'orderIndex' => 0,
        ]);

        // Recalcular prioridades e índices
        $priority = self::TRANSLATION_PRIORITY;
        foreach ($filtered as $idx => &$item) {
            $item['orderIndex'] = $idx;
            $item['priority'] = $priority;
            $priority -= 10;
        }

        return $filtered;
    }

    /**
     * Serializa la lista de mods a la gramática estricta de EnabledMods.txt con terminación CRLF.
     */
    public function serializeEnabledMods(array $mods): string
    {
        $crlf = ByteBufferHelper::CRLF;
        $count = count($mods);

        $out = self::CANONICAL_HEADER . $crlf;
        $out .= 'SinsArchiveVersion ' . self::CANONICAL_ARCHIVE_VERSION . $crlf;
        $out .= 'Version ' . self::CANONICAL_VERSION . $crlf;
        $out .= 'enabledModNameCount ' . $count . $crlf;

        foreach ($mods as $mod) {
            $name = is_array($mod) ? $mod['name'] : (string)$mod;
            $out .= 'enabledModName "' . $name . '"' . $crlf;
        }

        return $out;
    }

    /**
     * Calcula la suma de verificación SHA-256 para validación de colisiones semánticas.
     */
    public function computeChecksum(string $filePath): string
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException('File not found for checksum.');
        }
        return hash_file('sha256', $filePath);
    }
}
