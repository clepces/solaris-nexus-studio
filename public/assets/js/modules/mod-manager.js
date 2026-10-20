/**
 * Solaris Nexus Studio - ModManager Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.ModManagerModule = (() => {
  const { state, apiGet, apiPost } = NexusCore;

  const LAA_CEILING_MB = 3250;

  function switchSubTab(targetSubTabId) {
    document.querySelectorAll('.mod-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === targetSubTabId);
    });

    document.querySelectorAll('.mod-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetSubTabId);
    });
  }

  async function detectPlatforms() {
    const container = document.getElementById('platform-detection-list');
    if (!container) return;

    const res = await apiGet('mods/detect-platforms');
    if (res.success && res.data && res.data.platforms) {
      container.innerHTML = res.data.platforms.map(p => `
        <div class="platform-path-card ${p.exists ? 'detected' : 'not-found'}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 0.82rem; color: var(--text-main);">${p.platform}</span>
            <span class="metric-badge-pill ${p.exists ? '' : 'neutral'}">${p.exists ? '✓ RUTA DETECTADA' : 'NO INSTALADO'}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 3px; word-break: break-all;">
            ${p.path}
          </div>
          <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 4px;">
            ${p.description}
          </div>
        </div>
      `).join('');
    }
  }

  function renderModList() {
    const container = document.getElementById('mod-active-list');
    if (!container) return;
    container.innerHTML = '';

    state.activeMods.forEach((mod, idx) => {
      const card = document.createElement('div');
      card.className = 'mod-item-card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <span class="mod-priority-badge">${mod.priority}</span>
          <div style="min-width: 0;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${mod.name}
            </div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">
              Consumo RAM: <strong>${mod.ramMb} MB</strong> ${mod.isMinimod ? '· <span style="color:#059669; font-weight:700;">[MINIMOD]</span>' : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
          <button class="btn-icon-reagle btn-mod-up" data-idx="${idx}" title="Subir prioridad">▲</button>
          <button class="btn-icon-reagle btn-mod-down" data-idx="${idx}" title="Bajar prioridad">▼</button>
          <button class="btn-icon-reagle btn-mod-remove" data-idx="${idx}" style="color: #dc2626;" title="Desactivar">✕</button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.btn-mod-up').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        if (i > 0) {
          const temp = state.activeMods[i];
          state.activeMods[i] = state.activeMods[i - 1];
          state.activeMods[i - 1] = temp;
          recalculatePriorities();
          renderModList();
          updateRamMetrics();
        }
      });
    });

    container.querySelectorAll('.btn-mod-down').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        if (i < state.activeMods.length - 1) {
          const temp = state.activeMods[i];
          state.activeMods[i] = state.activeMods[i + 1];
          state.activeMods[i + 1] = temp;
          recalculatePriorities();
          renderModList();
          updateRamMetrics();
        }
      });
    });

    container.querySelectorAll('.btn-mod-remove').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-idx'), 10);
        state.activeMods.splice(i, 1);
        recalculatePriorities();
        renderModList();
        updateRamMetrics();
      });
    });

    updateRamMetrics();
  }

  function recalculatePriorities() {
    let p = 999;
    state.activeMods.forEach(m => {
      m.priority = p;
      p -= 10;
    });
  }

  function updateRamMetrics() {
    const totalRam = state.activeMods.reduce((acc, m) => acc + (m.ramMb || 0), 0);
    const pct = Math.min(100, Math.round((totalRam / LAA_CEILING_MB) * 100));

    const ramText = document.getElementById('ram-meter-text');
    const ramFill = document.getElementById('ram-meter-fill');
    const ramRisk = document.getElementById('ram-risk-badge');
    const miniRam = document.getElementById('mini-metric-ram');

    if (ramText) ramText.innerText = `${totalRam.toLocaleString()} MB / ${LAA_CEILING_MB.toLocaleString()} MB (${pct}%)`;
    if (miniRam) miniRam.innerText = `${totalRam.toLocaleString()} MB`;

    if (ramFill) {
      ramFill.style.width = `${pct}%`;
      ramFill.className = 'reagle-progress-fill';
      if (pct > 85) ramFill.classList.add('critical');
      else if (pct > 70) ramFill.classList.add('warning');
    }

    if (ramRisk) {
      if (pct > 85) {
        ramRisk.style.color = '#ef4444';
        ramRisk.style.background = 'rgba(239, 68, 68, 0.12)';
        ramRisk.innerText = 'ESTADO: CRÍTICO (Riesgo alto de MiniDump Crash al saltar entre sistemas estelares)';
      } else if (pct > 70) {
        ramRisk.style.color = '#d97706';
        ramRisk.style.background = 'rgba(217, 119, 6, 0.12)';
        ramRisk.innerText = 'ESTADO: ADVERTENCIA (Supervisar texturas de naves capitales)';
      } else {
        ramRisk.style.color = '#059669';
        ramRisk.style.background = 'rgba(5, 150, 105, 0.12)';
        ramRisk.innerText = 'ESTADO: SEGURO (Bajo riesgo de desbordamiento de memoria de 32 bits)';
      }
    }
  }

  async function scanMods() {
    const res = await apiGet('mods/scan');
    if (res.success && res.data && res.data.mods) {
      alert(`Se detectaron ${res.data.mods.length} mods instalados en el directorio activo.`);
    } else {
      alert('Escaneo completado. Verificando perfiles VFS activos.');
    }
  }

  async function saveVfsHierarchy() {
    const payload = {
      mods: state.activeMods.map(m => m.name)
    };
    const res = await apiPost('mods/save', payload);
    if (res.success) {
      alert('Jerarquía VFS guardada exitosamente en EnabledMods.txt con copia de seguridad atómica.');
    } else {
      alert('Aviso: Jerarquía VFS sincronizada localmente en sesión.');
    }
  }

  function injectCustomMinimod() {
    const nameInput = document.getElementById('input-minimod-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert('Introduce un nombre descriptivo para el minimod.');
      return;
    }

    state.activeMods.unshift({
      name: `[ES] ${name}`,
      priority: 999,
      isMinimod: true,
      ramMb: 15
    });

    recalculatePriorities();
    renderModList();
    if (nameInput) nameInput.value = '';
    switchSubTab('subtab-mods-catalog');
    alert(`Minimod [ES] ${name} inyectado con prioridad 999 en la cima de EnabledMods.txt.`);
  }

  function init() {
    document.querySelectorAll('.mod-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) switchSubTab(target);
      });
    });

    document.getElementById('btn-inject-minimod-action')?.addEventListener('click', injectCustomMinimod);
    document.getElementById('btn-scan-platforms')?.addEventListener('click', detectPlatforms);

    renderModList();
    detectPlatforms();
  }

  return {
    init,
    switchSubTab,
    renderModList,
    scanMods,
    saveVfsHierarchy,
    detectPlatforms
  };
})();
