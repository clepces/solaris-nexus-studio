<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

final class LinterService
{
    private TokenGuardService $tokenGuard;

    public function __construct(?TokenGuardService $tokenGuard = null)
    {
        $this->tokenGuard = $tokenGuard ?? new TokenGuardService();
    }

    /**
     * Evalúa el riesgo de desbordamiento visual (clipping) en cuadros InfoCard fijos de DirectX 9.
     */
    public function checkTextExpansionRisk(string $originalText, string $translatedText): string
    {
        $origLen = mb_strlen($originalText, 'UTF-8');
        $transLen = mb_strlen($translatedText, 'UTF-8');

        if ($origLen < 15) {
            return 'SAFE';
        }

        $ratio = $transLen / $origLen;
        if ($ratio > 1.6) {
            return 'OVERFLOW_RISK';
        }
        if ($ratio > 1.35) {
            return 'WARNING';
        }

        return 'SAFE';
    }

    /**
     * Analiza sintácticamente el valor de una cadena individual en busca de anomalías.
     */
    public function lintStringValue(string $id, string $originalValue, string $translatedValue, int $lineNumber = 0): array
    {
        $issues = [];

        // 1. Detección de caracteres nulos (0x00)
        if (str_contains($translatedValue, "\0")) {
            $issues[] = [
                'rule' => 'NO_NULL_BYTE',
                'severity' => 'CRITICAL',
                'message' => 'Contiene byte nulo (0x00) que corrompe la lectura del motor C++.',
                'line' => $lineNumber,
                'id' => $id,
            ];
        }

        // 2. Detección de comillas dobles desbalanceadas o sin escapar
        if (preg_match_all('/(?<!\\\\)"/', $translatedValue, $matches)) {
            $issues[] = [
                'rule' => 'UNESCAPED_DOUBLE_QUOTES',
                'severity' => 'CRITICAL',
                'message' => 'Contiene comillas dobles sin escapar que romperán el analizador de archivos .str.',
                'line' => $lineNumber,
                'id' => $id,
            ];
        }

        // 3. Validación de tokens de motor
        $tokenValidation = $this->tokenGuard->validateTranslation($originalValue, $translatedValue);
        if (!$tokenValidation['isValid']) {
            $missingList = array_map(static fn($m) => $m['token'], $tokenValidation['missingTokens']);
            $extraList = array_map(static fn($e) => $e['token'], $tokenValidation['extraTokens']);

            $msgParts = [];
            if (!empty($missingList)) {
                $msgParts[] = 'Tokens faltantes: ' . implode(', ', $missingList);
            }
            if (!empty($extraList)) {
                $msgParts[] = 'Tokens no autorizados/modificados: ' . implode(', ', $extraList);
            }

            $issues[] = [
                'rule' => 'TOKEN_GUARD_MISMATCH',
                'severity' => 'CRITICAL',
                'message' => implode(' | ', $msgParts),
                'line' => $lineNumber,
                'id' => $id,
            ];
        }

        // 4. Riesgo de expansión de texto
        $risk = $this->checkTextExpansionRisk($originalValue, $translatedValue);
        if ($risk !== 'SAFE') {
            $issues[] = [
                'rule' => 'TEXT_EXPANSION_RISK',
                'severity' => $risk === 'OVERFLOW_RISK' ? 'WARNING' : 'INFO',
                'message' => sprintf('Expansión de texto (%s): El texto traducido es significativamente más largo y puede desbordar la InfoCard.', $risk),
                'line' => $lineNumber,
                'id' => $id,
            ];
        }

        return $issues;
    }

    /**
     * Ejecuta una auditoría completa de un diccionario de traducción.
     */
    public function auditDictionary(array $originalEntries, array $translatedEntries): array
    {
        $origMap = [];
        foreach ($originalEntries as $e) {
            $origMap[$e['id']] = $e['value'];
        }

        $allIssues = [];
        $criticalCount = 0;
        $warningCount = 0;

        foreach ($translatedEntries as $t) {
            $id = $t['id'];
            $transVal = $t['value'];
            $origVal = $origMap[$id] ?? '';
            $line = $t['lineNumber'] ?? 0;

            $issues = $this->lintStringValue($id, $origVal, $transVal, $line);
            foreach ($issues as $issue) {
                if ($issue['severity'] === 'CRITICAL') {
                    $criticalCount++;
                } elseif ($issue['severity'] === 'WARNING') {
                    $warningCount++;
                }
                $allIssues[] = $issue;
            }
        }

        return [
            'isValid' => $criticalCount === 0,
            'criticalCount' => $criticalCount,
            'warningCount' => $warningCount,
            'totalIssues' => count($allIssues),
            'issues' => $allIssues,
        ];
    }
}
