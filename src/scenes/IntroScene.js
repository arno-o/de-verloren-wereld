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
    
    // Play intro story
    this.playIntro();
  }

  playIntro() {
    // Example: Auto-complete after 10 seconds
    // Replace with your actual intro audio/video duration
    this.introTimer = setTimeout(() => {
      this.onIntroComplete();
    }, 10000);
    
    // TODO: Add your audio playback here
    // const audio = new Audio('path/to/intro.mp3');
    // audio.play();
    // audio.onended = () => this.onIntroComplete();
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
