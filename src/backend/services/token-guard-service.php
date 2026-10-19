<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

final class TokenGuardService
{
    /**
     * Patrones de tokens reservados del motor C++ de Ironclad Games.
     */
    private const PATTERNS = [
        'value_variable' => '/\[VALUE\d*\]/',
        'printf_specifier' => '/%(\d+\$)?([-+# 0]*)?(\d+)?(\.\d+)?([diouxXeEfgGaAcpsn%])/',
        'positional_index' => '/\{\d+\}/',
        'embedded_newline' => '/(?:\\\\r)?\\\\n|\r?\n/',
    ];

    /**
     * Extrae todos los tokens reservados encontrados en una cadena de texto.
     */
    public function extractTokens(string $text): array
    {
        $tokens = [];

        foreach (self::PATTERNS as $type => $pattern) {
            if (preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
                foreach ($matches[0] as $match) {
                    $tokens[] = [
                        'token' => $match[0],
                        'type' => $type,
                        'offset' => $match[1],
                    ];
                }
            }
        }

        // Ordenar tokens por posición de aparición en el texto
        usort($tokens, static fn(array $a, array $b): int => $a['offset'] <=> $b['offset']);

        return $tokens;
    }

    /**
     * Valida la concordancia estricta entre los tokens de la cadena original y la traducción.
     * Si la traducción mutila o altera tokens dinámicos, el juego se cerrará abruptamente.
     */
    public function validateTranslation(string $originalText, string $translatedText): array
    {
        $originalTokens = $this->extractTokens($originalText);
        $translatedTokens = $this->extractTokens($translatedText);

        $origCounts = $this->countTokenOccurrences($originalTokens);
        $transCounts = $this->countTokenOccurrences($translatedTokens);

        $missing = [];
        $extra = [];

        // Detectar tokens faltantes en la traducción
        foreach ($origCounts as $token => $count) {
            $transCount = $transCounts[$token] ?? 0;
            if ($transCount < $count) {
                $missing[] = [
                    'token' => $token,
                    'expected' => $count,
                    'found' => $transCount,
                ];
            }
        }

        // Detectar tokens sobrantes o malformados introducidos por error
        foreach ($transCounts as $token => $count) {
            $origCount = $origCounts[$token] ?? 0;
            if ($count > $origCount) {
                $extra[] = [
                    'token' => $token,
                    'expected' => $origCount,
                    'found' => $count,
                ];
            }
        }

        $isValid = empty($missing) && empty($extra);

        return [
            'isValid' => $isValid,
            'originalTokens' => $originalTokens,
            'translatedTokens' => $translatedTokens,
            'missingTokens' => $missing,
            'extraTokens' => $extra,
        ];
    }

    /**
     * Cuenta la frecuencia de cada token para comparación exacta.
     */
    private function countTokenOccurrences(array $tokenList): array
    {
        $counts = [];
        foreach ($tokenList as $t) {
            $val = $t['token'];
            $counts[$val] = ($counts[$val] ?? 0) + 1;
        }
        return $counts;
    }
}
