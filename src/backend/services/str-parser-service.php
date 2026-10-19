<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use Generator;
use SolarisNexus\Backend\Utils\ByteBufferHelper;

final class StrParserService
{
    /**
     * Parsea un archivo .str en memoria de forma completa retornando el catálogo de cadenas.
     */
    public function parseFile(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException(sprintf('FILE_NOT_FOUND: Path "%s" does not exist.', $filePath));
        }

        $raw = file_get_contents($filePath);
        if ($raw === false) {
            throw new \RuntimeException('READ_ERROR: Unable to read string dictionary.');
        }

        return $this->parseContent($raw);
    }

    /**
     * Parsea el contenido en texto crudo de un archivo de localización .str.
     */
    public function parseContent(string $rawContent): array
    {
        $content = ByteBufferHelper::stripBom($rawContent);
        // Dividir por líneas preservando índices
        $lines = preg_split("/\r\n|\n|\r/", $content);
        if ($lines === false || count($lines) < 2) {
            throw new \RuntimeException('SYNTAX_ERROR: File does not contain minimal header.');
        }

        $header = trim($lines[0]);
        if ($header !== 'TXT') {
            throw new \RuntimeException(sprintf('SYNTAX_ERROR: Invalid header "%s", expected "TXT".', $header));
        }

        if (!preg_match('/^NumStrings\s+(\d+)$/', trim($lines[1]), $matches)) {
            throw new \RuntimeException(sprintf('SYNTAX_ERROR: Invalid NumStrings directive at line 2: "%s".', $lines[1]));
        }

        $expectedCount = (int)$matches[1];
        $entries = [];

        $totalLines = count($lines);
        $i = 2;

        while ($i < $totalLines) {
            $line = trim($lines[$i]);
            if ($line === '') {
                $i++;
                continue;
            }

            if ($line === 'StringInfo') {
                $startLine = $i + 1;
                $id = null;
                $value = null;
                $i++;

                // Buscar ID
                while ($i < $totalLines && $id === null) {
                    $subLine = trim($lines[$i]);
                    if (preg_match('/^ID\s+"(.*)"$/', $subLine, $idMatches)) {
                        $id = $idMatches[1];
                    }
                    $i++;
                }

                // Buscar Value
                while ($i < $totalLines && $value === null) {
                    $subLine = trim($lines[$i]);
                    if (preg_match('/^Value\s+"(.*)"$/s', $subLine, $valMatches)) {
                        $value = $valMatches[1];
                    }
                    $i++;
                }

                if ($id !== null && $value !== null) {
                    $entries[] = [
                        'id' => $id,
                        'value' => $value,
                        'lineNumber' => $startLine,
                    ];
                }
            } else {
                $i++;
            }
        }

        return [
            'header' => 'TXT',
            'numStrings' => count($entries),
            'expectedNumStrings' => $expectedCount,
            'isCountValid' => count($entries) === $expectedCount,
            'entries' => $entries,
        ];
    }

    /**
     * Iterador en streaming mediante generador para procesar archivos masivos (>15.000 entradas)
     * con huella de memoria mínima (<5MB).
     */
    public function parseStream(string $filePath): Generator
    {
        $handle = @fopen($filePath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('STREAM_ERROR: Failed to open file handle.');
        }

        try {
            // Leer y descartar posible BOM de 3 bytes
            $initial = fread($handle, 3);
            if ($initial !== ByteBufferHelper::BOM_BYTES) {
                rewind($handle);
            }

            $currentLineNum = 0;
            $currentId = null;

            while (($line = fgets($handle)) !== false) {
                $currentLineNum++;
                $trimmed = trim($line);

                if ($trimmed === 'StringInfo') {
                    $currentId = null;
                    continue;
                }

                if ($currentId === null && preg_match('/^ID\s+"(.*)"$/', $trimmed, $idM)) {
                    $currentId = $idM[1];
                    continue;
                }

                if ($currentId !== null && preg_match('/^Value\s+"(.*)"$/s', $trimmed, $valM)) {
                    yield [
                        'id' => $currentId,
                        'value' => $valM[1],
                        'lineNumber' => $currentLineNum,
                    ];
                    $currentId = null;
                }
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Serializa un conjunto de entradas al formato canónico del motor de Sins of a Solar Empire.
     */
    public function serialize(array $entries): string
    {
        $count = count($entries);
        $crlf = ByteBufferHelper::CRLF;
        $out = 'TXT' . $crlf;
        $out .= 'NumStrings ' . $count . $crlf;

        foreach ($entries as $entry) {
            $id = $entry['id'];
            $value = $entry['value'];
            // Escapar comillas dobles internas si no están escapadas
            $escapedValue = preg_replace('/(?<!\\\\)"/', '\"', $value);

            $out .= 'StringInfo' . $crlf;
            $out .= "\tID \"" . $id . '"' . $crlf;
            $out .= "\tValue \"" . $escapedValue . '"' . $crlf;
        }

        return $out;
    }
}
