import { SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class IntroScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.introTimer = null;
  }

  init() {
    console.log('[IntroScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="intro-content">
        <div class="story-text">
          <h2>Het Verhaal Begint...</h2>
          <p class="story-paragraph">
            <!-- Your intro story text here -->
          </p>
        </div>
        <div class="intro-visuals">
          <!-- Add intro visuals/animations here -->
        </div>
      </div>
    `;
  }

  start() {
    console.log('[IntroScene] Starting intro scene...');
    this.isActive = true;
    this.container.classList.remove('hidden');
    this.playIntro();
  }

  playIntro() {
    console.log('[IntroScene] Playing intro content...');
  }

  onIntroComplete() {
    console.log('[IntroScene] Intro completed');
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'intro' });
    }
  }

  cleanup() {
    console.log('[IntroScene] Cleaning up...');
    this.isActive = false;

    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }

    this.container.classList.add('hidden');
  }
}