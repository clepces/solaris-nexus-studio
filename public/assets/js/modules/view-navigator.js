/**
 * Solaris Nexus Studio - ViewNavigator Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.ViewNavigator = (() => {
  const MODULE_METADATA = {
    'tab-dashboard': {
      title: 'Dashboard',
      subtitle: 'All Your Workflows And Permissions Managed',
      metricNumber: '340',
      metricLabel: 'Executions',
      metricBadge: '↑ 204%'
    },
    'tab-translation': {
      title: 'Estudio de Traducción',
      subtitle: 'Gestión masiva de diccionarios .str, Token Guard en tiempo real e inyección UTF-8 BOM canónica.',
      metricNumber: '0',
      metricLabel: 'Cadenas en Memoria',
      metricBadge: 'Sin archivo'
    },
    'tab-mods': {
      title: 'Gestor VFS & Mods',
      subtitle: 'Detección multiplataforma (Steam/GOG), jerarquía en EnabledMods.txt y monitor LAA de 3.250 MB.',
      metricNumber: '3',
      metricLabel: 'Mods Activos en Cascada',
      metricBadge: 'Prioridad 999'
    },
    'tab-entities': {
      title: 'Editor de Entidades',
      subtitle: 'Inspección táctica de naves capitales con respaldo atómico y advertencia de checksum multijugador.',
      metricNumber: '5 Naves',
      metricLabel: 'Catálogo de Flota',
      metricBadge: 'Beta Sandbox'
    },
    'tab-galaxy': {
      title: 'Galaxy Forge Companion',
      subtitle: 'Modelador de topologías estelares, detección de planetas aislados y exportación canónica .galaxy.',
      metricNumber: '12 Planetas',
      metricLabel: 'Grafo Conexo Estelar',
      metricBadge: 'Sin Islas'
    },
    'tab-convert': {
      title: 'ConvertData CLI',
      subtitle: 'Conversor bidireccional entre binario DirectX compilado y texto legible por humanos.',
      metricNumber: 'NATIVE_CLI',
      metricLabel: 'Motor de Conversión',
      metricBadge: 'DirectX 9'
    },
    'tab-system': {
      title: 'Diagnóstico & Salud',
      subtitle: 'Verificación de variables fail-fast, conectividad relacional SQLite/MySQL y blindaje UUID Safety.',
      metricNumber: 'HEALTHY',
      metricLabel: 'Estado del Servidor WAMP',
      metricBadge: 'Cero Stack Traces'
    }
  };

  function switchTab(targetId) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.dock-btn[data-tab]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === targetId);
    });

    updateHeroMetrics(targetId);
    renderContextualActions(targetId);

    if (targetId === 'tab-galaxy' && window.GalaxyForgeModule) {
      window.GalaxyForgeModule.refreshCanvas();
    }
  }

  function updateHeroMetrics(targetId) {
    const meta = MODULE_METADATA[targetId];
    if (!meta) return;

    const titleEl = document.getElementById('view-main-title');
    const subtitleEl = document.getElementById('view-main-subtitle');
    const labelEl = document.getElementById('hero-metric-label');
    const numEl = document.getElementById('hero-metric-number');
    const badgeEl = document.getElementById('hero-metric-badge');

    if (titleEl) titleEl.innerText = meta.title;
    if (subtitleEl) subtitleEl.innerText = meta.subtitle;
    if (labelEl) labelEl.innerText = meta.metricLabel;

    if (targetId === 'tab-translation' && window.TranslationStudioModule) {
      const count = window.TranslationStudioModule.getCount();
      if (numEl) numEl.innerText = count.toLocaleString();
      if (badgeEl) {
        if (count === 0) {
          badgeEl.className = 'metric-badge-pill neutral';
          badgeEl.innerText = 'Sin archivo';
        } else {
          badgeEl.className = 'metric-badge-pill';
          badgeEl.innerText = '✓ 100% Validado';
        }
      }
      const sideCount = document.getElementById('sidebar-count-strings');
      if (sideCount) sideCount.innerText = count.toLocaleString();
    } else {
      if (numEl) numEl.innerText = meta.metricNumber;
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = meta.metricBadge;
      }
    }
  }

  function toggleSidebar(forceOpen) {
    const sidebar = document.querySelector('.reagle-sidebar');
    if (!sidebar) return;
    if (forceOpen === true) {
      sidebar.classList.remove('collapsed');
    } else if (forceOpen === false) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  function renderContextualActions(tabId) {
    const container = document.getElementById('header-actions-container');
    if (!container) return;

    if (tabId === 'tab-dashboard') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="ViewNavigator.switchTab('tab-translation');">📁 Abrir Traducción</button>
        <button class="btn-reagle" onclick="ViewNavigator.switchTab('tab-mods');">⚙️ Mods VFS</button>
      `;
    } else if (tabId === 'tab-translation') {
      container.innerHTML = `
        <input type="file" id="file-input-str" accept=".str" style="display: none;">
        <button class="btn-reagle" id="btn-trigger-str-file">📁 Cargar .str</button>
        <button class="btn-reagle" id="btn-demo-str">🔄 Demo (7.828)</button>
        <button class="btn-reagle btn-reagle-success" id="btn-export-str-main">💾 Exportar .str (BOM)</button>
      `;
      const fi = document.getElementById('file-input-str');
      document.getElementById('btn-trigger-str-file')?.addEventListener('click', () => fi?.click());
      fi?.addEventListener('change', (e) => window.TranslationStudioModule?.handleStrUpload(e));
      document.getElementById('btn-demo-str')?.addEventListener('click', () => window.TranslationStudioModule?.loadDemoData());
      document.getElementById('btn-export-str-main')?.addEventListener('click', () => window.TranslationStudioModule?.exportStrFile());
    } else if (tabId === 'tab-mods') {
      container.innerHTML = `
        <button class="btn-reagle" id="btn-scan-mods-top">📁 Escanear Mods</button>
        <button class="btn-reagle btn-reagle-success" id="btn-inject-minimod-top">+ Inyectar Minimod</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-save-vfs-top">💾 Guardar VFS</button>
      `;
      document.getElementById('btn-scan-mods-top')?.addEventListener('click', () => window.ModManagerModule?.scanMods());
      document.getElementById('btn-inject-minimod-top')?.addEventListener('click', () => window.ModManagerModule?.switchSubTab('subtab-mods-injector'));
      document.getElementById('btn-save-vfs-top')?.addEventListener('click', () => window.ModManagerModule?.saveVfsHierarchy());
    } else if (tabId === 'tab-entities') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" id="btn-reload-catalog-top">🔄 Recargar Flota</button>
        <button class="btn-reagle btn-reagle-success" id="btn-save-entity-top">💾 Guardar Parámetros</button>
      `;
      document.getElementById('btn-reload-catalog-top')?.addEventListener('click', () => window.EntityEditorModule?.loadCatalog());
      document.getElementById('btn-save-entity-top')?.addEventListener('click', () => window.EntityEditorModule?.saveCurrentEntity());
    } else if (tabId === 'tab-galaxy') {
      container.innerHTML = `
        <button class="btn-reagle" onclick="window.GalaxyForgeModule?.generate(8);">Mapa 8P</button>
        <button class="btn-reagle btn-reagle-primary" onclick="window.GalaxyForgeModule?.generate(12);">Generar 12P</button>
        <button class="btn-reagle btn-reagle-success" onclick="window.GalaxyForgeModule?.exportGalaxy();">💾 Exportar .galaxy</button>
      `;
    } else if (tabId === 'tab-convert') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="window.ConvertCliModule?.run();">⚡ Ejecutar Conversión</button>
      `;
    } else if (tabId === 'tab-system') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-success" onclick="window.SystemHealthModule?.runAudit();">🛡️ Auditoría Fail-Fast</button>
      `;
    }
  }

  function init() {
    document.querySelectorAll('.sidebar-nav-item, .dock-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleSidebar());

    const restoreBtn = document.getElementById('btn-restore-sidebar');
    if (restoreBtn) restoreBtn.addEventListener('click', () => toggleSidebar(true));
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    updateHeroMetrics
  };
})();
