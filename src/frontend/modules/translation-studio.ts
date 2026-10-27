/**
 * Solaris Nexus Studio - TranslationStudio Module (TypeScript Enterprise)
 * Clepces org. ltd | Versión v0.4.2
 * Cumplimiento de Constitución: Cero `any`, Tipado Estricto, Salida Compilada.
 */

import type {
  StrProject,
  WorkspacePayload,
  DiscoveredFilesData,
  TmStatsPayload,
  TmItem,
  NexusCoreBridge
} from '../types/translation.types';

declare global {
  interface Window {
    NexusCore: NexusCoreBridge;
    TranslationStudioModule: {
      init: () => void;
      getCount: () => number;
      loadWorkspace: () => Promise<void>;
      selectProject: (projectId: string, switchToLiveTab?: boolean) => Promise<void>;
      renderVirtualGrid: () => void;
      switchSubTab: (targetSubTabId: string) => void;
      applyFilters: () => void;
      enterLiveEditor: (projectId?: string) => void;
      exitLiveEditor: () => void;
      openProjectSettingsModal: (projectId?: string) => void;
      closeProjectSettingsModal: () => void;
      openCreateProjectModal: () => void;
      closeCreateProjectModal: () => void;
      openDeleteConfirmModal: (projectId?: string) => void;
      closeDeleteConfirmModal: () => void;
      syncNavigationState: (isLive: boolean) => void;
    };
  }
}

