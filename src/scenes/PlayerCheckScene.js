import { AvatarColors } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerCheckScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.checkNumber = 1;
    this.checkTimer = null;
  }

  init() {
    console.log('[PlayerCheckScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="player-check-content">
        <h2>Iedereen terug op zijn veld!</h2>
        <div class="check-message">
          <p>Ga op je veld staan om door te gaan...</p>
        </div>
        <div class="player-check-grid">
          <div class="player-check-slot" data-player="1">
            <div class="avatar"></div>
            <span>Speler 1</span>
            <div class="status-indicator"></div>
          </div>
          <div class="player-check-slot" data-player="2">
            <div class="avatar"></div>
            <span>Speler 2</span>
            <div class="status-indicator"></div>
          </div>
          <div class="player-check-slot" data-player="3">
            <div class="avatar"></div>
            <span>Speler 3</span>
            <div class="status-indicator"></div>
          </div>
          <div class="player-check-slot" data-player="4">
            <div class="avatar"></div>
            <span>Speler 4</span>
            <div class="status-indicator"></div>
          </div>
        </div>
      </div>
    `;
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
    const players = this.playerManager.getActivePlayers();
    
    for (let i = 1; i <= 4; i++) {
      const slot = this.container.querySelector(`[data-player="${i}"]`);
      const player = players.find(p => p.id === i);
      
      if (!player) {
        slot.classList.add('hidden');
      } else {
        slot.classList.remove('hidden');
        const avatar = slot.querySelector('.avatar');
        const indicator = slot.querySelector('.status-indicator');
        
        avatar.style.backgroundColor = AvatarColors[i - 1];
        
        if (player.isOnPlate) {
          indicator.classList.add('ready');
          indicator.classList.remove('waiting');
        } else {
          indicator.classList.remove('ready');
          indicator.classList.add('waiting');
        }
      }
    }
  }

  startCheckingPlayers() {
    const checkInterval = 500; // check every 500ms
    
    const checkPlayers = () => {
      if (!this.isActive) return;
      
      if (this.playerManager.areAllActivePlayersOnPlate()) {
        console.log('[PlayerCheckScene] All players ready!');
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

  onCheckComplete() {
    console.log('[PlayerCheckScene] Player check completed');
    if (this.isActive) {
      const sceneName = this.checkNumber === 1 ? 'player-check-1' : 'player-check-2';
      gameEvents.emit(Events.SCENE_COMPLETE, { 
        scene: sceneName,
        results: {
          playersRemaining: this.playerManager.getActivePlayerCount()
        }
      });
    }
  }

  cleanup() {
    console.log('[PlayerCheckScene] Cleaning up...');
    this.isActive = false;
    
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
    
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
