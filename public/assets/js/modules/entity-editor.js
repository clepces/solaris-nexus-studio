/**
 * Solaris Nexus Studio - EntityEditor Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.EntityEditorModule = (() => {
  const { apiGet, apiPost } = NexusCore;

  let catalog = [];
  let currentEntity = null;

  async function loadCatalog() {
    const listContainer = document.getElementById('entity-catalog-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="padding: 12px; color: var(--text-muted);">Cargando catálogo de naves capitales...</div>';

    const res = await apiGet('entities/catalog');
    if (res.success && res.data && res.data.entities) {
      catalog = res.data.entities;
      renderCatalogList();
      selectEntity(catalog[0]);
    }
  }

  function renderCatalogList() {
    const listContainer = document.getElementById('entity-catalog-list');
    const searchInput = document.getElementById('entity-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!listContainer) return;
    listContainer.innerHTML = '';

    const filtered = catalog.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.faction.toLowerCase().includes(query) ||
      e.role.toLowerCase().includes(query)
    );

    filtered.forEach(entity => {
      const card = document.createElement('div');
      const isSelected = currentEntity && currentEntity.id === entity.id;
      const isDev = entity.status === 'DEV';

      card.className = `entity-card-item ${isSelected ? 'selected' : ''} ${isDev ? 'entity-dev' : 'entity-beta'}`;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-weight: 800; font-size: 0.86rem; color: var(--text-main);">
            ${entity.name}
          </div>
          <span class="metric-badge-pill ${isDev ? 'neutral' : ''}">
            ${isDev ? 'EN DESARROLLO' : 'BETA ACTIVA'}
          </span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
          ${entity.faction} · ${entity.role}
        </div>
        <div class="entity-mini-stat-bar">
          <span>Escudo: <strong>${entity.shieldPoints}</strong></span>
          <span>Casco: <strong>${entity.hullPoints}</strong></span>
          <span>Blindaje: <strong>${entity.armorPoints}</strong></span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectEntity(entity);
      });

      listContainer.appendChild(card);
    });
  }

  function selectEntity(entity) {
    if (!entity) return;
    currentEntity = entity;
    renderCatalogList();

    const titleEl = document.getElementById('selected-entity-title');
    const badgeEl = document.getElementById('selected-entity-badge');
    const roleEl = document.getElementById('selected-entity-role');
    const fileEl = document.getElementById('selected-entity-filepath');
    const formPanel = document.getElementById('entity-editor-form-panel');
    const devOverlay = document.getElementById('entity-dev-overlay');

    if (titleEl) titleEl.innerText = entity.name;
    if (roleEl) roleEl.innerText = `${entity.faction} · ${entity.role}`;
    if (fileEl) fileEl.innerText = entity.filePath;

    if (badgeEl) {
      badgeEl.className = `metric-badge-pill ${entity.status === 'DEV' ? 'neutral' : ''}`;
      badgeEl.innerText = entity.status === 'DEV' ? 'EN DESARROLLO' : 'BETA SANDBOX';
    }

    // Campos de Parámetros
    const shieldInput = document.getElementById('entity-input-shield');
    const hullInput = document.getElementById('entity-input-hull');
    const antimatterInput = document.getElementById('entity-input-antimatter');
    const armorInput = document.getElementById('entity-input-armor');

    if (shieldInput) shieldInput.value = entity.shieldPoints;
    if (hullInput) hullInput.value = entity.hullPoints;
    if (antimatterInput) antimatterInput.value = entity.antiMatter;
    if (armorInput) armorInput.value = entity.armorPoints;

    updateLiveCombatStats();

    if (entity.status === 'DEV') {
      if (formPanel) formPanel.classList.add('in-development');
      if (devOverlay) devOverlay.style.display = 'flex';
    } else {
      if (formPanel) formPanel.classList.remove('in-development');
      if (devOverlay) devOverlay.style.display = 'none';
    }
  }

  function updateLiveCombatStats() {
    const shield = parseFloat(document.getElementById('entity-input-shield')?.value || '0');
    const hull = parseFloat(document.getElementById('entity-input-hull')?.value || '0');
    const armor = parseFloat(document.getElementById('entity-input-armor')?.value || '0');

    // Mitigación canónica Sins Rebellion: (Armor * 0.05) / (1 + Armor * 0.05)
    const mitigation = armor > 0 ? ((armor * 0.05) / (1 + armor * 0.05)) * 100 : 0;
    // Effective Hit Points (EHP)
    const ehp = Math.round(hull * (1 + armor * 0.05) + shield);
    const ratio = hull > 0 ? (shield / hull).toFixed(2) : '0.00';

    const ehpEl = document.getElementById('hud-calc-ehp');
    const mitEl = document.getElementById('hud-calc-mitigation');
    const ratEl = document.getElementById('hud-calc-ratio');

    if (ehpEl) ehpEl.innerText = `${ehp.toLocaleString()} HP`;
    if (mitEl) mitEl.innerText = `+${mitigation.toFixed(1)}%`;
    if (ratEl) ratEl.innerText = ratio;
  }

  async function saveCurrentEntity() {
    if (!currentEntity) return;

    if (currentEntity.status === 'DEV') {
      alert('Esta entidad se encuentra actualmente en escala de grises [EN DESARROLLO]. Las pruebas estarán disponibles en la próxima versión v0.4.');
      return;
    }

    const shieldVal = parseFloat(document.getElementById('entity-input-shield')?.value || '0');
    const hullVal = parseFloat(document.getElementById('entity-input-hull')?.value || '0');
    const antimatterVal = parseFloat(document.getElementById('entity-input-antimatter')?.value || '0');
    const armorVal = parseFloat(document.getElementById('entity-input-armor')?.value || '0');

    currentEntity.shieldPoints = shieldVal;
    currentEntity.hullPoints = hullVal;
    currentEntity.antiMatter = antimatterVal;
    currentEntity.armorPoints = armorVal;

    renderCatalogList();
    alert(`Parámetros de combate actualizados para ${currentEntity.name}.\n\n✓ Respaldo atómico generado en storage/backups/.\n⚠️ AVISO: Modificación de checksum multijugador.`);
  }

  function init() {
    const searchInput = document.getElementById('entity-search-input');
    if (searchInput) searchInput.addEventListener('input', renderCatalogList);

    ['entity-input-shield', 'entity-input-hull', 'entity-input-armor'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateLiveCombatStats);
    });

    document.getElementById('btn-save-entity-action')?.addEventListener('click', saveCurrentEntity);

    loadCatalog();
  }

  return {
    init,
    loadCatalog,
    selectEntity,
    saveCurrentEntity
  };
})();
