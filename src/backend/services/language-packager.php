<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Services;

use SolarisNexus\Backend\Utils\ByteBufferHelper;
use SolarisNexus\Backend\Utils\LoggerService;

final class LanguagePackager
{
    private LoggerService $logger;

    public function __construct(?LoggerService $logger = null)
    {
        $this->logger = $logger ?? new LoggerService();
    }

    /**
     * Despliega la traducción al idioma nativo español dentro de la carpeta del juego base.
     * Crucial: El archivo activo DEBE llamarse English.str debido a la constante grabada en el binario C++.
     */
    public function deployNativeSpanish(string $sinsInstallPath, string $strContent, string $backupDir): array
    {
        $baseStringDir = rtrim($sinsInstallPath, '/\\') . DIRECTORY_SEPARATOR . 'Localizations' . DIRECTORY_SEPARATOR . 'es' . DIRECTORY_SEPARATOR . 'String';
        if (!is_dir($baseStringDir)) {
            @mkdir($baseStringDir, 0755, true);
        }

        // 1. Archivo maestro que lee el binario
        $canonicalPath = $baseStringDir . DIRECTORY_SEPARATOR . 'English.str';
        ByteBufferHelper::safeAtomicWrite($canonicalPath, $strContent, $backupDir);

        // 2. Archivo informativo auxiliar
        $mirrorPath = $baseStringDir . DIRECTORY_SEPARATOR . 'Spanish.str';
        ByteBufferHelper::safeAtomicWrite($mirrorPath, $strContent, $backupDir);

        // 3. Configuración opcional de steam_emu.ini
        $emuPath = rtrim($sinsInstallPath, '/\\') . DIRECTORY_SEPARATOR . 'steam_emu.ini';
        $emuConfigured = false;
        if (file_exists($emuPath)) {
            $emuConfigured = $this->configureSteamEmulator($emuPath, 'spanish');
        }

        $this->logger->info('Despliegue nativo completado con éxito.', [
            'canonical_file' => 'Localizations/es/String/English.str',
            'mirror_file' => 'Localizations/es/String/Spanish.str',
            'emu_updated' => $emuConfigured,
        ]);

        return [
            'success' => true,
            'canonicalPath' => $canonicalPath,
            'mirrorPath' => $mirrorPath,
            'steamEmuUpdated' => $emuConfigured,
        ];
    }

    /**
     * Despliega un minimod de traducción no destructivo en la carpeta de Mods del usuario.
     */
    public function deployTranslationMinimod(string $sinsModsPath, string $minimodFolder, string $strContent, string $backupDir): string
    {
        $targetDir = rtrim($sinsModsPath, '/\\') . DIRECTORY_SEPARATOR . $minimodFolder . DIRECTORY_SEPARATOR . 'String';
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }

        $targetFile = $targetDir . DIRECTORY_SEPARATOR . 'English.str';
        ByteBufferHelper::safeAtomicWrite($targetFile, $strContent, $backupDir);

        $this->logger->info('Minimod de traducción desplegado con éxito en el VFS.', [
            'folder' => $minimodFolder,
        ]);

        return $targetFile;
    }

    /**
     * Actualiza la directiva Language en steam_emu.ini preservando el resto de parámetros.
     */
    private function configureSteamEmulator(string $emuPath, string $targetLanguage): bool
    {
        $content = @file_get_contents($emuPath);
        if ($content === false) {
            return false;
        }

        if (preg_match('/^Language\s*=\s*.*$/m', $content)) {
            $updated = preg_replace('/^Language\s*=\s*.*$/m', 'Language=' . $targetLanguage, $content);
        } else {
            $updated = $content . PHP_EOL . 'Language=' . $targetLanguage . PHP_EOL;
        }

        return @file_put_contents($emuPath, $updated) !== false;
    }
}