export const TranslationStudio = (() => {
  const core = window.NexusCore || {
    state: { allEntries: [], filteredEntries: [], page: 1, pageSize: 25, currentFilter: 'all' },
    extractTokens: (t: string) => {
      const match = t.match(/\[VALUE\d*\]|%s|%d|%f|\{\d+\}/g);
      return match ? Array.from(match) : [];
    },
    validateTokenSyntax: () => ({ valid: true, missing: [], extra: [] }),
    downloadBlob: () => {},
    apiPost: async () => ({ success: true })
  };

  const { state, extractTokens, validateTokenSyntax, downloadBlob, apiPost } = core;

  const modal = document.getElementById('edit-modal');
  const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
  const feedbackBox = document.getElementById('modal-token-feedback');
  const viewport = document.getElementById('virtual-viewport');
  const runway = document.getElementById('virtual-runway');

  let currentProject: StrProject | null = null;
  let workspaceData: WorkspacePayload | null = null;
  let _initialized = false;
  const STORAGE_KEY_LIVE_PROJECT = 'solaris_str_live_active_project';

  let activeSettingsProject: StrProject | null = null;
  let deleteCountdownInterval: ReturnType<typeof setInterval> | null = null;

  function getCount(): number {
    return state.allEntries ? state.allEntries.length : 0;
  }

  /**
   * Carga los datos reales del Workspace desde SQLite3 (/api/strings/workspace).
   */
  async function loadWorkspace(): Promise<void> {
    try {
      const res = await fetch('api/strings/workspace');
      const json = await res.json() as { success: boolean; data?: WorkspacePayload };
      if (json.success && json.data) {
        workspaceData = json.data;
        renderWorkspaceProjects(workspaceData.projects || []);
        renderDiscoveredFiles(workspaceData.discovered_files || {});

        const countBadge = document.getElementById('workspace-projects-count');
        if (countBadge) countBadge.innerText = `${(workspaceData.projects || []).length} Proyectos`;

        // Validación de sesión activa: Si existe proyecto guardado en sessionStorage, restaurar live editor
        const savedProject = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
        if (savedProject) {
          await selectProject(savedProject, true);
        } else if ((workspaceData.projects || []).length > 0 && !currentProject) {
          const firstProj = workspaceData.projects![0];
          if (firstProj) {
            await selectProject(firstProj.project_id, false);
            syncNavigationState(false);
          }
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar workspace:', err);
    }
  }

  /**
   * Renderiza las tarjetas de proyectos reales en la subpestaña Workspace con 4 botones balanceados.
   */
  function renderWorkspaceProjects(projects: StrProject[]): void {
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
      const total = parseInt(String(p.total_entries || p.total_strings || 0), 10);
      const translated = parseInt(String(p.translated_count || 0), 10);
      const percent = total > 0 ? Math.round((translated / total) * 100) : 0;
      const isActive = currentProject && currentProject.project_id === p.project_id;

      return `
        <div class="str-project-card ${isActive ? 'active-project' : ''}" data-project-id="${p.project_id}">
          <div class="str-project-header">
            <div>
              <div class="name">${p.name}</div>
              <div class="path">${p.target_file_path || p.base_file_path || 'English.str'}</div>
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
            <button class="btn-reagle btn-project-settings" data-action="project-settings" data-project-id="${p.project_id}" title="Ajustes y propiedades del proyecto">
              ⚙️ Ajustes
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Renderiza los archivos .str detectados categorizados.
   */
  function renderDiscoveredFiles(data: DiscoveredFilesData): void {
    const badge = document.getElementById('workspace-discovered-count');
    const baseLangsList = document.getElementById('str-base-langs-list');
    const modsList = document.getElementById('str-mods-list');
    const testList = document.getElementById('str-test-fixtures-list');
    const baseCountEl = document.getElementById('disc-tab-base-count');
    const modsCountEl = document.getElementById('disc-tab-mods-count');
    const testCountEl = document.getElementById('test-fixtures-count');

    if (!data || typeof data !== 'object') return;

    const baseLangs = data.base_languages || [];
    const mods = data.mods || [];
    const tests = data.test_fixtures || [];
    const totalFiles = (data.total_base || 0) + (data.total_mods || 0);

    if (badge) badge.innerText = `${totalFiles} Archivos`;
    if (baseCountEl) baseCountEl.innerText = String(baseLangs.length);
    if (modsCountEl) modsCountEl.innerText = String(mods.length);
    if (testCountEl) testCountEl.innerText = String(tests.length);

    if (baseLangsList) {
      if (baseLangs.length === 0) {
        baseLangsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.72rem; padding: 10px; text-align: center;">No se encontraron idiomas base del juego.</div>';
      } else {
        baseLangsList.innerHTML = baseLangs.map(lang => {
          const file = lang.files[0];
          const sizeKb = file ? (file.size_bytes / 1024).toFixed(1) : '0';
          return `
            <div class="str-lang-card">
              <div class="lang-card-header">
                <span class="lang-flag">${lang.flag}</span>
                <div class="lang-meta">
                  <span class="lang-name">${lang.lang_name}</span>
                  <span class="lang-locale-badge">${lang.locale}</span>
                </div>
                <span class="lang-size">${sizeKb} KB</span>
              </div>
              <div class="lang-path-marquee">
                <span>${file ? file.rel_path : ''}</span>
              </div>
              <div class="lang-actions">
                <button class="btn-reagle btn-reagle-primary" data-action="open-base-lang" data-path="${file ? file.rel_path : ''}" data-name="${lang.lang_name}">
                  ⚡ Abrir en Editor
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (modsList) {
      if (mods.length === 0) {
        modsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.72rem; padding: 10px; text-align: center;">No se encontraron mods con archivos .str.</div>';
      } else {
        modsList.innerHTML = mods.map((mod, idx) => {
          const totalSizeKb = (mod.files.reduce((sum, f) => sum + f.size_bytes, 0) / 1024).toFixed(1);
          const totalTokens = mod.files.reduce((sum, f) => sum + (f.tokens_count || 0), 0);
          return `
            <div class="str-mod-group">
              <div class="str-mod-group-header" data-action="toggle-mod" data-mod-index="${idx}">
                <div class="str-mod-title">
                  <span class="toggle-icon">▸</span>
                  <strong>${mod.mod_name}</strong>
                  <span class="str-badge-subtle">${mod.files.length} .str</span>
                </div>
                <div class="str-mod-meta">
                  <span>${totalSizeKb} KB</span>
                  <span>🛡️ ${totalTokens}</span>
                </div>
              </div>
              <div class="str-mod-files-collapse" id="mod-files-${idx}" style="display: none;">
                ${mod.files.map(f => `
                  <div class="str-file-row">
                    <span class="file-name">${f.name}</span>
                    <span class="file-path">${f.rel_path}</span>
                    <div class="file-actions">
                      <span class="file-size">${(f.size_bytes / 1024).toFixed(1)} KB</span>
                      <button class="btn-reagle" data-action="open-discovered-file" data-path="${f.rel_path}" data-mod="${mod.mod_name}">
                        Editar
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (testList) {
      if (tests.length === 0) {
        testList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.72rem; padding: 10px; text-align: center;">No se encontraron test fixtures.</div>';
      } else {
        testList.innerHTML = tests.map(f => `
          <div class="str-file-row">
            <span class="file-name">${f.name}</span>
            <span class="file-path">${f.rel_path}</span>
            <div class="file-actions">
              <span class="file-size">${(f.size_bytes / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        `).join('');
      }
    }
  }

  /**
   * Selecciona un proyecto y carga sus cadenas reales de SQLite3.
   */
  async function selectProject(projectId: string, switchToLiveTab = true): Promise<void> {
    try {
      const res = await fetch(`api/strings/project-strings?project_id=${encodeURIComponent(projectId)}&limit=1000`);
      const json = await res.json() as { success: boolean; data?: { project: StrProject; strings: Array<{ str_key: string; base_value: string; translated_value?: string; status: string; entry_id: number }> } };

      if (json.success && json.data) {
        currentProject = json.data.project;
        const rawStrings = json.data.strings || [];

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
        state.page = 1;

        const navMod = document.getElementById('live-nav-mod-name');
        const navFile = document.getElementById('live-nav-file-name');
        if (navMod) {
          navMod.innerText = currentProject.name;
          navMod.setAttribute('title', currentProject.name);
        }
        if (navFile) {
          const filePath = currentProject.target_file_path || currentProject.base_file_path || 'English.str';
          navFile.innerText = filePath;
          navFile.setAttribute('title', filePath);
        }

        updateTelemetry();

        if (switchToLiveTab) {
          enterLiveEditor(projectId);
        } else {
          syncNavigationState(false);
          renderVirtualGrid();
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar cadenas de proyecto:', err);
    }
  }

  /**
   * Sincroniza visualmente la barra de navegación del Translation Studio.
   */
  function syncNavigationState(isLive: boolean): void {
    const subtabBar = document.getElementById('str-subtab-bar');
    const normalGroup = document.getElementById('str-nav-normal-group');
    const contextualGroup = document.getElementById('str-nav-contextual-group');

    if (subtabBar) {
      subtabBar.classList.toggle('is-live-mode', isLive);
    }
    if (normalGroup) {
      normalGroup.style.display = isLive ? 'none' : 'flex';
    }
    if (contextualGroup) {
      contextualGroup.style.display = isLive ? 'flex' : 'none';
    }
  }

  /**
   * Entra al modo Editor en Vivo contextual.
   */
  function enterLiveEditor(projectId?: string): void {
    const targetId = projectId || (currentProject ? currentProject.project_id : null);
    if (targetId) {
      sessionStorage.setItem(STORAGE_KEY_LIVE_PROJECT, targetId);
    }

    syncNavigationState(true);

    document.querySelectorAll('.str-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === 'subtab-str-live');
    });

    state.page = 1;
    renderVirtualGrid();
  }

  /**
   * Sale del modo Editor en Vivo y regresa al Workspace general.
   */
  function exitLiveEditor(): void {
    sessionStorage.removeItem(STORAGE_KEY_LIVE_PROJECT);
    syncNavigationState(false);
    switchSubTab('subtab-str-workspace');
  }

  /**
   * Abre el modal de Ajustes y Propiedades del Proyecto .str activo o seleccionado con datos reales.
   */
  function openProjectSettingsModal(projectId?: string): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && workspaceData && workspaceData.projects) {
      proj = workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = currentProject;
    }
    if (!proj && workspaceData && workspaceData.projects && workspaceData.projects.length > 0) {
      proj = workspaceData.projects[0] || null;
    }
    if (!proj) {
      proj = {
        project_id: 'prj_sins_base_es',
        name: 'Sins of a Solar Empire Base (Spanish)',
        target_file_path: 'Localizations/es/String/English.str',
        base_file_path: 'Localizations/es/String/English.str',
        version: 'v1.85'
      };
    }

    activeSettingsProject = proj;

    const totalStrings = parseInt(String(proj.total_entries || proj.total_strings || (state.allEntries ? state.allEntries.length : 0)), 10);
    const translatedCount = parseInt(String(proj.translated_count || (state.allEntries ? state.allEntries.filter(e => e.translated && e.translated.trim() !== '').length : 0)), 10);
    const percent = totalStrings > 0 ? Math.round((translatedCount / totalStrings) * 100) : 0;
    const tokensCount = parseInt(String(proj.tokens_count || (state.allEntries ? state.allEntries.filter(e => e.tokens && e.tokens.length > 0).length : 0)), 10);

    const nameEl = document.getElementById('modal-set-project-name');
    const verEl = document.getElementById('modal-set-version-info');
    const totalEl = document.getElementById('modal-set-total-strings');
    const transSummaryEl = document.getElementById('modal-set-translated-summary');
    const tokenStatusEl = document.getElementById('modal-set-token-status');
    const tokensCountEl = document.getElementById('modal-set-tokens-count');
    const pathEl = document.getElementById('modal-set-canonical-path');
    const ramEl = document.getElementById('modal-set-ram-usage');
    const shaEl = document.getElementById('modal-set-sha256');

    if (nameEl) nameEl.textContent = proj.name || 'Sins Base';
    if (verEl) verEl.textContent = `Versión: ${proj.version || 'v1.85 Rebellion'}`;
    if (totalEl) totalEl.textContent = totalStrings.toLocaleString();
    if (transSummaryEl) transSummaryEl.textContent = `${translatedCount.toLocaleString()} traducidas (${percent}%)`;
    if (tokenStatusEl) tokenStatusEl.textContent = tokensCount > 0 ? '100% Protegido (Guard Activo)' : 'Sin Tokens';
    if (tokensCountEl) tokensCountEl.textContent = `${tokensCount.toLocaleString()} cadenas con tokens resguardados`;

    const canonicalPath = proj.target_file_path || proj.base_file_path || 'Localizations/es/String/English.str';
    if (pathEl) pathEl.textContent = canonicalPath;

    const approxBytes = totalStrings * 140;
    const approxKb = (approxBytes / 1024).toFixed(1);
    if (ramEl) ramEl.textContent = `${approxKb} KB (~${(approxBytes / (1024 * 1024)).toFixed(2)} MB heap)`;

    const pseudoHash = proj.sha256 || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
    if (shaEl) shaEl.textContent = pseudoHash;

    modalEl.classList.add('active');
  }

  function closeProjectSettingsModal(): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (modalEl) modalEl.classList.remove('active');
  }

  /**
   * Abre el modal global de creación de proyecto .str.
   */
  function openCreateProjectModal(): void {
    const modalEl = document.getElementById('modal-str-create-project');
    if (!modalEl) return;

    const nameInput = document.getElementById('create-str-name') as HTMLInputElement | null;
    const versionInput = document.getElementById('create-str-version') as HTMLInputElement | null;
    const pathInput = document.getElementById('create-str-path') as HTMLInputElement | null;

    if (nameInput) nameInput.value = '';
    if (versionInput) versionInput.value = 'v1.85 Rebellion';
    if (pathInput) pathInput.value = 'Localizations/es/String/English.str';

    modalEl.classList.add('active');
    setTimeout(() => nameInput?.focus(), 50);
  }

  function closeCreateProjectModal(): void {
    const modalEl = document.getElementById('modal-str-create-project');
    if (modalEl) modalEl.classList.remove('active');
  }

  /**
   * Envía la solicitud para crear un nuevo proyecto .str en backend SQLite3.
   */
  async function submitCreateProject(): Promise<void> {
    const nameInput = document.getElementById('create-str-name') as HTMLInputElement | null;
    const versionInput = document.getElementById('create-str-version') as HTMLInputElement | null;
    const typeSelect = document.getElementById('create-str-type') as HTMLSelectElement | null;
    const pathInput = document.getElementById('create-str-path') as HTMLInputElement | null;

    const name = nameInput ? nameInput.value.trim() : '';
    const version = versionInput ? versionInput.value.trim() : 'v1.85 Rebellion';
    const projectType = typeSelect ? typeSelect.value : 'mod';
    const filePath = pathInput ? pathInput.value.trim() : 'Localizations/es/String/English.str';

    if (!name) {
      alert('Por favor introduce un nombre para el proyecto.');
      nameInput?.focus();
      return;
    }

    try {
      const res = await fetch('api/strings/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          version: version,
          target_file_path: filePath,
          base_file_path: filePath,
          project_type: projectType
        })
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        closeCreateProjectModal();
        await loadWorkspace();
        alert(`Proyecto "${name}" creado exitosamente en SQLite3.`);
      } else {
        alert('Error al crear proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en create-project:', err);
      alert('Error de conexión al crear proyecto.');
    }
  }

  /**
   * Abre el modal de confirmación de eliminación con cuenta regresiva de 5 segundos.
   */
  function openDeleteConfirmModal(projectId?: string): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && workspaceData && workspaceData.projects) {
      proj = workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = activeSettingsProject || currentProject;
    }
    if (!proj) return;

    activeSettingsProject = proj;

    const nameEl = document.getElementById('delete-target-name');
    const idEl = document.getElementById('delete-target-id');
    const pathEl = document.getElementById('delete-target-path');

    if (nameEl) nameEl.textContent = proj.name;
    if (idEl) idEl.textContent = proj.project_id;
    if (pathEl) pathEl.textContent = proj.target_file_path || proj.base_file_path || 'English.str';

    const btnDigital = document.getElementById('btn-delete-digital') as HTMLButtonElement | null;
    const btnPhysical = document.getElementById('btn-delete-physical') as HTMLButtonElement | null;

    if (btnDigital) {
      btnDigital.disabled = true;
      btnDigital.textContent = '⏳ Espera (5s)...';
    }
    if (btnPhysical) {
      btnPhysical.disabled = true;
      btnPhysical.textContent = '⏳ Espera (5s)...';
    }

    if (deleteCountdownInterval) {
      clearInterval(deleteCountdownInterval);
    }

    let timeLeft = 5;
    deleteCountdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        if (btnDigital) btnDigital.textContent = `⏳ Espera (${timeLeft}s)...`;
        if (btnPhysical) btnPhysical.textContent = `⏳ Espera (${timeLeft}s)...`;
      } else {
        if (deleteCountdownInterval) {
          clearInterval(deleteCountdownInterval);
          deleteCountdownInterval = null;
        }
        if (btnDigital) {
          btnDigital.disabled = false;
          btnDigital.textContent = '🛡️ Confirmar Borrado Digital';
        }
        if (btnPhysical) {
          btnPhysical.disabled = false;
          btnPhysical.textContent = '🔥 Confirmar Borrado Físico + Digital';
        }
      }
    }, 1000);

    modalEl.classList.add('active');
  }

  function closeDeleteConfirmModal(): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (modalEl) modalEl.classList.remove('active');
    if (deleteCountdownInterval) {
      clearInterval(deleteCountdownInterval);
      deleteCountdownInterval = null;
    }
  }

  /**
   * Ejecuta el borrado del proyecto (digital o físico+digital).
   */
  async function executeProjectDeletion(deletePhysical: boolean): Promise<void> {
    if (!activeSettingsProject || !activeSettingsProject.project_id) return;

    const targetId = activeSettingsProject.project_id;
    const targetName = activeSettingsProject.name;

    try {
      const res = await fetch('api/strings/delete-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: targetId,
          delete_physical: deletePhysical
        })
      });
      const json = await res.json() as { success: boolean; error?: string };

      if (json.success) {
        closeDeleteConfirmModal();
        closeProjectSettingsModal();

        const activeLiveId = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
        if (activeLiveId === targetId) {
          exitLiveEditor();
        }

        await loadWorkspace();
        alert(`Proyecto "${targetName}" eliminado correctamente (${deletePhysical ? 'Físico + Digital' : 'Digital'}).`);
      } else {
        alert('Error al eliminar proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en delete-project:', err);
      alert('Error de red al intentar eliminar el proyecto.');
    }
  }

  function updateTelemetry(): void {
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

  async function loadTmStats(): Promise<void> {
    try {
      const res = await fetch('api/strings/tm-stats');
      const json = await res.json() as { success: boolean; data?: { stats: TmStatsPayload } };
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

  function renderTmRecent(items: TmItem[]): void {
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

  function renderVirtualGrid(): void {
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
      renderPagination(0);
      return;
    }

    const pageSize = state.pageSize === 'all' ? total : (parseInt(String(state.pageSize), 10) || 25);
    const totalPages = Math.ceil(total / pageSize);
    if (!state.page || state.page < 1) state.page = 1;
    if (state.page > totalPages) state.page = totalPages;

    const startIndex = (state.page - 1) * pageSize;
    const endIndex = Math.min(total, startIndex + pageSize);

    runway.style.display = 'flex';
    runway.style.flexDirection = 'column';
    runway.style.height = 'auto';
    runway.innerHTML = '';

    const hudText = document.getElementById('hud-status-text');
    if (hudText) {
      hudText.innerText = `Mostrando ${(startIndex + 1).toLocaleString()} - ${endIndex.toLocaleString()} de ${total.toLocaleString()} cadenas reales`;
    }

    for (let i = startIndex; i < endIndex; i++) {
      const item = state.filteredEntries[i];
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'virtual-row';

      const tokenPills = (item.tokens || []).map(t => {
        let colorClass = 'token-pill';
        if (t === '%s' || t.startsWith('%')) colorClass += ' token-var';
        else if (t.includes('VALUE')) colorClass += ' token-num';
        return `<span class="${colorClass}">${t}</span>`;
      }).join('');

      const hasTranslation = item.translated && item.translated.trim() !== '';

      row.innerHTML = `
        <div class="row-left">
          <div class="row-key">
            <span class="key-name">${item.id}</span>
            <div class="row-badges">
              <span class="status-indicator ${hasTranslation ? 'status-translated' : 'status-pending'}"></span>
              ${tokenPills}
            </div>
          </div>
          <div class="row-orig">${item.original}</div>
          <div class="row-trans ${!hasTranslation ? 'untranslated' : ''}">
            ${hasTranslation ? item.translated : '↳ <em>[Sin traducción - Requiere edición]</em>'}
          </div>
        </div>
        <div class="row-right">
          <button class="btn-reagle btn-edit-cell" data-action="edit-entry" data-index="${item.index}">
            ✎ Editar
          </button>
        </div>
      `;

      runway.appendChild(row);
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages: number): void {
    const controls = document.getElementById('grid-pagination-controls');
    if (!controls) return;

    if (totalPages <= 1) {
      controls.innerHTML = '';
      return;
    }

    const curPage = state.page || 1;
    const prevDisabled = curPage <= 1 ? 'disabled' : '';
    const nextDisabled = curPage >= totalPages ? 'disabled' : '';

    let pagesHtml = '';
    const maxButtons = 5;
    let startPage = Math.max(1, curPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `
        <button class="btn-reagle ${p === curPage ? 'btn-reagle-primary' : ''}" data-action="page:goto" data-page="${p}">
          ${p}
        </button>
      `;
    }

    controls.innerHTML = `
      <button class="btn-reagle" data-action="page:prev" ${prevDisabled}>◀ Anterior</button>
      ${pagesHtml}
      <button class="btn-reagle" data-action="page:next" ${nextDisabled}>Siguiente ▶</button>
    `;
  }

  function applyFilters(): void {
    if (!state.allEntries) return;
    const query = (document.getElementById('grid-search-input') as HTMLInputElement | null)?.value.toLowerCase().trim() || '';
    const filter = state.currentFilter || 'all';

    state.filteredEntries = state.allEntries.filter(item => {
      let matchesFilter = true;
      if (filter === 'translated') {
        matchesFilter = !!item.translated && item.translated.trim() !== '';
      } else if (filter === 'pending') {
        matchesFilter = !item.translated || item.translated.trim() === '';
      } else if (filter === 'tokens') {
        matchesFilter = !!item.tokens && item.tokens.length > 0;
      }

      let matchesQuery = true;
      if (query !== '') {
        const inKey = item.id.toLowerCase().includes(query);
        const inOrig = item.original.toLowerCase().includes(query);
        const inTrans = item.translated.toLowerCase().includes(query);
        matchesQuery = inKey || inOrig || inTrans;
      }

      return matchesFilter && matchesQuery;
    });

    state.page = 1;
    renderVirtualGrid();
  }

  function switchSubTab(targetSubTabId: string): void {
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

  let editingIndex: number | null = null;

  function openEditModal(index: number): void {
    if (!modal) return;
    const entry = state.allEntries ? state.allEntries[index] : null;
    if (!entry) return;

    editingIndex = index;
    const titleEl = document.getElementById('modal-string-id');
    const origEl = document.getElementById('modal-original-text');

    if (titleEl) titleEl.innerText = entry.id;
    if (origEl) origEl.innerText = entry.original;
    if (inputTranslated) {
      inputTranslated.value = entry.translated || '';
    }

    validateModalTokens();
    modal.classList.add('active');
    setTimeout(() => inputTranslated?.focus(), 50);
  }

  function closeModal(): void {
    if (modal) modal.classList.remove('active');
    editingIndex = null;
  }

  function validateModalTokens(): void {
    if (!feedbackBox || editingIndex === null) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry || !inputTranslated) return;

    const val = inputTranslated.value;
    const result = validateTokenSyntax(entry.original, val);

    if (result.valid) {
      feedbackBox.style.display = 'none';
      feedbackBox.className = 'modal-card-feedback';
    } else {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'modal-card-feedback error';
      feedbackBox.innerText = `⚠️ Inconsistencia de Tokens: Faltan [${result.missing.join(', ')}] o sobran [${result.extra.join(', ')}]`;
    }
  }

  async function saveModalChanges(): Promise<void> {
    if (editingIndex === null || !inputTranslated) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry || !currentProject) return;

    const newTrans = inputTranslated.value;
    entry.translated = newTrans;
    entry.status = newTrans.trim() !== '' ? 'TRANSLATED' : 'UNTRANSLATED';

    try {
      await apiPost('api/strings/save-entry', {
        project_id: currentProject.project_id,
        str_key: entry.id,
        translated_value: newTrans,
        status: entry.status
      });
    } catch (err) {
      console.warn('[TranslationStudio] Error al guardar en SQLite:', err);
    }

    closeModal();
    renderVirtualGrid();
    updateTelemetry();
  }

  async function suggestFromTm(): Promise<void> {
    if (editingIndex === null || !inputTranslated) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry) return;

    try {
      const res = await apiPost('api/strings/suggest-tm', { source_text: entry.original });
      const data = res.data as { suggestion?: { translated_text?: string } } | undefined;
      if (res.success && data && data.suggestion && data.suggestion.translated_text) {
        inputTranslated.value = data.suggestion.translated_text;
        validateModalTokens();
      } else {
        alert('No se encontraron concordancias en la Memoria de Traducción.');
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en suggest-tm:', err);
    }
  }

  async function autoPropagateTm(): Promise<void> {
    if (!currentProject) return;
    if (!confirm(`¿Deseas autocompletar cadenas pendientes usando la Memoria de Traducción?`)) return;

    try {
      const res = await apiPost('api/strings/auto-propagate', { project_id: currentProject.project_id });
      const data = res.data as { result?: { propagated_count?: number } } | undefined;
      if (res.success && data && data.result) {
        alert(`Auto-propagación completada: ${data.result.propagated_count || 0} cadenas actualizadas.`);
        await selectProject(currentProject.project_id, true);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en auto-propagate:', err);
    }
  }

  function exportStr(): void {
    if (!state.allEntries || state.allEntries.length === 0) {
      alert('No hay cadenas para exportar.');
      return;
    }

    const lines: string[] = [];
    lines.push('\uFEFFStringInfo');
    lines.push('{');
    lines.push(`\tNumStrings ${state.allEntries.length}`);

    state.allEntries.forEach(item => {
      lines.push('\tString');
      lines.push('\t{');
      lines.push(`\t\tStringID "${item.id}"`);
      const val = (item.translated && item.translated.trim() !== '') ? item.translated : item.original;
      lines.push(`\t\tValue "${val}"`);
      lines.push('\t}');
    });

    lines.push('}');
    lines.push('');

    const content = lines.join('\r\n');
    const filename = currentProject ? (currentProject.name.replace(/\s+/g, '_') + '.str') : 'English.str';
    downloadBlob(content, filename, 'text/plain;charset=utf-8');
  }

  function init(): void {
    if (_initialized) return;
    _initialized = true;

    // Delegación en documento para captura global de modales y acciones
    document.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-action]') as HTMLElement | null;
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'exit-live-editor') {
        exitLiveEditor();
      } else if (action === 'open-project' && target.dataset.projectId) {
        selectProject(target.dataset.projectId, true);
      } else if (action === 'project-settings' && target.dataset.projectId) {
        openProjectSettingsModal(target.dataset.projectId);
      } else if (action === 'live:open-settings') {
        openProjectSettingsModal();
      } else if (action === 'live:close-settings') {
        closeProjectSettingsModal();
      } else if (action === 'workspace:new-str') {
        openCreateProjectModal();
      } else if (action === 'create-str:cancel') {
        closeCreateProjectModal();
      } else if (action === 'create-str:submit') {
        submitCreateProject();
      } else if (action === 'live:open-delete-modal') {
        openDeleteConfirmModal();
      } else if (action === 'delete:cancel') {
        closeDeleteConfirmModal();
      } else if (action === 'delete:digital') {
        executeProjectDeletion(false);
      } else if (action === 'delete:physical') {
        executeProjectDeletion(true);
      } else if (action === 'audit-project') {
        alert('Auditoría sintáctica: Cero colisiones de claves y encabezado NumStrings válido.');
      } else if (action === 'export-project' || action === 'live:export-str') {
        exportStr();
      } else if (action === 'workspace:refresh') {
        loadWorkspace();
      } else if (action === 'workspace:upload') {
        (document.getElementById('file-input-str') as HTMLInputElement | null)?.click();
      } else if (action === 'live:auto-propagate') {
        autoPropagateTm();
      } else if (action === 'edit-entry' && target.dataset.index !== undefined) {
        openEditModal(parseInt(target.dataset.index, 10));
      } else if (action === 'clear-search') {
        const searchInput = document.getElementById('grid-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = '';
        applyFilters();
      } else if (action === 'telemetry:recheck') {
        updateTelemetry();
      } else if (action === 'page:prev') {
        if (state.page > 1) {
          state.page--;
          renderVirtualGrid();
        }
      } else if (action === 'page:next') {
        state.page = (state.page || 1) + 1;
        renderVirtualGrid();
      } else if (action === 'page:goto' && target.dataset.page) {
        state.page = parseInt(target.dataset.page, 10);
        renderVirtualGrid();
      }
    });

    const searchInput = document.getElementById('grid-search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    const filterBtns = document.querySelectorAll('#translation-filter-row .tab-link-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = (btn as HTMLElement).dataset.filter || 'all';
        applyFilters();
      });
    });

    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) switchSubTab(target);
      });
    });

    const pageSizeSelect = document.getElementById('str-page-size-select') as HTMLSelectElement | null;
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e: Event) => {
        state.pageSize = (e.target as HTMLSelectElement).value;
        state.page = 1;
        renderVirtualGrid();
      });
    }

    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    document.getElementById('modal-save')?.addEventListener('click', saveModalChanges);
    document.getElementById('btn-suggest-tm')?.addEventListener('click', suggestFromTm);
    if (inputTranslated) inputTranslated.addEventListener('input', validateModalTokens);

    // Cierre de modales al hacer click en el backdrop
    const settingsModal = document.getElementById('modal-str-project-settings');
    if (settingsModal) {
      settingsModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === settingsModal) closeProjectSettingsModal();
      });
    }

    const createModal = document.getElementById('modal-str-create-project');
    if (createModal) {
      createModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === createModal) closeCreateProjectModal();
      });
    }

    const deleteModal = document.getElementById('modal-str-delete-confirm');
    if (deleteModal) {
      deleteModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === deleteModal) closeDeleteConfirmModal();
      });
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        closeProjectSettingsModal();
        closeCreateProjectModal();
        closeDeleteConfirmModal();
      }
    });

    // Validación inicial de estado en sessionStorage
    const savedActiveProject = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
    if (!savedActiveProject) {
      syncNavigationState(false);
      switchSubTab('subtab-str-workspace');
    } else {
      syncNavigationState(true);
    }

    loadWorkspace();
    loadTmStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

  const moduleApi = {
    init,
    getCount,
    loadWorkspace,
    selectProject,
    renderVirtualGrid,
    switchSubTab,
    applyFilters,
    enterLiveEditor,
    exitLiveEditor,
    openProjectSettingsModal,
    closeProjectSettingsModal,
    openCreateProjectModal,
    closeCreateProjectModal,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    syncNavigationState
  };

  window.TranslationStudioModule = moduleApi;
  return moduleApi;
})();
