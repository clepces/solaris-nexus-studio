<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/utils/uuid-generator.php';
require_once __DIR__ . '/../../src/backend/utils/logger-service.php';
require_once __DIR__ . '/../../src/backend/utils/byte-buffer-helper.php';
require_once __DIR__ . '/../../src/backend/services/galaxy-forge-service.php';
require_once __DIR__ . '/../../src/backend/controllers/galaxy-controller.php';

use SolarisNexus\Backend\Services\GalaxyForgeService;
use SolarisNexus\Backend\Controllers\GalaxyController;

echo "=== TEST SUITE: GALAXY FORGE & PHASE LANE TOPOLOGY ===" . PHP_EOL;

$forge = new GalaxyForgeService();

// 1. Probar parseo de escenario galáctico
$sampleGalaxy = <<<EOD
TXT
galaxyScenarioDef
star
	name "Solaris Core"
	type "Yellow"
	position [ 0.00 , 0.00 ]
planet
	name "Terran Alpha"
	type "Terran"
	position [ -15000.00 , 0.00 ]
	isHomePlanet TRUE
planet
	name "Desert Beta"
	type "Desert"
	position [ 15000.00 , 0.00 ]
	isHomePlanet FALSE
planet
	name "Isolated Ice"
	type "Ice"
	position [ 0.00 , 30000.00 ]
	isHomePlanet FALSE
jumpLane
	sourcePlanet "Terran Alpha"
	targetPlanet "Desert Beta"
EOD;

$parsed = $forge->parseGalaxyContent($sampleGalaxy);

assert($parsed['starsCount'] === 1, 'Debe haber 1 estrella');
assert($parsed['planetsCount'] === 3, 'Debe haber 3 planetas');
assert($parsed['phaseLanesCount'] === 1, 'Debe haber 1 línea de salto');
assert($parsed['hasIsolatedPlanets'] === true, 'Debe detectar planetas aislados sin Phase Lane');
assert(in_array('Isolated Ice', $parsed['isolatedPlanets'], true), 'Isolated Ice detectado como aislado');
echo "[OK] GalaxyForgeService: Parseo de escenario y detección de planetas aislados verificado." . PHP_EOL;

// 2. Probar generación procedural balanceada
$procedural = $forge->generateProceduralGalaxy('Test Arena Map', 8);
assert($procedural['totalPlanets'] === 8, 'Debe generar 8 planetas');
assert($procedural['totalLanes'] >= 8, 'Debe conectar el anillo completo de Phase Lanes');
echo "[OK] GalaxyForgeService: Generación procedural y topología de anillo validada." . PHP_EOL;

// 3. Probar serialización canónica
$serialized = $forge->serializeGalaxy($procedural);
assert(str_starts_with($serialized, "TXT\r\ngalaxyScenarioDef\r\n"), 'Inicia con cabecera canónica TXT');
assert(str_contains($serialized, "jumpLane\r\n\tsourcePlanet \"Sector_01_Terran\""), 'Línea de salto serializada');
echo "[OK] GalaxyForgeService: Serialización canónica a formato .galaxy verificada." . PHP_EOL;

// 4. Probar GalaxyController
$controller = new GalaxyController($forge);
$ctrlGen = $controller->generate(['scenario_name' => 'API Generated Scenario', 'planet_count' => 6]);
assert(isset($ctrlGen['galaxy']) && count($ctrlGen['galaxy']['planets']) === 6, 'Controller generate responde correctamente');
echo "[OK] GalaxyController: Endpoint generate validado." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 12 PASARON EXITOSAMENTE ===" . PHP_EOL;
