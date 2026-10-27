<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Repositories;

use PDO;

final class ProjectRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Registra o actualiza un proyecto en tbl_projects.
     */
    public function saveProject(array $projectData): bool
    {
        $sql = "INSERT INTO tbl_projects (project_id, name, version, base_file_path, target_file_path, total_strings)
                VALUES (:id, :name, :version, :base_path, :target_path, :total_strings)
                ON CONFLICT(project_id) DO UPDATE SET
                    name = excluded.name,
                    version = excluded.version,
                    base_file_path = excluded.base_file_path,
                    target_file_path = excluded.target_file_path,
                    total_strings = excluded.total_strings,
                    updated_at = CURRENT_TIMESTAMP";

        // Compatibilidad MySQL / SQLite
        $driver = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver !== 'sqlite') {
            $sql = "INSERT INTO tbl_projects (project_id, name, version, base_file_path, target_file_path, total_strings)
                    VALUES (:id, :name, :version, :base_path, :target_path, :total_strings)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        version = VALUES(version),
                        base_file_path = VALUES(base_file_path),
                        target_file_path = VALUES(target_file_path),
                        total_strings = VALUES(total_strings),
                        updated_at = CURRENT_TIMESTAMP";
        }

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':id' => $projectData['project_id'],
            ':name' => $projectData['name'],
            ':version' => $projectData['version'],
            ':base_path' => $projectData['base_file_path'] ?? '',
            ':target_path' => $projectData['target_file_path'] ?? '',
            ':total_strings' => (int)($projectData['total_strings'] ?? 0),
        ]);
    }

    /**
     * Obtiene los metadatos de un proyecto.
     */
    public function getProject(string $projectId): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM tbl_projects WHERE project_id = :id");
        $stmt->execute([':id' => $projectId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Lista todos los proyectos con métricas agregadas reales de SQLite3.
     */
    public function listProjects(): array
    {
        $stmt = $this->pdo->query("
            SELECT p.*,
                   COUNT(e.entry_id) as total_entries,
                   COALESCE(SUM(CASE WHEN e.status = 'TRANSLATED' THEN 1 ELSE 0 END), 0) as translated_count,
                   COALESCE(SUM(CASE WHEN e.has_tokens = 1 THEN 1 ELSE 0 END), 0) as tokens_count
            FROM tbl_projects p
            LEFT JOIN tbl_string_entries e ON p.project_id = e.project_id
            GROUP BY p.project_id
            ORDER BY p.updated_at DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Inserción por lotes de cadenas en tbl_string_entries dentro de una transacción única.
     */
    public function batchInsertEntries(string $projectId, array $entries): int
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO tbl_string_entries (project_id, str_key, base_value, translated_value, status, file_index, has_tokens)
                VALUES (:project_id, :str_key, :base_value, :translated_value, :status, :file_index, :has_tokens)
            ");

            $count = 0;
            foreach ($entries as $index => $e) {
                $hasTokens = (int)(preg_match('/\[VALUE\d*\]|%s|%d|%f|\{\d+\}/', $e['value']) === 1);
                $stmt->execute([
                    ':project_id' => $projectId,
                    ':str_key' => $e['id'],
                    ':base_value' => $e['value'],
                    ':translated_value' => $e['translated'] ?? null,
                    ':status' => !empty($e['translated']) ? 'TRANSLATED' : 'UNTRANSLATED',
                    ':file_index' => $index,
                    ':has_tokens' => $hasTokens,
                ]);
                $count++;
            }

            $this->pdo->commit();
            return $count;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Actualiza la traducción y estado de una cadena individual.
     */
    public function updateStringTranslation(string $projectId, string $key, string $translatedValue, string $status = 'TRANSLATED'): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE tbl_string_entries 
            SET translated_value = :val, status = :status
            WHERE project_id = :project_id AND str_key = :str_key
        ");
        return $stmt->execute([
            ':val' => $translatedValue,
            ':status' => $status,
            ':project_id' => $projectId,
            ':str_key' => $key,
        ]);
    }

    /**
     * Consulta cadenas de un proyecto con paginación y filtro opcional por estado.
     */
    public function getStrings(string $projectId, int $limit = 100, int $offset = 0, ?string $status = null): array
    {
        $sql = "SELECT * FROM tbl_string_entries WHERE project_id = :project_id";
        $params = [':project_id' => $projectId];

        if ($status !== null) {
            $sql .= " AND status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY file_index ASC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Elimina un proyecto y todas sus entradas asociadas de tbl_string_entries dentro de una transacción.
     */
    public function deleteProject(string $projectId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $stmtEntries = $this->pdo->prepare("DELETE FROM tbl_string_entries WHERE project_id = :id");
            $stmtEntries->execute([':id' => $projectId]);

            $stmtProj = $this->pdo->prepare("DELETE FROM tbl_projects WHERE project_id = :id");
            $res = $stmtProj->execute([':id' => $projectId]);

            $this->pdo->commit();
            return $res;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
