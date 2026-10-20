/**
 * Solaris Nexus Studio - NexusCore Client Services
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */

const NexusCore = (() => {
  const state = {
    allEntries: [],
    filteredEntries: [],
    currentFilter: 'all',
    activeMods: [
      { name: '[ES] Star Wars Interregnum Traduccion', priority: 999, isMinimod: true, ramMb: 15 },
      { name: 'Star Wars Interregnum', priority: 989, isMinimod: false, ramMb: 1250 },
      { name: 'Enhanced 4X Mod', priority: 979, isMinimod: false, ramMb: 450 }
    ],
    currentEditIndex: null,
    rowHeight: 40,
    visibleCount: 40,
    currentGalaxy: null,
  };

  function extractTokens(text) {
    const regex = /\[VALUE\d*\]|%s|%d|%f|\{\d+\}/g;
    const found = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      found.push(m[0]);
    }
    return found;
  }

  function validateTokenSyntax(originalTokens, translatedText) {
    if (/(?<!\\)"/.test(translatedText)) {
      return {
        valid: false,
        error: 'ADVERTENCIA: Contiene comillas dobles sin escapar que romperán el motor.'
      };
    }

    const currentTokens = extractTokens(translatedText);
    const missing = originalTokens.filter(t => !currentTokens.includes(t));
    if (missing.length > 0) {
      return {
        valid: false,
        error: `ERROR TOKEN GUARD: Faltan los tokens requeridos: ${missing.join(', ')}`
      };
    }

    return {
      valid: true,
      message: 'SINTAXIS CORRECTA: Todos los tokens del motor coinciden.'
    };
  }

  function generateDemoEntries() {
    const templates = [
      ['IDS_MAIN_MENU_TITLE', 'Sins of a Solar Empire: Rebellion', 'Sins of a Solar Empire: Rebellion'],
      ['IDS_FLEET_STATUS', 'Fleet %s holding position with [VALUE] ships.', 'Flota %s manteniendo posición con [VALUE] naves.'],
      ['IDS_CAPITAL_SHIP_NAME', 'Kol Class Battleship', 'Acorazado Clase Kol'],
      ['IDS_TITAN_RAGNAROV', 'Ragnarov Titan armed with railguns.', 'Titán Ragnarov equipado con cañones de riel.'],
      ['IDS_ABILITY_SNIPE', 'Snipe enemy capital ships dealing [VALUE] damage.', 'Francotirador contra naves capitales infligiendo [VALUE] de daño.'],
      ['IDS_RESEARCH_ARMOR', 'Increases armor rating by [VALUE]%.', 'Incrementa el blindaje en un [VALUE]%.'],
      ['IDS_PLANET_DESERT', 'Arid and barren desert planet.', 'Planeta desértico árido y yermo.']
    ];

    const entries = [];
    for (let i = 0; i < 7828; i++) {
      const item = templates[i % templates.length];
      entries.push({
        id: `${item[0]}_${i}`,
        original: item[1],
        translated: item[2],
        tokens: extractTokens(item[1]),
      });
    }
    return entries;
  }

  function downloadBlob(content, filename, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function apiPost(endpoint, payload) {
    try {
      const res = await fetch(`api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function apiGet(endpoint) {
    try {
      const res = await fetch(`api/${endpoint}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return {
    state,
    extractTokens,
    validateTokenSyntax,
    generateDemoEntries,
    downloadBlob,
    apiPost,
    apiGet
  };
})();
