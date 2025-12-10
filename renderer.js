import GameStateManager from './src/managers/GameStateManager.js';

console.log('[Renderer] Initializing De Verloren Wereld...');

const gameStateManager = new GameStateManager();

window.addEventListener('DOMContentLoaded', () => {
  gameStateManager.start();
});