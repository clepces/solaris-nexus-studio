<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

final class ViewRenderer
{
    /**
     * Ensambla la SPA modular desde los archivos de vista parciales.
     */
    public static function renderSpa(string $viewsDir): string
    {
        $partials = [
            'dock' => $viewsDir . DIRECTORY_SEPARATOR . 'dock.partial.html',
            'sidebar' => $viewsDir . DIRECTORY_SEPARATOR . 'sidebar.partial.html',
            'header' => $viewsDir . DIRECTORY_SEPARATOR . 'header.partial.html',
            'dashboard' => $viewsDir . DIRECTORY_SEPARATOR . 'dashboard.view.html',
            'translation' => $viewsDir . DIRECTORY_SEPARATOR . 'translation.view.html',
            'mods' => $viewsDir . DIRECTORY_SEPARATOR . 'mods.view.html',
            'system' => $viewsDir . DIRECTORY_SEPARATOR . 'system.view.html',
            'entities' => $viewsDir . DIRECTORY_SEPARATOR . 'entities.view.html',
            'galaxy' => $viewsDir . DIRECTORY_SEPARATOR . 'galaxy.view.html',
            'convert' => $viewsDir . DIRECTORY_SEPARATOR . 'convert.view.html',
            'network' => $viewsDir . DIRECTORY_SEPARATOR . 'network.view.html',
            'pipeline' => $viewsDir . DIRECTORY_SEPARATOR . 'pipeline.view.html',
            'swarm' => $viewsDir . DIRECTORY_SEPARATOR . 'swarm.view.html',
            'vault' => $viewsDir . DIRECTORY_SEPARATOR . 'vault.view.html',
            'modal' => $viewsDir . DIRECTORY_SEPARATOR . 'modal-edit.partial.html',
        ];

        $head = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solaris Nexus Studio - Clepces org. ltd</title>
  <link rel="stylesheet" href="assets/css/main-theme.css">
  <link rel="stylesheet" href="assets/css/datatable-virtual.css">
  <link rel="stylesheet" href="assets/css/modules/mods-manager.css">
  <link rel="stylesheet" href="assets/css/modules/entity-editor.css">
  <link rel="stylesheet" href="assets/css/modules/galaxy-forge.css">
</head>
<body>
HTML;

        $dockContent = file_exists($partials['dock']) ? file_get_contents($partials['dock']) : '';
        $sidebarContent = file_exists($partials['sidebar']) ? file_get_contents($partials['sidebar']) : '';
        $headerContent = file_exists($partials['header']) ? file_get_contents($partials['header']) : '';

        $viewsContent = '';
        foreach (['dashboard', 'translation', 'mods', 'system', 'entities', 'galaxy', 'convert', 'network', 'pipeline', 'swarm', 'vault'] as $v) {
            if (file_exists($partials[$v])) {
                $viewsContent .= "\n" . file_get_contents($partials[$v]);
            }
        }

        $modalContent = file_exists($partials['modal']) ? file_get_contents($partials['modal']) : '';

        $scripts = <<<HTML
  <!-- SCRIPTS MODULARES -->
  <script src="assets/js/nexus-core.js?v=0.3.1"></script>
  <script src="assets/js/modules/view-navigator.js?v=0.3.1"></script>
  <script src="assets/js/modules/translation-studio.js?v=0.3.1"></script>
  <script src="assets/js/modules/mod-manager.js?v=0.3.1"></script>
  <script src="assets/js/modules/entity-editor.js?v=0.3.1"></script>
  <script src="assets/js/modules/galaxy-forge.js?v=0.3.1"></script>
  <script src="assets/js/modules/convert-cli.js?v=0.3.1"></script>
  <script src="assets/js/modules/system-health.js?v=0.3.1"></script>
  <script src="assets/js/nexus-ui.js?v=0.3.1"></script>
</body>
</html>
HTML;

        return $head . "\n" .
            $dockContent . "\n" .
            "  <div class=\"reagle-window\">\n" .
            $sidebarContent . "\n" .
            "    <main class=\"reagle-workspace\">\n" .
            $headerContent . "\n" .
            $viewsContent . "\n" .
            "    </main>\n" .
            "  </div>\n" .
            $modalContent . "\n" .
            $scripts;
    }
}
