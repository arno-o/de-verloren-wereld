import { AvatarColors, PlayerConfig, SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import Lottie from 'lottie-web';

export default class PlayerCheckScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.checkNumber = 1;
    this.checkTimer = null;
    this.gracePeriodTimer = null;
    this.inGracePeriod = false;
    this.avatars = [];
    this.avatarStates = []; // Track current state of each avatar
  }

  init() {
    console.log('[PlayerCheckScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="player-select-content">
        <div class="player-select-title">
          <h2>Iedereen terug op zijn veld!</h2>
          <p>Ga op je veld staan om door te gaan</p>
        </div>
        
        <div class="player-avatars">
          ${Array.from({ length: PlayerConfig.MAX_PLAYERS }, (_, i) => `
            <div class="avatar-slot" data-player="${i + 1}">
              <div class="avatar empty" id="check-player-${i}"></div>
              <span>Speler ${i + 1}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="countdown">
          <p id="check-message">Wachten op spelers...</p>
        </div>
      </div>
    `;

    const avatarTypes = ['water', 'fire', 'earth', 'air'];

    this.segments = {
      active: [0, 250],           // 0-10 seconds
      toInactive: [250, 275],     // 10-11 seconds
      inactive: [275, 350],       // 11-14 seconds
      toActive: [350, 375]        // 14-15 seconds
    };

    for (let i = 0; i < PlayerConfig.MAX_PLAYERS; i++) {
      const playerContainer = document.querySelector(`#check-player-${i}`);
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

      animation.addEventListener('DOMLoaded', () => {
        animation.goToAndStop(this.segments.inactive[0], true);
      });

      this.avatars.push(animation);
      this.avatarStates.push('inactive');
    }
  }

  start(options = {}) {
    console.log('[PlayerCheckScene] Starting player check scene...');
    this.isActive = true;
    this.checkNumber = options.checkNumber || 1;
    this.container.classList.remove('hidden');
    
    this.updatePlayerStatus();
    
    this.activeListener = () => this.updatePlayerStatus();
    this.inactiveListener = () => this.updatePlayerStatus();
    gameEvents.on(Events.PLAYER_ACTIVE, this.activeListener);
    gameEvents.on(Events.PLAYER_INACTIVE, this.inactiveListener);
    
    this.startCheckingPlayers();
  }

  updatePlayerStatus() {
    const initialPlayerIds = Array.from(this.playerManager.initialPlayers);
    const players = this.playerManager.getActivePlayers();
    
    for (let i = 1; i <= PlayerConfig.MAX_PLAYERS; i++) {
      const slot = this.container.querySelector(`[data-player="${i}"]`);
      const avatar = slot.querySelector('.avatar');
      const avatarIndex = i - 1;
      const animation = this.avatars[avatarIndex];
      const currentState = this.avatarStates[avatarIndex];
      const isInitialPlayer = initialPlayerIds.includes(i);
      const player = players.find(p => p.id === i);
      
      if (!isInitialPlayer || !player) {
        // not an initial player - show as empty
        slot.style.opacity = '0.3';
        avatar.classList.add('empty');
        avatar.style.backgroundColor = '';
        if (animation && currentState !== 'inactive') {
          this.avatarStates[avatarIndex] = 'inactive';
          animation.removeEventListener('complete');
          animation.addEventListener('complete', () => {
            animation.playSegments(this.segments.inactive, true);
            animation.loop = true;
          });
          animation.loop = false;
          animation.playSegments(this.segments.toInactive, true);
        }
      } else {
        slot.style.opacity = '1';
        avatar.classList.remove('empty');
        avatar.style.backgroundColor = AvatarColors[i - 1];
        
        if (player.isOnPlate) {
          // Player is on plate - show as active
          if (animation && currentState !== 'active') {
            this.avatarStates[avatarIndex] = 'active';
            animation.removeEventListener('complete');
            animation.addEventListener('complete', () => {
              animation.playSegments(this.segments.active, true);
              animation.loop = true;
            });
            animation.loop = false;
            animation.playSegments(this.segments.toActive, true);
          }
        } else {
          // Player is not on plate - show as inactive/waiting
          if (animation && currentState !== 'inactive') {
            this.avatarStates[avatarIndex] = 'inactive';
            animation.removeEventListener('complete');
            animation.addEventListener('complete', () => {
              animation.playSegments(this.segments.inactive, true);
              animation.loop = true;
            });
            animation.loop = false;
            animation.playSegments(this.segments.toInactive, true);
          }
        }
      }
    }
  }

  startCheckingPlayers() {
    const checkInterval = 500; // check every 500ms
    
    const checkPlayers = () => {
      if (!this.isActive) return;
      
      const initialPlayers = this.playerManager.getInitialPlayers().filter(p => p.isActive);
      const initialPlayersCount = initialPlayers.length;
      
      // check if we have minimum players
      if (initialPlayersCount < 2) {
        if (!this.inGracePeriod) {
          console.log('[PlayerCheckScene] Below minimum players, starting grace period');
          this.inGracePeriod = true;
          this.updateMessage('Wachten op meer spelers...');
          
          this.gracePeriodTimer = setTimeout(() => {
            // still below minimum? Reset to idle
            const stillBelowMin = this.playerManager.getInitialPlayers().filter(p => p.isActive).length < 2;
            if (stillBelowMin) {
              console.log('[PlayerCheckScene] Grace period expired, resetting to idle');
              gameEvents.emit(Events.RESET_TO_IDLE);
            }
          }, 10000); // 10 second grace period
        }
        this.checkTimer = setTimeout(checkPlayers, checkInterval);
        return;
      }
      
      // we have enough players, cancel grace period if active
      if (this.inGracePeriod) {
        console.log('[PlayerCheckScene] Minimum players restored');
        this.inGracePeriod = false;
        if (this.gracePeriodTimer) {
          clearTimeout(this.gracePeriodTimer);
          this.gracePeriodTimer = null;
        }
        this.updateMessage('Ga op je veld staan om door te gaan...');
      }
      
      // check if all initial active players are on plate
      const allOnPlate = initialPlayers.every(p => p.isOnPlate);
      
      if (allOnPlate) {
        console.log('[PlayerCheckScene] All initial players ready!');
        // small delay before continuing
        setTimeout(() => {
          this.onCheckComplete();
        }, 1000);
      } else {
        this.checkTimer = setTimeout(checkPlayers, checkInterval);
      }
    };
    
    checkPlayers();
  }

  updateMessage(text) {
    const messageEl = this.container.querySelector('#check-message');
    if (messageEl) {
      messageEl.textContent = text;
    }
  }

  onCheckComplete() {
    console.log('[PlayerCheckScene] Player check completed');
    if (this.isActive) {
      const sceneName = this.checkNumber === 1 ? 'player-check-1' : 'player-check-2';
      const playersRemaining = this.playerManager.getActivePlayerCount();
      console.log(`[PlayerCheckScene] Emitting SCENE_COMPLETE for ${sceneName}, playersRemaining: ${playersRemaining}`);
      gameEvents.emit(Events.SCENE_COMPLETE, { 
        scene: sceneName,
        results: {
          playersRemaining: playersRemaining
        }
      });
    }
  }

  cleanup() {
    console.log('[PlayerCheckScene] Cleaning up...');
    this.isActive = false;
    this.inGracePeriod = false;
    
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
    
    if (this.gracePeriodTimer) {
      clearTimeout(this.gracePeriodTimer);
      this.gracePeriodTimer = null;
    }
    
    this.avatars.forEach(avatar => {
      if (avatar) avatar.destroy();
    });
    this.avatars = [];
    this.avatarStates = [];
    
    if (this.activeListener) {
      gameEvents.off(Events.PLAYER_ACTIVE, this.activeListener);
      this.activeListener = null;
    }
    
    if (this.inactiveListener) {
      gameEvents.off(Events.PLAYER_INACTIVE, this.inactiveListener);
      this.inactiveListener = null;
    }
    
    this.container.classList.add('hidden');
  }
}
