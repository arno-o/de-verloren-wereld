import { SceneConfig, AvatarColors, PlayerConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerSelectScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.countdownTimer = null;
    this.isCountdownRunning = false;
    this.playerJoinListener = null;
    this.playerLeaveListener = null;
    this.playerInactiveListener = null;
    this.remainingTime = 0;
    
    // cached DOM elements
    this.countdownMessage = null;
    this.minPlayersMessage = null;
    this.timerElement = null;
  }

  init() {
    console.log('[PlayerSelectScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    const initialTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
    
    this.container.innerHTML = `
      <div class="player-select-content">
        <h2>Welkom spelers!</h2>
        <p class="instructions">Ga op een veld staan om mee te spelen</p>
        
        <div class="player-avatars">
          ${Array.from({ length: PlayerConfig.MAX_PLAYERS }, (_, i) => `
            <div class="avatar-slot" data-player="${i + 1}">
              <div class="avatar empty"></div>
              <span>Speler ${i + 1}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="countdown">
          <p id="countdown-message">Het spel begint in <span id="countdown-timer">${initialTime}</span> seconden...</p>
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

    // cache DOM elements
    this.countdownMessage = this.container.querySelector('#countdown-message');
    this.minPlayersMessage = this.container.querySelector('#min-players-message');
    this.timerElement = this.container.querySelector('#countdown-timer');

    this.updatePlayerDisplay();

    this.playerJoinListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_JOIN, this.playerJoinListener);

    this.playerLeaveListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_LEAVE, this.playerLeaveListener);

    this.playerInactiveListener = () => this.updatePlayerDisplay();
    gameEvents.on(Events.PLAYER_INACTIVE, this.playerInactiveListener);
  }

  updatePlayerDisplay() {
    const activePlayers = this.playerManager.getActivePlayerIds();

    for (let i = 1; i <= PlayerConfig.MAX_PLAYERS; i++) {
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

    if (activeCount < PlayerConfig.MIN_PLAYERS) {
      // below minimum
      this.stopCountdown();
      this.remainingTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
      if (this.timerElement) this.timerElement.textContent = this.remainingTime;
      this.countdownMessage?.classList.add('hidden');
      this.minPlayersMessage?.classList.remove('hidden');
    } else {
      // reached minimum
      if (!this.isCountdownRunning) {
        this.startCountdown();
      }
      this.countdownMessage?.classList.remove('hidden');
      this.minPlayersMessage?.classList.add('hidden');
    }
  }

  startCountdown() {
    if (this.isCountdownRunning) return;
    
    console.log('[PlayerSelectScene] Starting countdown');
    this.isCountdownRunning = true;

    const updateTimer = () => {
      if (!this.isActive || !this.isCountdownRunning) return;

      if (this.timerElement) {
        this.timerElement.textContent = this.remainingTime;
      }

      if (this.remainingTime <= 0) {
        this.onCountdownComplete();
      } else {
        this.remainingTime--;
        this.countdownTimer = setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  }

  stopCountdown() {
    if (!this.isCountdownRunning) return;
    
    console.log('[PlayerSelectScene] Stopping countdown');
    this.isCountdownRunning = false;
    
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
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

    this.stopCountdown();

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