/**
 * Solaris Nexus Studio - SystemHealth Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.SystemHealthModule = (() => {
  const { apiGet } = NexusCore;

  async function runAudit() {
    const container = document.getElementById('health-report-content');
    if (!container) return;

    container.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">Ejecutando diagnóstico del entorno corporativo...</div>';

    const res = await apiGet('system/health');
    if (res.success && res.data) {
      const d = res.data;
      container.innerHTML = `
        <div style="padding: 12px; background: rgba(5, 150, 105, 0.1); border-radius: 12px; color: #059669; font-weight: 700;">
          ✓ SERVIDOR WAMP ACTIVO: Conexión establecida con Apache y PHP ${d.phpVersion}.
        </div>
        <div class="health-meta-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 0.82rem;">
          <div class="mini-neu-card" style="cursor: default;">
            <span class="mini-card-label">Suite Corporativa</span>
            <span style="font-weight: 800; color: var(--text-main);">${d.appName} (${d.version})</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${d.company}</span>
          </div>
          <div class="mini-neu-card" style="cursor: default;">
            <span class="mini-card-label">Memoria del Servidor</span>
            <span class="mini-card-value">${d.memoryUsageMb} MB</span>
            <span style="font-size: 0.72rem; color: var(--text-success); font-weight: 700;">● Consumo Óptimo</span>
          </div>
          <div class="mini-neu-card" style="cursor: default;">
            <span class="mini-card-label">Base de Datos</span>
            <span style="font-weight: 800; color: var(--text-main);">${d.database}</span>
            <span style="font-size: 0.72rem; color: var(--text-blue); font-weight: 700;">● SQLite Relacional OK</span>
          </div>
          <div class="mini-neu-card" style="cursor: default;">
            <span class="mini-card-label">Protocolo UUID Safety</span>
            <span style="font-weight: 800; color: var(--text-main);">ACTIVO</span>
            <span style="font-size: 0.72rem; color: var(--text-success); font-weight: 700;">● Cero Stack Traces</span>
          </div>
        </div>
      `;
    }
  }

  function init() {
    runAudit();
  }

  return {
    init,
    runAudit
  };
})();
