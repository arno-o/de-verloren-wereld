import { gameEvents, Events } from '../utils/events.js';

export default class OutroScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.outroTimer = null;
  }

  init() {
    console.log('[OutroScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="outro-content">
        <h2>Geweldig gedaan!</h2>
        <div class="outro-story">
          <p class="outro-message">
            Fantastisch! Jullie hebben het avontuur succesvol voltooid!
          </p>
        </div>
        <div class="outro-visuals">
          <!-- Add outro visuals/animations here -->
        </div>
      </div>
    `;
  }

  start(options = {}) {
    console.log('[OutroScene] Starting outro scene...');
    this.isActive = true;
    this.container.classList.remove('hidden');
    
    // play outro
    this.playOutro();
  }

  playOutro() {
    // auto-complete after timer
    this.outroTimer = setTimeout(() => {
      this.onOutroComplete();
    }, 8000); // give time to see message, outro plays 20s in GameStateManager
    
    // TODO: add audio/video playback here
  }

  onOutroComplete() {
    console.log('[OutroScene] Outro completed');
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'outro' });
    }
  }

  cleanup() {
    console.log('[OutroScene] Cleaning up...');
    this.isActive = false;
    
    if (this.outroTimer) {
      clearTimeout(this.outroTimer);
      this.outroTimer = null;
    }
    
    this.container.classList.add('hidden');
  }
}
