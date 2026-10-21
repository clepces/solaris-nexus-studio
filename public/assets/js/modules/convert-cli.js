/**
 * Solaris Nexus Studio - ConvertCli Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.ConvertCliModule = (() => {
  const { apiPost } = NexusCore;

  async function run() {
    const type = document.getElementById('convert-resource-type')?.value || 'entity';
    const direction = document.getElementById('convert-direction')?.value || 'bin_to_txt';
    const filePath = document.getElementById('convert-file-path')?.value || 'tests/fixtures/sample_demo.entity';
    const resultBox = document.getElementById('convert-result-box');

    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.78rem;">
        > Inicializando ConvertData_Rebellion.exe...<br>
        > Modo: ${direction} | Tipo: ${type}<br>
        > Ruta objetivo: ${filePath}
      </div>
    `;

    const res = await apiPost('engine/convert', {
      resource_type: type,
      direction: direction,
      file_path: filePath
    });

    if (res.success && res.data) {
      if (window.ViewNavigator) {
        window.ViewNavigator.logExecution('CLI', `Conversión ${direction} (${type}): ${filePath}`, 'DirectX OK');
      }
      resultBox.innerHTML = `
        <div style="color: #059669; font-weight: 700; margin-bottom: 4px;">✓ CONVERSIÓN COMPLETADA EXITOSAMENTE (${res.data.mode})</div>
        <div style="font-family: var(--font-mono); font-size: 0.78rem;">
          <div><strong>Ruta de Salida:</strong> ${res.data.outputPath}</div>
          <div style="margin-top: 3px;"><strong>Checksum SHA-256:</strong> <span style="color: var(--text-blue);">${res.data.checksum}</span></div>
          <div style="margin-top: 3px; color: var(--text-secondary);">DirectX 9 Vertex & String Alignment OK.</div>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div style="color: #dc2626; font-weight: 700;">✗ ERROR EN PIPELINE DE CONVERSIÓN</div>
        <div style="font-size: 0.78rem; margin-top: 4px; color: var(--text-secondary);">${res.message || 'Error de procesamiento en subproceso proc_open.'}</div>
      `;
    }
  }

  function init() {
    document.getElementById('btn-run-cli-main')?.addEventListener('click', run);
  }

  return {
    init,
    run
  };
})();
