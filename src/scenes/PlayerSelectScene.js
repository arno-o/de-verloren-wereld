import { SceneConfig, AvatarColors, PlayerConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerSelectScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.countdownTimer = null;
    this.playerJoinListener = null;
    this.playerLeaveListener = null;
    this.playerInactiveListener = null;
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
          <p id="countdown-message">Het spel begint in <span id="countdown-timer">15</span> seconden...</p>
          <p id="min-players-message" class="hidden">Minimaal ${PlayerConfig.MIN_PLAYERS} spelers nodig om te starten</p>
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
    
    this.playerJoinListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_JOIN, this.playerJoinListener);

    this.playerLeaveListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_LEAVE, this.playerLeaveListener);
    
    this.playerInactiveListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_INACTIVE, this.playerInactiveListener);
    
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
    
    this.checkMinimumPlayers();
  }
  
  checkMinimumPlayers() {
    const activeCount = this.playerManager.getActivePlayerCount();
    const countdownMessage = this.container.querySelector('#countdown-message');
    const minPlayersMessage = this.container.querySelector('#min-players-message');
    const timerElement = this.container.querySelector('#countdown-timer');
    
    if (activeCount < PlayerConfig.MIN_PLAYERS) {
      // below minimum - reset countdown and show message
      this.remainingTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
      if (timerElement) timerElement.textContent = this.remainingTime;
      countdownMessage?.classList.add('hidden');
      minPlayersMessage?.classList.remove('hidden');
    } else {
      // above minimum - start/continue countdown
      countdownMessage?.classList.remove('hidden');
      minPlayersMessage?.classList.add('hidden');
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
    console.log('[PlayerSelectScene] Countdown complete');
    
    // check if we have minimum players
    const activeCount = this.playerManager.getActivePlayerCount();
    if (activeCount < PlayerConfig.MIN_PLAYERS) {
      console.log(`[PlayerSelectScene] Not enough players (${activeCount}/${PlayerConfig.MIN_PLAYERS}), cannot start game`);
      // reset countdown to idle
      gameEvents.emit(Events.RESET_TO_IDLE);
      return;
    }
    
    console.log('[PlayerSelectScene] Starting game with', activeCount, 'players');
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
    
    if (this.playerLeaveListener) {
      gameEvents.off(Events.PLAYER_LEAVE, this.playerLeaveListener);
      this.playerLeaveListener = null;
    }
    
    if (this.playerInactiveListener) {
      gameEvents.off(Events.PLAYER_INACTIVE, this.playerInactiveListener);
      this.playerInactiveListener = null;
    }
    
    this.container.classList.add('hidden');
  }
}
