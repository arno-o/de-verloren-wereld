import { gameEvents, Events } from '../utils/events.js';

export default class OutroScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
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

  start() {
    this.isActive = true;
    this.container.classList.remove('hidden');
  }

  cleanup() {
    this.isActive = false;
    this.container.classList.add('hidden');
  }
}
