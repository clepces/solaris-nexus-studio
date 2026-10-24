<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Controllers;

use PDO;
use SolarisNexus\Backend\Repositories\ProjectRepository;
use SolarisNexus\Backend\Repositories\TranslationMemoryRepo;
use SolarisNexus\Backend\Services\StrParserService;
use SolarisNexus\Backend\Services\LinterService;
use SolarisNexus\Backend\Services\TokenGuardService;
use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;
use SolarisNexus\Config\DatabaseConfig;

final class StringController
{
    private StrParserService $parser;
    private LinterService $linter;
    private LoggerService $logger;

    public function __construct(
        ?StrParserService $parser = null,
        ?LinterService $linter = null,
        ?LoggerService $logger = null
    ) {
        $this->parser = $parser ?? new StrParserService();
        $this->linter = $linter ?? new LinterService();
        $this->logger = $logger ?? new LoggerService();
    }

    private function getPdo(array $config): PDO
    {
        return DatabaseConfig::getConnection($config);
    }

    /**
     * Parsea un archivo de cadenas enviado o indicado por ruta.
     */
    public function parse(array $payload): array
    {
        if (isset($payload['raw_content']) && is_string($payload['raw_content'])) {
            return $this->parser->parseContent($payload['raw_content']);
        }

        if (isset($payload['file_path']) && is_string($payload['file_path'])) {
            return $this->parser->parseFile($payload['file_path']);
        }

        throw new \InvalidArgumentException('INVALID_PAYLOAD: "raw_content" or "file_path" must be provided.');
    }

    /**
     * Valida una traducción individual con Token Guard y Linter.
     */
    public function validateEntry(array $payload): array
    {
        $id = $payload['id'] ?? '';
        $original = $payload['original'] ?? '';
        $translated = $payload['translated'] ?? '';

        $issues = $this->linter->lintStringValue($id, $original, $translated);
        $expansion = $this->linter->checkTextExpansionRisk($original, $translated);

        return [
            'isValid' => empty(array_filter($issues, static fn($i) => $i['severity'] === 'CRITICAL')),
            'expansionRisk' => $expansion,
            'issues' => $issues,
        ];
    }

    /**
     * Serializa un conjunto de cadenas a formato canónico .str con BOM UTF-8 y CRLF.
     */
    public function export(array $payload): array
    {
        $entries = $payload['entries'] ?? null;
        if (!is_array($entries)) {
            throw new \InvalidArgumentException('INVALID_PAYLOAD: "entries" array is required.');
        }

        $serialized = ByteBufferHelper::UTF8_BOM . $this->parser->serialize($entries);

        return [
            'numStrings' => count($entries),
            'content' => $serialized,
            'sizeBytes' => strlen($serialized),
        ];
    }

    /**
     * Retorna el espacio de trabajo con proyectos .str reales de SQLite3 y disco.
     */
    public function workspace(array $config): array
    {
        $pdo = $this->getPdo($config);
        $repo = new ProjectRepository($pdo);
        $projects = $repo->listProjects();

        // Si la base de datos está vacía, inicializar proyectos canónicos con archivos reales
        if (empty($projects)) {
            $this->seedInitialProjects($repo, $config);
            $projects = $repo->listProjects();
        }

        // Escanear archivos .str adicionales en el sistema de archivos real (categorizado)
        $discoveredData = $this->scanFilesystemStrFiles($config);

        return [
            'success' => true,
            'projects' => $projects,
            'discovered_files' => $discoveredData,
            'total_projects' => count($projects),
            'database' => 'SQLite3 (storage/database.sqlite)',
        ];
    }

