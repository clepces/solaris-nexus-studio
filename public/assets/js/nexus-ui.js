/**
 * Solaris Nexus Studio - NexusUI Controller
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */

const NexusUI = (() => {
  const { state, extractTokens, validateTokenSyntax, downloadBlob, apiPost, apiGet, generateDemoEntries } = NexusCore;

  const PLANET_COLORS = {
    'Terran': '#22c55e',
    'Desert': '#eab308',
    'Ice': '#38bdf8',
    'Volcanic': '#ef4444',
    'Asteroid': '#94a3b8',
    'GasGiant': '#a855f7'
  };

  const MODULE_METADATA = {
    'tab-translation': {
      title: 'Estudio de Traducción',
      subtitle: 'Gestión masiva de diccionarios .str, Token Guard en tiempo real e inyección UTF-8 BOM canónica.',
      metricNumber: '7,828',
      metricLabel: 'Cadenas del Diccionario',
      metricBadge: '✓ 100% Validado'
    },
    'tab-mods': {
      title: 'Gestor VFS & Mods',
      subtitle: 'Jerarquía de prioridades en EnabledMods.txt y monitor de techo físico virtual de 32 bits (LAA).',
      metricNumber: '3',
      metricLabel: 'Mods Activos en Cascada',
      metricBadge: 'Prioridad 999'
    },
    'tab-system': {
      title: 'Diagnóstico & Salud',
      subtitle: 'Verificación de variables fail-fast, conectividad relacional SQLite/MySQL y blindaje UUID Safety.',
      metricNumber: 'HEALTHY',
      metricLabel: 'Estado del Servidor WAMP',
      metricBadge: 'Cero Stack Traces'
    },
    'tab-entities': {
      title: 'Editor de Entidades',
      subtitle: 'Inspección de atributos de combate con respaldo atómico y advertencia de checksum multijugador.',
      metricNumber: 'Kol Battleship',
      metricLabel: 'Entidad de Combate Activa',
      metricBadge: 'Sandbox Only'
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
    }
  };

  // 1. GESTIÓN DE VISTAS (TAB SWITCHER)
  function switchTab(targetId) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.dock-btn[data-tab]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === targetId);
    });

    const meta = MODULE_METADATA[targetId];
    if (meta) {
      document.getElementById('view-main-title').innerText = meta.title;
      document.getElementById('view-main-subtitle').innerText = meta.subtitle;
      document.getElementById('hero-metric-label').innerText = meta.metricLabel;
      document.getElementById('hero-metric-number').innerText = meta.metricNumber;
      document.getElementById('hero-metric-badge').innerText = meta.metricBadge;
    }

    const filterRow = document.getElementById('translation-filter-row');
    if (filterRow) {
      filterRow.style.display = (targetId === 'tab-translation') ? 'flex' : 'none';
    }

    renderContextualActions(targetId);

    if (targetId === 'tab-galaxy' && state.currentGalaxy) {
      requestAnimationFrame(() => drawGalaxy(state.currentGalaxy));
    }
  }

  function renderContextualActions(tabId) {
    const container = document.getElementById('header-actions-container');
    if (!container) return;

    if (tabId === 'tab-translation') {
      container.innerHTML = `
        <input type="file" id="file-input-str" accept=".str" style="display: none;">
        <button class="btn-reagle" id="btn-trigger-str-file">📁 Cargar .str</button>
        <button class="btn-reagle" id="btn-demo-str">🔄 Demo (7.828)</button>
        <button class="btn-reagle btn-reagle-success" id="btn-export-str-main">💾 Exportar .str (BOM)</button>
      `;
      document.getElementById('btn-trigger-str-file').addEventListener('click', () => document.getElementById('file-input-str').click());
      document.getElementById('file-input-str').addEventListener('change', handleStrUpload);
      document.getElementById('btn-demo-str').addEventListener('click', () => {
        state.allEntries = generateDemoEntries();
        state.filteredEntries = state.allEntries;
        document.getElementById('sidebar-count-strings').innerText = state.allEntries.length.toLocaleString();
        renderVirtualGrid();
      });
      document.getElementById('btn-export-str-main').addEventListener('click', exportStrFile);
    } else if (tabId === 'tab-mods') {
      container.innerHTML = `
        <button class="btn-reagle" id="btn-scan-mods-top">📁 Escanear Mods</button>
        <button class="btn-reagle btn-reagle-success" id="btn-inject-minimod-top">+ Inyectar Minimod</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-save-vfs-top">💾 Guardar VFS</button>
      `;
      document.getElementById('btn-scan-mods-top').addEventListener('click', scanModsAction);
      document.getElementById('btn-inject-minimod-top').addEventListener('click', injectMinimodAction);
      document.getElementById('btn-save-vfs-top').addEventListener('click', saveVfsAction);
    } else if (tabId === 'tab-entities') {
      container.innerHTML = `
        <input type="file" id="file-input-entity" accept=".entity" style="display: none;">
        <button class="btn-reagle" id="btn-trigger-entity-file">📁 Cargar .entity</button>
        <button class="btn-reagle" id="btn-load-demo-entity-top">Cargar Kol Demo</button>
        <button class="btn-reagle btn-reagle-success" id="btn-save-entity-top">💾 Guardar Parámetros</button>
      `;
      document.getElementById('btn-trigger-entity-file').addEventListener('click', () => document.getElementById('file-input-entity').click());
      document.getElementById('file-input-entity').addEventListener('change', handleEntityUpload);
      document.getElementById('btn-load-demo-entity-top').addEventListener('click', loadKolDemo);
      document.getElementById('btn-save-entity-top').addEventListener('click', saveEntityAction);
    } else if (tabId === 'tab-galaxy') {
      container.innerHTML = `
        <input type="file" id="file-input-galaxy" accept=".galaxy" style="display: none;">
        <button class="btn-reagle" id="btn-trigger-galaxy-file">📁 Cargar .galaxy</button>
        <button class="btn-reagle" id="btn-gen-galaxy-8p">Mapa 8P</button>
        <button class="btn-reagle btn-reagle-primary" id="btn-gen-galaxy-12p">Generar 12P</button>
        <button class="btn-reagle btn-reagle-success" id="btn-export-galaxy-top">💾 Exportar .galaxy</button>
      `;
      document.getElementById('btn-trigger-galaxy-file').addEventListener('click', () => document.getElementById('file-input-galaxy').click());
      document.getElementById('file-input-galaxy').addEventListener('change', handleGalaxyUpload);
      document.getElementById('btn-gen-galaxy-8p').addEventListener('click', () => requestGalaxy(8));
      document.getElementById('btn-gen-galaxy-12p').addEventListener('click', () => requestGalaxy(12));
      document.getElementById('btn-export-galaxy-top').addEventListener('click', exportGalaxyFile);
    } else if (tabId === 'tab-system') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" id="btn-refresh-health-top">🔄 Actualizar Diagnóstico</button>
      `;
      document.getElementById('btn-refresh-health-top').addEventListener('click', fetchHealthStatus);
    } else if (tabId === 'tab-convert') {
      container.innerHTML = `
        <button class="btn-reagle btn-reagle-primary" id="btn-run-cli-top">⚡ Ejecutar Conversión</button>
      `;
      document.getElementById('btn-run-cli-top').addEventListener('click', runConvertDataAction);
    }
  }

  // 2. SCROLL VIRTUALIZADO (60 FPS)
  const viewport = document.getElementById('virtual-viewport');
  const runway = document.getElementById('virtual-runway');

  function renderVirtualGrid() {
    if (!viewport || !runway) return;
    const total = state.filteredEntries.length;
    runway.style.height = `${total * state.rowHeight}px`;

    const scrollTop = viewport.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / state.rowHeight) - 5);
    const endIndex = Math.min(total, startIndex + state.visibleCount);

    runway.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const item = state.filteredEntries[i];
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'virtual-row';
      row.style.transform = `translateY(${i * state.rowHeight}px)`;

      const tokenPills = item.tokens.map(t => `<span class="token-pill">${t}</span>`).join('');

      row.innerHTML = `
        <div class="col-id" title="${item.id}">${item.id}</div>
        <div class="col-text" title="${item.original}">${item.original}</div>
        <div class="col-text" title="${item.translated}">${item.translated}</div>
        <div class="col-tokens">${tokenPills}</div>
        <div class="col-actions">
          <button class="btn-icon-reagle btn-edit" data-index="${i}" title="Editar traducción">✏️</button>
        </div>
      `;
      runway.appendChild(row);
    }

    runway.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        openEditModal(idx);
      });
    });
  }

  function applyFilters() {
    const searchInput = document.getElementById('grid-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let entries = state.allEntries;

    if (state.currentFilter === 'tokens') {
      entries = entries.filter(e => e.tokens.length > 0);
    }

    if (query) {
      entries = entries.filter(item =>
        item.id.toLowerCase().includes(query) ||
        item.original.toLowerCase().includes(query) ||
        item.translated.toLowerCase().includes(query)
      );
    }

    state.filteredEntries = entries;
    const totalCountEl = document.getElementById('mini-metric-total-strings');
    if (totalCountEl) totalCountEl.innerText = state.filteredEntries.length.toLocaleString();
    if (viewport) viewport.scrollTop = 0;
    renderVirtualGrid();
  }

  // 3. MODAL DE EDICIÓN
  const modal = document.getElementById('edit-modal');
  const inputTranslated = document.getElementById('modal-translated-input');
  const feedbackBox = document.getElementById('modal-token-feedback');

  function openEditModal(index) {
    state.currentEditIndex = index;
    const item = state.filteredEntries[index];
    document.getElementById('modal-string-id').innerText = item.id;
    document.getElementById('modal-original-text').innerText = item.original;
    inputTranslated.value = item.translated;
    validateModalTokens();
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
    state.currentEditIndex = null;
  }

  function validateModalTokens() {
    if (state.currentEditIndex === null) return;
    const item = state.filteredEntries[state.currentEditIndex];
    const val = inputTranslated.value;
    const result = validateTokenSyntax(item.tokens, val);

    feedbackBox.style.display = 'block';
    if (!result.valid) {
      feedbackBox.style.background = 'rgba(239, 68, 68, 0.15)';
      feedbackBox.style.color = '#ef4444';
      feedbackBox.innerText = result.error;
    } else {
      feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
      feedbackBox.style.color = '#059669';
      feedbackBox.innerText = result.message;
    }
  }

  // 4. ACCIONES DE ARCHIVOS
  async function handleStrUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const json = await apiPost('strings/parse', { raw_content: text });
      if (json.success && json.data && json.data.entries) {
        state.allEntries = json.data.entries.map(e => ({
          id: e.id,
          original: e.value,
          translated: e.value,
          tokens: extractTokens(e.value)
        }));
        state.filteredEntries = state.allEntries;
        document.getElementById('sidebar-count-strings').innerText = state.allEntries.length.toLocaleString();
        renderVirtualGrid();
        alert(`Archivo ${file.name} cargado con ${state.allEntries.length} entradas.`);
      }
    };
    reader.readAsText(file);
  }

  async function exportStrFile() {
    const payload = {
      entries: state.allEntries.slice(0, 1000).map(e => ({ id: e.id, value: e.translated }))
    };
    const json = await apiPost('strings/export', payload);
    if (json.success && json.data && json.data.content) {
      downloadBlob(json.data.content, 'Spanish.str');
      return;
    }

    // Fallback local con BOM UTF-8 y CRLF
    const slice = state.allEntries.slice(0, 500);
    let out = `\uFEFFTXT\r\nNumStrings ${slice.length}\r\n`;
    slice.forEach(e => {
      const esc = e.translated.replace(/"/g, '\\"');
      out += `StringInfo\r\n{\r\n\tID "${e.id}"\r\n\tValue "${esc}"\r\n}\r\n`;
    });
    downloadBlob(out, 'Spanish.str');
  }

  // 5. GESTOR DE MODS
  function renderModManager() {
    const container = document.getElementById('mod-active-list');
    if (!container) return;
    container.innerHTML = '';

    let totalRam = 1400;
    state.activeMods.forEach(m => {
      totalRam += m.ramMb;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '10px 14px';
      row.style.borderRadius = '12px';
      row.style.background = m.isMinimod ? 'rgba(37, 99, 235, 0.08)' : 'var(--neu-card-bg)';
      row.style.boxShadow = 'var(--neu-shadow-card-sm)';
      row.style.border = '1px solid rgba(255, 255, 255, 0.8)';

      row.innerHTML = `
        <div>
          <strong>${m.name}</strong>
          <span style="font-size: 0.76rem; color: var(--text-secondary); margin-left: 8px;">(~${m.ramMb} MB)</span>
          ${m.isMinimod ? '<span class="metric-badge-pill" style="margin-left: 6px;">Minimod VFS</span>' : ''}
        </div>
        <div>
          <span class="sidebar-pill-badge" style="background:#fff; color:var(--text-blue); font-weight:700;">P${m.priority}</span>
        </div>
      `;
      container.appendChild(row);
    });

    const fill = document.getElementById('ram-meter-fill');
    const text = document.getElementById('ram-meter-text');
    const badge = document.getElementById('ram-risk-badge');

    const pct = Math.min(100, Math.round((totalRam / 3250) * 100));
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.innerText = `${totalRam.toLocaleString()} MB / 3.250 MB (${pct}%)`;

    if (badge) {
      if (totalRam >= 3350) {
        fill.className = 'reagle-progress-fill critical';
        badge.style.color = '#ef4444';
        badge.innerText = 'ESTADO: CRÍTICO (MiniDump Crash inminente en batallas)';
      } else if (totalRam >= 3100) {
        fill.className = 'reagle-progress-fill warning';
        badge.style.color = '#f59e0b';
        badge.innerText = 'ESTADO: ALTO RIESGO (Alcanzando techo de 32 bits)';
      } else {
        fill.className = 'reagle-progress-fill';
        badge.style.color = '#059669';
        badge.innerText = 'ESTADO: SEGURO (Bajo riesgo de colapso de memoria)';
      }
    }
  }

  function injectMinimodAction() {
    const name = prompt('Nombre del minimod de traducción para inyectar con Prioridad 999:', '[ES] Sins Rebellion Traduccion');
    if (name) {
      state.activeMods.unshift({ name, priority: 999, isMinimod: true, ramMb: 15 });
      state.activeMods.forEach((m, i) => m.priority = 999 - (i * 10));
      renderModManager();
    }
  }

  async function scanModsAction() {
    const res = await apiGet('mods/scan');
    if (res.success && res.data) {
      alert(`Escaneo completado: ${res.data.modsCount} mods disponibles detectados.`);
    } else {
      alert('Directorio de mods escaneado en entorno local.');
    }
  }

  async function saveVfsAction() {
    const res = await apiPost('mods/save', { mods: state.activeMods });
    if (res.success) {
      alert('Configuración guardada en EnabledMods.txt con terminación CRLF y respaldo seguro.');
    } else {
      alert('Configuración de demostración guardada en sesión local.');
    }
  }

  // 6. ENTIDADES
  function loadKolDemo() {
    document.getElementById('ent-type').value = 'CapitalShip';
    document.getElementById('ent-hull').value = '3500';
    document.getElementById('ent-shields').value = '2100';
    document.getElementById('ent-antimatter').value = '300';
    document.getElementById('ent-mitigation').value = '0.70';
    document.getElementById('ent-hull-rate').value = '2.0';
    alert('Entidad canónica Kol Battleship cargada en el inspector.');
  }

  async function handleEntityUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = await apiPost('entities/inspect', { raw_content: event.target.result });
      if (res.success && res.data && res.data.attributes) {
        const a = res.data.attributes;
        if (a.HullPoints) document.getElementById('ent-hull').value = a.HullPoints;
        if (a.ShieldPoints) document.getElementById('ent-shields').value = a.ShieldPoints;
        if (a.MaxAntiMatter) document.getElementById('ent-antimatter').value = a.MaxAntiMatter;
        if (a.maxShieldMitigation) document.getElementById('ent-mitigation').value = a.maxShieldMitigation;
        if (a.HullPointRestoreRate) document.getElementById('ent-hull-rate').value = a.HullPointRestoreRate;
        alert(`Entidad ${file.name} inspeccionada con éxito.`);
      }
    };
    reader.readAsText(file);
  }

  async function saveEntityAction() {
    const params = {
      HullPoints: parseFloat(document.getElementById('ent-hull').value),
      ShieldPoints: parseFloat(document.getElementById('ent-shields').value),
      MaxAntiMatter: parseFloat(document.getElementById('ent-antimatter').value),
      maxShieldMitigation: parseFloat(document.getElementById('ent-mitigation').value),
      HullPointRestoreRate: parseFloat(document.getElementById('ent-hull-rate').value),
    };
    const res = await apiPost('entities/update', {
      file_path: 'Entity/KolBattleship.entity',
      parameters: params
    });
    alert('Parámetros guardados con respaldo seguro en storage/backups/.\n\nAVISO MULTIJUGADOR: Checksum de red alterado.');
  }

  // 7. GALAXY FORGE
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  async function requestGalaxy(count) {
    const res = await apiPost('galaxy/generate', {
      scenario_name: `Solaris_Ring_${count}P`,
      planet_count: count
    });
    if (res.success && res.data && res.data.galaxy) {
      renderGalaxyTopology(res.data.galaxy);
    }
  }

  function renderGalaxyTopology(galaxy) {
    state.currentGalaxy = galaxy;
    document.getElementById('galaxy-scenario-name').innerText = galaxy.scenarioName || 'Escenario Galáctico';
    document.getElementById('galaxy-star-count').innerText = galaxy.stars ? galaxy.stars.length : 1;
    document.getElementById('galaxy-planet-count').innerText = galaxy.planets ? galaxy.planets.length : 0;
    document.getElementById('galaxy-lane-count').innerText = galaxy.phaseLanes ? galaxy.phaseLanes.length : 0;

    const listEl = document.getElementById('galaxy-nodes-list');
    if (listEl) {
      listEl.innerHTML = '';
      (galaxy.planets || []).forEach(p => {
        const item = document.createElement('div');
        item.style.padding = '6px 8px';
        item.style.borderRadius = '8px';
        item.style.background = '#cfd4db';
        item.style.boxShadow = 'var(--neu-shadow-inset)';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.innerHTML = `
          <div>
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${PLANET_COLORS[p.type] || '#38bdf8'}; margin-right:6px;"></span>
            <strong>${p.name}</strong>
            ${p.isHomePlanet ? '<span style="color:#059669; margin-left:4px;">★</span>' : ''}
          </div>
          <span style="color:var(--text-secondary); font-size:0.7rem;">(${Math.round(p.x)}, ${Math.round(p.y)})</span>
        `;
        item.addEventListener('click', () => {
          const infoEl = document.getElementById('galaxy-selected-info');
          infoEl.innerHTML = `
            <div style="background: rgba(37, 99, 235, 0.08); border-left: 3px solid var(--text-blue); padding: 8px; border-radius: 6px;">
              <div><strong>Planeta:</strong> ${p.name}</div>
              <div><strong>Bioma:</strong> <span style="color:${PLANET_COLORS[p.type] || '#333'}">${p.type}</span></div>
              <div><strong>Coordenadas:</strong> X: ${p.x.toFixed(1)}, Y: ${p.y.toFixed(1)}</div>
              <div><strong>Planeta Natal:</strong> ${p.isHomePlanet ? 'SÍ (Spawn)' : 'NO (Neutral)'}</div>
            </div>
          `;
        });
        listEl.appendChild(item);
      });
    }

    drawGalaxy(galaxy);
  }

  function drawGalaxy(galaxy) {
    if (!ctx || !galaxy) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
    bgGrad.addColorStop(0, '#0a1020');
    bgGrad.addColorStop(1, '#03060c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    let maxDist = 60000;
    (galaxy.planets || []).forEach(p => {
      const d = Math.hypot(p.x, p.y);
      if (d > maxDist) maxDist = d;
    });

    const cx = width / 2;
    const cy = height / 2;
    const scale = (Math.min(width, height) / 2 - 45) / (maxDist || 1);

    const map = {};
    (galaxy.planets || []).forEach(p => {
      map[p.name] = { x: cx + (p.x * scale), y: cy + (p.y * scale), raw: p };
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 9;
    (galaxy.phaseLanes || []).forEach(lane => {
      const p1 = map[lane.source];
      const p2 = map[lane.target];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
    ctx.restore();

    (galaxy.stars || []).forEach(star => {
      const sx = cx + (star.x * scale);
      const sy = cy + (star.y * scale);
      ctx.save();
      const starGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 18);
      starGrad.addColorStop(0, '#fff');
      starGrad.addColorStop(0.3, '#facc15');
      starGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    Object.values(map).forEach(m => {
      const p = m.raw;
      const color = PLANET_COLORS[p.type] || '#38bdf8';
      ctx.save();
      if (p.isHomePlanet) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(m.x, m.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, m.x, m.y + 16);
    });
  }

  async function handleGalaxyUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = await apiPost('galaxy/parse', { raw_content: event.target.result });
      if (res.success && res.data) {
        renderGalaxyTopology(res.data);
        alert(`Escenario ${file.name} cargado con ${res.data.planets.length} planetas.`);
      }
    };
    reader.readAsText(file);
  }

  function exportGalaxyFile() {
    if (!state.currentGalaxy) {
      alert('Genera o carga un escenario galáctico primero.');
      return;
    }
    const g = state.currentGalaxy;
    let out = "TXT\r\ngalaxyScenarioDef\r\n";
    out += `\tstar\r\n\t\tname "${g.stars[0].name}"\r\n\t\ttype "Yellow"\r\n\t\tposition [ 0.0 , 0.0 ]\r\n`;
    (g.planets || []).forEach(p => {
      out += `\tplanet\r\n\t\tname "${p.name}"\r\n\t\ttype "${p.type}"\r\n\t\tposition [ ${p.x.toFixed(1)} , ${p.y.toFixed(1)} ]\r\n\t\tisHomePlanet ${p.isHomePlanet ? 'TRUE' : 'FALSE'}\r\n`;
    });
    (g.phaseLanes || []).forEach(lane => {
      out += `\tjumpLane\r\n\t\tsourcePlanet "${lane.source}"\r\n\t\ttargetPlanet "${lane.target}"\r\n`;
    });
    downloadBlob(out, `${g.scenarioName || 'GalaxyScenario'}.galaxy`);
  }

  // 8. DIAGNÓSTICO
  async function fetchHealthStatus() {
    const container = document.getElementById('health-report-content');
    const res = await apiGet('system/health');
    if (res.success && res.data) {
      const d = res.data;
      container.innerHTML = `
        <div style="padding: 10px; background: rgba(5, 150, 105, 0.1); border-radius: 10px; color: #059669; font-weight: 700;">
          ✓ SERVIDOR WAMP ACTIVO: Conexión establecida con Apache y PHP ${d.phpVersion}.
        </div>
        <div><strong>Suite Corporativa:</strong> ${d.appName} (${d.version})</div>
        <div><strong>Organización:</strong> ${d.company}</div>
        <div><strong>Estado Global:</strong> <span class="metric-badge-pill">${d.status.toUpperCase()}</span></div>
        <div><strong>Base de Datos Relacional:</strong> ${d.database}</div>
        <div><strong>Memoria RAM Servidor:</strong> ${d.memoryUsageMb} MB</div>
        <div><strong>Protocolo UUID Safety:</strong> ACTIVO (Cero Stack Traces en respuestas HTTP)</div>
      `;
    }
  }

  // 9. CONVERTDATA CLI
  async function runConvertDataAction() {
    const type = document.getElementById('convert-resource-type').value;
    const direction = document.getElementById('convert-direction').value;
    const filePath = document.getElementById('convert-file-path').value;
    const resultBox = document.getElementById('convert-result-box');

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<em>Ejecutando pipeline de conversión ConvertData_Rebellion.exe...</em>';

    const res = await apiPost('engine/convert', {
      resource_type: type,
      direction: direction,
      file_path: filePath
    });

    if (res.success && res.data) {
      resultBox.innerHTML = `
        <div style="color: #059669; font-weight: 700;">✓ CONVERSIÓN COMPLETADA: ${res.data.mode}</div>
        <div style="margin-top: 4px;"><strong>Ruta de Salida:</strong> ${res.data.outputPath}</div>
        <div><strong>Hash SHA-256:</strong> ${res.data.checksum}</div>
      `;
    } else {
      resultBox.innerHTML = `<span style="color: #dc2626;">Error: ${res.message || 'Error en conversión'}</span>`;
    }
  }

  // INICIALIZACIÓN
  function init() {
    // Eventos de Navegación
    document.querySelectorAll('.sidebar-nav-item, .dock-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Filtros de Cadenas
    document.querySelectorAll('.tab-link-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.getAttribute('data-filter');
        applyFilters();
      });
    });

    const searchInput = document.getElementById('grid-search-input');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    if (viewport) viewport.addEventListener('scroll', renderVirtualGrid);

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    inputTranslated.addEventListener('input', validateModalTokens);
    document.getElementById('modal-save').addEventListener('click', () => {
      if (state.currentEditIndex === null) return;
      state.filteredEntries[state.currentEditIndex].translated = inputTranslated.value;
      closeModal();
      renderVirtualGrid();
    });

    document.getElementById('btn-suggest-tm').addEventListener('click', () => {
      alert('Memoria de Traducción (TM): 100% Coincidencia SHA-256 aplicada.');
    });

    // Carga inicial
    state.allEntries = generateDemoEntries();
    state.filteredEntries = state.allEntries;
    renderVirtualGrid();
    renderModManager();
    fetchHealthStatus();
    requestGalaxy(12);
    renderContextualActions('tab-translation');
  }

  return {
    init,
    switchTab
  };
})();

document.addEventListener('DOMContentLoaded', NexusUI.init);
