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

    const ICONS = {
      folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
      save: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
      gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      zap: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
    };

    if (tabId === 'tab-dashboard') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="ViewNavigator.switchTab('tab-translation');">${ICONS.folder} Abrir Traducción</button>
        <button class="btn-reagle" onclick="ViewNavigator.switchTab('tab-mods');">${ICONS.gear} Mods VFS</button>
      `;
    } else if (tabId === 'tab-translation') {
      container.innerHTML = `
        <input type="file" id="file-input-str" accept=".str" style="display: none;">
        <button class="btn-reagle" id="btn-trigger-str-file">${ICONS.folder} Cargar .str</button>
        <button class="btn-reagle" id="btn-demo-str">${ICONS.refresh} Demo (7.828)</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-export-str-main">${ICONS.save} Exportar .str (BOM)</button>
      `;
      const fi = document.getElementById('file-input-str');
      document.getElementById('btn-trigger-str-file')?.addEventListener('click', () => fi?.click());
      fi?.addEventListener('change', (e) => window.TranslationStudioModule?.handleStrUpload(e));
      document.getElementById('btn-demo-str')?.addEventListener('click', () => window.TranslationStudioModule?.loadDemoData());
      document.getElementById('btn-export-str-main')?.addEventListener('click', () => window.TranslationStudioModule?.exportStrFile());
    } else if (tabId === 'tab-mods') {
      container.innerHTML = `
        <button class="btn-reagle" id="btn-scan-mods-top">${ICONS.refresh} Escanear Mods</button>
        <button class="btn-reagle" id="btn-inject-minimod-top">${ICONS.plus} Inyectar Minimod</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-save-vfs-top">${ICONS.save} Guardar VFS</button>
      `;
      document.getElementById('btn-scan-mods-top')?.addEventListener('click', () => window.ModManagerModule?.scanMods());
      document.getElementById('btn-inject-minimod-top')?.addEventListener('click', () => window.ModManagerModule?.switchSubTab('subtab-mods-injector'));
      document.getElementById('btn-save-vfs-top')?.addEventListener('click', () => window.ModManagerModule?.saveVfsHierarchy());
    } else if (tabId === 'tab-entities') {
      container.innerHTML = `
        <button class="btn-reagle" id="btn-reload-catalog-top">${ICONS.refresh} Recargar Flota</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-save-entity-top">${ICONS.save} Guardar Parámetros</button>
      `;
      document.getElementById('btn-reload-catalog-top')?.addEventListener('click', () => window.EntityEditorModule?.loadCatalog());
      document.getElementById('btn-save-entity-top')?.addEventListener('click', () => window.EntityEditorModule?.saveCurrentEntity());
    } else if (tabId === 'tab-galaxy') {
      container.innerHTML = `
        <button class="btn-reagle" onclick="window.GalaxyForgeModule?.generate(8);">${ICONS.zap} Mapa 8P</button>
        <button class="btn-reagle btn-reagle-primary" onclick="window.GalaxyForgeModule?.generate(12);">${ICONS.zap} Generar 12P</button>
        <button class="btn-reagle" onclick="window.GalaxyForgeModule?.exportGalaxy();">${ICONS.save} Exportar .galaxy</button>
      `;
    } else if (tabId === 'tab-convert') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="window.ConvertCliModule?.run();">${ICONS.zap} Ejecutar Conversión</button>
      `;
    } else if (tabId === 'tab-system') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="window.SystemHealthModule?.runAudit();">${ICONS.shield} Auditoría Fail-Fast</button>
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

    // Pestañas segmentadas interactivas del Dashboard (Workflows / Permissions / Executions)
    document.querySelectorAll('.tab-link-btn[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link-btn[data-dash-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-dash-tab');
        document.querySelectorAll('.dash-pane').forEach(pane => {
          pane.style.display = pane.id === `pane-dash-${tabName}` ? 'block' : 'none';
        });
      });
    });

    // Navegación interactiva desde el árbol de Documentos del Sidebar
    document.querySelectorAll('.folder-tree .tree-node').forEach(node => {
      node.addEventListener('click', () => {
        document.querySelectorAll('.folder-tree .tree-node').forEach(n => n.classList.remove('selected'));
        node.classList.add('selected');
        const route = node.getAttribute('data-route');
        if (route) switchTab(route);
      });
    });

    // Filtro en tiempo real para la matriz de Workflows del Dashboard
    const dashSearch = document.getElementById('dashboard-search-input');
    if (dashSearch) {
      dashSearch.addEventListener('input', () => {
        const q = dashSearch.value.toLowerCase().trim();
        document.querySelectorAll('#pane-dash-workflows .workflow-task-item').forEach(item => {
          item.style.display = item.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      });
    }
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    updateHeroMetrics
  };
})();
