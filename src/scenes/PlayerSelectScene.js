import { SceneConfig, AvatarColors } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerSelectScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.countdownTimer = null;
    this.playerJoinListener = null;
    this.remainingTime = 0;
  }

  init() {
    console.log('[PlayerSelectScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="player-select-content">
        <h2>Welkom spelers!</h2>
        <p class="instructions">Ga op een veld staan om mee te spelen</p>
        
        <div class="player-avatars">
          <div class="avatar-slot" data-player="1"><div class="avatar empty"></div><span>Speler 1</span></div>
          <div class="avatar-slot" data-player="2"><div class="avatar empty"></div><span>Speler 2</span></div>
          <div class="avatar-slot" data-player="3"><div class="avatar empty"></div><span>Speler 3</span></div>
          <div class="avatar-slot" data-player="4"><div class="avatar empty"></div><span>Speler 4</span></div>
        </div>
        
        <div class="countdown">
          <p>Het spel begint in <span id="countdown-timer">15</span> seconden...</p>
        </div>
      </div>
    `;
  }

  start() {
    console.log('[PlayerSelectScene] Starting player select scene...');
    this.isActive = true;
    this.container.classList.remove('hidden');
    this.remainingTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
    
    this.updatePlayerDisplay();
    
    this.playerJoinListener = (data) => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_JOIN, this.playerJoinListener);
    
    this.startCountdown();
  }

  updatePlayerDisplay() {
    const activePlayers = this.playerManager.getActivePlayerIds();
    
    for (let i = 1; i <= 4; i++) {
      const slot = this.container.querySelector(`[data-player="${i}"] .avatar`);
      if (activePlayers.includes(i)) {
        slot.classList.remove('empty');
        slot.classList.add('active');
        slot.style.backgroundColor = AvatarColors[i - 1];
      } else {
        slot.classList.add('empty');
        slot.classList.remove('active');
        slot.style.backgroundColor = '';
      }
    }
  }

  startCountdown() {
    const timerElement = this.container.querySelector('#countdown-timer');
    
    const updateTimer = () => {
      if (!this.isActive) return;
      
      timerElement.textContent = this.remainingTime;
      
      if (this.remainingTime <= 0) {
        this.onCountdownComplete();
      } else {
        this.remainingTime--;
        this.countdownTimer = setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  }

  onCountdownComplete() {
    console.log('[PlayerSelectScene] Countdown complete, starting game');
    gameEvents.emit(Events.PLAYERS_READY);
  }

  cleanup() {
    console.log('[PlayerSelectScene] Cleaning up...');
    this.isActive = false;
    
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    if (this.playerJoinListener) {
      gameEvents.off(Events.PLAYER_JOIN, this.playerJoinListener);
      this.playerJoinListener = null;
    }
    
    this.container.classList.add('hidden');
  }
}
