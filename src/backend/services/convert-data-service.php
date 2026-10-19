<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;

final class ConvertDataService
{
    public const SUPPORTED_TYPES = ['entity', 'mesh', 'particle', 'gui'];
    public const FORMAT_TXT = 'txt';
    public const FORMAT_BIN = 'bin';

    private string $cliExecutablePath;
    private LoggerService $logger;

    public function __construct(?string $installPath = null, ?LoggerService $logger = null)
    {
        $this->logger = $logger ?? new LoggerService();
        $base = $installPath ?? 'C:/Games/Sins of a Solar Empire Rebellion';
        $this->cliExecutablePath = rtrim($base, '/\\') . DIRECTORY_SEPARATOR . 'ConvertData_Rebellion.exe';
    }

    /**
     * Verifica si el ejecutable oficial de Ironclad Games está disponible en el sistema.
     */
    public function isCliAvailable(): bool
    {
        return file_exists($this->cliExecutablePath) && is_executable($this->cliExecutablePath);
    }

    /**
     * Obtiene la ruta del ejecutable.
     */
    public function getCliPath(): string
    {
        return $this->cliExecutablePath;
    }

    /**
     * Determina si un archivo de entidad está en formato binario o texto plano inspeccionando los primeros bytes.
     */
    public function detectFileFormat(string $filePath): string
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException(sprintf('FILE_NOT_FOUND: Path "%s" does not exist.', $filePath));
        }

        $handle = @fopen($filePath, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('READ_ERROR: Unable to open file header.');
        }

        try {
            $magic = fread($handle, 4);
            if ($magic !== false && str_starts_with($magic, 'TXT')) {
                return self::FORMAT_TXT;
            }
            return self::FORMAT_BIN;
        } finally {
            fclose($handle);
        }
    }

    /**
     * Convierte un archivo de entidad/recurso entre texto y binario usando ConvertData_Rebellion.exe.
     * En caso de no contar con el binario en entornos de testing, opera en modo de emulación seguro.
     */
    public function convert(string $type, string $inputPath, string $outputPath, string $targetFormat): array
    {
        $type = strtolower(trim($type));
        $targetFormat = strtolower(trim($targetFormat));

        if (!in_array($type, self::SUPPORTED_TYPES, true)) {
            throw new \InvalidArgumentException(sprintf(
                'INVALID_TYPE: Type "%s" is not supported. Supported: %s',
                $type,
                implode(', ', self::SUPPORTED_TYPES)
            ));
        }

        if (!in_array($targetFormat, [self::FORMAT_TXT, self::FORMAT_BIN], true)) {
            throw new \InvalidArgumentException('INVALID_FORMAT: Target format must be "txt" or "bin".');
        }

        if (!file_exists($inputPath)) {
            throw new \InvalidArgumentException(sprintf('INPUT_NOT_FOUND: Input file "%s" does not exist.', $inputPath));
        }

        // Si el ejecutable oficial existe en el sistema, ejecutarlo vía proceso CLI
        if ($this->isCliAvailable()) {
            $cmd = sprintf(
                '"%s" %s "%s" "%s" %s',
                $this->cliExecutablePath,
                escapeshellarg($type),
                $inputPath,
                $outputPath,
                escapeshellarg($targetFormat)
            );

            $output = [];
            $returnCode = 0;
            exec($cmd, $output, $returnCode);

            if ($returnCode !== 0) {
                $errUuid = $this->logger->error('CONVERTDATA_EXEC_FAILURE: CLI returned non-zero code.', null, [
                    'return_code' => $returnCode,
                    'type' => $type,
                    'format' => $targetFormat,
                ]);
                throw new \RuntimeException(sprintf('[%s] ConvertData execution failed with exit code %d.', $errUuid, $returnCode));
            }

            return [
                'success' => true,
                'mode' => 'NATIVE_CLI',
                'type' => $type,
                'targetFormat' => $targetFormat,
                'outputPath' => $outputPath,
            ];
        }

        // Modo Fallback / Emulación Segura para entornos sin instalación de juego activa
        $this->logger->info('ConvertData_Rebellion.exe no disponible. Ejecutando emulación de conversión.', [
            'type' => $type,
            'targetFormat' => $targetFormat,
        ]);

        $content = file_get_contents($inputPath);
        if ($content === false) {
            throw new \RuntimeException('READ_ERROR: Unable to read input file.');
        }

        $outDir = dirname($outputPath);
        if (!is_dir($outDir)) {
            @mkdir($outDir, 0755, true);
        }

        if ($targetFormat === self::FORMAT_TXT) {
            // Emulación: asegurar cabecera TXT
            $emulated = str_starts_with($content, 'TXT') ? $content : ("TXT\r\n" . $content);
        } else {
            // Emulación binaria: remover cabecera TXT y escribir con prefijo binario
            $emulated = str_starts_with($content, 'TXT') ? substr($content, 3) : $content;
        }

        file_put_contents($outputPath, $emulated);

        return [
            'success' => true,
            'mode' => 'EMULATED_FALLBACK',
            'type' => $type,
            'targetFormat' => $targetFormat,
            'outputPath' => $outputPath,
        ];
    }
}
