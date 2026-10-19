<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use PDO;
use SolarisNexus\Backend\Utils\LoggerService;

final class DatabaseMigrator
{
    private PDO $pdo;
    private LoggerService $logger;

    public function __construct(PDO $pdo, ?LoggerService $logger = null)
    {
        $this->pdo = $pdo;
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Ejecuta las migraciones DDL idempotentes para SQLite o MySQL.
     * Regla 12: Idempotencia en automatizaciones.
     */
    public function migrate(): array
    {
        $driver = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $executed = [];

        if ($driver === 'sqlite') {
            $executed = $this->migrateSqlite();
        } else {
            $executed = $this->migrateMysql();
        }

        $this->logger->info('Migración de base de datos relacional completada.', [
            'driver' => $driver,
            'tables_count' => count($executed),
        ]);

        return [
            'success' => true,
            'driver' => $driver,
            'tables' => $executed,
        ];
    }

    private function migrateSqlite(): array
    {
        $ddl = [
            'tbl_projects' => "
                CREATE TABLE IF NOT EXISTS tbl_projects (
                    project_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL,
                    base_file_path TEXT NOT NULL,
                    target_file_path TEXT NOT NULL,
                    total_strings INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ",
            'tbl_string_entries' => "
                CREATE TABLE IF NOT EXISTS tbl_string_entries (
                    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    str_key TEXT NOT NULL,
                    base_value TEXT NOT NULL,
                    translated_value TEXT NULL,
                    status TEXT DEFAULT 'PENDING',
                    file_index INTEGER NOT NULL,
                    has_tokens INTEGER DEFAULT 0,
                    token_metadata TEXT NULL,
                    FOREIGN KEY (project_id) REFERENCES tbl_projects(project_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_str_project_key ON tbl_string_entries(project_id, str_key);
                CREATE INDEX IF NOT EXISTS idx_str_status ON tbl_string_entries(status);
            ",
            'tbl_translation_memory' => "
                CREATE TABLE IF NOT EXISTS tbl_translation_memory (
                    tm_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_hash TEXT NOT NULL UNIQUE,
                    source_text TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    context_tag TEXT DEFAULT 'GENERAL',
                    usage_count INTEGER DEFAULT 1,
                    verified INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_tm_source_hash ON tbl_translation_memory(source_hash);
            ",
            'tbl_mod_catalog' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_catalog (
                    mod_id TEXT PRIMARY KEY,
                    folder_name TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    default_priority INTEGER NOT NULL DEFAULT 10,
                    estimated_ram_mb INTEGER NOT NULL DEFAULT 150,
                    has_strings INTEGER DEFAULT 0,
                    detected_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ",
            'tbl_mod_incompatibilities' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_incompatibilities (
                    conflict_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mod_id TEXT NOT NULL,
                    incompatible_mod_id TEXT NOT NULL,
                    conflict_reason TEXT NOT NULL,
                    FOREIGN KEY (mod_id) REFERENCES tbl_mod_catalog(mod_id) ON DELETE CASCADE,
                    UNIQUE (mod_id, incompatible_mod_id)
                );
            ",
            'tbl_mod_profiles' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_profiles (
                    profile_id TEXT PRIMARY KEY,
                    profile_name TEXT NOT NULL,
                    description TEXT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ",
            'tbl_profile_items' => "
                CREATE TABLE IF NOT EXISTS tbl_profile_items (
                    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id TEXT NOT NULL,
                    mod_id TEXT NOT NULL,
                    priority_order INTEGER NOT NULL,
                    FOREIGN KEY (profile_id) REFERENCES tbl_mod_profiles(profile_id) ON DELETE CASCADE,
                    FOREIGN KEY (mod_id) REFERENCES tbl_mod_catalog(mod_id) ON DELETE CASCADE
                );
            ",
            'tbl_audit_logs' => "
                CREATE TABLE IF NOT EXISTS tbl_audit_logs (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    error_uuid TEXT NOT NULL UNIQUE,
                    event_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    technical_stack TEXT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_audit_uuid ON tbl_audit_logs(error_uuid);
            ",
        ];

        $tables = [];
        foreach ($ddl as $tableName => $sql) {
            $this->pdo->exec($sql);
            $tables[] = $tableName;
        }

        return $tables;
    }

    private function migrateMysql(): array
    {
        $ddl = [
            'tbl_projects' => "
                CREATE TABLE IF NOT EXISTS tbl_projects (
                    project_id VARCHAR(64) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    version VARCHAR(32) NOT NULL,
                    base_file_path VARCHAR(512) NOT NULL,
                    target_file_path VARCHAR(512) NOT NULL,
                    total_strings INT UNSIGNED NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_string_entries' => "
                CREATE TABLE IF NOT EXISTS tbl_string_entries (
                    entry_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    project_id VARCHAR(64) NOT NULL,
                    str_key VARCHAR(191) NOT NULL,
                    base_value MEDIUMTEXT NOT NULL,
                    translated_value MEDIUMTEXT NULL,
                    status ENUM('TRANSLATED', 'UNTRANSLATED', 'PENDING', 'PROTECTED', 'ERROR') DEFAULT 'PENDING',
                    file_index INT UNSIGNED NOT NULL,
                    has_tokens BOOLEAN DEFAULT FALSE,
                    token_metadata JSON NULL,
                    FOREIGN KEY (project_id) REFERENCES tbl_projects(project_id) ON DELETE CASCADE,
                    INDEX idx_project_key (project_id, str_key),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_translation_memory' => "
                CREATE TABLE IF NOT EXISTS tbl_translation_memory (
                    tm_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    source_hash CHAR(64) NOT NULL UNIQUE,
                    source_text MEDIUMTEXT NOT NULL,
                    translated_text MEDIUMTEXT NOT NULL,
                    context_tag VARCHAR(64) DEFAULT 'GENERAL',
                    usage_count INT UNSIGNED DEFAULT 1,
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_source_hash (source_hash)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_mod_catalog' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_catalog (
                    mod_id VARCHAR(64) PRIMARY KEY,
                    folder_name VARCHAR(255) NOT NULL,
                    display_name VARCHAR(255) NOT NULL,
                    category ENUM('TOTAL_CONVERSION', 'OVERHAUL', 'GAMEPLAY_MINIMOD', 'GRAPHICS', 'TRANSLATION_PATCH') NOT NULL,
                    default_priority INT NOT NULL DEFAULT 10,
                    estimated_ram_mb INT UNSIGNED NOT NULL DEFAULT 150,
                    has_strings BOOLEAN DEFAULT FALSE,
                    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_mod_incompatibilities' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_incompatibilities (
                    conflict_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    mod_id VARCHAR(64) NOT NULL,
                    incompatible_mod_id VARCHAR(64) NOT NULL,
                    conflict_reason TEXT NOT NULL,
                    FOREIGN KEY (mod_id) REFERENCES tbl_mod_catalog(mod_id) ON DELETE CASCADE,
                    UNIQUE KEY uk_conflict_pair (mod_id, incompatible_mod_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_mod_profiles' => "
                CREATE TABLE IF NOT EXISTS tbl_mod_profiles (
                    profile_id VARCHAR(64) PRIMARY KEY,
                    profile_name VARCHAR(128) NOT NULL,
                    description TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_profile_items' => "
                CREATE TABLE IF NOT EXISTS tbl_profile_items (
                    item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    profile_id VARCHAR(64) NOT NULL,
                    mod_id VARCHAR(64) NOT NULL,
                    priority_order INT NOT NULL,
                    FOREIGN KEY (profile_id) REFERENCES tbl_mod_profiles(profile_id) ON DELETE CASCADE,
                    FOREIGN KEY (mod_id) REFERENCES tbl_mod_catalog(mod_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            'tbl_audit_logs' => "
                CREATE TABLE IF NOT EXISTS tbl_audit_logs (
                    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    error_uuid CHAR(36) NOT NULL UNIQUE,
                    event_type VARCHAR(64) NOT NULL,
                    message TEXT NOT NULL,
                    technical_stack MEDIUMTEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_uuid (error_uuid)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
        ];

        $tables = [];
        foreach ($ddl as $tableName => $sql) {
            $this->pdo->exec($sql);
            $tables[] = $tableName;
        }

        return $tables;
    }
}
