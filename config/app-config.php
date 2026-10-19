<?php
declare(strict_types=1);

namespace SolarisNexus\Config;

use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;

final class AppConfig
{
    private static ?array $config = null;

    /**
     * Carga y valida estrictamente las variables de configuración (Fail-Fast).
     */
    public static function load(?string $rootPath = null): array
    {
        if (self::$config !== null) {
            return self::$config;
        }

        $baseDir = $rootPath ?? dirname(__DIR__);
        $envFile = $baseDir . DIRECTORY_SEPARATOR . '.env';

        if (!file_exists($envFile)) {
            $uuid = UuidGenerator::v4();
            $errorMsg = sprintf('[%s] CONFIGURATION_ERROR: Critical .env file missing in project root.', $uuid);
            error_log($errorMsg);
            throw new \RuntimeException($errorMsg);
        }

        $envData = self::parseEnvFile($envFile);

        // Validación Fail-Fast de variables requeridas
        $requiredKeys = ['APP_ENV', 'DB_CONNECTION', 'SINS_INSTALL_PATH', 'LOG_DIR'];
        $missing = [];

        foreach ($requiredKeys as $key) {
            if (!isset($envData[$key]) || trim((string)$envData[$key]) === '') {
                $missing[] = $key;
            }
        }

        if (!empty($missing)) {
            $uuid = UuidGenerator::v4();
            $errorMsg = sprintf(
                '[%s] CONFIGURATION_ERROR: Missing required environment variables: %s',
                $uuid,
                implode(', ', $missing)
            );
            error_log($errorMsg);
            throw new \RuntimeException($errorMsg);
        }

        self::$config = [
            'app_name' => 'Solaris Nexus Studio',
            'company' => 'Clepces org. ltd',
            'version' => '0.2.0.0-alpha',
            'env' => $envData['APP_ENV'] ?? 'development',
            'debug' => filter_var($envData['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'url' => rtrim($envData['APP_URL'] ?? 'http://localhost', '/'),
            'database' => [
                'connection' => $envData['DB_CONNECTION'] ?? 'sqlite',
                'database' => $baseDir . DIRECTORY_SEPARATOR . ($envData['DB_DATABASE'] ?? 'storage/database.sqlite'),
                'host' => $envData['DB_HOST'] ?? '127.0.0.1',
                'port' => (int)($envData['DB_PORT'] ?? 3306),
                'name' => $envData['DB_NAME'] ?? 'solaris_nexus',
                'user' => $envData['DB_USER'] ?? 'root',
                'pass' => $envData['DB_PASS'] ?? '',
            ],
            'sins' => [
                'install_path' => $envData['SINS_INSTALL_PATH'],
                'mods_path' => $envData['SINS_MODS_PATH'] ?? '',
                'exe_name' => 'Sins of a Solar Empire Rebellion.exe',
                'convert_data_cli' => 'ConvertData_Rebellion.exe',
            ],
            'logging' => [
                'level' => $envData['LOG_LEVEL'] ?? 'info',
                'dir' => $baseDir . DIRECTORY_SEPARATOR . ($envData['LOG_DIR'] ?? 'storage/logs'),
            ],
            'paths' => [
                'root' => $baseDir,
                'storage' => $baseDir . DIRECTORY_SEPARATOR . 'storage',
                'cache' => $baseDir . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'cache',
                'backups' => $baseDir . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'backups',
            ],
        ];

        return self::$config;
    }

    /**
     * Parsea un archivo .env sin dependencias externas.
     */
    private static function parseEnvFile(string $filePath): array
    {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return [];
        }

        $data = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $val = trim($parts[1]);
                // Eliminar comillas delimitadoras si existen
                if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                    (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                    $val = substr($val, 1, -1);
                }
                $data[$key] = $val;
            }
        }

        return $data;
    }
}
