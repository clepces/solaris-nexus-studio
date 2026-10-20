<?php
declare(strict_types=1);

echo "================================================================" . PHP_EOL;
echo "  SOLARIS NEXUS STUDIO - SUITE DE TESTING AUTOMATIZADA          " . PHP_EOL;
echo "  Clepces org. ltd | Versión Objetivo: v0.3.0.0-alpha           " . PHP_EOL;
echo "================================================================" . PHP_EOL . PHP_EOL;

$testFiles = [
    'Fase 0 - Bootstrap & Config' => __DIR__ . '/unit/test-bootstrap.php',
    'Fase 1 - Parser .str & ByteBuffer' => __DIR__ . '/unit/str-parser.test.php',
    'Fase 2 - Token Guard & Linters' => __DIR__ . '/unit/token-guard.test.php',
    'Fase 3 - Mod Orchestrator & VFS' => __DIR__ . '/unit/mod-priority.test.php',
    'Fase 4 - RAM Profiler (32-bit)' => __DIR__ . '/unit/ram-profiler.test.php',
    'Fase 5 - API Safety & UUID' => __DIR__ . '/unit/api-safety.test.php',
    'Fase 8 - Database & Translation Memory' => __DIR__ . '/unit/database-persistence.test.php',
    'Fase 9 - JIT Language Synthesizer' => __DIR__ . '/unit/language-synthesizer.test.php',
    'Fase 10 - ConvertData CLI & Engine' => __DIR__ . '/unit/convert-data.test.php',
    'Fase 11 - Game Entity Inspector' => __DIR__ . '/unit/entity-inspector.test.php',
    'Fase 12 - Galaxy Forge & Topology' => __DIR__ . '/unit/galaxy-forge.test.php',
];

$passedCount = 0;
$failedCount = 0;

foreach ($testFiles as $phaseName => $path) {
    echo ">> Ejecutando: $phaseName..." . PHP_EOL;
    $output = [];
    $returnVar = 0;
    
    // Ejecutar de forma asíncrona/aislada con el binario de PHP
    exec(sprintf('"%s" "%s"', PHP_BINARY, $path), $output, $returnVar);

    if ($returnVar === 0) {
        $passedCount++;
        echo "   [PASÓ] Exitoso." . PHP_EOL;
    } else {
        $failedCount++;
        echo "   [FALLÓ] Código de error: $returnVar" . PHP_EOL;
        echo implode(PHP_EOL, $output) . PHP_EOL;
    }
    echo PHP_EOL;
}

echo "----------------------------------------------------------------" . PHP_EOL;
echo sprintf("RESULTADOS: %d Aprobados, %d Fallidos (Total: %d)", $passedCount, $failedCount, count($testFiles)) . PHP_EOL;
echo "----------------------------------------------------------------" . PHP_EOL;

if ($failedCount === 0) {
    echo "ESTADO DEL ENTREGABLE: CERTIFICADO PARA v0.3.0.0-alpha." . PHP_EOL;
    exit(0);
} else {
    echo "ESTADO DEL ENTREGABLE: NO CERTIFICADO." . PHP_EOL;
    exit(1);
}
