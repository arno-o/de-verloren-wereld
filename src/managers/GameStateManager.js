import { GameStates, SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import SceneManager from './SceneManager.js';
import PlayerManager from './PlayerManager.js';

export default class GameStateManager {
  constructor() {
    this.currentState = GameStates.IDLE;
    this.sceneManager = new SceneManager();
    this.playerManager = new PlayerManager();
    this.timers = new Map();
    this.missingPlayers = new Map(); // playerId -> timer info
  }

  init() {
    console.log('[GameStateManager] Initializing...');
    
    this.sceneManager.init(this.playerManager);
    this.setupEventListeners();
  }

  setupEventListeners() {
    gameEvents.on(Events.PLAYER_JOIN, (data) => {
      if (this.currentState === GameStates.IDLE) {
        this.startPlayerSelect();
      }
    });

    gameEvents.on(Events.PLAYERS_READY, () => {
      if (this.currentState === GameStates.PLAYER_SELECT) {
        this.startIntro();
      }
    });

    gameEvents.on(Events.PLAYER_INACTIVE, (data) => {
      if (this.isInGameState()) {
        this.handlePlayerLeave(data.playerId);
      }
    });

    gameEvents.on(Events.PLAYER_ACTIVE, (data) => {
      if (this.isInGameState()) {
        this.handlePlayerReturn(data.playerId);
      }
    });

    gameEvents.on(Events.SCENE_COMPLETE, (data) => {
      this.onSceneComplete(data.scene, data.results);
    });

    gameEvents.on(Events.RESET_TO_IDLE, () => {
      this.resetToIdle();
    });
  }

  start() {
    console.log('[GameStateManager] Starting game...');
    this.init();
    this.setState(GameStates.IDLE);
    this.sceneManager.switchScene('idle');
    this.playerManager.startListening();
  }

  startPlayerSelect() {
    console.log('[GameStateManager] Starting player selection...');
    this.setState(GameStates.PLAYER_SELECT);
    this.sceneManager.switchScene('player-select');
  }

  startIntro() {
    console.log('[GameStateManager] Starting intro...');
    // Lock in the players who are starting the game
    this.playerManager.lockInPlayers();
    this.setState(GameStates.INTRO);
    this.sceneManager.switchScene('intro');
  }

  startGame1() {
    console.log('[GameStateManager] Starting Game 1...');
    this.setState(GameStates.GAME_1);
    this.sceneManager.switchScene('game1');
  }

  startPlayerCheck(checkNumber) {
    console.log(`[GameStateManager] Starting player check ${checkNumber}...`);
    const state = checkNumber === 1 ? GameStates.PLAYER_CHECK_1 : GameStates.PLAYER_CHECK_2;
    this.setState(state);
    this.sceneManager.switchScene('player-check', { checkNumber });
  }

  startGame2() {
    console.log('[GameStateManager] Starting Game 2...');
    this.setState(GameStates.GAME_2);
    this.sceneManager.switchScene('game2');
  }

  startOutro() {
    console.log('[GameStateManager] Starting outro...');
    this.setState(GameStates.OUTRO);
    this.sceneManager.switchScene('outro');
  }

  onSceneComplete(sceneName, data = {}) {
    console.log(`[GameStateManager] Scene completed: ${sceneName}`, data);
    
    switch (sceneName) {
      case 'intro':
        this.startGame1();
        break;
        
      case 'game1':
        this.startPlayerCheck(1);
        break;
        
      case 'player-check-1':
        if (data.playersRemaining > 1) {
          this.startGame2();
        } else {
          this.resetToIdle(); // this has to be the PAUSE menu in the future
        }
        break;
        
      case 'game2':
        this.startPlayerCheck(2);
        break;
        
      case 'player-check-2':
        if (data.playersRemaining > 1) {
          this.startOutro();
        } else {
          this.resetToIdle();
        }
        break;
        
      case 'outro':
        // Wait 20 seconds then return to idle
        this.timers.set('outro', setTimeout(() => {
          this.resetToIdle();
        }, SceneConfig.OUTRO_DURATION));
        break;
        
      default:
        console.warn(`[GameStateManager] Unknown scene completion: ${sceneName}`);
    }
  }

  handlePlayerLeave(playerId) {
    // Only track leaves for initial players
    if (!this.playerManager.isInitialPlayer(playerId)) {
      console.log(`[GameStateManager] Player ${playerId} not an initial player, ignoring leave`);
      return;
    }
    
    console.log(`[GameStateManager] Initial player ${playerId} left during game`);
    
    // Already tracking this player's leave?
    if (this.missingPlayers.has(playerId)) {
      return;
    }
    
    this.missingPlayers.set(playerId, { timestamp: Date.now() });
    
    // Pause game and wait 5 seconds
    gameEvents.emit(Events.GAME_PAUSE, { playerId });
    
    const timer = setTimeout(() => {
      const player = this.playerManager.getPlayer(playerId);
      if (!player.isOnPlate) {
        console.log(`[GameStateManager] Player ${playerId} didn't return, removing them`);
        this.playerManager.removePlayer(playerId);
        this.missingPlayers.delete(playerId);
        
        // Count remaining initial players who are still active
        const remainingInitialPlayers = this.playerManager.getInitialPlayers().filter(p => p.isActive);
        
        if (remainingInitialPlayers.length === 0) {
          console.log('[GameStateManager] All initial players gone, resetting to idle');
          this.resetToIdle();
        } else {
          console.log(`[GameStateManager] ${remainingInitialPlayers.length} initial player(s) remaining, resuming game`);
          gameEvents.emit(Events.GAME_RESUME);
        }
      }
    }, SceneConfig.PLAYER_LEAVE_WAIT);
    
    this.timers.set(`player-${playerId}-leave`, timer);
  }

  handlePlayerReturn(playerId) {
    if (this.missingPlayers.has(playerId)) {
      console.log(`[GameStateManager] Player ${playerId} returned!`);
      this.missingPlayers.delete(playerId);
      
      // Clear their timeout
      const timerKey = `player-${playerId}-leave`;
      if (this.timers.has(timerKey)) {
        clearTimeout(this.timers.get(timerKey));
        this.timers.delete(timerKey);
      }
      
      // Only resume if no other players are missing
      if (this.missingPlayers.size === 0) {
        gameEvents.emit(Events.GAME_RESUME);
      }
    }
  }

  resetToIdle() {
    console.log('[GameStateManager] Resetting to idle...');
    this.clearAllTimers();
    this.missingPlayers.clear();
    this.playerManager.reset();
    this.setState(GameStates.IDLE);
    this.sceneManager.switchScene('idle');
  }

  clearAllTimers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  isInGameState() {
    return [
      GameStates.GAME_1,
      GameStates.GAME_2,
      GameStates.PLAYER_CHECK_1,
      GameStates.PLAYER_CHECK_2
    ].includes(this.currentState);
  }

  setState(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    
    console.log(`[GameStateManager] State change: ${oldState} -> ${newState}`);
    gameEvents.emit(Events.STATE_CHANGE, { from: oldState, to: newState });
  }

  getCurrentState() {
    return this.currentState;
  }

  getPlayerManager() {
    return this.playerManager;
  }
}
