<?php
declare(strict_types=1);

namespace SolarisNexus\Config;

use PDO;
use PDOException;
use SolarisNexus\Backend\Utils\LoggerService;

final class DatabaseConfig
{
    private static ?PDO $pdo = null;

    /**
     * Obtiene una conexión PDO única garantizando Prepared Statements por defecto.
     */
    public static function getConnection(?array $config = null): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $cfg = $config ?? AppConfig::load();
        $dbCfg = $cfg['database'];
        $logger = new LoggerService($cfg['logging']['dir']);

        try {
            if ($dbCfg['connection'] === 'sqlite') {
                $dir = dirname($dbCfg['database']);
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                }
                $dsn = 'sqlite:' . $dbCfg['database'];
                self::$pdo = new PDO($dsn, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                self::$pdo->exec('PRAGMA foreign_keys = ON;');
            } else {
                $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                    $dbCfg['host'],
                    $dbCfg['port'],
                    $dbCfg['name']
                );
                self::$pdo = new PDO($dsn, $dbCfg['user'], $dbCfg['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            }

            return self::$pdo;
        } catch (PDOException $e) {
            $uuid = $logger->critical('DATABASE_CONNECTION_FAILURE: Unable to initialize PDO instance.', $e);
            throw new \RuntimeException(sprintf('[%s] Database connection failed. Consult audit log.', $uuid));
        }
    }
}
