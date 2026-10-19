<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Repositories;

use PDO;

final class ModRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Registra o actualiza un mod en el catálogo central.
     */
    public function saveMod(array $mod): bool
    {
        $sql = "INSERT INTO tbl_mod_catalog (mod_id, folder_name, display_name, category, default_priority, estimated_ram_mb, has_strings)
                VALUES (:id, :folder, :name, :cat, :pri, :ram, :has_str)
                ON CONFLICT(mod_id) DO UPDATE SET
                    display_name = excluded.display_name,
                    category = excluded.category,
                    default_priority = excluded.default_priority,
                    estimated_ram_mb = excluded.estimated_ram_mb,
                    has_strings = excluded.has_strings";

        $driver = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver !== 'sqlite') {
            $sql = "INSERT INTO tbl_mod_catalog (mod_id, folder_name, display_name, category, default_priority, estimated_ram_mb, has_strings)
                    VALUES (:id, :folder, :name, :cat, :pri, :ram, :has_str)
                    ON DUPLICATE KEY UPDATE
                        display_name = VALUES(display_name),
                        category = VALUES(category),
                        default_priority = VALUES(default_priority),
                        estimated_ram_mb = VALUES(estimated_ram_mb),
                        has_strings = VALUES(has_strings)";
        }

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':id' => $mod['mod_id'],
            ':folder' => $mod['folder_name'],
            ':name' => $mod['display_name'],
            ':cat' => $mod['category'] ?? 'GAMEPLAY_MINIMOD',
            ':pri' => (int)($mod['default_priority'] ?? 10),
            ':ram' => (int)($mod['estimated_ram_mb'] ?? 100),
            ':has_str' => !empty($mod['has_strings']) ? 1 : 0,
        ]);
    }

    /**
     * Obtiene el catálogo completo de mods registrados.
     */
    public function getCatalog(): array
    {
        $stmt = $this->pdo->query("SELECT * FROM tbl_mod_catalog ORDER BY default_priority DESC");
        return $stmt->fetchAll();
    }

    /**
     * Registra una incompatibilidad conocida entre dos mods de forma idempotente.
     */
    public function declareIncompatibility(string $modId, string $incompatibleModId, string $reason): bool
    {
        $driver = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $sql = "INSERT INTO tbl_mod_incompatibilities (mod_id, incompatible_mod_id, conflict_reason)
                    VALUES (:m1, :m2, :reason)
                    ON CONFLICT(mod_id, incompatible_mod_id) DO UPDATE SET conflict_reason = excluded.conflict_reason";
        } else {
            $sql = "INSERT INTO tbl_mod_incompatibilities (mod_id, incompatible_mod_id, conflict_reason)
                    VALUES (:m1, :m2, :reason)
                    ON DUPLICATE KEY UPDATE conflict_reason = VALUES(conflict_reason)";
        }

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':m1' => $modId,
            ':m2' => $incompatibleModId,
            ':reason' => $reason,
        ]);
    }

    /**
     * Consulta incompatibilidades para una lista de mods seleccionados.
     */
    public function findConflicts(array $activeModIds): array
    {
        if (empty($activeModIds)) {
            return [];
        }

        $inClause = implode(',', array_fill(0, count($activeModIds), '?'));
        $sql = "SELECT * FROM tbl_mod_incompatibilities 
                WHERE mod_id IN ($inClause) AND incompatible_mod_id IN ($inClause)";

        $stmt = $this->pdo->prepare($sql);
        // Doble paso de parámetros para ambas cláusulas IN
        $params = array_merge($activeModIds, $activeModIds);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