    /**
     * Retorna las cadenas de un proyecto con paginación y filtrado.
     */
    public function getProjectStrings(array $params, array $config): array
    {
        $projectId = (string)($params['project_id'] ?? '');
        $limit = max(1, min(500, (int)($params['limit'] ?? 100)));
        $offset = max(0, (int)($params['offset'] ?? 0));
        $status = isset($params['status']) && $params['status'] !== 'ALL' ? (string)$params['status'] : null;

        $pdo = $this->getPdo($config);
        $repo = new ProjectRepository($pdo);
        $project = $repo->getProject($projectId);

        if (!$project) {
            throw new \InvalidArgumentException('PROJECT_NOT_FOUND: Proyecto no registrado en SQLite.');
        }

        $strings = $repo->getStrings($projectId, $limit, $offset, $status);

        return [
            'success' => true,
            'project' => $project,
            'strings' => $strings,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'count' => count($strings),
                'total' => (int)$project['total_strings'],
            ],
        ];
    }

    /**
     * Guarda la traducción de una cadena en SQLite3 y en la Memoria de Traducción.
     */
    public function saveEntry(array $payload, array $config): array
    {
        $projectId = (string)($payload['project_id'] ?? '');
        $key = (string)($payload['key'] ?? '');
        $translated = (string)($payload['translated'] ?? '');
        $original = (string)($payload['original'] ?? '');

        if ($projectId === '' || $key === '') {
            throw new \InvalidArgumentException('Campos project_id y key son obligatorios.');
        }

        $pdo = $this->getPdo($config);
        $projectRepo = new ProjectRepository($pdo);
        $tmRepo = new TranslationMemoryRepo($pdo);

        // Actualizar en el proyecto
        $updated = $projectRepo->updateStringTranslation($projectId, $key, $translated, 'TRANSLATED');

        // Almacenar en la memoria de traducción compartida
        if ($original !== '' && $translated !== '') {
            $tmRepo->storeTranslation($original, $translated, 'PROJECT_' . $projectId, true);
        }

        return [
            'success' => $updated,
            'key' => $key,
            'translated' => $translated,
            'saved_at' => date('c'),
        ];
    }

    /**
     * Retorna estadísticas reales de la Memoria de Traducción (TM).
     */
    public function getTmStats(array $config): array
    {
        $pdo = $this->getPdo($config);
        $tmRepo = new TranslationMemoryRepo($pdo);

        return [
            'success' => true,
            'stats' => $tmRepo->getStats(),
        ];
    }

    /**
     * Búsqueda por coincidencia de segmentos en la Memoria de Traducción.
     */
    public function searchTm(array $payload, array $config): array
    {
        $query = (string)($payload['query'] ?? ($_GET['query'] ?? ''));
        $pdo = $this->getPdo($config);
        $tmRepo = new TranslationMemoryRepo($pdo);

        if (trim($query) === '') {
            $stats = $tmRepo->getStats();
            return [
                'success' => true,
                'items' => $stats['recent'] ?? [],
            ];
        }

        $items = $tmRepo->search($query, 30);
        return [
            'success' => true,
            'items' => $items,
        ];
    }

    /**
     * Busca una sugerencia exacta en la Memoria de Traducción.
     */
    public function suggestTm(array $payload, array $config): array
    {
        $text = (string)($payload['text'] ?? '');
        if ($text === '') {
            return ['found' => false, 'match' => null];
        }

        $pdo = $this->getPdo($config);
        $tmRepo = new TranslationMemoryRepo($pdo);
        $match = $tmRepo->lookupExact($text);

        return [
            'found' => $match !== null,
            'match' => $match,
        ];
    }

    /**
     * Autopropaga traducciones conocidas sobre las cadenas pendientes.
     */
    public function autoPropagate(array $payload, array $config): array
    {
        $projectId = (string)($payload['project_id'] ?? '');
        if ($projectId === '') {
            throw new \InvalidArgumentException('project_id es requerido.');
        }

        $pdo = $this->getPdo($config);
        $tmRepo = new TranslationMemoryRepo($pdo);
        $result = $tmRepo->autoPropagate($projectId);

        return [
            'success' => true,
            'result' => $result,
        ];
    }

    /**
     * Inicializa proyectos reales a partir de los fixtures existentes.
     */
    private function seedInitialProjects(ProjectRepository $repo, array $config): void
    {
        $fixturesDir = dirname(__DIR__, 3) . '/tests/fixtures';
        $sampleValid = $fixturesDir . '/sample-valid.str';

        if (file_exists($sampleValid)) {
            $parsed = $this->parser->parseFile($sampleValid);
            $repo->saveProject([
                'project_id' => 'sins-rebellion-core',
                'name' => 'Sins of a Solar Empire: Rebellion (Vanilla Base)',
                'version' => '1.85',
                'base_file_path' => 'Localizations/es/String/English.str',
                'target_file_path' => 'Localizations/es/String/Spanish.str',
                'total_strings' => $parsed['numStrings'] ?? count($parsed['entries'] ?? []),
            ]);

            if (!empty($parsed['entries'])) {
                $repo->batchInsertEntries('sins-rebellion-core', $parsed['entries']);
            }
        }
    }

    /**
     * Escanea archivos .str en disco y los devuelve categorizados:
     *   - base_languages: Idiomas base del juego (Localizations/XX/String/)
     *   - mods: Archivos de mods agrupados por nombre de mod
     *   - test_fixtures: Archivos de testing del proyecto
     */
    private function scanFilesystemStrFiles(array $config): array
    {
        $installPath = str_replace('\\', '/', $config['sins']['install_path'] ?? '');
        $modsPath    = str_replace('\\', '/', $config['sins']['mods_path'] ?? '');
        $projectRoot = str_replace('\\', '/', dirname(__DIR__, 3));

        // ── Mapa canónico de idiomas base de Sins of a Solar Empire: Rebellion ──
        $langMap = [
            'de'    => ['name' => 'Deutsch',             'flag' => '🇩🇪'],
            'en'    => ['name' => 'English',             'flag' => '🇺🇸'],
            'fr'    => ['name' => 'Français',            'flag' => '🇫🇷'],
            'it'    => ['name' => 'Italiano',            'flag' => '🇮🇹'],
            'ja'    => ['name' => '日本語',               'flag' => '🇯🇵'],
            'pl'    => ['name' => 'Polski',              'flag' => '🇵🇱'],
            'ru'    => ['name' => 'Русский',             'flag' => '🇷🇺'],
            'zh-CN' => ['name' => '简体中文',             'flag' => '🇨🇳'],
        ];

        // ── 1. Idiomas Base (Localizations/{locale}/String/*.str) ──
        $baseLanguages = [];
        $basePattern = $installPath . '/Localizations/*/String/*.str';
        foreach (glob($basePattern, GLOB_NOSORT) ?: [] as $filePath) {
            $normalized = str_replace('\\', '/', $filePath);
            if (preg_match('#/Localizations/([^/]+)/String/([^/]+)$#', $normalized, $m)) {
                $locale   = $m[1];
                $filename = $m[2];
                $info = $langMap[$locale] ?? ['name' => ucfirst($locale), 'flag' => '🌐'];

                if (!isset($baseLanguages[$locale])) {
                    $baseLanguages[$locale] = [
                        'locale'      => $locale,
                        'lang_name'   => $info['name'],
                        'flag'        => $info['flag'],
                        'files'       => [],
                    ];
                }
                $baseLanguages[$locale]['files'][] = [
                    'filename'    => $filename,
                    'path'        => $normalized,
                    'size_bytes'  => filesize($filePath) ?: 0,
                    'modified_at' => date('c', filemtime($filePath) ?: time()),
                ];
            }
        }

        // ── 2. Mods (mods_path/{ModName}/String/*.str) ──
        $mods = [];
        $modsPattern = $modsPath . '/*/String/*.str';
        foreach (glob($modsPattern, GLOB_NOSORT) ?: [] as $filePath) {
            $normalized = str_replace('\\', '/', $filePath);
            if (preg_match('#/([^/]+)/String/([^/]+)$#', $normalized, $m)) {
                $modName  = $m[1];
                $filename = $m[2];

                if (!isset($mods[$modName])) {
                    $mods[$modName] = [
                        'mod_name' => $modName,
                        'files'    => [],
                    ];
                }
                $mods[$modName]['files'][] = [
                    'filename'    => $filename,
                    'path'        => $normalized,
                    'size_bytes'  => filesize($filePath) ?: 0,
                    'modified_at' => date('c', filemtime($filePath) ?: time()),
                ];
            }
        }

        // ── 3. Test Fixtures (tests/fixtures/*.str) ──
        $testFixtures = [];
        $testPattern = $projectRoot . '/tests/fixtures/*.str';
        foreach (glob($testPattern, GLOB_NOSORT) ?: [] as $filePath) {
            $normalized = str_replace('\\', '/', $filePath);
            $testFixtures[] = [
                'filename'    => basename($filePath),
                'path'        => $normalized,
                'size_bytes'  => filesize($filePath) ?: 0,
                'modified_at' => date('c', filemtime($filePath) ?: time()),
            ];
        }

        return [
            'base_languages' => array_values($baseLanguages),
            'mods'           => array_values($mods),
            'test_fixtures'  => $testFixtures,
            'total_base'     => count($baseLanguages),
            'total_mods'     => array_sum(array_map(fn($m) => count($m['files']), $mods)),
            'total_tests'    => count($testFixtures),
        ];
    }
}
