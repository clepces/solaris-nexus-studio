<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/services/convert-data-service.php';

use SolarisNexus\Backend\Services\ConvertDataService;

echo "=== TEST SUITE: CONVERTDATA CLI & BINARY/TEXT ENGINE ===" . PHP_EOL;

$service = new ConvertDataService('C:/Games/MockSinsPath');

// 1. Probar validación de tipos y formatos
$typeValidationFailed = false;
try {
    $service->convert('unsupported_type', 'dummy.txt', 'out.txt', 'txt');
} catch (\InvalidArgumentException $e) {
    $typeValidationFailed = true;
}
assert($typeValidationFailed, 'Debe rechazar tipos no soportados');

$formatValidationFailed = false;
try {
    $service->convert('entity', 'dummy.txt', 'out.txt', 'unsupported_format');
} catch (\InvalidArgumentException $e) {
    $formatValidationFailed = true;
}
assert($formatValidationFailed, 'Debe rechazar formatos no soportados');
echo "[OK] ConvertDataService: Validación de tipos y formatos estrictos verificada." . PHP_EOL;

// 2. Probar detección de formato binario vs texto
$tempTxt = __DIR__ . '/../fixtures/temp_entity.txt';
$tempBin = __DIR__ . '/../fixtures/temp_entity.bin';

file_put_contents($tempTxt, "TXT\r\nentityType \"Frigate\"\r\n");
file_put_contents($tempBin, "\x00\x01\x02\x03entityTypeFrigate");

assert($service->detectFileFormat($tempTxt) === ConvertDataService::FORMAT_TXT, 'Detecta formato TXT correctamente');
assert($service->detectFileFormat($tempBin) === ConvertDataService::FORMAT_BIN, 'Detecta formato BIN correctamente');
echo "[OK] ConvertDataService: Detección automática de cabeceras (TXT vs BIN) verificada." . PHP_EOL;

// 3. Probar conversión (modo nativo o emulado según disponibilidad del ejecutable)
$convertedOut = __DIR__ . '/../fixtures/temp_entity_converted.txt';
$convResult = $service->convert('entity', $tempBin, $convertedOut, 'txt');

assert($convResult['success'] === true, 'Conversión exitosa');
assert(file_exists($convertedOut), 'Archivo de salida generado');
assert($service->detectFileFormat($convertedOut) === ConvertDataService::FORMAT_TXT, 'El archivo generado tiene formato TXT');
echo "[OK] ConvertDataService: Pipeline de conversión ejecutado exitosamente en modo " . $convResult['mode'] . "." . PHP_EOL;

// Limpieza de fixtures temporales
@unlink($tempTxt);
@unlink($tempBin);
@unlink($convertedOut);

echo "=== TODOS LOS TESTS DE LA FASE 10 PASARON EXITOSAMENTE ===" . PHP_EOL;
