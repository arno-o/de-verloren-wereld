import GameStateManager from './src/managers/GameStateManager.js';

console.log('[Renderer] Initializing De Verloren Wereld...');

const gameStateManager = new GameStateManager();

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Renderer] DOM loaded, starting game...');
  gameStateManager.start();
});

if (window.versions) {
  console.log(`Chrome: v${window.versions.chrome()}`);
  console.log(`Node: v${window.versions.node()}`);
  console.log(`Electron: v${window.versions.electron()}`);
}