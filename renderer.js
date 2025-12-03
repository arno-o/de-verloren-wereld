import GameStateManager from './src/managers/GameStateManager.js';

console.log('[Renderer] Initializing De Verloren Wereld...');

const gameStateManager = new GameStateManager();

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Renderer] DOM loaded, starting game...');
  gameStateManager.start();
});

// ctrl+shift+q to quit
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
    console.log('[Renderer] Emergency quit requested');
    if (window.electronAPI) {
      window.electronAPI.quitApp();
    }
  }
  
  // ctrl+shift+r to restart
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
    console.log('[Renderer] Emergency restart requested');
    if (window.electronAPI) {
      window.electronAPI.restartApp();
    }
  }
});

if (window.versions) {
  console.log(`Chrome: v${window.versions.chrome()}`);
  console.log(`Node: v${window.versions.node()}`);
  console.log(`Electron: v${window.versions.electron()}`);
}