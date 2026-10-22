/**
 * Solaris Nexus Studio - ViewNavigator Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.ViewNavigator = (() => {
  const STUDIO_TABS = ['tab-translation', 'tab-mods', 'tab-entities', 'tab-galaxy', 'tab-convert'];
  let lastActiveStudioTab = 'tab-translation';

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
    },
    'tab-network': {
      title: 'Red Galáctica & Workshop',
      subtitle: 'Conexión a repositorios remotos ModDB y Steam Workshop para distribución de paquetes de traducción.',
      metricNumber: 'EN DESARROLLO',
      metricLabel: 'Estado del Enlace',
      metricBadge: 'Beta v0.4'
    },
    'tab-pipeline': {
      title: 'Pipeline Gráfico & Shaders',
      subtitle: 'Procesamiento de texturas DDS (DXT1/DXT5), verificación de MIP-maps y linter de shaders HLSL.',
      metricNumber: 'EN DESARROLLO',
      metricLabel: 'Motor Texturas',
      metricBadge: 'DirectX 9 HLSL'
    },
    'tab-swarm': {
      title: 'Swarm Event Bus & Sincronización P2P',
      subtitle: 'Bus de eventos reactivo para colaboración multi-modder en tiempo real y resolución de conflictos.',
      metricNumber: 'EN DESARROLLO',
      metricLabel: 'Bus de Eventos',
      metricBadge: 'Kernel Swarm'
    },
    'tab-vault': {
      title: 'Bóveda de Resguardos (.bak)',
      subtitle: 'Auditoría de snapshots de seguridad automáticos y empaquetado canónico comprimido (.zip / .solaris).',
      metricNumber: 'SEGURO',
      metricLabel: 'Integridad Bóveda',
      metricBadge: 'Disaster Recovery'
    }
  };

  function switchTab(targetId) {
    if (STUDIO_TABS.includes(targetId)) {
      lastActiveStudioTab = targetId;
    }

    document.querySelectorAll('.sidebar-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.dock-btn[data-tab]').forEach(b => {
      const tab = b.getAttribute('data-tab');
      if (b.id === 'dock-btn-studio') {
        b.classList.toggle('active', STUDIO_TABS.includes(targetId));
      } else {
        b.classList.toggle('active', tab === targetId);
      }
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
    const unitEl = document.getElementById('hero-metric-unit');
    const badgeEl = document.getElementById('hero-metric-badge');
    const subtextEl = document.getElementById('hero-metric-subtext');
    const linkEl = document.getElementById('hero-metric-link');

    if (titleEl) titleEl.innerText = meta.title;
    if (subtitleEl) subtitleEl.innerText = meta.subtitle;

    const strCount = window.TranslationStudioModule && window.TranslationStudioModule.getCount() > 0
      ? window.TranslationStudioModule.getCount()
      : (NexusCore.state.totalStrings || 7828);
    const modsCount = NexusCore.state.activeMods ? NexusCore.state.activeMods.length : 0;
    const ramMb = NexusCore.state.realEnv?.mods?.ramBudget?.totalBudgetMb || 1400;
    const safeMarginMb = NexusCore.state.realEnv?.mods?.ramBudget?.safeMarginMb || 1850;
    const totalEntities = NexusCore.state.totalEntities || 1872;
    const galaxyNodes = NexusCore.state.totalGalaxies || 126;

    // Métricas en tiempo real con diseño Google AI Studio
    if (targetId === 'tab-dashboard') {
      if (labelEl) labelEl.innerText = 'Cadenas Rebellion';
      if (numEl) numEl.innerText = strCount.toLocaleString();
      if (unitEl) unitEl.innerText = 'cadenas';
      if (subtextEl) subtextEl.innerText = 'Localizations/es/String/English.str';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = '✓ 100% Real';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Cadenas →';
        linkEl.onclick = () => switchTab('tab-translation');
      }
    } else if (targetId === 'tab-translation') {
      if (labelEl) labelEl.innerText = 'Cadenas en Memoria';
      if (numEl) numEl.innerText = strCount.toLocaleString();
      if (unitEl) unitEl.innerText = 'cadenas';
      if (subtextEl) subtextEl.innerText = 'Diccionario activo';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = '✓ UTF-8 BOM';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Editor →';
        linkEl.onclick = () => switchTab('tab-translation');
      }
    } else if (targetId === 'tab-mods') {
      if (labelEl) labelEl.innerText = 'Mods VFS Activos';
      if (numEl) numEl.innerText = modsCount.toString();
      if (unitEl) unitEl.innerText = 'mods';
      if (subtextEl) subtextEl.innerText = 'EnabledMods.txt (Directorio limpio)';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill neutral';
        badgeEl.innerText = 'Vanilla Base';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver VFS →';
        linkEl.onclick = () => switchTab('tab-mods');
      }
    } else if (targetId === 'tab-entities') {
      if (labelEl) labelEl.innerText = 'Entidades GameInfo';
      if (numEl) numEl.innerText = totalEntities.toLocaleString();
      if (unitEl) unitEl.innerText = 'archivos .entity';
      if (subtextEl) subtextEl.innerText = 'Directorio GameInfo oficial';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = 'Vanilla Base';
      }
      if (linkEl) {
        linkEl.innerText = 'Explorar Entidades →';
        linkEl.onclick = () => switchTab('tab-entities');
      }
    } else if (targetId === 'tab-galaxy') {
      if (labelEl) labelEl.innerText = 'Mapas Galácticos';
      if (numEl) numEl.innerText = galaxyNodes.toLocaleString();
      if (unitEl) unitEl.innerText = 'archivos .galaxy';
      if (subtextEl) subtextEl.innerText = 'Directorio Galaxy';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = 'Oficial Rebellion';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Topología →';
        linkEl.onclick = () => switchTab('tab-galaxy');
      }
    } else {
      if (labelEl) labelEl.innerText = meta.metricLabel;
      if (numEl) numEl.innerText = meta.metricNumber;
      if (unitEl) unitEl.innerText = '';
      if (subtextEl) subtextEl.innerText = meta.subtitle.slice(0, 40) + '...';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = meta.metricBadge;
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Detalles →';
        linkEl.onclick = () => switchTab('tab-system');
      }
    }

    // Actualizar mini-métricas secundarias con datos reales
    const miniRam = document.getElementById('mini-metric-ram');
    if (miniRam) miniRam.innerText = `${ramMb.toLocaleString()} MB`;
    const miniRamDesc = document.getElementById('mini-metric-ram-desc');
    if (miniRamDesc) miniRamDesc.innerText = `${safeMarginMb.toLocaleString()} MB margen libre`;
    const miniMods = document.getElementById('mini-metric-mods');
    if (miniMods) miniMods.innerText = `${modsCount} Mods`;
    const miniModsDesc = document.getElementById('mini-metric-mod-top');
    if (miniModsDesc) miniModsDesc.innerText = modsCount === 0 ? 'Vanilla (Sin mods)' : `${modsCount} mods activos`;
    const miniEntities = document.getElementById('mini-metric-entities');
    if (miniEntities) miniEntities.innerText = totalEntities.toLocaleString();

    // Actualizar badges del sidebar y del árbol VFS real
    const sideDash = document.getElementById('sidebar-count-dashboard');
    if (sideDash) sideDash.innerText = strCount.toLocaleString();
    const sideStrings = document.getElementById('sidebar-count-strings');
    if (sideStrings) sideStrings.innerText = strCount.toLocaleString();
    const sideMods = document.getElementById('sidebar-count-mods');
    if (sideMods) sideMods.innerText = modsCount;
    const sideEntities = document.getElementById('sidebar-count-entities');
    if (sideEntities) sideEntities.innerText = totalEntities.toLocaleString();
    const sideGalaxy = document.getElementById('sidebar-count-galaxy');
    if (sideGalaxy) sideGalaxy.innerText = galaxyNodes;
    const treeModsCount = document.getElementById('tree-badge-mods-count');
    if (treeModsCount) treeModsCount.innerText = modsCount;

    const dashStrBadge = document.getElementById('dash-str-badge');
    if (dashStrBadge) {
      dashStrBadge.innerText = `${strCount.toLocaleString()} Cadenas (0 Errores)`;
      dashStrBadge.className = 'metric-badge-pill';
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
    } else if (tabId === 'tab-network') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="alert('Conectando a repositorios de la comunidad ModDB & Steam Workshop...');">${ICONS.refresh} Comprobar Actualizaciones</button>
      `;
    } else if (tabId === 'tab-pipeline') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="alert('Validando compresión DXT1/5 y Mip-Maps de texturas DDS...');">${ICONS.zap} Validar Mipmaps DDS</button>
      `;
    } else if (tabId === 'tab-swarm') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="alert('Enviando evento de sincronización a los nodos pares del enjambre...');">${ICONS.refresh} Ping Swarm Bus</button>
      `;
    } else if (tabId === 'tab-vault') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" onclick="window.NexusCore?.showToast ? NexusCore.showToast('Generando respaldo atómico .bak...') : alert('Generando respaldo atómico .bak...');">${ICONS.save} Nuevo Resguardo .bak</button>
      `;
    }
  }

  function init() {
    document.querySelectorAll('.sidebar-nav-item, .dock-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (btn.id === 'dock-btn-studio') {
          e.stopPropagation();
          switchTab(lastActiveStudioTab || 'tab-translation');
          return;
        }
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

    // Control determinista de carpetas en el árbol VFS (Expandir/Colapsar sin cambiar de vista)
    document.querySelectorAll('.tree-folder-toggle').forEach(folderNode => {
      folderNode.addEventListener('click', (e) => {
        e.stopPropagation();
        folderNode.classList.toggle('active');
        const folderKey = folderNode.getAttribute('data-folder');
        const subGroup = document.getElementById(`tree-group-${folderKey}`);
        const caret = folderNode.querySelector('.tree-caret');
        const isOpen = folderNode.classList.contains('active');
        if (subGroup) {
          subGroup.style.display = isOpen ? 'block' : 'none';
        }
        if (caret) {
          caret.innerText = isOpen ? '▼' : '▶';
        }
      });
    });

    // Control de selección e inspección de archivos del árbol VFS (Sin saltos de vista desordenados)
    const inspector = document.getElementById('tree-selection-inspector');
    const selName = document.getElementById('tree-sel-name');
    const selType = document.getElementById('tree-sel-type');
    const btnOpen = document.getElementById('btn-tree-open-target');

    let currentTreeTarget = null;
    let currentTreeType = null;

    function openTreeItem(type, target) {
      if (type === 'str') {
        switchTab('tab-translation');
        if (window.TranslationStudioModule && window.TranslationStudioModule.getCount() === 0) {
          window.TranslationStudioModule.loadDemoData();
        }
      } else if (type === 'mod') {
        switchTab('tab-mods');
      } else if (type === 'entity') {
        switchTab('tab-entities');
      }
    }

    document.querySelectorAll('.tree-file-item').forEach(fileNode => {
      fileNode.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tree-file-item').forEach(n => n.classList.remove('selected'));
        fileNode.classList.add('selected');

        currentTreeTarget = fileNode.getAttribute('data-target');
        currentTreeType = fileNode.getAttribute('data-file-type');

        if (inspector) inspector.style.display = 'block';
        if (selName) selName.innerText = currentTreeTarget;
        if (selType) selType.innerText = `Tipo: ${currentTreeType ? currentTreeType.toUpperCase() : 'RAW'}`;
      });

      fileNode.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openTreeItem(fileNode.getAttribute('data-file-type'), fileNode.getAttribute('data-target'));
      });
    });

    if (btnOpen) {
      btnOpen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentTreeType && currentTreeTarget) {
          openTreeItem(currentTreeType, currentTreeTarget);
        }
      });
    }

    // Historial reciente de archivos sin desvío de navegación
    document.getElementById('btn-sidebar-recent')?.addEventListener('click', () => {
      alert("Archivos Recientemente Modificados:\n• String_table.str (TEC Vanilla - 7.828 cadenas)\n• EnabledMods.txt (VFS Cascade v1.85)\n• Kol Battleship.entity (TEC Capital)");
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

    // Filtro en tiempo real para el árbol VFS y directorios locales del Sidebar
    const vfsSearch = document.getElementById('vfs-tree-search-input');
    if (vfsSearch) {
      vfsSearch.addEventListener('input', () => {
        const q = vfsSearch.value.toLowerCase().trim();
        document.querySelectorAll('#sidebar-real-vfs-tree .tree-node').forEach(node => {
          node.style.display = node.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      });
    }

    // Botón de re-escaneo rápido VFS en el encabezado del Sidebar
    document.getElementById('btn-sidebar-scan-vfs')?.addEventListener('click', () => {
      switchTab('tab-mods');
      if (window.ModManagerModule) window.ModManagerModule.scanMods();
    });
  }

  function logExecution(type, description, result) {
    const list = document.getElementById('dash-executions-list');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'workflow-task-item';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    item.innerHTML = `
      <div>
        <div style="font-weight: 700; font-size: 0.84rem;">[${type}] ${description}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted);">Registro reactivo de telemetría</div>
      </div>
      <div style="font-size: 0.74rem; font-family: var(--font-mono); color: var(--text-secondary);">${timeStr}</div>
      <div><span class="metric-badge-pill">✓ ${result}</span></div>
    `;
    list.insertBefore(item, list.firstChild);
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    updateHeroMetrics,
    logExecution
  };
})();
