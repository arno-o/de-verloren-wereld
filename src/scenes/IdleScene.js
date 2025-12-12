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
        <h1>De Verloren Wereld</h1>
        <p class="subtitle">Stap op een veld om te beginnen</p>
        <div class="attract-animation">
          <div class="pulse-indicator"></div>
        </div>
      </div>
    `;
  }

  start() {
    console.log('[IdleScene] Starting idle scene...');
    this.isActive = true;
    this.container.classList.remove('hidden');
  }

  cleanup() {
    console.log('[IdleScene] Cleaning up...');
    this.isActive = false;
    this.container.classList.add('hidden');
  }
}
