<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

final class ViewRenderer
{
    /**
     * Ensambla la SPA modular desde las plantillas semánticas en src/frontend/templates/.
     */
    public static function renderSpa(?string $templatesDir = null): string
    {
        $baseDir = dirname(__DIR__, 2);
        $tplDir = $templatesDir ?? ($baseDir . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'templates');
        
        $layoutsDir = $tplDir . DIRECTORY_SEPARATOR . 'layouts';
        $viewsDir = $tplDir . DIRECTORY_SEPARATOR . 'views';

        // Si se suministró la carpeta legacy public/views, mantener compatibilidad
        if (!is_dir($layoutsDir) && is_dir($tplDir)) {
            $layoutsDir = $tplDir;
            $viewsDir = $tplDir;
        }

        $appShellFile = $layoutsDir . DIRECTORY_SEPARATOR . 'app-shell.template.html';
        $dockFile = $layoutsDir . DIRECTORY_SEPARATOR . (file_exists($layoutsDir . DIRECTORY_SEPARATOR . 'dock.template.html') ? 'dock.template.html' : 'dock.partial.html');
        $sidebarFile = $layoutsDir . DIRECTORY_SEPARATOR . (file_exists($layoutsDir . DIRECTORY_SEPARATOR . 'sidebar.template.html') ? 'sidebar.template.html' : 'sidebar.partial.html');
        $headerFile = $layoutsDir . DIRECTORY_SEPARATOR . (file_exists($layoutsDir . DIRECTORY_SEPARATOR . 'header.template.html') ? 'header.template.html' : 'header.partial.html');
        $modalFile = $layoutsDir . DIRECTORY_SEPARATOR . (file_exists($layoutsDir . DIRECTORY_SEPARATOR . 'modal-edit.template.html') ? 'modal-edit.template.html' : 'modal-edit.partial.html');

        $dockContent = file_exists($dockFile) ? file_get_contents($dockFile) : '';
        $sidebarContent = file_exists($sidebarFile) ? file_get_contents($sidebarFile) : '';
        $headerContent = file_exists($headerFile) ? file_get_contents($headerFile) : '';
        $modalContent = file_exists($modalFile) ? file_get_contents($modalFile) : '';

        $viewNames = [
            'dashboard', 'studio', 'translation', 'mods', 'system',
            'entities', 'galaxy', 'convert', 'network', 'pipeline',
            'swarm', 'vault'
        ];

        $viewsContent = '';
        foreach ($viewNames as $v) {
            $viewPath = $viewsDir . DIRECTORY_SEPARATOR . $v . '.template.html';
            if (!file_exists($viewPath)) {
                $viewPath = $viewsDir . DIRECTORY_SEPARATOR . $v . '.view.html';
            }
            if (file_exists($viewPath)) {
                $viewsContent .= "\n" . file_get_contents($viewPath);
            }
        }

        if (file_exists($appShellFile)) {
            $shell = file_get_contents($appShellFile);
            return str_replace(
                ['{{dock}}', '{{sidebar}}', '{{header}}', '{{modal}}', '{{views}}'],
                [$dockContent, $sidebarContent, $headerContent, $modalContent, $viewsContent],
                $shell
            );
        }

        // Fallback en caso de ausencia de app-shell
        return self::renderFallback($dockContent, $sidebarContent, $headerContent, $viewsContent, $modalContent);
    }

    private static function renderFallback(string $dock, string $sidebar, string $header, string $views, string $modal): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solaris Nexus Studio</title>
  <link rel="stylesheet" href="assets/css/main-theme.css">
  <link rel="stylesheet" href="assets/css/datatable-virtual.css">
  <link rel="stylesheet" href="assets/css/modules/animations.css">
</head>
<body>
  {$dock}
  <div class="reagle-window">
    {$sidebar}
    <main class="reagle-workspace">
      {$header}
      {$views}
    </main>
  </div>
  {$modal}
  <script src="assets/js/nexus-core.js?v=0.4.1"></script>
  <script src="assets/js/modules/nexus-components.js?v=0.4.1"></script>
  <script src="assets/js/modules/view-navigator.js?v=0.4.1"></script>
  <script src="assets/js/nexus-ui.js?v=0.4.1"></script>
  <script type="module" src="assets/js/bundle.js?v=0.4.1"></script>
</body>
</html>
HTML;
    }
}
