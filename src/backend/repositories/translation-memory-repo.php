<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Repositories;

use PDO;

final class TranslationMemoryRepo
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Calcula la suma de verificación SHA-256 canónica del texto original normalizado.
     */
    public static function computeHash(string $sourceText): string
    {
        $normalized = trim(str_replace(["\r\n", "\r"], "\n", $sourceText));
        return hash('sha256', $normalized);
    }

    /**
     * Almacena o incrementa el uso de un par de traducción en la Memoria de Traducción.
     */
    public function storeTranslation(string $sourceText, string $translatedText, string $contextTag = 'GENERAL', bool $verified = false): int
    {
        $hash = self::computeHash($sourceText);
        $driver = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'sqlite') {
            $sql = "INSERT INTO tbl_translation_memory (source_hash, source_text, translated_text, context_tag, usage_count, verified)
                    VALUES (:hash, :source, :trans, :context, 1, :verified)
                    ON CONFLICT(source_hash) DO UPDATE SET
                        translated_text = CASE WHEN :verified = 1 THEN excluded.translated_text ELSE tbl_translation_memory.translated_text END,
                        usage_count = tbl_translation_memory.usage_count + 1,
                        verified = MAX(tbl_translation_memory.verified, excluded.verified)";
        } else {
            $sql = "INSERT INTO tbl_translation_memory (source_hash, source_text, translated_text, context_tag, usage_count, verified)
                    VALUES (:hash, :source, :trans, :context, 1, :verified)
                    ON DUPLICATE KEY UPDATE
                        translated_text = IF(:verified = 1, VALUES(translated_text), translated_text),
                        usage_count = usage_count + 1,
                        verified = GREATEST(verified, VALUES(verified))";
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':hash' => $hash,
            ':source' => $sourceText,
            ':trans' => $translatedText,
            ':context' => $contextTag,
            ':verified' => $verified ? 1 : 0,
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    /**
     * Busca una coincidencia exacta (100% Match) por el hash del texto de origen.
     */
    public function lookupExact(string $sourceText): ?array
    {
        $hash = self::computeHash($sourceText);
        $stmt = $this->pdo->prepare("SELECT * FROM tbl_translation_memory WHERE source_hash = :hash");
        $stmt->execute([':hash' => $hash]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Autopropaga traducciones almacenadas en la TM sobre las cadenas pendientes de un proyecto.
     * Esto automatiza la traducción de miles de cadenas coincidentes entre juego base y mods.
     */
    public function autoPropagate(string $projectId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT entry_id, base_value 
            FROM tbl_string_entries 
            WHERE project_id = :project_id AND (status = 'UNTRANSLATED' OR status = 'PENDING' OR translated_value IS NULL)
        ");
        $stmt->execute([':project_id' => $projectId]);
        $untranslated = $stmt->fetchAll();

        $propagatedCount = 0;
        $updateStmt = $this->pdo->prepare("
            UPDATE tbl_string_entries 
            SET translated_value = :trans, status = 'TRANSLATED'
            WHERE entry_id = :id
        ");

        $this->pdo->beginTransaction();
        try {
            foreach ($untranslated as $row) {
                $match = $this->lookupExact($row['base_value']);
                if ($match !== null) {
                    $updateStmt->execute([
                        ':trans' => $match['translated_text'],
                        ':id' => $row['entry_id'],
                    ]);
                    $propagatedCount++;
                }
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return [
            'totalEvaluated' => count($untranslated),
            'propagatedCount' => $propagatedCount,
            'remainingPending' => count($untranslated) - $propagatedCount,
        ];
    }

    /**
     * Retorna métricas cuantitativas reales del banco relacional de memoria de traducción.
     */
    public function getStats(): array
    {
        $stmt = $this->pdo->query("
            SELECT COUNT(*) as total_segments,
                   COALESCE(SUM(usage_count), 0) as total_reuses,
                   COALESCE(SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END), 0) as verified_count
            FROM tbl_translation_memory
        ");
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        $recentStmt = $this->pdo->query("
            SELECT tm_id, source_text, translated_text, context_tag, usage_count, verified, created_at
            FROM tbl_translation_memory
            ORDER BY tm_id DESC
            LIMIT 15
        ");
        $recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return [
            'total_segments' => (int)($res['total_segments'] ?? 0),
            'total_reuses' => (int)($res['total_reuses'] ?? 0),
            'verified_count' => (int)($res['verified_count'] ?? 0),
            'recent' => $recent,
        ];
    }

    /**
     * Búsqueda difusa o parcial de concordancias en la memoria de traducción.
     */
    public function search(string $query, int $limit = 20): array
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM tbl_translation_memory 
            WHERE source_text LIKE :q OR translated_text LIKE :q 
            ORDER BY usage_count DESC 
            LIMIT :limit
        ");
        $stmt->bindValue(':q', '%' . $query . '%');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
