/**
 * Solaris Nexus Studio - SidebarTree Module
 * Clepces org. ltd | Versión Oficial v0.4.1.0-alpha
 */
window.SidebarTree = (() => {
  let currentTreeTarget = null;
  let currentTreeType = null;

  function openTreeItem(type, target) {
    if (type === 'str') {
      window.ViewNavigator?.switchTab('tab-translation');
      if (window.TranslationStudioModule && window.TranslationStudioModule.getCount() === 0) {
        window.TranslationStudioModule.loadDemoData();
      }
    } else if (type === 'mods' || type === 'enabled') {
      window.ViewNavigator?.switchTab('tab-mods');
      if (window.ModManagerModule) window.ModManagerModule.scanMods();
    } else if (type === 'entities') {
      window.ViewNavigator?.switchTab('tab-entities');
      if (window.EntityEditorModule) window.EntityEditorModule.loadCatalog();
    } else if (type === 'galaxy') {
      window.ViewNavigator?.switchTab('tab-galaxy');
      if (window.GalaxyForgeModule) window.GalaxyForgeModule.generate(12);
    }
  }

  function init() {
    document.querySelectorAll('.tree-folder-toggle').forEach(folderNode => {
      folderNode.addEventListener('click', (e) => {
        e.stopPropagation();
        folderNode.classList.toggle('active');
        const folderKey = folderNode.getAttribute('data-folder');
        const subGroup = document.getElementById(`tree-group-${folderKey}`);
        const caret = folderNode.querySelector('.tree-caret');
        const isOpen = folderNode.classList.contains('active');
        if (subGroup) {
          subGroup.style.display = isOpen ? 'block' : 'none';
        }
        if (caret) {
          caret.innerText = isOpen ? '▼' : '▶';
        }
      });
    });

    const inspector = document.getElementById('tree-selection-inspector');
    const selName = document.getElementById('tree-sel-name');
    const selType = document.getElementById('tree-sel-type');
    const btnOpen = document.getElementById('btn-tree-open-target');

    document.querySelectorAll('.tree-file[data-target]').forEach(fileNode => {
      fileNode.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tree-file').forEach(f => f.classList.remove('selected'));
        fileNode.classList.add('selected');

        const target = fileNode.getAttribute('data-target');
        const type = fileNode.getAttribute('data-type');
        const label = fileNode.querySelector('span:last-child')?.innerText || target;

        currentTreeTarget = target;
        currentTreeType = type;

        if (inspector && selName && selType) {
          inspector.style.display = 'block';
          selName.innerText = label;
          selType.innerText = `[${(type || 'FILE').toUpperCase()}] · ${target}`;
        }
      });

      fileNode.addEventListener('dblclick', () => {
        const target = fileNode.getAttribute('data-target');
        const type = fileNode.getAttribute('data-type');
        openTreeItem(type, target);
      });
    });

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        if (currentTreeType && currentTreeTarget) {
          openTreeItem(currentTreeType, currentTreeTarget);
        }
      });
    }

    const vfsSearch = document.getElementById('vfs-tree-search-input');
    if (vfsSearch) {
      vfsSearch.addEventListener('input', () => {
        const q = vfsSearch.value.toLowerCase().trim();
        document.querySelectorAll('.tree-file').forEach(fileNode => {
          const text = fileNode.innerText.toLowerCase();
          fileNode.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
      });
    }
  }

  return {
    init,
    openTreeItem
  };
})();
