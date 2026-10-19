<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/services/ram-profiler-service.php';

use SolarisNexus\Backend\Services\RamProfilerService;

echo "=== TEST SUITE: RAM PROFILER SERVICE (32-BIT LAA) ===" . PHP_EOL;

$profiler = new RamProfilerService();

// 1. Caso Seguro (Juego Base + Traducción)
$safeMods = ['[ES] Rebellion Traduccion'];
$safeBudget = $profiler->calculateBudget($safeMods);

assert($safeBudget['totalBudgetMb'] === 1415, '1400 MB + 15 MB = 1415 MB');
assert($safeBudget['riskLevel'] === 'LOW', 'Nivel de riesgo debe ser LOW');
assert($safeBudget['isExceeded'] === false, 'No excede el techo de memoria');
echo "[OK] RamProfiler: Perfil seguro (Juego base + Traducción) validado (1415 MB)." . PHP_EOL;

// 2. Caso Moderado (Juego Base + Conversión Total)
$modMods = ['Star Wars Interregnum'];
$modBudget = $profiler->calculateBudget($modMods);
assert($modBudget['totalBudgetMb'] === 2650, '1400 MB + 1250 MB = 2650 MB');
assert($modBudget['riskLevel'] === 'LOW', '2650 MB se mantiene por debajo de 2800 MB');
echo "[OK] RamProfiler: Perfil de conversión total individual validado (2650 MB)." . PHP_EOL;

// 3. Caso Alto / Crítico (Conversión + Expansiones + Texturas HD)
$criticalMods = [
    'Star Wars Interregnum',
    'Enhanced 4X Mod',
    'HD Planets 4K Texture Pack',
];
$critBudget = $profiler->calculateBudget($criticalMods);
assert($critBudget['totalBudgetMb'] === 3800, '1400 + 1250 + 450 + 700 = 3800 MB');
assert($critBudget['riskLevel'] === 'CRITICAL', '3800 MB debe detonar riesgo CRITICAL');
assert($critBudget['isExceeded'] === true, 'Excede el techo virtual de 3250 MB');
echo "[OK] RamProfiler: Detección de sobrecarga crítica (3800 MB - MiniDump Crash Risk) verificada." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 4 PASARON EXITOSAMENTE ===" . PHP_EOL;
