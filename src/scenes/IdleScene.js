import Lottie from 'lottie-web';
import { PlayerConfig } from '../utils/constants.js';

export default class IdleScene {
  constructor(container) {
    this.container = container;
    this.isActive = false;
  }

  init() {
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="idle-content">
        <div class="idle-header">
          <div class="idle-header-item">2 - 4 spelers</div>
        </div>
        <div class="idle-title">
          <div class="idle-title-image">
            <img src="../assets/images/idle_logo.png" />
          </div>
          <div class="idle-title-instruction">
            Stap op 1 van de tegels om te beginnen
          </div>
        </div>
        <div class="idle-arrows">
          ${Array.from({ length: PlayerConfig.MAX_PLAYERS }, (_, i) => `
            <div class="idle-arrow-slot" id="arrow-${i}"></div>
          `).join('')}
        </div>
      </div>
    `;

    this.setupArrows();
  }

  start() {
    console.log('[IdleScene] Starting idle scene...');
    this.isActive = true;
    this.container.classList.remove('hidden');
  }

  setupArrows() {
    const avatarTypes = ['water', 'fire', 'earth', 'air'];

    for (let i = 0; i < PlayerConfig.MAX_PLAYERS; i++) {
      const playerContainer = document.querySelector(`#arrow-${i}`);
      const avatarType = avatarTypes[i % avatarTypes.length];

      const animation = Lottie.loadAnimation({
        container: playerContainer,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: `./assets/animations/arrow_${avatarType}.json`,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
        }
      });

      setTimeout(() => {
        animation.play();
      }, i * 200);
    }
  }

  cleanup() {
    console.log('[IdleScene] Cleaning up...');
    this.isActive = false;
    this.container.classList.add('hidden');
  }
}
