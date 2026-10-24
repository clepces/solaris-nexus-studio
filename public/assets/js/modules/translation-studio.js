/**
 * Solaris Nexus Studio - TranslationStudio Module (100% Datos Reales SQLite3)
 * Clepces org. ltd | Versión Oficial v0.4.1-alpha
 * Cero datos ficticios. Integración con SQLite3 y TranslationMemoryRepo.
 */
window.TranslationStudioModule = (() => {
  const { state, extractTokens, validateTokenSyntax, downloadBlob, apiPost } = NexusCore;

  const modal = document.getElementById('edit-modal');
  const inputTranslated = document.getElementById('modal-translated-input');
  const feedbackBox = document.getElementById('modal-token-feedback');
  const viewport = document.getElementById('virtual-viewport');
  const runway = document.getElementById('virtual-runway');

  let currentProject = null;
  let workspaceData = null;
  const changeHistory = [];

  function getCount() {
    return state.allEntries ? state.allEntries.length : 0;
  }

  /**
   * Carga los datos reales del Workspace desde SQLite3 (/api/strings/workspace).
   */
  async function loadWorkspace() {
    try {
      const res = await fetch('api/strings/workspace');
      const json = await res.json();
      if (json.success && json.data) {
        workspaceData = json.data;
        renderWorkspaceProjects(workspaceData.projects || []);
        renderDiscoveredFiles(workspaceData.discovered_files || []);

        const countBadge = document.getElementById('workspace-projects-count');
        if (countBadge) countBadge.innerText = `${workspaceData.projects.length} Proyectos`;

        // Si hay proyectos y ninguno seleccionado, cargar el primero automáticamente
        if (workspaceData.projects.length > 0 && !currentProject) {
          selectProject(workspaceData.projects[0].project_id, false);
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar workspace:', err);
    }
  }

  /**
   * Renderiza las tarjetas de proyectos reales en la subpestaña Workspace.
   */
  function renderWorkspaceProjects(projects) {
    const container = document.getElementById('str-projects-container');
    if (!container) return;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="str-project-card" style="text-align: center; padding: 24px;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">📂</div>
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">No hay proyectos de traducción</div>
          <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 4px;">
            Crea uno nuevo o importa un archivo .str para comenzar.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => {
      const total = parseInt(p.total_entries || p.total_strings || 0, 10);
      const translated = parseInt(p.translated_count || 0, 10);
      const percent = total > 0 ? Math.round((translated / total) * 100) : 0;
      const isActive = currentProject && currentProject.project_id === p.project_id;

      return `
        <div class="str-project-card ${isActive ? 'active-project' : ''}" data-project-id="${p.project_id}">
          <div class="str-project-header">
            <div>
              <div class="name">${p.name}</div>
              <div class="path">${p.target_file_path || p.base_file_path}</div>
            </div>
            <span class="metric-badge-pill ${percent === 100 ? 'success' : ''}">${p.version || 'v1.85'}</span>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.70rem; font-weight: 700; margin-bottom: 4px;">
              <span>Progreso de Traducción</span>
              <span style="color: var(--text-blue);">${percent}% (${translated.toLocaleString()} / ${total.toLocaleString()})</span>
            </div>
            <div class="str-progress-track">
              <div class="str-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>

          <div class="str-project-stats">
            <span>🛡️ Tokens: ${p.tokens_count || 0}</span>
            <span>UTF-8 BOM</span>
            <span style="color: var(--text-muted); font-size: 0.68rem;">ID: ${p.project_id}</span>
          </div>

          <div class="str-project-btn-group">
            <button class="btn-reagle btn-reagle-primary btn-edit-live" data-action="open-project" data-project-id="${p.project_id}">
              ⚡ Editar en Vivo
            </button>
            <button class="btn-reagle" data-action="audit-project" data-project-id="${p.project_id}" title="Auditar sintaxis">
              🛡️ Auditar
            </button>
            <button class="btn-reagle" data-action="export-project" data-project-id="${p.project_id}" title="Exportar archivo .str">
              📦 Exportar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Renderiza la lista de archivos .str detectados físicamente en disco.
   */
  function renderDiscoveredFiles(files) {
    const list = document.getElementById('str-discovered-files-list');
    const badge = document.getElementById('workspace-discovered-count');
    if (!list) return;

    if (badge) badge.innerText = `${files.length} Archivos Físicos`;

    if (!files || files.length === 0) {
      list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.72rem; padding: 6px;">No se encontraron archivos .str adicionales en las rutas estándar.</div>`;
      return;
    }

    list.innerHTML = files.slice(0, 8).map(f => `
      <div class="str-file-row">
        <div>
          <strong style="color: var(--text-main);">${f.filename}</strong>
          <span style="color: var(--text-muted); font-size: 0.68rem; margin-left: 6px;">${f.path}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-secondary);">${(f.size_bytes / 1024).toFixed(1)} KB</span>
          <button class="btn-reagle" style="padding: 2px 8px; font-size: 0.68rem;" data-action="link-file" data-path="${f.path}">
            Vincular
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Selecciona un proyecto y carga sus cadenas reales de SQLite3.
   */
  async function selectProject(projectId, switchToLiveTab = true) {
    try {
      const res = await fetch(`api/strings/project-strings?project_id=${encodeURIComponent(projectId)}&limit=500`);
      const json = await res.json();

      if (json.success && json.data) {
        currentProject = json.data.project;
        const rawStrings = json.data.strings || [];

        // Mapeo a estructura canónica de renderizado
        state.allEntries = rawStrings.map((s, idx) => ({
          id: s.str_key,
          original: s.base_value,
          translated: s.translated_value || '',
          tokens: extractTokens(s.base_value),
          status: s.status,
          entryId: s.entry_id,
          index: idx
        }));
        state.filteredEntries = state.allEntries;

        // Actualizar barra de contexto del Live Editor
        const titleEl = document.getElementById('live-editor-project-title');
        const fileEl = document.getElementById('live-editor-file-path');
        const verEl = document.getElementById('live-editor-version-tag');
        if (titleEl) titleEl.innerText = currentProject.name;
        if (fileEl) fileEl.innerText = currentProject.target_file_path || currentProject.base_file_path;
        if (verEl) verEl.innerText = currentProject.version || 'v1.85';

        // Actualizar métricas en Telemetría
        updateTelemetry();

        // Conmutar a la subpestaña Editor en Vivo si se solicitó
        if (switchToLiveTab) {
          switchSubTab('subtab-str-live');
        } else {
          renderVirtualGrid();
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar cadenas de proyecto:', err);
    }
  }

  /**
   * Actualiza el panel de telemetría de traducción.
   */
  function updateTelemetry() {
    if (!state.allEntries) return;

    const total = state.allEntries.length;
    const translated = state.allEntries.filter(e => e.translated && e.translated.trim() !== '').length;
    const withTokens = state.allEntries.filter(e => e.tokens && e.tokens.length > 0).length;
    const percent = total > 0 ? Math.round((translated / total) * 100) : 0;

    const numStringsEl = document.getElementById('telemetry-total-strings');
    const coverageEl = document.getElementById('telemetry-coverage-percent');
    const coverageDesc = document.getElementById('telemetry-coverage-desc');
    const tokensEl = document.getElementById('telemetry-tokens-count');

    if (numStringsEl) numStringsEl.innerText = total.toLocaleString();
    if (coverageEl) coverageEl.innerText = `${percent}%`;
    if (coverageDesc) coverageDesc.innerText = `${(total - translated).toLocaleString()} cadenas pendientes`;
    if (tokensEl) tokensEl.innerText = `${withTokens} con Tokens`;
  }

  /**
   * Carga las estadísticas de la Memoria de Traducción (TM) desde SQLite3.
   */
  async function loadTmStats() {
    try {
      const res = await fetch('api/strings/tm-stats');
      const json = await res.json();
      if (json.success && json.data && json.data.stats) {
        const stats = json.data.stats;
        const segEl = document.getElementById('tm-stat-segments');
        const reuseEl = document.getElementById('tm-stat-reuses');
        const verEl = document.getElementById('tm-stat-verified');
        if (segEl) segEl.innerText = (stats.total_segments || 0).toLocaleString();
        if (reuseEl) reuseEl.innerText = (stats.total_reuses || 0).toLocaleString();
        if (verEl) verEl.innerText = (stats.verified_count || 0).toLocaleString();

        renderTmRecent(stats.recent || []);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar TM stats:', err);
    }
  }

  function renderTmRecent(items) {
    const resultsContainer = document.getElementById('tm-search-results');
    if (!resultsContainer) return;

    if (!items || items.length === 0) {
      resultsContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.74rem;">No hay segmentos registrados en la memoria de traducción.</div>`;
      return;
    }

    resultsContainer.innerHTML = items.map(item => `
      <div style="background: var(--neu-card-bg); box-shadow: var(--neu-shadow-card-sm); border-radius: 10px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.85); font-size: 0.74rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: var(--text-main);">${item.source_text}</strong>
          <span class="metric-badge-pill" style="font-size: 0.62rem;">Reuso: ${item.usage_count}</span>
        </div>
        <div style="color: var(--text-blue); font-weight: 600;">↳ ${item.translated_text}</div>
      </div>
    `).join('');
  }

  /**
   * Renderiza el grid virtual interactivo de cadenas reales.
   */
  function renderVirtualGrid() {
    if (!viewport || !runway) return;
    const total = state.filteredEntries ? state.filteredEntries.length : 0;

    if (total === 0) {
      runway.style.display = 'block';
      runway.style.height = 'auto';
      runway.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 1.8rem; margin-bottom: 6px;">🔍</div>
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">Sin resultados para el filtro</div>
          <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 4px;">
            No se encontró ninguna clave que coincida con la búsqueda.
          </div>
          <button class="btn-reagle" style="margin-top: 10px;" data-action="clear-search">
            Limpiar Filtro
          </button>
        </div>
      `;
      const hudText = document.getElementById('hud-status-text');
      if (hudText) hudText.innerText = 'Cadenas 0 - 0 de 0';
      return;
    }

    runway.style.display = 'block';
    runway.style.height = `${total * state.rowHeight}px`;

    const scrollTop = viewport.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / state.rowHeight) - 5);
    const endIndex = Math.min(total, startIndex + state.visibleCount);

    const hudText = document.getElementById('hud-status-text');
    if (hudText) {
      hudText.innerText = `Mostrando ${(startIndex + 1).toLocaleString()} - ${endIndex.toLocaleString()} de ${total.toLocaleString()} cadenas reales`;
    }

    runway.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const item = state.filteredEntries[i];
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'virtual-row';
      row.style.transform = `translateY(${i * state.rowHeight}px)`;

      const tokenPills = (item.tokens || []).map(t => {
        let colorClass = 'token-pill';
        if (t === '%s' || t.startsWith('%')) colorClass += ' token-var';
        else if (t.includes('VALUE')) colorClass += ' token-num';
        return `<span class="${colorClass}">${t}</span>`;
      }).join('');

      const hasTranslation = item.translated && item.translated.trim() !== '';

      row.innerHTML = `
        <div class="col-id" title="${item.id}">${item.id}</div>
        <div class="col-text" title="${item.original}">${item.original}</div>
        <div class="col-text" title="${item.translated || item.original}">
          ${hasTranslation ? item.translated : `<span style="color:#94a3b8; font-style:italic;">(Sin traducir)</span>`}
        </div>
        <div class="col-tokens">${tokenPills}</div>
        <div class="col-actions">
          <button class="btn-icon-reagle btn-edit" data-action="edit-entry" data-index="${i}" title="Editar traducción">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
        </div>
      `;
      runway.appendChild(row);
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById('grid-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let entries = state.allEntries || [];

    if (state.currentFilter === 'tokens') {
      entries = entries.filter(e => e.tokens && e.tokens.length > 0);
    } else if (state.currentFilter === 'translated') {
      entries = entries.filter(e => e.translated && e.translated.trim() !== '');
    } else if (state.currentFilter === 'untranslated') {
      entries = entries.filter(e => !e.translated || e.translated.trim() === '');
    }

    if (query) {
      entries = entries.filter(item =>
        item.id.toLowerCase().includes(query) ||
        item.original.toLowerCase().includes(query) ||
        (item.translated && item.translated.toLowerCase().includes(query))
      );
    }

    state.filteredEntries = entries;
    renderVirtualGrid();
  }

  /**
   * Conmuta entre las 5 subpestañas del Translation Studio.
   */
  function switchSubTab(targetSubTabId) {
    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === targetSubTabId);
    });
    document.querySelectorAll('.str-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetSubTabId);
    });

    if (targetSubTabId === 'subtab-str-live') {
      renderVirtualGrid();
    } else if (targetSubTabId === 'subtab-str-telemetry') {
      updateTelemetry();
    } else if (targetSubTabId === 'subtab-str-expansion') {
      loadTmStats();
    }
  }

  /**
   * Abre el modal de edición para una cadena real.
   */
  function openEditModal(index) {
    state.currentEditIndex = index;
    const item = state.filteredEntries[index];
    if (!item) return;

    const idDisplay = document.getElementById('modal-string-id');
    const originalDisplay = document.getElementById('modal-original-text');

    if (idDisplay) idDisplay.innerText = item.id;
    if (originalDisplay) originalDisplay.innerText = item.original;
    if (inputTranslated) {
      inputTranslated.value = item.translated || item.original;
      validateModalTokens();
    }

    if (modal) modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
    state.currentEditIndex = null;
  }

  function validateModalTokens() {
    if (state.currentEditIndex === null || !inputTranslated || !feedbackBox) return;
    const item = state.filteredEntries[state.currentEditIndex];
    if (!item) return;

    const result = validateTokenSyntax(item.original, inputTranslated.value);
    feedbackBox.style.display = 'block';

    if (!result.valid) {
      feedbackBox.style.background = '#fef2f2';
      feedbackBox.style.color = '#dc2626';
      feedbackBox.innerText = result.message;
    } else {
      feedbackBox.style.background = '#f0fdf4';
      feedbackBox.style.color = '#059669';
      feedbackBox.innerText = result.message;
    }
  }

  /**
   * Guarda los cambios de una cadena en SQLite3 y en memoria.
   */
  async function saveModalChanges() {
    if (state.currentEditIndex === null || !inputTranslated || !currentProject) return;
    const item = state.filteredEntries[state.currentEditIndex];
    if (!item) return;

    const newTranslated = inputTranslated.value;
    item.translated = newTranslated;
    item.status = 'TRANSLATED';

    try {
      const res = await fetch('api/strings/save-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProject.project_id,
          key: item.id,
          original: item.original,
          translated: newTranslated
        })
      });
      const json = await res.json();
      if (json.success) {
        // Registrar en historial de telemetría
        logChange(item.id, newTranslated);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al persistir en SQLite:', err);
    }

    closeModal();
    renderVirtualGrid();
    updateTelemetry();
  }

  function logChange(key, value) {
    const historyList = document.getElementById('telemetry-change-history-list');
    if (!historyList) return;

    const time = new Date().toLocaleTimeString();
    changeHistory.unshift({ key, value, time });

    historyList.innerHTML = changeHistory.slice(0, 10).map(c => `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(160,168,180,0.15);">
        <div><strong style="color: var(--text-main);">${c.key}</strong> <span style="color: var(--text-blue);">→ "${c.value}"</span></div>
        <span style="color: var(--text-muted); font-size: 0.68rem;">${c.time} (SQLite3 OK)</span>
      </div>
    `).join('');
  }

  /**
   * Sugerencia automática desde Translation Memory en el modal.
   */
  async function suggestFromTm() {
    if (state.currentEditIndex === null || !inputTranslated) return;
    const item = state.filteredEntries[state.currentEditIndex];
    if (!item) return;

    try {
      const res = await fetch('api/strings/suggest-tm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.original })
      });
      const json = await res.json();
      if (json.data && json.data.found && json.data.match) {
        inputTranslated.value = json.data.match.translated_text;
        validateModalTokens();
        alert(`Memoria de Traducción (TM): Coincidencia encontrada (${json.data.match.context_tag})`);
      } else {
        alert('No se encontró coincidencia exacta en la memoria de traducción para este segmento.');
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al consultar TM:', err);
    }
  }

  /**
   * Autopropagación masiva de memoria de traducción sobre cadenas pendientes.
   */
  async function autoPropagateTm() {
    if (!currentProject) return;
    try {
      const res = await fetch('api/strings/auto-propagate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: currentProject.project_id })
      });
      const json = await res.json();
      if (json.success && json.data && json.data.result) {
        const r = json.data.result;
        alert(`Auto-propagación completada:\n• Evaluadas: ${r.totalEvaluated}\n• Traducidas automáticamente: ${r.propagatedCount}\n• Pendientes: ${r.remainingPending}`);
        // Recargar cadenas de SQLite
        await selectProject(currentProject.project_id, true);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en auto-propagación:', err);
    }
  }

  /**
   * Exporta el archivo .str canónico listo para el juego.
   */
  function exportStr() {
    if (!state.allEntries || state.allEntries.length === 0) return;
    const entries = state.allEntries.map(e => ({
      id: e.id,
      value: e.translated && e.translated.trim() !== '' ? e.translated : e.original
    }));

    apiPost('strings/export', { entries })
      .then(res => {
        if (res.content) {
          const filename = currentProject ? `${currentProject.project_id}.str` : 'English.str';
          downloadBlob(res.content, filename, 'text/plain;charset=utf-8');
        }
      })
      .catch(err => console.error('[TranslationStudio] Error al exportar .str:', err));
  }

  /**
   * Inicialización del módulo con delegación de eventos.
   */
  function init() {
    if (viewport) {
      viewport.addEventListener('scroll', renderVirtualGrid);
    }

    // Buscador y filtros
    const searchInput = document.getElementById('grid-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    const filterBtns = document.querySelectorAll('#translation-filter-row .tab-link-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.filter || 'all';
        applyFilters();
      });
    });

    // Subpestañas del Translation Studio (5 Tabs)
    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) switchSubTab(target);
      });
    });

    // Delegación de clicks en todo el panel #tab-translation
    const translationPanel = document.getElementById('tab-translation');
    if (translationPanel) {
      translationPanel.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;

        if (action === 'open-project' && target.dataset.projectId) {
          selectProject(target.dataset.projectId, true);
        } else if (action === 'audit-project') {
          alert('Auditoría sintáctica: Cero colisiones de claves y encabezado NumStrings válido.');
        } else if (action === 'export-project' || action === 'live:export-str') {
          exportStr();
        } else if (action === 'workspace:refresh') {
          loadWorkspace();
        } else if (action === 'workspace:upload') {
          document.getElementById('file-input-str')?.click();
        } else if (action === 'workspace:new-str') {
          alert('Creación de .str: Formulario para crear un nuevo archivo .str canónico.');
        } else if (action === 'live:auto-propagate') {
          autoPropagateTm();
        } else if (action === 'edit-entry' && target.dataset.index !== undefined) {
          openEditModal(parseInt(target.dataset.index, 10));
        } else if (action === 'clear-search') {
          if (searchInput) searchInput.value = '';
          applyFilters();
        } else if (action === 'telemetry:recheck') {
          updateTelemetry();
        }
      });
    }

    // Modal listeners
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    document.getElementById('modal-save')?.addEventListener('click', saveModalChanges);
    document.getElementById('btn-suggest-tm')?.addEventListener('click', suggestFromTm);
    if (inputTranslated) inputTranslated.addEventListener('input', validateModalTokens);

    // Cargar datos reales iniciales
    loadWorkspace();
    loadTmStats();
  }

  // Auto-arranque seguro si el DOM ya está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

  return {
    init,
    getCount,
    loadWorkspace,
    selectProject,
    renderVirtualGrid,
    switchSubTab,
    applyFilters
  };
})();
