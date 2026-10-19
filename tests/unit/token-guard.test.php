<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/backend/services/token-guard-service.php';
require_once __DIR__ . '/../../src/backend/services/linter-service.php';

use SolarisNexus\Backend\Services\TokenGuardService;
use SolarisNexus\Backend\Services\LinterService;

echo "=== TEST SUITE: TOKEN GUARD & LINTER SERVICE ===" . PHP_EOL;

$tokenGuard = new TokenGuardService();
$linter = new LinterService($tokenGuard);

// 1. Validar extracción de tokens
$sample = "Flota %s con [VALUE] naves restantes y nivel %d.\\nObjetivo: {0}";
$tokens = $tokenGuard->extractTokens($sample);

assert(count($tokens) === 5, 'Debe extraer 5 tokens');
assert($tokens[0]['token'] === '%s', 'Primer token %s');
assert($tokens[1]['token'] === '[VALUE]', 'Segundo token [VALUE]');
assert($tokens[2]['token'] === '%d', 'Tercer token %d');
assert($tokens[3]['token'] === '\\n', 'Cuarto token \\n');
assert($tokens[4]['token'] === '{0}', 'Quinto token {0}');
echo "[OK] TokenGuard: Extracción de 5 tipos de tokens reservada completada." . PHP_EOL;

// 2. Validar coincidencia válida
$orig = "The planet %s has [VALUE] defenses remaining.";
$validTrans = "El planeta %s cuenta con [VALUE] defensas restantes.";
$checkValid = $tokenGuard->validateTranslation($orig, $validTrans);
assert($checkValid['isValid'] === true, 'Traducción válida debe dar true');
echo "[OK] TokenGuard: Concordancia correcta verificada." . PHP_EOL;

// 3. Validar token roto / mutilado
$corruptTrans = "El planeta %s cuenta con [VALU defensas restantes.";
$checkCorrupt = $tokenGuard->validateTranslation($orig, $corruptTrans);
assert($checkCorrupt['isValid'] === false, 'Traducción rota debe dar false');
assert(count($checkCorrupt['missingTokens']) === 1, 'Debe faltar 1 token');
assert($checkCorrupt['missingTokens'][0]['token'] === '[VALUE]', 'Falta token [VALUE]');
echo "[OK] TokenGuard: Detección de token mutilado [VALU verificada." . PHP_EOL;

// 4. Validar linter con comillas no escapadas
$issues = $linter->lintStringValue('TEST_1', 'Original quote', 'Traducción con "comillas crudas" sin escapar');
$hasQuoteIssue = false;
foreach ($issues as $iss) {
    if ($iss['rule'] === 'UNESCAPED_DOUBLE_QUOTES') {
        $hasQuoteIssue = true;
    }
}
assert($hasQuoteIssue, 'Linter debe detectar comillas no escapadas');
echo "[OK] LinterService: Detección de comillas crudas verificada." . PHP_EOL;

// 5. Validar heurística de expansión de texto
assert($linter->checkTextExpansionRisk('Short', 'Corta') === 'SAFE', 'Texto corto es SAFE');
assert($linter->checkTextExpansionRisk(
    'Attack the enemy battleship immediately.',
    'Ataque inmediatamente a la nave nodriza de batalla del enemigo sin demora alguna y con toda la potencia de fuego.'
) === 'OVERFLOW_RISK', 'Expansión extrema detecta OVERFLOW_RISK');
echo "[OK] LinterService: Heurística de expansión de texto verificada." . PHP_EOL;

echo "=== TODOS LOS TESTS DE LA FASE 2 PASARON EXITOSAMENTE ===" . PHP_EOL;
