/**
 * Solaris Nexus Studio - NexusUI Application Coordinator
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.NexusUI = (() => {
  async function init() {
    // 1. Cargar entorno real del sistema (cero datos simulados)
    if (window.NexusCore && window.NexusCore.fetchRealEnvironment) {
      await window.NexusCore.fetchRealEnvironment();
    }

    // 2. Inicializar Módulos Especializados
    if (window.ViewNavigator) window.ViewNavigator.init();
    if (window.TranslationStudioModule) window.TranslationStudioModule.init();
    if (window.ModManagerModule) window.ModManagerModule.init();
    if (window.EntityEditorModule) window.EntityEditorModule.init();
    if (window.GalaxyForgeModule) window.GalaxyForgeModule.init();
    if (window.ConvertCliModule) window.ConvertCliModule.init();
    if (window.SystemHealthModule) window.SystemHealthModule.init();

    // 3. Arrancar en Vista Restaurada o Dashboard con Datos Reales
    if (window.ViewNavigator) {
      const savedTab = localStorage.getItem('solaris_active_tab') || 'tab-dashboard';
      window.ViewNavigator.switchTab(savedTab);
    }
  }

  function switchTab(targetId) {
    if (window.ViewNavigator) {
      window.ViewNavigator.switchTab(targetId);
    }
  }

  function toggleSidebar(forceOpen) {
    if (window.ViewNavigator) {
      window.ViewNavigator.toggleSidebar(forceOpen);
    }
  }

  function toggleExperimentalDrawer() {
    if (window.ViewNavigator) {
      window.ViewNavigator.toggleExperimentalDrawer();
    }
  }

  function loadDemoData() {
    if (window.TranslationStudioModule) {
      window.TranslationStudioModule.loadDemoData();
    }
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    toggleExperimentalDrawer,
    loadDemoData
  };
})();

document.addEventListener('DOMContentLoaded', NexusUI.init);
