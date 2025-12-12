import { SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import BackgroundManager from '../managers/BackgroundManager.js';

export default class IntroScene {
  constructor(container, playerManager) {
    this.isActive = false;
    this.introTimer = null;
    this.container = container;
    
    this.playerManager = playerManager;
    this.backgroundManager = new BackgroundManager();
  }

  init() {
    console.log('[IntroScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="intro-content">
        <div class="demo-video hidden">
          <video />
        </div>
      </div>
    `;
  }

  start() {
    this.isActive = true;
    this.container.classList.remove('hidden');
    this.playDemo();
  }

  playDemo() {
    this.backgroundManager.setSegment('PROCESS_UP', () => {
      console.log('[IntroScene] Moved background UP');

      this.backgroundManager.setSegment('PROCESS_DOWN', () => {
        this.backgroundManager.setSegment('TRANSITION_START', () => {
          this.backgroundManager.setSegment('GAME');
          this.onIntroComplete();
          this.isActive = false;
        })
      })
    });
  }

  onIntroComplete() {
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'intro' });
    }
  }

  cleanup() {
    this.isActive = false;

    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }

    this.container.classList.add('hidden');
  }
}