import { gameEvents, Events } from '../utils/events.js';

export default class Game1Scene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.isPaused = false;
    this.gameTimer = null;
    this.pauseListener = null;
    this.resumeListener = null;
  }

  init() {
    console.log('[Game1Scene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="game1-content">
        <h2>Spel 1</h2>
        <div class="game-area">
          <!-- Your game 1 content here -->
          <p>Game 1 is running...</p>
        </div>
        <div class="pause-overlay hidden">
          <p>Wachten op speler...</p>
        </div>
      </div>
    `;
  }

  start() {
    console.log('[Game1Scene] Starting game 1...');
    this.isActive = true;
    this.isPaused = false;
    this.container.classList.remove('hidden');
    
    // Setup pause/resume listeners
    this.pauseListener = () => this.handlePause();
    this.resumeListener = () => this.handleResume();
    gameEvents.on(Events.GAME_PAUSE, this.pauseListener);
    gameEvents.on(Events.GAME_RESUME, this.resumeListener);
    
    // Start game logic
    this.startGameLogic();
  }

  startGameLogic() {
    // Example: Auto-complete after 15 seconds
    this.gameTimer = setTimeout(() => {
      if (!this.isPaused) {
        this.onGameComplete();
      }
    }, 15000);
    
    // TODO: Implement actual game logic here
  }

  handlePause() {
    console.log('[Game1Scene] Game paused');
    this.isPaused = true;
    const overlay = this.container.querySelector('.pause-overlay');
    overlay.classList.remove('hidden');
    
    // Pause game logic here
  }

  handleResume() {
    console.log('[Game1Scene] Game resumed');
    this.isPaused = false;
    const overlay = this.container.querySelector('.pause-overlay');
    overlay.classList.add('hidden');
    
    // Resume game logic here
  }

  onGameComplete() {
    console.log('[Game1Scene] Game 1 completed');
    if (this.isActive && !this.isPaused) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'game1' });
    }
  }

  update(deltaTime) {
    // Called each frame if needed
    if (!this.isActive || this.isPaused) return;
    
    // Implement game loop here
  }

  cleanup() {
    console.log('[Game1Scene] Cleaning up...');
    this.isActive = false;
    this.isPaused = false;
    
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    
    if (this.pauseListener) {
      gameEvents.off(Events.GAME_PAUSE, this.pauseListener);
      this.pauseListener = null;
    }
    
    if (this.resumeListener) {
      gameEvents.off(Events.GAME_RESUME, this.resumeListener);
      this.resumeListener = null;
    }
    
    this.container.classList.add('hidden');
  }
}
