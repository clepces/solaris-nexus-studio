/**
 * Solaris Nexus Studio - GalaxyForge Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.GalaxyForgeModule = (() => {
  const { state, apiPost, downloadBlob } = NexusCore;

  const PLANET_COLORS = {
    'Terran': '#22c55e',
    'Desert': '#eab308',
    'Ice': '#38bdf8',
    'Volcanic': '#ef4444',
    'Asteroid': '#94a3b8',
    'GasGiant': '#a855f7'
  };

  let canvas = null;
  let ctx = null;

  function init() {
    canvas = document.getElementById('galaxy-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
    }

    generate(12);
  }

  function refreshCanvas() {
    if (state.currentGalaxy) {
      requestAnimationFrame(() => drawGalaxy(state.currentGalaxy));
    }
  }

  async function generate(count) {
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

    const nameEl = document.getElementById('galaxy-scenario-name');
    const starEl = document.getElementById('galaxy-star-count');
    const planetEl = document.getElementById('galaxy-planet-count');
    const laneEl = document.getElementById('galaxy-lane-count');

    if (nameEl) nameEl.innerText = galaxy.scenarioName || 'Escenario Galáctico';
    if (starEl) starEl.innerText = galaxy.stars ? galaxy.stars.length : 1;
    if (planetEl) planetEl.innerText = galaxy.planets ? galaxy.planets.length : 0;
    if (laneEl) laneEl.innerText = galaxy.phaseLanes ? galaxy.phaseLanes.length : 0;

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
          if (infoEl) {
            infoEl.innerHTML = `
              <div style="background: rgba(37, 99, 235, 0.08); border-left: 3px solid var(--text-blue); padding: 8px; border-radius: 6px;">
                <div><strong>Planeta:</strong> ${p.name}</div>
                <div><strong>Bioma:</strong> <span style="color:${PLANET_COLORS[p.type] || '#333'}">${p.type}</span></div>
                <div><strong>Coordenadas:</strong> X: ${p.x.toFixed(1)}, Y: ${p.y.toFixed(1)}</div>
                <div><strong>Planeta Natal:</strong> ${p.isHomePlanet ? 'SÍ (Spawn Oficial)' : 'NO (Neutral)'}</div>
              </div>
            `;
          }
        });

        listEl.appendChild(item);
      });
    }

    validateGraphConnectivity(galaxy);
    drawGalaxy(galaxy);
  }

  function validateGraphConnectivity(galaxy) {
    if (!galaxy.planets || galaxy.planets.length === 0) return;
    const adj = {};
    galaxy.planets.forEach(p => { adj[p.name] = []; });
    (galaxy.phaseLanes || []).forEach(l => {
      if (adj[l.source] && adj[l.target]) {
        adj[l.source].push(l.target);
        adj[l.target].push(l.source);
      }
    });

    const visited = new Set();
    const startNode = galaxy.planets[0].name;
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const cur = queue.shift();
      (adj[cur] || []).forEach(nxt => {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      });
    }

    const unreached = galaxy.planets.filter(p => !visited.has(p.name));
    const badge = document.getElementById('galaxy-connectivity-badge');
    if (badge) {
      if (unreached.length === 0) {
        badge.className = 'metric-badge-pill';
        badge.style.color = 'var(--text-success)';
        badge.innerText = '● Grafo 100% Conexo (BFS OK)';
      } else {
        badge.className = 'metric-badge-pill neutral';
        badge.style.color = '#dc2626';
        badge.innerText = `⚠️ ${unreached.length} Planetas Aislados`;
      }
    }
  }

  function drawGalaxy(galaxy) {
    if (!ctx || !canvas || !galaxy) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Fondo espacial estelar
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
    bgGrad.addColorStop(0, '#0a1020');
    bgGrad.addColorStop(1, '#03060c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Rejilla táctica
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

    const scale = (Math.min(width, height) / 2 - 35) / maxDist;
    const cx = width / 2;
    const cy = height / 2;

    const pMap = {};
    (galaxy.planets || []).forEach(p => { pMap[p.name] = p; });

    // Líneas de fase (Phase Lanes)
    ctx.lineWidth = 1.2;
    (galaxy.phaseLanes || []).forEach(lane => {
      const p1 = pMap[lane.source];
      const p2 = pMap[lane.target];
      if (p1 && p2) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.moveTo(cx + p1.x * scale, cy + p1.y * scale);
        ctx.lineTo(cx + p2.x * scale, cy + p2.y * scale);
        ctx.stroke();
      }
    });

    // Estrella central
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Planetas
    (galaxy.planets || []).forEach(p => {
      const px = cx + p.x * scale;
      const py = cy + p.y * scale;

      ctx.fillStyle = PLANET_COLORS[p.type] || '#94a3b8';
      ctx.beginPath();
      ctx.arc(px, py, p.isHomePlanet ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '8px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, px, py - 6);
    });
  }

  function exportGalaxy() {
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

  return {
    init,
    generate,
    exportGalaxy,
    refreshCanvas
  };
})();
