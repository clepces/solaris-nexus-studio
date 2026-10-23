/**
 * Solaris Nexus Studio - DashboardHandler Module
 * Clepces org. ltd | Versión Oficial v0.4.1.0-alpha
 */
window.DashboardHandler = (() => {
  let executionsData = [];
  let executionsPagination = null;
  const EXEC_PER_PAGE = 8;

  function renderExecutionsPage(page) {
    const list = document.getElementById('dash-executions-list');
    const emptyContainer = document.getElementById('dash-executions-empty');
    if (!list) return;

    const dashSearch = document.getElementById('dashboard-search-input');
    const query = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const filtered = executionsData.filter(e => {
      if (!query) return true;
      return (e.description && e.description.toLowerCase().includes(query)) ||
             (e.exec_type && e.exec_type.toLowerCase().includes(query)) ||
             (e.details && e.details.toLowerCase().includes(query)) ||
             (e.result && e.result.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      list.innerHTML = '';
      if (emptyContainer) {
        emptyContainer.style.display = 'block';
        emptyContainer.innerHTML = window.NexusComponents ? window.NexusComponents.renderEmptyState({
          title: query ? 'Sin ejecuciones coincidentes' : 'Historial de Ejecuciones Vacío',
          description: query 
            ? `No se encontraron registros que coincidan con "${query}".`
            : 'No hay registros de ejecución en la base de datos.',
          icon: 'search',
          actionText: query ? 'Limpiar Búsqueda' : null,
          actionCallback: query ? 'DashboardHandler.clearDashboardSearch()' : null
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

    const activeExecPane = document.getElementById('pane-dash-executions');
    if (activeExecPane && activeExecPane.classList.contains('active')) {
      if (executionsPagination) executionsPagination.currentPage = 1;
      renderExecutionsPage(1);
      return;
    }

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
          actionCallback: 'DashboardHandler.clearDashboardSearch()'
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
              <span class="metric-badge-pill ${p.granted ? '' : 'neutral'}">${p.access}</span>
            </div>
            <div class="workflow-col-action">
              <span class="metric-badge-pill ${p.granted ? '' : 'warning'}">${p.statusText}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  function logExecution(type, description, result, details = null) {
    const entry = {
      exec_type: type,
      description,
      details,
      result,
      created_at: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    executionsData.unshift(entry);
    const countEl = document.getElementById('dash-exec-count');
    if (countEl) countEl.innerText = executionsData.length;

    try {
      localStorage.setItem('solaris_executions', JSON.stringify(executionsData.slice(0, 100)));
    } catch (e) {}

    renderExecutionsPage(1);
    NexusCore.apiPost('system/executions', entry).catch(() => {});
  }

  function init() {
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

    const savedDashTab = localStorage.getItem('solaris_dash_tab');
    if (savedDashTab) {
      const matchBtn = document.querySelector(`.tab-link-btn[data-dash-tab="${savedDashTab}"]`);
      if (matchBtn) matchBtn.click();
    }

    const searchInput = document.getElementById('dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => applyDashboardSearch());
    }

    loadPermissions();
    loadExecutions();
  }

  return {
    init,
    loadPermissions,
    loadExecutions,
    logExecution,
    applyDashboardSearch,
    clearDashboardSearch
  };
})();
