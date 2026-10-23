/**
 * Solaris Nexus Studio - MinimodInjector Module
 * Clepces org. ltd | Versión Oficial v0.4.1.0-alpha
 */
window.MinimodInjector = (() => {
  function updateMinimodStatus() {
    const state = NexusCore.state;
    const hasMinimod = state.activeMods && state.activeMods.some(m => m.isMinimod || m.name.includes('[ES]'));
    const badge = document.getElementById('minimod-active-status-badge');
    const panel = document.getElementById('minimod-status-panel');
    const btn = document.getElementById('btn-toggle-minimod-p999');
    const title = document.getElementById('minimod-current-title');

    if (badge) {
      badge.className = `metric-badge-pill ${hasMinimod ? '' : 'neutral'}`;
      badge.innerText = hasMinimod ? '✓ ACTIVO EN P999' : '○ STANDBY (Vanilla)';
    }
    if (panel) {
      panel.className = `minimod-status-panel ${hasMinimod ? 'active' : ''}`;
    }
    if (btn) {
      btn.innerText = hasMinimod ? '✕ Retirar Minimod P999' : '⚡ Inyectar Minimod (P999)';
      btn.style.color = hasMinimod ? '#dc2626' : '#1a73e8';
    }
    if (title) {
      title.innerText = hasMinimod ? 'Minimod: [ES] Idioma Español Rebellion (Activo en P999)' : 'Minimod: [ES] Idioma Español Rebellion (Standby)';
    }
  }

  function toggleMinimodP999() {
    const state = NexusCore.state;
    const hasMinimod = state.activeMods && state.activeMods.some(m => m.isMinimod || m.name.includes('[ES]'));
    if (hasMinimod) {
      state.activeMods = state.activeMods.filter(m => !m.isMinimod && !m.name.includes('[ES]'));
      window.ViewNavigator?.logExecution('VFS', 'Retirado minimod [ES] de EnabledMods.txt (Modo Vanilla)', 'Desactivado');
    } else {
      const inputName = document.getElementById('input-minimod-name')?.value?.trim() || 'Idioma Español Rebellion';
      state.activeMods.unshift({
        name: `[ES] ${inputName}`,
        priority: 999,
        isMinimod: true,
        ramMb: 15
      });
      window.ViewNavigator?.logExecution('VFS', `Inyectado minimod quirúrgico [ES] ${inputName} (Prioridad 999)`, 'En Cascada');
    }
    window.ModManagerModule?.recalculatePriorities();
    window.ModManagerModule?.renderModList();
    window.ModManagerModule?.saveVfsHierarchy();
  }

  function injectCustomMinimod() {
    const nameInput = document.getElementById('input-minimod-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert('Introduce un nombre descriptivo para el minimod.');
      return;
    }

    NexusCore.state.activeMods.unshift({
      name: `[ES] ${name}`,
      priority: 999,
      isMinimod: true,
      ramMb: 15
    });

    window.ModManagerModule?.recalculatePriorities();
    window.ModManagerModule?.renderModList();
    window.ViewNavigator?.logExecution('VFS', `Inyectado minimod [ES] ${name} (Prioridad 999)`, 'En Cascada');
    
    if (nameInput) nameInput.value = '';
    window.ModManagerModule?.switchSubTab('subtab-mods-catalog');
    alert(`Minimod [ES] ${name} inyectado con prioridad 999 en la cima de EnabledMods.txt.`);
  }

  return {
    updateMinimodStatus,
    toggleMinimodP999,
    injectCustomMinimod
  };
})();
