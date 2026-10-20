<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;

final class GalaxyForgeService
{
    private LoggerService $logger;

    public function __construct(?LoggerService $logger = null)
    {
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Parsea un archivo de escenario de mapa galáctico (.galaxy).
     */
    public function parseGalaxyContent(string $rawContent): array
    {
        $content = ByteBufferHelper::stripBom($rawContent);
        $lines = preg_split("/\r\n|\n|\r/", $content);
        if ($lines === false || count($lines) < 2) {
            throw new \RuntimeException('SYNTAX_ERROR: Galaxy scenario content too short.');
        }

        $header = trim($lines[0]);
        if ($header !== 'TXT' && $header !== 'TXT2') {
            throw new \RuntimeException(sprintf('SYNTAX_ERROR: Invalid header "%s", expected "TXT".', $header));
        }

        $stars = [];
        $planets = [];
        $phaseLanes = [];

        $totalLines = count($lines);
        $i = 1;

        while ($i < $totalLines) {
            $line = trim($lines[$i]);
            if ($line === '') {
                $i++;
                continue;
            }

            if ($line === 'star') {
                $starData = ['name' => 'Star_' . count($stars), 'type' => 'Yellow', 'x' => 0.0, 'y' => 0.0];
                $i++;
                while ($i < $totalLines && trim($lines[$i]) !== 'star' && trim($lines[$i]) !== 'planet' && trim($lines[$i]) !== 'jumpLane') {
                    $subLine = trim($lines[$i]);
                    if (preg_match('/^name\s+"(.*)"$/', $subLine, $m)) {
                        $starData['name'] = $m[1];
                    } elseif (preg_match('/^type\s+"(.*)"$/', $subLine, $m)) {
                        $starData['type'] = $m[1];
                    } elseif (preg_match('/^position\s+\[\s*([0-9\.\-]+)\s*,\s*([0-9\.\-]+)\s*\]/', $subLine, $m)) {
                        $starData['x'] = (float)$m[1];
                        $starData['y'] = (float)$m[2];
                    }
                    $i++;
                }
                $stars[] = $starData;
                continue;
            }

            if ($line === 'planet') {
                $planetData = ['name' => 'Planet_' . count($planets), 'type' => 'Terran', 'x' => 0.0, 'y' => 0.0, 'isHomePlanet' => false];
                $i++;
                while ($i < $totalLines && trim($lines[$i]) !== 'planet' && trim($lines[$i]) !== 'jumpLane' && trim($lines[$i]) !== 'star') {
                    $subLine = trim($lines[$i]);
                    if (preg_match('/^name\s+"(.*)"$/', $subLine, $m)) {
                        $planetData['name'] = $m[1];
                    } elseif (preg_match('/^type\s+"(.*)"$/', $subLine, $m)) {
                        $planetData['type'] = $m[1];
                    } elseif (preg_match('/^position\s+\[\s*([0-9\.\-]+)\s*,\s*([0-9\.\-]+)\s*\]/', $subLine, $m)) {
                        $planetData['x'] = (float)$m[1];
                        $planetData['y'] = (float)$m[2];
                    } elseif (preg_match('/^isHomePlanet\s+(TRUE|FALSE)/i', $subLine, $m)) {
                        $planetData['isHomePlanet'] = strtoupper($m[1]) === 'TRUE';
                    }
                    $i++;
                }
                $planets[] = $planetData;
                continue;
            }

            if ($line === 'jumpLane') {
                $laneData = ['source' => '', 'target' => ''];
                $i++;
                while ($i < $totalLines && trim($lines[$i]) !== 'jumpLane' && trim($lines[$i]) !== 'planet' && trim($lines[$i]) !== 'star') {
                    $subLine = trim($lines[$i]);
                    if (preg_match('/^sourcePlanet\s+"(.*)"$/', $subLine, $m)) {
                        $laneData['source'] = $m[1];
                    } elseif (preg_match('/^targetPlanet\s+"(.*)"$/', $subLine, $m)) {
                        $laneData['target'] = $m[1];
                    }
                    $i++;
                }
                if (!empty($laneData['source']) && !empty($laneData['target'])) {
                    $phaseLanes[] = $laneData;
                }
                continue;
            }

            $i++;
        }

        // Validación de conectividad topológica
        $connectedPlanetNames = [];
        foreach ($phaseLanes as $lane) {
            $connectedPlanetNames[$lane['source']] = true;
            $connectedPlanetNames[$lane['target']] = true;
        }

        $isolatedPlanets = [];
        foreach ($planets as $p) {
            if (!isset($connectedPlanetNames[$p['name']])) {
                $isolatedPlanets[] = $p['name'];
            }
        }

        return [
            'header' => $header,
            'starsCount' => count($stars),
            'planetsCount' => count($planets),
            'phaseLanesCount' => count($phaseLanes),
            'stars' => $stars,
            'planets' => $planets,
            'phaseLanes' => $phaseLanes,
            'hasIsolatedPlanets' => !empty($isolatedPlanets),
            'isolatedPlanets' => $isolatedPlanets,
        ];
    }

    /**
     * Genera un escenario galáctico procedural balanceado para Sins of a Solar Empire.
     */
    public function generateProceduralGalaxy(string $scenarioName, int $planetCount = 12): array
    {
        $types = ['Terran', 'Desert', 'Ice', 'Volcanic', 'Asteroid'];
        $stars = [
            ['name' => 'Solaris Core', 'type' => 'Yellow', 'x' => 0.0, 'y' => 0.0]
        ];

        $planets = [];
        $phaseLanes = [];
        $radius = 60000.0;
        $angleStep = (2 * M_PI) / $planetCount;

        for ($idx = 0; $idx < $planetCount; $idx++) {
            $angle = $idx * $angleStep;
            $x = round(cos($angle) * $radius, 2);
            $y = round(sin($angle) * $radius, 2);
            $type = $types[$idx % count($types)];
            $name = sprintf('Sector_%02d_%s', $idx + 1, $type);

            $planets[] = [
                'name' => $name,
                'type' => $type,
                'x' => $x,
                'y' => $y,
                'isHomePlanet' => ($idx === 0 || $idx === (int)($planetCount / 2)),
            ];
        }

        // Generar anillo orbital de líneas de fase entre planetas contiguos
        for ($idx = 0; $idx < $planetCount; $idx++) {
            $nextIdx = ($idx + 1) % $planetCount;
            $phaseLanes[] = [
                'source' => $planets[$idx]['name'],
                'target' => $planets[$nextIdx]['name'],
            ];
        }

        // Agregar salto radial transversal hacia el sector opuesto
        $phaseLanes[] = [
            'source' => $planets[0]['name'],
            'target' => $planets[(int)($planetCount / 2)]['name'],
        ];

        return [
            'scenarioName' => $scenarioName,
            'stars' => $stars,
            'planets' => $planets,
            'phaseLanes' => $phaseLanes,
            'totalPlanets' => count($planets),
            'totalLanes' => count($phaseLanes),
        ];
    }

    /**
     * Serializa un escenario de galaxia al formato canónico .galaxy con terminación CRLF.
     */
    public function serializeGalaxy(array $galaxyData): string
    {
        $crlf = ByteBufferHelper::CRLF;
        $out = 'TXT' . $crlf;
        $out .= 'galaxyScenarioDef' . $crlf;

        // Estrellas
        foreach ($galaxyData['stars'] as $s) {
            $out .= 'star' . $crlf;
            $out .= "\tname \"" . $s['name'] . '"' . $crlf;
            $out .= "\ttype \"" . $s['type'] . '"' . $crlf;
            $out .= sprintf("\tposition [ %0.2f , %0.2f ]%s", $s['x'], $s['y'], $crlf);
        }

        // Planetas
        foreach ($galaxyData['planets'] as $p) {
            $out .= 'planet' . $crlf;
            $out .= "\tname \"" . $p['name'] . '"' . $crlf;
            $out .= "\ttype \"" . $p['type'] . '"' . $crlf;
            $out .= sprintf("\tposition [ %0.2f , %0.2f ]%s", $p['x'], $p['y'], $crlf);
            $out .= "\tisHomePlanet " . ($p['isHomePlanet'] ? 'TRUE' : 'FALSE') . $crlf;
        }

        // Líneas de salto (Phase Lanes)
        foreach ($galaxyData['phaseLanes'] as $lane) {
            $out .= 'jumpLane' . $crlf;
            $out .= "\tsourcePlanet \"" . $lane['source'] . '"' . $crlf;
            $out .= "\ttargetPlanet \"" . $lane['target'] . '"' . $crlf;
        }

        return $out;
    }
}
