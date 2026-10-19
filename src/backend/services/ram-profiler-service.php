<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

final class RamProfilerService
{
    public const CEILING_RAM_MB = 3250;
    public const BASE_ENGINE_RAM_MB = 1400;

    /**
     * Estima el impacto de memoria de un mod individual según su tipología y tamaño en disco.
     */
    public function estimateModRam(string $modName, ?int $diskSizeMb = null): int
    {
        $lower = strtolower($modName);

        // Minimods de traducción de texto: impacto insignificante
        if (str_starts_with($modName, '[ES]') || str_contains($lower, 'traduccion') || str_contains($lower, 'translation')) {
            return 15;
        }

        // Conversiones totales pesadas
        if (str_contains($lower, 'star wars') ||
            str_contains($lower, 'interregnum') ||
            str_contains($lower, 'armada') ||
            str_contains($lower, 'sins of the prophets') ||
            str_contains($lower, 'sta3') ||
            str_contains($lower, 'fall of kobol')) {
            return 1250;
        }

        // Expansiones y overhauls 4X
        if (str_contains($lower, 'e4x') ||
            str_contains($lower, 'enhanced 4x') ||
            str_contains($lower, 'distant stars') ||
            str_contains($lower, 'maelstrom')) {
            return 450;
        }

        // Minimods gráficos pesados (texturas 2K/4K, explosiones, partículas)
        if (str_contains($lower, 'texture') ||
            str_contains($lower, 'hd') ||
            str_contains($lower, 'graphic') ||
            str_contains($lower, 'fx') ||
            str_contains($lower, 'particle')) {
            return 700;
        }

        // Si se proporciona el tamaño en disco, aplicar heurística de descompresión
        if ($diskSizeMb !== null && $diskSizeMb > 0) {
            return min(1200, (int)($diskSizeMb * 0.4) + 100);
        }

        // Promedio estándar para minimods de balance o utilitarios
        return 80;
    }

    /**
     * Calcula el presupuesto acumulado de memoria virtual para la lista de mods activos.
     */
    public function calculateBudget(array $activeMods): array
    {
        $total = self::BASE_ENGINE_RAM_MB;
        $breakdown = [
            [
                'name' => 'Motor Base C++ (Rebellion 32-bit)',
                'estimatedRamMb' => self::BASE_ENGINE_RAM_MB,
                'category' => 'ENGINE_CORE',
            ]
        ];

        foreach ($activeMods as $mod) {
            $name = is_array($mod) ? $mod['name'] : (string)$mod;
            $estimated = $this->estimateModRam($name);
            $total += $estimated;

            $breakdown[] = [
                'name' => $name,
                'estimatedRamMb' => $estimated,
                'category' => $this->categorizeMod($name),
            ];
        }

        $margin = self::CEILING_RAM_MB - $total;

        $riskLevel = 'LOW';
        if ($total >= 3350) {
            $riskLevel = 'CRITICAL';
        } elseif ($total >= 3100) {
            $riskLevel = 'HIGH';
        } elseif ($total >= 2800) {
            $riskLevel = 'MODERATE';
        }

        return [
            'totalBudgetMb' => $total,
            'ceilingMb' => self::CEILING_RAM_MB,
            'safeMarginMb' => $margin,
            'riskLevel' => $riskLevel,
            'isExceeded' => $total > self::CEILING_RAM_MB,
            'breakdown' => $breakdown,
        ];
    }

    private function categorizeMod(string $name): string
    {
        $lower = strtolower($name);
        if (str_starts_with($name, '[ES]') || str_contains($lower, 'traduccion')) {
            return 'TRANSLATION_MINIMOD';
        }
        if (str_contains($lower, 'interregnum') || str_contains($lower, 'armada') || str_contains($lower, 'prophets')) {
            return 'TOTAL_CONVERSION';
        }
        if (str_contains($lower, 'e4x') || str_contains($lower, 'distant stars')) {
            return 'OVERHAUL';
        }
        return 'STANDARD_MOD';
    }
}
