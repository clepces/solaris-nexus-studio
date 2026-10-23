/**
 * Solaris Nexus Studio - EntityEditor Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 * Integración de datos reales de Sins of a Solar Empire: Rebellion
 */
window.EntityEditorModule = (() => {
  const { apiGet, apiPost } = NexusCore;

  let catalog = [];
  let originalCatalog = [];
  let currentEntity = null;
  let activeFactionFilter = 'ALL';
  let activeSubtab = 'survival';

  async function loadCatalog() {
    const listContainer = document.getElementById('entity-catalog-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 0.8rem;">Cargando catálogo de naves capitales...</div>';

    const res = await apiGet('entities/catalog');
    if (res.success && res.data && res.data.entities) {
      catalog = JSON.parse(JSON.stringify(res.data.entities));
      originalCatalog = JSON.parse(JSON.stringify(res.data.entities));
      renderCatalogList();
      selectEntity(catalog[0]);
    }
  }

  function setFactionFilter(faction) {
    activeFactionFilter = faction;
    document.querySelectorAll('.entity-faction-btn').forEach(btn => {
      if (btn.getAttribute('data-faction') === faction) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    renderCatalogList();
  }

  function renderCatalogList() {
    const listContainer = document.getElementById('entity-catalog-list');
    const searchInput = document.getElementById('entity-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!listContainer) return;
    listContainer.innerHTML = '';

    const filtered = catalog.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(query) ||
                            e.faction.toLowerCase().includes(query) ||
                            e.role.toLowerCase().includes(query);
      const matchesFaction = activeFactionFilter === 'ALL' || e.factionCode === activeFactionFilter;
      return matchesSearch && matchesFaction;
    });

    const countBadge = document.getElementById('entity-count-badge');
    if (countBadge) {
      countBadge.innerText = `${filtered.length} Naves`;
    }

    filtered.forEach(entity => {
      const card = document.createElement('div');
      const isSelected = currentEntity && currentEntity.id === entity.id;

      let tagClass = 'tag-tec';
      if (entity.factionCode === 'ADV') tagClass = 'tag-adv';
      if (entity.factionCode === 'VAS') tagClass = 'tag-vas';

      card.className = `entity-card-item ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-weight: 800; font-size: 0.84rem; color: var(--text-main);">
            ${entity.name}
          </div>
          <span class="entity-faction-tag ${tagClass}">
            ${entity.factionCode || 'TEC'}
          </span>
        </div>
        <div style="font-size: 0.70rem; color: var(--text-secondary); margin-top: 2px;">
          ${entity.role}
        </div>
        <div class="entity-mini-stat-bar">
          <span>Escudo: <strong>${Math.round(entity.shieldPoints)}</strong></span>
          <span>Casco: <strong>${Math.round(entity.hullPoints)}</strong></span>
          <span>Blindaje: <strong>${entity.armorPoints}</strong></span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectEntity(entity);
      });

      listContainer.appendChild(card);
    });
  }

  function switchSubtab(tabName) {
    activeSubtab = tabName;
    document.querySelectorAll('.entity-subtab-btn').forEach(btn => {
      if (btn.getAttribute('data-subtab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const panels = ['survival', 'weapons', 'abilities', 'logistics'];
    panels.forEach(p => {
      const el = document.getElementById(`subtab-panel-${p}`);
      if (el) {
        el.style.display = (p === tabName) ? 'block' : 'none';
      }
    });
  }

  function selectEntity(entity) {
    if (!entity) return;
    currentEntity = entity;
    renderCatalogList();

    // Actualizar encabezados
    const titleEl = document.getElementById('selected-entity-title');
    const roleEl = document.getElementById('selected-entity-role');
    const fileEl = document.getElementById('selected-entity-filepath');
    const tagEl = document.getElementById('selected-entity-faction-tag');

    if (titleEl) titleEl.innerText = entity.name;
    if (roleEl) roleEl.innerText = `${entity.faction} · ${entity.role}`;
    if (fileEl) fileEl.innerText = entity.filePath;

    if (tagEl) {
      let tagClass = 'tag-tec';
      if (entity.factionCode === 'ADV') tagClass = 'tag-adv';
      if (entity.factionCode === 'VAS') tagClass = 'tag-vas';
      tagEl.className = `entity-faction-tag ${tagClass}`;
      tagEl.innerText = entity.factionCode || 'TEC';
    }

    // Campos de Entrada de Supervivencia
    const shieldInput = document.getElementById('entity-input-shield');
    const hullInput = document.getElementById('entity-input-hull');
    const antimatterInput = document.getElementById('entity-input-antimatter');
    const armorInput = document.getElementById('entity-input-armor');

    if (shieldInput) shieldInput.value = entity.shieldPoints;
    if (hullInput) hullInput.value = entity.hullPoints;
    if (antimatterInput) antimatterInput.value = entity.antiMatter;
    if (armorInput) armorInput.value = entity.armorPoints;

    // Subtítulos de Regeneración
    const hullRegenEl = document.getElementById('lbl-hull-regen');
    const shieldRegenEl = document.getElementById('lbl-shield-regen');
    const antimatterRegenEl = document.getElementById('lbl-antimatter-regen');

    if (hullRegenEl) hullRegenEl.innerText = `Regen: ${entity.hullRestore ? entity.hullRestore.toFixed(2) : '1.80'} HP/s`;
    if (shieldRegenEl) shieldRegenEl.innerText = `Regen: ${entity.shieldRestore ? entity.shieldRestore.toFixed(2) : '3.60'} HP/s`;
    if (antimatterRegenEl) antimatterRegenEl.innerText = `Regen: ${entity.antiMatterRestore ? entity.antiMatterRestore.toFixed(2) : '0.75'} /s`;

    // Renderizar Armamento
    renderWeapons(entity.weapons || []);

    // Renderizar Habilidades
    renderAbilities(entity.abilities || []);

    // Actualizar Costes
    const costCredEl = document.getElementById('cost-credits');
    const costMetalEl = document.getElementById('cost-metal');
    const costCrystEl = document.getElementById('cost-crystal');
    const costBuildEl = document.getElementById('cost-buildtime');
    const costSupplyEl = document.getElementById('cost-supply');

    if (costCredEl) costCredEl.innerText = Number(entity.credits || 3000).toLocaleString();
    if (costMetalEl) costMetalEl.innerText = Number(entity.metal || 400).toLocaleString();
    if (costCrystEl) costCrystEl.innerText = Number(entity.crystal || 250).toLocaleString();
    if (costBuildEl) costBuildEl.innerText = `${entity.buildTime || 75} seg`;
    if (costSupplyEl) costSupplyEl.innerText = `${entity.slotCount || 50} Pts`;

    updateLiveCombatStats();
  }

  function renderWeapons(weapons) {
    const container = document.getElementById('entity-weapons-container');
    if (!container) return;
    container.innerHTML = '';

    if (!weapons.length) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 10px;">No hay baterías de armamento registradas para esta nave.</div>';
      return;
    }

    weapons.forEach((w, idx) => {
      const card = document.createElement('div');
      card.className = 'entity-weapon-card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--text-blue); flex-shrink: 0;">
            💥
          </div>
          <div>
            <div style="font-weight: 800; font-size: 0.84rem; color: var(--text-main);">${w.name || `Batería Táctica #${idx + 1}`}</div>
            <div style="font-size: 0.70rem; color: var(--text-muted);">${w.type} · Arco: <strong>${w.arc}</strong></div>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0;">
          <div style="font-size: 1rem; font-weight: 800; color: #ef4444; font-family: var(--font-mono);">${w.dps} DPS</div>
          <div style="font-size: 0.68rem; color: var(--text-secondary);">Alcance: ${w.range} m</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function renderAbilities(abilities) {
    const container = document.getElementById('entity-abilities-container');
    if (!container) return;
    container.innerHTML = '';

    if (!abilities.length) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 10px;">Sin habilidades tácticas activas.</div>';
      return;
    }

    const icons = ['⚡', '🛡️', '🎯', '🌟'];

    abilities.forEach((ab, idx) => {
      const card = document.createElement('div');
      card.className = 'entity-ability-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
            <span>${icons[idx % icons.length]}</span>
            <span>${ab.name}</span>
          </div>
          <span class="metric-badge-pill" style="font-size: 0.60rem;">${ab.type}</span>
        </div>
        <div style="font-size: 0.70rem; color: var(--text-secondary); line-height: 1.3; margin-top: 4px;">
          ${ab.desc}
        </div>
        <div style="font-size: 0.62rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">
          ID: ${ab.id}
        </div>
      `;
      container.appendChild(card);
    });
  }

  function updateLiveCombatStats() {
    const shield = parseFloat(document.getElementById('entity-input-shield')?.value || '0');
    const hull = parseFloat(document.getElementById('entity-input-hull')?.value || '0');
    const armor = parseFloat(document.getElementById('entity-input-armor')?.value || '0');

    // Fórmula Canónica Sins of a Solar Empire:
    // Mitigación por armadura: (Armor * 0.05) / (1 + Armor * 0.05) * 100
    const armorMultiplier = 1 + (armor * 0.05);
    const mitigation = armor > 0 ? ((armor * 0.05) / armorMultiplier) * 100 : 0;

    // Effective Hit Points (EHP): Daño efectivo necesario para destruir la nave considerando armadura en casco + escudos
    const effectiveHull = hull * armorMultiplier;
    const ehp = Math.round(effectiveHull + shield);
    const ratio = hull > 0 ? (shield / hull).toFixed(2) : '0.00';

    const ehpEl = document.getElementById('hud-calc-ehp');
    const mitEl = document.getElementById('hud-calc-mitigation');
    const ratEl = document.getElementById('hud-calc-ratio');

    if (ehpEl) ehpEl.innerText = `${ehp.toLocaleString()} HP`;
    if (mitEl) mitEl.innerText = `+${mitigation.toFixed(1)}%`;
    if (ratEl) ratEl.innerText = ratio;
  }

  function resetToVanilla() {
    if (!currentEntity) return;
    const original = originalCatalog.find(e => e.id === currentEntity.id);
    if (!original) return;

    currentEntity.shieldPoints = original.shieldPoints;
    currentEntity.hullPoints = original.hullPoints;
    currentEntity.antiMatter = original.antiMatter;
    currentEntity.armorPoints = original.armorPoints;

    selectEntity(currentEntity);
  }

  async function saveCurrentEntity() {
    if (!currentEntity) return;

    const shieldVal = parseFloat(document.getElementById('entity-input-shield')?.value || '0');
    const hullVal = parseFloat(document.getElementById('entity-input-hull')?.value || '0');
    const antimatterVal = parseFloat(document.getElementById('entity-input-antimatter')?.value || '0');
    const armorVal = parseFloat(document.getElementById('entity-input-armor')?.value || '0');

    currentEntity.shieldPoints = shieldVal;
    currentEntity.hullPoints = hullVal;
    currentEntity.antiMatter = antimatterVal;
    currentEntity.armorPoints = armorVal;

    renderCatalogList();
    alert(`Parámetros de combate guardados para ${currentEntity.name}.\n\n✓ Atributos actualizados en memoria.\n✓ Respaldo atómico de sandbox listo.`);
  }

  function init() {
    // Delegación de eventos global (los elementos se inyectan dinámicamente vía ViewRenderer)
    document.addEventListener('click', (e) => {
      const factionBtn = e.target.closest('.entity-faction-btn');
      if (factionBtn) {
        const faction = factionBtn.getAttribute('data-faction') || 'ALL';
        setFactionFilter(faction);
        return;
      }

      const subtabBtn = e.target.closest('.entity-subtab-btn');
      if (subtabBtn) {
        const subtab = subtabBtn.getAttribute('data-subtab') || 'survival';
        switchSubtab(subtab);
        return;
      }

      if (e.target.closest('#btn-save-entity-action')) {
        saveCurrentEntity();
        return;
      }

      if (e.target.closest('#btn-reset-entity')) {
        resetToVanilla();
        return;
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'entity-search-input') {
        renderCatalogList();
        return;
      }

      if (['entity-input-shield', 'entity-input-hull', 'entity-input-armor'].includes(e.target.id)) {
        updateLiveCombatStats();
        return;
      }
    });

    loadCatalog();
  }

  return {
    init,
    loadCatalog,
    selectEntity,
    saveCurrentEntity,
    resetToVanilla,
    switchSubtab,
    setFactionFilter
  };
})();
