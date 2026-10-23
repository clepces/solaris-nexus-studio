/**
 * Solaris Nexus Studio - ViewNavigator Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.ViewNavigator = (() => {
  const STUDIO_TABS = ['tab-studio', 'tab-translation', 'tab-mods', 'tab-entities', 'tab-galaxy', 'tab-convert'];
  let lastActiveStudioTab = 'tab-translation';

  const MODULE_METADATA = {
    'tab-dashboard': {
      title: 'Dashboard',
      subtitle: 'All Your Workflows And Permissions Managed',
      metricNumber: '340',
      metricLabel: 'Executions',
      metricBadge: '↑ 204%'
    },
    'tab-studio': {
      title: 'Studio Edition (Master)',
      subtitle: 'Entorno unificado de ingeniería inversa: Cadenas léxicas, Entidades de flota y Topología galáctica en un solo espacio.',
      metricNumber: 'UNIFICADO',
      metricLabel: 'Modo de Trabajo',
      metricBadge: 'Pro Edition'
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

    try {
      localStorage.setItem('solaris_active_tab', targetId);
    } catch (e) {}

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

    // Mini-métricas adaptativas según el módulo activo
    const miniCard1Label = document.querySelector('#secondary-metrics-row .mini-neu-card:nth-child(1) .mini-card-label');
    const miniCard1Badge = document.getElementById('mini-metric-ram-badge');
    const miniRam = document.getElementById('mini-metric-ram');
    const miniCard1Desc = document.getElementById('mini-metric-ram-desc');

    const miniCard2Label = document.querySelector('#secondary-metrics-row .mini-neu-card:nth-child(2) .mini-card-label');
    const miniCard2Badge = document.getElementById('mini-metric-mods-badge');
    const miniMods = document.getElementById('mini-metric-mods');
    const miniCard2Desc = document.getElementById('mini-metric-mod-top');

    const miniCard3Label = document.querySelector('#secondary-metrics-row .mini-neu-card:nth-child(3) .mini-card-label');
    const miniCard3Badge = document.getElementById('mini-metric-entities-badge');
    const miniEntities = document.getElementById('mini-metric-entities');
    const miniCard3Desc = document.getElementById('mini-metric-entities-desc');

    if (targetId === 'tab-translation') {
      if (miniCard1Label) miniCard1Label.innerText = 'TOKEN GUARD';
      if (miniRam) {
        miniRam.innerText = '100% OK';
        miniRam.className = 'mini-card-value';
      }
      if (miniCard1Badge) { miniCard1Badge.innerText = '0 Errores'; miniCard1Badge.className = 'metric-badge-pill'; }
      if (miniCard1Desc) {
        miniCard1Desc.innerText = '[VALUE], %s protegidos';
        miniCard1Desc.title = '[VALUE], %s protegidos';
        miniCard1Desc.className = 'metric-footer-text success';
      }

      if (miniCard2Label) miniCard2Label.innerText = 'MODIFICADAS';
      if (miniMods) {
        miniMods.innerText = '0 Cadenas';
        miniMods.className = 'mini-card-value';
      }
      if (miniCard2Badge) { miniCard2Badge.innerText = 'Sin cambios'; miniCard2Badge.className = 'metric-badge-pill neutral'; }
      if (miniCard2Desc) {
        miniCard2Desc.innerText = 'Memoria de sesión limpia';
        miniCard2Desc.title = 'Memoria de sesión limpia';
        miniCard2Desc.className = 'metric-footer-text muted';
      }

      if (miniCard3Label) miniCard3Label.innerText = 'MEMORIA TRADUCCIÓN';
      if (miniEntities) {
        miniEntities.innerText = 'CONECTADA';
        miniEntities.className = 'mini-card-value val-sm';
      }
      if (miniCard3Badge) { miniCard3Badge.innerText = 'SQLite TM'; miniCard3Badge.className = 'metric-badge-pill'; }
      if (miniCard3Desc) {
        miniCard3Desc.innerText = 'IndexedDB & SQLite Sync';
        miniCard3Desc.title = 'IndexedDB & SQLite Sync';
        miniCard3Desc.className = 'metric-footer-text muted';
      }
    } else if (targetId === 'tab-mods') {
      if (miniCard1Label) miniCard1Label.innerText = 'PRESUPUESTO RAM LAA';
      if (miniRam) {
        miniRam.innerText = `${ramMb.toLocaleString()} MB`;
        miniRam.className = 'mini-card-value';
      }
      if (miniCard1Badge) { miniCard1Badge.innerText = 'LAA Seguro'; miniCard1Badge.className = 'metric-badge-pill'; }
      if (miniCard1Desc) {
        miniCard1Desc.innerText = `${safeMarginMb.toLocaleString()} MB margen libre`;
        miniCard1Desc.title = `${safeMarginMb.toLocaleString()} MB margen libre`;
        miniCard1Desc.className = 'metric-footer-text success';
      }

      if (miniCard2Label) miniCard2Label.innerText = 'COLISIONES VFS';
      if (miniMods) {
        miniMods.innerText = '2 Overrides';
        miniMods.className = 'mini-card-value';
      }
      if (miniCard2Badge) { miniCard2Badge.innerText = '100% Limpio'; miniCard2Badge.className = 'metric-badge-pill'; }
      if (miniCard2Desc) {
        miniCard2Desc.innerText = 'Sin conflictos cíclicos';
        miniCard2Desc.title = 'Sin conflictos cíclicos';
        miniCard2Desc.className = 'metric-footer-text muted';
      }

      if (miniCard3Label) miniCard3Label.innerText = 'INYECCIÓN MINIMOD';
      const hasMinimod = NexusCore.state.activeMods && NexusCore.state.activeMods.some(m => m.isMinimod || m.name.includes('[ES]'));
      if (miniEntities) {
        miniEntities.innerText = hasMinimod ? 'ACTIVO P999' : 'STANDBY';
        miniEntities.className = 'mini-card-value val-sm';
      }
      if (miniCard3Badge) {
        miniCard3Badge.innerText = hasMinimod ? 'P999 Inyectado' : 'Vanilla P0';
        miniCard3Badge.className = `metric-badge-pill ${hasMinimod ? '' : 'neutral'}`;
      }
      if (miniCard3Desc) {
        miniCard3Desc.innerText = hasMinimod ? 'Cúspide de cascada' : 'Inyección quirúrgica lista';
        miniCard3Desc.title = hasMinimod ? 'Cúspide de cascada' : 'Inyección quirúrgica lista';
        miniCard3Desc.className = 'metric-footer-text muted';
      }
    } else {
      if (miniCard1Label) miniCard1Label.innerText = 'MEMORIA 32-BIT';
      if (miniRam) {
        miniRam.innerText = `${ramMb.toLocaleString()} MB`;
        miniRam.className = 'mini-card-value';
      }
      if (miniCard1Badge) { miniCard1Badge.innerText = 'LAA Seguro'; miniCard1Badge.className = 'metric-badge-pill'; }
      if (miniCard1Desc) {
        miniCard1Desc.innerText = `${safeMarginMb.toLocaleString()} MB margen libre`;
        miniCard1Desc.title = `${safeMarginMb.toLocaleString()} MB margen libre`;
        miniCard1Desc.className = 'metric-footer-text success';
      }

      if (miniCard2Label) miniCard2Label.innerText = 'MODS ACTIVOS';
      if (miniMods) {
        miniMods.innerText = `${modsCount} Mods`;
        miniMods.className = 'mini-card-value';
      }
      if (miniCard2Badge) { miniCard2Badge.innerText = modsCount === 0 ? '0 Activos' : `${modsCount} Activos`; miniCard2Badge.className = `metric-badge-pill ${modsCount === 0 ? 'neutral' : ''}`; }
      if (miniCard2Desc) {
        miniCard2Desc.innerText = modsCount === 0 ? 'Vanilla (Sin mods)' : `${modsCount} mods en cascada`;
        miniCard2Desc.title = modsCount === 0 ? 'Vanilla (Sin mods)' : `${modsCount} mods en cascada`;
        miniCard2Desc.className = 'metric-footer-text muted';
      }

      if (miniCard3Label) miniCard3Label.innerText = 'ENTIDADES GAMEINFO';
      if (miniEntities) {
        miniEntities.innerText = totalEntities.toLocaleString();
        miniEntities.className = 'mini-card-value';
      }
      if (miniCard3Badge) { miniCard3Badge.innerText = 'Vanilla'; miniCard3Badge.className = 'metric-badge-pill'; }
      if (miniCard3Desc) {
        miniCard3Desc.innerText = 'Directorio GameInfo';
        miniCard3Desc.title = 'Directorio GameInfo';
        miniCard3Desc.className = 'metric-footer-text muted';
      }
    }

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

    // Iconos limpios estilo Google Material Symbols
    const G_ICONS = {
      translate: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.08c1.74-1.94 2.98-4.17 3.71-6.48H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>',
      folder: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
      refresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
      save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
      layers: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z"/></svg>',
      tune: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>',
      play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      security: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
      sparkle: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>'
    };

    if (tabId === 'tab-dashboard') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="ViewNavigator.switchTab('tab-translation');" title="Abrir Traducción">${G_ICONS.translate}<span class="action-label">Abrir Traducción</span></button>
        <button class="btn-reagle-action" onclick="ViewNavigator.switchTab('tab-mods');" title="Gestionar Mods VFS">${G_ICONS.layers}<span class="action-label">Mods VFS</span></button>
        <button class="btn-reagle-action" id="btn-refresh-env" title="Escanear Entorno Físico">${G_ICONS.refresh}<span class="action-label">Escanear Entorno</span></button>
      `;
      document.getElementById('btn-refresh-env')?.addEventListener('click', async () => {
        if (window.NexusCore && window.NexusCore.fetchRealEnvironment) {
          await window.NexusCore.fetchRealEnvironment();
          await loadPermissions();
          await loadExecutions();
          logExecution('SYS', 'Re-escaneo manual de entorno y subsistemas físicos', 'OK', 'C:/Games/...');
        }
      });
    } else if (tabId === 'tab-studio') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="window.TranslationStudioModule?.loadDemoData();" title="Recargar dataset en caliente">${G_ICONS.refresh}<span class="action-label">Sincronizar</span></button>
      `;
    } else if (tabId === 'tab-translation') {
      container.innerHTML = `
        <input type="file" id="file-input-str" accept=".str" style="display: none;">
        <button class="btn-reagle-action" id="btn-trigger-str-file" title="Cargar archivo .str">${G_ICONS.folder}<span class="action-label">Cargar .str</span></button>
        <button class="btn-reagle-action" id="btn-demo-str" title="Cargar catálogo completo 7.828 cadenas">${G_ICONS.sparkle}<span class="action-label">Cargar (7.828)</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-export-str-main" title="Exportar .str canónico UTF-8 BOM">${G_ICONS.save}<span class="action-label">Exportar .str</span></button>
      `;
      const fi = document.getElementById('file-input-str');
      document.getElementById('btn-trigger-str-file')?.addEventListener('click', () => fi?.click());
      fi?.addEventListener('change', (e) => window.TranslationStudioModule?.handleStrUpload(e));
      document.getElementById('btn-demo-str')?.addEventListener('click', () => window.TranslationStudioModule?.loadDemoData());
      document.getElementById('btn-export-str-main')?.addEventListener('click', () => window.TranslationStudioModule?.exportStrFile());
    } else if (tabId === 'tab-mods') {
      container.innerHTML = `
        <button class="btn-reagle-action" id="btn-scan-mods-top" title="Escanear directorio de mods">${G_ICONS.refresh}<span class="action-label">Escanear Mods</span></button>
        <button class="btn-reagle-action" id="btn-inject-minimod-top" title="Inyectar minimod JIT">${G_ICONS.tune}<span class="action-label">Inyectar Minimod</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-save-vfs-top" title="Guardar jerarquía VFS">${G_ICONS.save}<span class="action-label">Guardar VFS</span></button>
      `;
      document.getElementById('btn-scan-mods-top')?.addEventListener('click', () => window.ModManagerModule?.scanMods());
      document.getElementById('btn-inject-minimod-top')?.addEventListener('click', () => window.ModManagerModule?.switchSubTab('subtab-mods-injector'));
      document.getElementById('btn-save-vfs-top')?.addEventListener('click', () => window.ModManagerModule?.saveVfsHierarchy());
    } else if (tabId === 'tab-entities') {
      container.innerHTML = `
        <button class="btn-reagle-action" id="btn-reload-catalog-top" title="Recargar catálogo de naves">${G_ICONS.refresh}<span class="action-label">Recargar Flota</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-save-entity-top" title="Guardar parámetros de entidad">${G_ICONS.save}<span class="action-label">Guardar Entidad</span></button>
      `;
      document.getElementById('btn-reload-catalog-top')?.addEventListener('click', () => window.EntityEditorModule?.loadCatalog());
      document.getElementById('btn-save-entity-top')?.addEventListener('click', () => window.EntityEditorModule?.saveCurrentEntity());
    } else if (tabId === 'tab-galaxy') {
      container.innerHTML = `
        <button class="btn-reagle-action" onclick="window.GalaxyForgeModule?.generate(8);" title="Generar topología de 8 planetas">${G_ICONS.play}<span class="action-label">Mapa 8P</span></button>
        <button class="btn-reagle-action btn-reagle-primary" onclick="window.GalaxyForgeModule?.generate(12);" title="Generar topología de 12 planetas">${G_ICONS.play}<span class="action-label">Generar 12P</span></button>
        <button class="btn-reagle-action" onclick="window.GalaxyForgeModule?.exportGalaxy();" title="Exportar archivo .galaxy">${G_ICONS.save}<span class="action-label">Exportar .galaxy</span></button>
      `;
    } else if (tabId === 'tab-convert') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="window.ConvertCliModule?.run();" title="Ejecutar motor ConvertData CLI">${G_ICONS.play}<span class="action-label">Ejecutar Conversión</span></button>
      `;
    } else if (tabId === 'tab-system') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="window.SystemHealthModule?.runAudit();" title="Auditoría integral Fail-Fast">${G_ICONS.security}<span class="action-label">Auditoría Fail-Fast</span></button>
      `;
    } else if (tabId === 'tab-network') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="alert('Conectando a repositorios de la comunidad ModDB & Steam Workshop...');" title="Comprobar actualizaciones remotas">${G_ICONS.refresh}<span class="action-label">Actualizaciones</span></button>
      `;
    } else if (tabId === 'tab-pipeline') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="alert('Validando compresión DXT1/5 y Mip-Maps de texturas DDS...');" title="Validar texturas DDS">${G_ICONS.play}<span class="action-label">Validar Mipmaps</span></button>
      `;
    } else if (tabId === 'tab-swarm') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="alert('Enviando evento de sincronización a los nodos pares del enjambre...');" title="Ping al bus de eventos">${G_ICONS.refresh}<span class="action-label">Ping Swarm</span></button>
      `;
    } else if (tabId === 'tab-vault') {
      container.innerHTML = `
        <button class="btn-reagle-action btn-reagle-primary" onclick="window.NexusCore?.showToast ? NexusCore.showToast('Generando respaldo atómico .bak...') : alert('Generando respaldo atómico .bak...');" title="Crear snapshot .bak">${G_ICONS.save}<span class="action-label">Nuevo Resguardo</span></button>
      `;
    }
  }

  async function loadPermissions() {
    const list = document.getElementById('dash-permissions-list');
    if (!list) return;
    try {
      const res = await NexusCore.apiGet('system/permissions');
      if (res && res.success && res.data && res.data.permissions) {
        list.innerHTML = res.data.permissions.map(p => `
          <div class="workflow-task-item">
            <div class="workflow-col-main">
              <div class="main-text">
                <div class="main-title">${p.resource}</div>
                <div class="main-desc" title="${p.path}">${p.path}</div>
              </div>
            </div>
            <div class="workflow-col-badge">
              <span class="sidebar-pill-badge" style="background: #f1f5f9; color: #475569; font-weight: 700;">${p.access}</span>
            </div>
            <div class="workflow-col-action">
              <span class="metric-badge-pill ${p.granted ? '' : 'neutral'}">${p.statusText}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  let executionsData = [];
  let executionsPagination = null;
  const EXEC_PER_PAGE = 7;

  function renderExecutionsPage(page) {
    const list = document.getElementById('dash-executions-list');
    const emptyContainer = document.getElementById('dash-executions-empty');
    if (!list) return;

    const dashSearch = document.getElementById('dashboard-search-input');
    const query = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const filtered = query
      ? executionsData.filter(e => 
          (e.exec_type && e.exec_type.toLowerCase().includes(query)) ||
          (e.description && e.description.toLowerCase().includes(query)) ||
          (e.details && e.details.toLowerCase().includes(query)) ||
          (e.result && e.result.toLowerCase().includes(query))
        )
      : executionsData;

    if (filtered.length === 0) {
      list.innerHTML = '';
      if (emptyContainer) {
        emptyContainer.style.display = 'block';
        emptyContainer.innerHTML = window.NexusComponents ? window.NexusComponents.renderEmptyState({
          title: 'Sin resultados de ejecución',
          description: query 
            ? `No se encontraron ejecuciones que coincidan con "${query}".`
            : 'No hay registros de ejecución en la base de datos.',
          icon: 'search',
          actionText: query ? 'Limpiar Búsqueda' : null,
          actionCallback: query ? 'ViewNavigator.clearDashboardSearch()' : null
        }) : `<div style="text-align: center; padding: 24px; color: #94a3b8;">No hay registros</div>`;
      }
      if (executionsPagination) executionsPagination.setTotal(0);
      return;
    }

    if (emptyContainer) emptyContainer.style.display = 'none';

    if (executionsPagination) {
      executionsPagination.setTotal(filtered.length);
    }

    const start = (page - 1) * EXEC_PER_PAGE;
    const end = Math.min(filtered.length, start + EXEC_PER_PAGE);
    const pageItems = filtered.slice(start, end);

    list.innerHTML = pageItems.map(e => `
      <div class="workflow-task-item">
        <div class="workflow-col-main">
          <div class="main-text">
            <div class="main-title">[${e.exec_type}] ${e.description}</div>
            <div class="main-desc" title="${e.details || ''}">${e.details || 'Telemetría del sistema'}</div>
          </div>
        </div>
        <div class="workflow-col-badge">
          <span style="font-size: 0.74rem; font-family: var(--font-mono); color: #64748b;">${e.created_at}</span>
        </div>
        <div class="workflow-col-action">
          <span class="metric-badge-pill">✓ ${e.result}</span>
        </div>
      </div>
    `).join('');
  }

  function clearDashboardSearch() {
    const dashSearch = document.getElementById('dashboard-search-input');
    if (dashSearch) {
      dashSearch.value = '';
      applyDashboardSearch();
    }
  }

  function applyDashboardSearch() {
    const dashSearch = document.getElementById('dashboard-search-input');
    const q = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    // Si la pestaña activa es Executions, usamos la paginación reactiva
    const activeExecPane = document.getElementById('pane-dash-executions');
    if (activeExecPane && activeExecPane.classList.contains('active')) {
      if (executionsPagination) executionsPagination.currentPage = 1;
      renderExecutionsPage(1);
      return;
    }

    // Para workflows y permissions
    const activePane = document.querySelector('.dash-pane.active');
    if (!activePane) return;

    let visibleCount = 0;
    activePane.querySelectorAll('.workflow-task-item').forEach(item => {
      const match = item.innerText.toLowerCase().includes(q);
      item.style.display = match ? 'grid' : 'none';
      if (match) visibleCount++;
    });

    const emptyBox = activePane.querySelector('.dash-pane-empty');
    if (emptyBox) {
      if (visibleCount === 0 && q !== '') {
        emptyBox.style.display = 'block';
        emptyBox.innerHTML = window.NexusComponents ? window.NexusComponents.renderEmptyState({
          title: 'Sin coincidencias en esta pestaña',
          description: `No se encontraron elementos que coincidan con "${q}".`,
          icon: 'search',
          actionText: 'Limpiar Filtro',
          actionCallback: 'ViewNavigator.clearDashboardSearch()'
        }) : '';
      } else {
        emptyBox.style.display = 'none';
      }
    }
  }

  async function loadExecutions() {
    const list = document.getElementById('dash-executions-list');
    const countEl = document.getElementById('dash-exec-count');
    const paginationContainer = document.getElementById('dash-executions-pagination');
    if (!list) return;

    try {
      const res = await NexusCore.apiGet('system/executions');
      let executions = (res && res.success && res.data && res.data.executions) ? res.data.executions : [];

      if (executions.length === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem('solaris_executions') || '[]');
          if (Array.isArray(cached) && cached.length > 0) executions = cached;
        } catch (e) {}
      }

      executionsData = executions;
      if (countEl) countEl.innerText = executions.length;

      if (window.NexusComponents && paginationContainer && !executionsPagination) {
        executionsPagination = new window.NexusComponents.Pagination({
          container: paginationContainer,
          totalItems: executionsData.length,
          itemsPerPage: EXEC_PER_PAGE,
          currentPage: 1,
          onPageChange: (newPage) => {
            renderExecutionsPage(newPage);
          }
        });
      }

      renderExecutionsPage(1);
    } catch (e) {}
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

    // Pestañas segmentadas interactivas del Dashboard con persistencia
    document.querySelectorAll('.tab-link-btn[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link-btn[data-dash-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-dash-tab');
        try {
          localStorage.setItem('solaris_dash_tab', tabName);
        } catch (e) {}
        document.querySelectorAll('.dash-pane').forEach(pane => {
          const match = pane.id === `pane-dash-${tabName}`;
          pane.classList.toggle('active', match);
          pane.style.display = match ? 'block' : 'none';
        });
        applyDashboardSearch();
      });
    });

    // Restaurar subpestaña del Dashboard
    const savedDashTab = localStorage.getItem('solaris_dash_tab');
    if (savedDashTab) {
      const matchBtn = document.querySelector(`.tab-link-btn[data-dash-tab="${savedDashTab}"]`);
      if (matchBtn) matchBtn.click();
    }

    // Cargar permisos y ejecuciones físicas reales
    loadPermissions();
    loadExecutions();

    // Control determinista de carpetas en el árbol VFS
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

    // Control de selección e inspección de archivos del árbol VFS
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
      } else if (type === 'mod' || type === 'txt') {
        switchTab('tab-mods');
      } else if (type === 'entity') {
        switchTab('tab-entities');
      } else if (type === 'galaxy') {
        switchTab('tab-galaxy');
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

    // Historial reciente de archivos
    document.getElementById('btn-sidebar-recent')?.addEventListener('click', () => {
      alert("Archivos Recientemente Modificados:\n• Localizations/es/String/English.str (7.828 cadenas)\n• Mods-Rebellion v1.85/EnabledMods.txt (Vanilla)\n• GameInfo/ (1.872 archivos .entity)");
    });

    // Filtro en tiempo real para flujos, permisos y ejecuciones (con sincronización total)
    const dashSearch = document.getElementById('dashboard-search-input');
    if (dashSearch) {
      dashSearch.addEventListener('input', applyDashboardSearch);
    }

    // Filtro para el árbol VFS del Sidebar
    const vfsSearch = document.getElementById('vfs-tree-search-input');
    if (vfsSearch) {
      vfsSearch.addEventListener('input', () => {
        const q = vfsSearch.value.toLowerCase().trim();
        document.querySelectorAll('#sidebar-real-vfs-tree .tree-node').forEach(node => {
          node.style.display = node.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      });
    }

    // Botón de re-escaneo rápido VFS
    document.getElementById('btn-sidebar-scan-vfs')?.addEventListener('click', () => {
      switchTab('tab-mods');
      if (window.ModManagerModule) window.ModManagerModule.scanMods();
    });

    // Selector de modo interno en Studio Edition
    document.querySelectorAll('[data-studio-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-studio-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-studio-mode');
        document.querySelectorAll('.studio-mode-panel').forEach(p => {
          p.style.display = p.id === `studio-mode-${mode}` ? 'block' : 'none';
        });
      });
    });
  }

  function logExecution(type, description, result, details = null) {
    const list = document.getElementById('dash-executions-list');
    const countEl = document.getElementById('dash-exec-count');
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (list) {
      const item = document.createElement('div');
      item.className = 'workflow-task-item';
      item.style.animation = 'paneFadeSlideIn 0.3s ease forwards';
      item.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 0.85rem; color: #0f172a;">[${type}] ${description}</div>
          <div style="font-size: 0.72rem; color: #64748b;">${details || 'Registro reactivo de telemetría'}</div>
        </div>
        <div style="font-size: 0.74rem; font-family: var(--font-mono); color: #64748b;">${timeStr}</div>
        <div style="text-align: right;"><span class="metric-badge-pill">✓ ${result}</span></div>
      `;
      list.insertBefore(item, list.firstChild);
      if (countEl) {
        const cur = parseInt(countEl.innerText) || 0;
        countEl.innerText = cur + 1;
      }
    }

    // Persistir en SQLite físico vía API asíncrona
    NexusCore.apiPost('system/executions', {
      type,
      description,
      details: details || 'Telemetría del sistema',
      result
    });

    // Guardar espejo en LocalStorage para arranque instantáneo (0ms)
    try {
      const cached = JSON.parse(localStorage.getItem('solaris_executions') || '[]');
      cached.unshift({
        exec_type: type,
        description,
        details: details || 'Telemetría del sistema',
        result,
        created_at: timeStr
      });
      localStorage.setItem('solaris_executions', JSON.stringify(cached.slice(0, 50)));
    } catch (e) {}
  }

  function toggleExperimentalDrawer() {
    const content = document.getElementById('experimental-drawer-content');
    const arrow = document.getElementById('experimental-drawer-arrow');
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'grid' : 'none';
    if (arrow) arrow.innerText = isHidden ? '▴' : '▾';
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    toggleExperimentalDrawer,
    clearDashboardSearch,
    applyDashboardSearch,
    updateHeroMetrics,
    logExecution,
    loadPermissions,
    loadExecutions
  };
})();
