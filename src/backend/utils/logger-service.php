<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

final class LoggerService
{
    private string $logDirectory;
    private string $basePath;

    public function __construct(?string $logDirectory = null)
    {
        $this->basePath = dirname(__DIR__, 3);
        $this->logDirectory = $logDirectory ?? ($this->basePath . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'logs');

        if (!is_dir($this->logDirectory)) {
            @mkdir($this->logDirectory, 0755, true);
        }
    }

    /**
     * Registra un evento informativo.
     */
    public function info(string $message, array $context = []): void
    {
        $this->write('INFO', $message, $context);
    }

    /**
     * Registra una advertencia del sistema.
     */
    public function warning(string $message, array $context = []): void
    {
        $this->write('WARNING', $message, $context);
    }

    /**
     * Registra un error garantizando el protocolo de Cero Stack Traces (UUID Safety).
     * Devuelve el UUID generado para correlación en la respuesta del cliente.
     */
    public function error(string $message, ?\Throwable $exception = null, array $context = []): string
    {
        $errorUuid = UuidGenerator::v4();
        $payload = array_merge($context, ['error_uuid' => $errorUuid]);

        if ($exception !== null) {
            $payload['exception_class'] = get_class($exception);
            $payload['exception_message'] = $exception->getMessage();
            $payload['sanitized_trace'] = $this->sanitizePath($exception->getTraceAsString());
            $payload['file'] = $this->sanitizePath($exception->getFile());
            $payload['line'] = $exception->getLine();
        }

        $this->write('ERROR', $message, $payload);
        return $errorUuid;
    }

    /**
     * Registra un fallo crítico del sistema.
     */
    public function critical(string $message, ?\Throwable $exception = null, array $context = []): string
    {
        $errorUuid = UuidGenerator::v4();
        $payload = array_merge($context, ['error_uuid' => $errorUuid]);

        if ($exception !== null) {
            $payload['exception_class'] = get_class($exception);
            $payload['exception_message'] = $exception->getMessage();
            $payload['sanitized_trace'] = $this->sanitizePath($exception->getTraceAsString());
        }

        $this->write('CRITICAL', $message, $payload);
        return $errorUuid;
    }

    /**
     * Sanitiza rutas de disco para cumplir con la mitigación de escape y zero stack trace.
     */
    public function sanitizePath(string $rawText): string
    {
        $normalizedBase = str_replace('\\', '/', $this->basePath);
        $normalizedText = str_replace('\\', '/', $rawText);
        return str_replace($normalizedBase, '[APP_ROOT]', $normalizedText);
    }

    /**
     * Escritura atómica en el archivo de log rotativo diario.
     */
    private function write(string $level, string $message, array $context): void
    {
        $timestamp = (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP');
        $logFile = $this->logDirectory . DIRECTORY_SEPARATOR . 'nexus-' . date('Y-m-d') . '.log';

        $entry = sprintf(
            "[%s] [%s] %s %s%s",
            $timestamp,
            $level,
            $this->sanitizePath($message),
            !empty($context) ? json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : '',
            PHP_EOL
        );

        @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    }
}
