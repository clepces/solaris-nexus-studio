/**
 * Solaris Nexus Studio - NexusUI Application Coordinator
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.NexusUI = (() => {
  function init() {
    // 1. Inicializar Módulos Especializados
    if (window.ViewNavigator) window.ViewNavigator.init();
    if (window.TranslationStudioModule) window.TranslationStudioModule.init();
    if (window.ModManagerModule) window.ModManagerModule.init();
    if (window.EntityEditorModule) window.EntityEditorModule.init();
    if (window.GalaxyForgeModule) window.GalaxyForgeModule.init();
    if (window.ConvertCliModule) window.ConvertCliModule.init();
    if (window.SystemHealthModule) window.SystemHealthModule.init();

    // 2. Arrancar en Vista Dashboard con Estado Limpio y Transparente
    if (window.ViewNavigator) {
      window.ViewNavigator.switchTab('tab-dashboard');
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

  function loadDemoData() {
    if (window.TranslationStudioModule) {
      window.TranslationStudioModule.loadDemoData();
    }
  }

  return {
    init,
    switchTab,
    toggleSidebar,
    loadDemoData
  };
})();

document.addEventListener('DOMContentLoaded', NexusUI.init);
