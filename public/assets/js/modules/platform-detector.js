/**
 * Solaris Nexus Studio - PlatformDetector Module
 * Clepces org. ltd | Versión Oficial v0.4.1.0-alpha
 */
window.PlatformDetector = (() => {
  async function detectPlatforms() {
    const container = document.getElementById('platform-detection-list');
    if (!container) return;

    const res = await NexusCore.apiGet('mods/detect-platforms');
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

  async function validateCustomGamePath() {
    const input = document.getElementById('input-custom-game-path');
    const path = input ? input.value.trim() : '';
    if (!path) return;

    const res = await NexusCore.apiPost('mods/validate-custom-path', { path });
    const msg = document.getElementById('custom-path-status-msg');
    const bRw = document.getElementById('res-badge-rw');
    const bExe = document.getElementById('res-badge-exe');
    const bLoc = document.getElementById('res-badge-loc');
    const bEnt = document.getElementById('res-badge-ent');

    if (res && res.success) {
      if (bRw) { bRw.className = 'metric-badge-pill'; bRw.innerText = res.is_writable ? '✓ Permisos RW' : 'Solo Lectura'; }
      if (bExe) { bExe.className = `metric-badge-pill ${res.has_exe ? '' : 'warning'}`; bExe.innerText = res.has_exe ? '✓ Rebellion.exe' : 'Sin .exe'; }
      if (bLoc) { bLoc.className = `metric-badge-pill ${res.has_localizations ? '' : 'neutral'}`; bLoc.innerText = res.has_localizations ? '✓ Localizations (es)' : 'Sin Localizations'; }
      if (bEnt) { bEnt.className = `metric-badge-pill ${res.has_gameinfo ? '' : 'neutral'}`; bEnt.innerText = res.has_gameinfo ? '✓ GameInfo Detectado' : 'Sin GameInfo'; }
      if (msg) {
        msg.innerText = res.message || 'Directorio verificado con éxito.';
        msg.style.color = '#16a34a';
      }
      try {
        localStorage.setItem('solaris_custom_game_path', path);
      } catch (e) {}
      window.ViewNavigator?.logExecution('FS', `Validado y vinculado directorio personalizado: ${path}`, 'Ruta OK');
    } else {
      if (msg) {
        msg.innerText = (res && res.message) ? res.message : 'Error al validar directorio.';
        msg.style.color = '#ef4444';
      }
    }
  }

  return {
    detectPlatforms,
    validateCustomGamePath
  };
})();
