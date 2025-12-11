import { SceneConfig, AvatarColors, PlayerConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import Lottie from 'lottie-web';

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
    this.avatars = [];
    this.avatarStates = []; // Track current state of each avatar
    this.countdownAnimation = null;
  }

  init() {
    console.log('[PlayerSelectScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    const initialTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
    
    this.container.innerHTML = `
      <div class="player-select-content">
        <h2>De Verloren Wereld</h2>
        <p class="instructions">Ga op een veld staan om mee te spelen</p>
        
        <div class="player-avatars">
          ${Array.from({ length: PlayerConfig.MAX_PLAYERS }, (_, i) => `
            <div class="avatar-slot" data-player="${i + 1}">
              <div class="avatar empty" id="player-${i}"></div>
              <span>Speler ${i + 1}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="countdown"></div>
      </div>
    `;

    // Now that the DOM elements exist, initialize the Lottie animations
    const avatarTypes = ['water', 'fire', 'earth', 'air'];
    
    // Animation segments (in frames, 25fps)
    this.segments = {
      active: [0, 250],           // 0-10 seconds
      toInactive: [250, 275],     // 10-11 seconds
      inactive: [275, 350],       // 11-14 seconds
      toActive: [350, 375]        // 14-15 seconds
    };
    
    for (let i = 0; i < PlayerConfig.MAX_PLAYERS; i++) {
      const playerContainer = document.querySelector(`#player-${i}`);
      const avatarType = avatarTypes[i % avatarTypes.length];
      
      const animation = Lottie.loadAnimation({
        container: playerContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: `./assets/avatars/avatar_${avatarType}.json`,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
        }
      });
      
      // Start in inactive state
      animation.addEventListener('DOMLoaded', () => {
        animation.goToAndStop(this.segments.inactive[0], true);
      });
      
      this.avatars.push(animation);
      this.avatarStates.push('inactive'); // Initialize state tracking
    }

    const countdownContainer = document.querySelector(".countdown");
    this.countdownAnimation = Lottie.loadAnimation({
      container: countdownContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: `./assets/animations/countdown.json`,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      }
    });
  }

  start() {
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
  }

  updatePlayerDisplay() {
    const activePlayers = this.playerManager.getActivePlayerIds();

    for (let i = 1; i <= PlayerConfig.MAX_PLAYERS; i++) {
      const slot = this.container.querySelector(`[data-player="${i}"] .avatar`);
      const avatarIndex = i - 1;
      const animation = this.avatars[avatarIndex];
      const currentState = this.avatarStates[avatarIndex];
      
      if (activePlayers.includes(i)) {
        slot.classList.remove('empty');
        if (animation && currentState !== 'active') {
          // Only transition if not already active
          this.avatarStates[avatarIndex] = 'active';
          animation.removeEventListener('complete');
          animation.addEventListener('complete', () => {
            animation.playSegments(this.segments.active, true);
            animation.loop = true;
          });
          animation.loop = false;
          animation.playSegments(this.segments.toActive, true);
        }
        slot.style.backgroundColor = AvatarColors[i - 1];
      } else {
        slot.classList.add('empty');
        if (animation && currentState !== 'inactive') {
          // Only transition if not already inactive
          this.avatarStates[avatarIndex] = 'inactive';
          animation.removeEventListener('complete');
          animation.addEventListener('complete', () => {
            animation.playSegments(this.segments.inactive, true);
            animation.loop = true;
          });
          animation.loop = false;
          animation.playSegments(this.segments.toInactive, true);
        }
        slot.style.backgroundColor = '';
      }
    }

    this.checkMinimumPlayers();
  }

  checkMinimumPlayers() {
    const activeCount = this.playerManager.getActivePlayerCount();

    if (activeCount < PlayerConfig.MIN_PLAYERS) {     // below minimum
      this.stopCountdown();
      this.remainingTime = SceneConfig.PLAYER_SELECT_WAIT / 1000;
      if (this.timerElement) this.timerElement.textContent = this.remainingTime;
      this.countdownMessage?.classList.add('hidden');
      this.minPlayersMessage?.classList.remove('hidden');
    } else {                                          // reached minimum
      if (!this.isCountdownRunning) {
        this.startCountdown();
      }
      this.countdownMessage?.classList.remove('hidden');
      this.minPlayersMessage?.classList.add('hidden');
    }
  }

  startCountdown() {
    if (this.isCountdownRunning) return;
    
    this.isCountdownRunning = true;

    const countdownContainer = this.container.querySelector('.countdown');
    if (countdownContainer) {
      countdownContainer.classList.add('active');
    }

    if (this.countdownAnimation) {
      this.countdownAnimation.addEventListener('complete', () => {
        this.onCountdownComplete();
      });
      this.countdownAnimation.play();
    }
  }

  stopCountdown() {
    if (!this.isCountdownRunning) return;
    
    console.log('[PlayerSelectScene] Stopping countdown');
    this.isCountdownRunning = false;
    
    const countdownContainer = this.container.querySelector('.countdown');
    if (countdownContainer) {
      countdownContainer.classList.remove('active');
    }
    
    if (this.countdownAnimation) {
      this.countdownAnimation.stop();
      this.countdownAnimation.goToAndStop(0, true);
    }
    
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  onCountdownComplete() {
    console.log('[PlayerSelectScene] Countdown complete');

    const activeCount = this.playerManager.getActivePlayerCount();
    if (activeCount < PlayerConfig.MIN_PLAYERS) {
      gameEvents.emit(Events.RESET_TO_IDLE);
      return;
    }

    gameEvents.emit(Events.PLAYERS_READY);
  }

  cleanup() {
    console.log('[PlayerSelectScene] Cleaning up...');
    this.isActive = false;

    this.stopCountdown();
    
    if (this.countdownAnimation) {
      this.countdownAnimation.destroy();
      this.countdownAnimation = null;
    }
    
    this.avatars.forEach(avatar => {
      if (avatar) avatar.destroy();
    });
    this.avatars = [];

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