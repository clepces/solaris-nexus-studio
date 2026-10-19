<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../src/backend/services/str-parser-service.php';

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Services\StrParserService;

echo "=== TEST SUITE: STR PARSER & BYTE BUFFER HELPER ===" . PHP_EOL;

// 1. Probar ByteBufferHelper
$rawText = "TXT\nNumStrings 1\nStringInfo\n\tID \"KEY\"\n\tValue \"Val\"\n";
$canonical = ByteBufferHelper::createCanonicalBuffer($rawText);

assert(ByteBufferHelper::hasUtf8Bom($canonical), 'Debe tener BOM UTF-8');
assert(str_contains($canonical, "\r\n"), 'Debe contener saltos de línea CRLF');
assert(!str_contains(substr($canonical, 3), "\n\n"), 'No deben existir saltos dobles anormales');
echo "[OK] ByteBufferHelper: Inyección de BOM y conversión CRLF validada." . PHP_EOL;

// 2. Probar Atomic Write con Backup
$testFile = __DIR__ . '/../fixtures/temp-test.str';
$backupDir = __DIR__ . '/../../storage/backups';

ByteBufferHelper::safeAtomicWrite($testFile, $canonical, $backupDir);
assert(file_exists($testFile), 'Archivo de prueba escrito');
assert(ByteBufferHelper::hasUtf8Bom(file_get_contents($testFile)), 'El archivo en disco debe tener BOM');

// Sobrescribir para forzar generación de backup
ByteBufferHelper::safeAtomicWrite($testFile, $canonical . "\r\n# Update", $backupDir);
$backups = glob($backupDir . '/*.bak');
assert(count($backups) > 0, 'Debe haberse generado al menos un archivo .bak');
echo "[OK] ByteBufferHelper: Escritura atómica y backup preventivo verificados (" . basename($backups[0]) . ")." . PHP_EOL;

// Limpieza de archivo temporal
@unlink($testFile);

// 3. Probar StrParserService sobre sample-valid.str
$parser = new StrParserService();
$validFixture = __DIR__ . '/../fixtures/sample-valid.str';
$result = $parser->parseFile($validFixture);

assert($result['header'] === 'TXT', 'Header debe ser TXT');
assert($result['numStrings'] === 3, 'NumStrings debe ser 3');
assert($result['isCountValid'] === true, 'Conteo de cadenas debe ser válido');
assert($result['entries'][0]['id'] === 'IDS_MAIN_MENU_TITLE', 'ID primera entrada');
assert($result['entries'][1]['id'] === 'IDS_FLEET_STATUS', 'ID segunda entrada');
assert(str_contains($result['entries'][1]['value'], '[VALUE]'), 'Debe contener token [VALUE]');
echo "[OK] StrParserService: Parseo en memoria de 3 entradas completado con éxito." . PHP_EOL;

// 4. Probar Streaming con Generador (parseStream)
$streamCount = 0;
foreach ($parser->parseStream($validFixture) as $entry) {
    $streamCount++;
    assert(isset($entry['id']) && isset($entry['value']), 'Entrada de stream válida');
}
assert($streamCount === 3, 'Generador debe emitir exactamente 3 entradas');
echo "[OK] StrParserService: Streaming con generador (memoria constante) verificado." . PHP_EOL;

// 5. Probar Serialización
$serialized = $parser->serialize($result['entries']);
assert(str_starts_with($serialized, "TXT\r\nNumStrings 3\r\n"), 'Serializador inicia con cabecera canónica');
assert(str_contains($serialized, "\tID \"IDS_PLANET_TEC_CAPITAL\"\r\n"), 'Serializador formatea ID con tab');
echo "[OK] StrParserService: Serialización canónica verificada." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 1 PASARON EXITOSAMENTE ===" . PHP_EOL;
