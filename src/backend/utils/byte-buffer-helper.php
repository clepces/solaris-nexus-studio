<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

final class ByteBufferHelper
{
    public const BOM_BYTES = "\xEF\xBB\xBF";
    public const CRLF = "\r\n";

    /**
     * Normaliza cualquier texto a saltos de línea CRLF (\r\n) estilo Windows.
     */
    public static function normalizeToCrlf(string $content): string
    {
        // Normalizar primero reemplazando \r\n con \n, luego \r solo con \n, y finalmente todo a \r\n
        $content = str_replace(["\r\n", "\r"], "\n", $content);
        return str_replace("\n", self::CRLF, $content);
    }

    /**
     * Remueve la firma UTF-8 BOM si está presente en el contenido.
     */
    public static function stripBom(string $content): string
    {
        if (str_starts_with($content, self::BOM_BYTES)) {
            return substr($content, 3);
        }
        return $content;
    }

    /**
     * Inyecta la firma UTF-8 BOM y asegura terminación CRLF.
     */
    public static function createCanonicalBuffer(string $content): string
    {
        $normalized = self::normalizeToCrlf(self::stripBom($content));
        return self::BOM_BYTES . $normalized;
    }

    /**
     * Verifica si una cadena o buffer inicia con el BOM UTF-8 oficial.
     */
    public static function hasUtf8Bom(string $content): bool
    {
        return str_starts_with($content, self::BOM_BYTES);
    }

    /**
     * Escribe un archivo de forma atómica con respaldo preventivo.
     * Regla 12.5: Respaldo y Recuperación (Disaster Recovery).
     */
    public static function safeAtomicWrite(string $targetPath, string $content, string $backupDir): string
    {
        $dir = dirname($targetPath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        // 1. Si el archivo destino existe, generar copia de seguridad
        if (file_exists($targetPath)) {
            if (!is_dir($backupDir)) {
                @mkdir($backupDir, 0755, true);
            }
            $baseName = basename($targetPath);
            $backupFilename = sprintf('%s_%s_%s.bak', pathinfo($baseName, PATHINFO_FILENAME), date('Ymd_His'), substr(UuidGenerator::v4(), 0, 8));
            $backupPath = $backupDir . DIRECTORY_SEPARATOR . $backupFilename;
            copy($targetPath, $backupPath);
        }

        // 2. Escritura atómica a archivo temporal
        $tempPath = $dir . DIRECTORY_SEPARATOR . '.' . basename($targetPath) . '.' . UuidGenerator::v4() . '.tmp';
        $canonicalBuffer = self::createCanonicalBuffer($content);

        $bytesWritten = @file_put_contents($tempPath, $canonicalBuffer, LOCK_EX);
        if ($bytesWritten === false) {
            throw new \RuntimeException('IO_ERROR: Failed to write to temporary swap file.');
        }

        // 3. Reemplazo atómico
        if (!@rename($tempPath, $targetPath)) {
            @unlink($tempPath);
            throw new \RuntimeException('IO_ERROR: Failed to swap temporary file to target path.');
        }

        return $targetPath;
    }
}
