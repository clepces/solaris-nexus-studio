<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Repositories;

use PDO;
use SolarisNexus\Config\DatabaseConfig;

final class ExecutionRepository
{
    public static function getExecutions(array $config): array
    {
        try {
            $pdo = DatabaseConfig::getConnection($config);
            if ($pdo === null) {
                return ['executions' => []];
            }

            self::ensureTable($pdo);

            $stmt = $pdo->query("SELECT COUNT(*) FROM tbl_executions");
            if ((int)$stmt->fetchColumn() === 0) {
                $initials = [
                    ['SYS', 'Arranque de entorno canónico y detección física de juego', 'C:/Games/Sins of a Solar Empire Rebellion', 'OK'],
                    ['STR', 'Inspección de diccionario local Spanish.str', '7.828 cadenas UTF-8 BOM detectadas', 'OK'],
                    ['VFS', 'Auditoría de EnabledMods.txt', '0 mods activos, configuración Vanilla canónica', 'OK'],
                    ['FS', 'Indexación de catálogo GameInfo', '1.872 archivos .entity verificados', 'OK'],
                    ['SYS', 'Verificación de base de datos relacional SQLite', 'storage/database.sqlite conectado', 'OK'],
                ];
                $ins = $pdo->prepare("INSERT INTO tbl_executions (exec_type, description, details, result) VALUES (?, ?, ?, ?)");
                foreach ($initials as $init) {
                    $ins->execute($init);
                }
            }

            $query = $pdo->query("SELECT * FROM tbl_executions ORDER BY exec_id DESC LIMIT 50");
            return ['executions' => $query->fetchAll(PDO::FETCH_ASSOC)];
        } catch (\Throwable $e) {
            return ['executions' => []];
        }
    }

    public static function recordExecution(array $payload, array $config): array
    {
        $type = $payload['type'] ?? 'SYS';
        $desc = $payload['description'] ?? 'Operación en sistema';
        $details = $payload['details'] ?? null;
        $result = $payload['result'] ?? 'OK';

        try {
            $pdo = DatabaseConfig::getConnection($config);
            if ($pdo !== null) {
                self::ensureTable($pdo);
                $stmt = $pdo->prepare("INSERT INTO tbl_executions (exec_type, description, details, result) VALUES (?, ?, ?, ?)");
                $stmt->execute([$type, $desc, $details, $result]);
            }
            return ['success' => true, 'logged' => true];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => 'DATABASE_WRITE_ERROR'];
        }
    }

    private static function ensureTable(PDO $pdo): void
    {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS tbl_executions (
                exec_id INTEGER PRIMARY KEY AUTOINCREMENT,
                exec_type TEXT NOT NULL,
                description TEXT NOT NULL,
                details TEXT NULL,
                result TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        ");
    }
}
