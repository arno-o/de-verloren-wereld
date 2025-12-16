import { GameStates, SceneConfig, DEV_MODE } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import SceneManager from './SceneManager.js';
import PlayerManager from './PlayerManager.js';
import BackgroundManager from './BackgroundManager.js';

export default class GameStateManager {
  constructor() {
    this.currentState = GameStates.IDLE;
    this.sceneManager = new SceneManager();
    this.playerManager = new PlayerManager();
    this.backgroundManager = new BackgroundManager();
    this.timers = new Map();
    this.missingPlayers = new Map(); // playerId -> timer info
  }

  async init() {
    const backgroundContainer = document.getElementById('background-container');
    if (backgroundContainer) {
      try {
        await this.backgroundManager.init(backgroundContainer);
      } catch (error) {
        console.error('[GameStateManager] Failed to load background animation:', error);
      }
    }

    this.sceneManager.init(this.playerManager, this.backgroundManager);
    this.setupEventListeners();

    // dev mode check
    if (DEV_MODE.ENABLED) {
      console.log(`[GameStateManager] DEV MODE: starting at scene "${DEV_MODE.START_SCENE}"`);
      this.setupDevMode();
    }
  }

  setupDevMode() {
    // create mock players
    const mockPlayerCount = Math.min(Math.max(DEV_MODE.MOCK_PLAYERS, 2), 4);
    console.log(`[GameStateManager] DEV MODE: creating ${mockPlayerCount} mock players`);

    for (let i = 1; i <= mockPlayerCount; i++) {
      const player = this.playerManager.getPlayer(i);
      player.isActive = true;
      player.isOnPlate = true;
      player.joinedAt = Date.now();
      this.playerManager.initialPlayers.add(i);
    }

    this.playerManager.gameStarted = true;

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === DEV_MODE.RESET_KEY && DEV_MODE.ENABLED) {
        this.startDevScene(DEV_MODE.START_SCENE);
      }
    });
  }

  getCurrentSceneName() {
    // map current state to scene name
    switch (this.currentState) {
      case GameStates.IDLE: return 'idle';
      case GameStates.PLAYER_SELECT: return 'player-select';
      case GameStates.INTRO: return 'intro';
      case GameStates.GAME_1: return 'game1';
      case GameStates.PLAYER_CHECK_1: return 'player-check';
      case GameStates.INTRO_2: return 'intro2';
      case GameStates.GAME_2: return 'game2';
      case GameStates.PLAYER_CHECK_2: return 'player-check';
      case GameStates.OUTRO: return 'outro';
      default: return null;
    }
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
      // only handle player leaves during player check scenes, not during actual games
      if (this.currentState === GameStates.PLAYER_CHECK_1 || this.currentState === GameStates.PLAYER_CHECK_2) {
        this.handlePlayerLeave(data.playerId);
      }
    });

    gameEvents.on(Events.PLAYER_ACTIVE, (data) => {
      // only handle player returns during player check scenes
      if (this.currentState === GameStates.PLAYER_CHECK_1 || this.currentState === GameStates.PLAYER_CHECK_2) {
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

  async start() {
    console.log('[GameStateManager] Starting game...');
    await this.init();

    if (DEV_MODE.ENABLED && DEV_MODE.START_SCENE !== 'idle') {
      // Initialize idle scene as current so it gets cleaned up properly
      this.sceneManager.currentScene = this.sceneManager.getScene('idle');
      this.startDevScene(DEV_MODE.START_SCENE);
    } else {
      this.setState(GameStates.IDLE);
      this.sceneManager.switchScene('idle');
      this.backgroundManager.setSegment('IDLE');
    }

    this.playerManager.startListening();
  }

  startDevScene(sceneName) {
    switch (sceneName) {
      case 'player-select':
        this.startPlayerSelect();
        this.backgroundManager.setSegment('IDLE');
        break;
      case 'intro':
        this.startIntro();
        break;
      case 'game1':
        this.startGame1();
        break;
      case 'game2':
        this.startGame2();
        break;
      case 'outro':
        this.startOutro();
        break;
      default:
        console.warn(`[DEV-GameStateManager] unknown scene "${sceneName}"`);
        this.setState(GameStates.IDLE);
        this.sceneManager.switchScene('idle');
        this.backgroundManager.setSegment('IDLE');
    }
  }

  startPlayerSelect() {
    console.log('[GameStateManager] Starting player selection...');
    this.setState(GameStates.PLAYER_SELECT);
    this.sceneManager.switchScene('player-select');
  }

  startIntro() {
    console.log('[GameStateManager] Starting intro...');
    // lock in players
    this.playerManager.lockInPlayers();
    this.setState(GameStates.INTRO);
    this.backgroundManager.setSegment('PROCESS_UP');
    this.sceneManager.switchScene('intro');
  }

  startGame1() {
    console.log('[GameStateManager] Starting Game 1...');
    this.backgroundManager.setSegment('GAME');
    this.setState(GameStates.GAME_1);
    this.sceneManager.switchScene('game1');
  }

  startPlayerCheck(checkNumber) {
    console.log(`[GameStateManager] Starting player check ${checkNumber}...`);
    const state = checkNumber === 1 ? GameStates.PLAYER_CHECK_1 : GameStates.PLAYER_CHECK_2;
    this.setState(state);
    this.sceneManager.switchScene('player-check', { checkNumber });
  }

  startIntro2() {
    console.log('[GameStateManager] Starting intro 2...');
    this.setState(GameStates.INTRO_2);
    this.backgroundManager.setSegment('PROCESS_UP');
    this.sceneManager.switchScene('intro2');
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
    this.backgroundManager.setSegment('ENDING', () => {
      this.resetToIdle();
    });
  }

  onSceneComplete(sceneName, data = {}) {
    switch (sceneName) {
      case 'intro':
        this.backgroundManager.setSegment('TRANSITION_START', () => {
            this.backgroundManager.setSegment('GAME');
            this.startGame1();
          });
        break;
      case 'game1':
        this.sceneManager.hideCurrentScene();
        this.backgroundManager.setSegment('TRANSITION_END', () => {
          this.startPlayerCheck(1);
        });
        break;
      case 'player-check-1':
        if (data.playersRemaining > 1) {
          this.startIntro2();
        } else {
          this.resetToIdle();
        }
        break;
      case 'intro2':
        // After intro2 completes, transition background to game
        this.backgroundManager.setSegment('PROCESS_DOWN', () => {
          this.backgroundManager.setSegment('TRANSITION_START', () => {
            this.backgroundManager.setSegment('GAME');
            this.startGame2();
          });
        });
        break;
      case 'game2':
        this.sceneManager.hideCurrentScene();
        this.backgroundManager.setSegment('TRANSITION_END', () => {
          console.log('[GameStateManager] TRANSITION_END complete, starting outro...');
          this.startOutro();
        });
        break;
      case 'player-check-2':
        if (data.playersRemaining > 1) {
          this.startOutro();
        } else {
          this.resetToIdle();
        }
        break;
      default:
        console.warn(`[GameStateManager] Unknown scene completion: ${sceneName}`);
    }
  }

  handlePlayerLeave(playerId) {
    if (!this.playerManager.isInitialPlayer(playerId)) { 
      console.log(`[GameStateManager] ignoring leave`);
      return;
    }

    console.log(`[GameStateManager] Initial player ${playerId} left during game`);

    if (this.missingPlayers.has(playerId)) {
      return;
    }

    this.missingPlayers.set(playerId, { timestamp: Date.now() });

    gameEvents.emit(Events.GAME_PAUSE, { playerId });

    const timer = setTimeout(() => {
      const player = this.playerManager.getPlayer(playerId);
      if (!player.isOnPlate) {
        console.log(`[GameStateManager] Removing player ${playerId} (Inactivity)`);
        this.playerManager.removePlayer(playerId);
        this.missingPlayers.delete(playerId);

        // count remaining initial players who are still active
        const remainingInitialPlayers = this.playerManager.getInitialPlayers().filter(p => p.isActive);

        if (remainingInitialPlayers.length === 0) {
          console.log('[GameStateManager] Resetting (Abandoned)');
          this.resetToIdle();
        } else {
          console.log(`[GameStateManager] Resuming game`);
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

      // clear their timeout
      const timerKey = `player-${playerId}-leave`;
      if (this.timers.has(timerKey)) {
        clearTimeout(this.timers.get(timerKey));
        this.timers.delete(timerKey);
      }

      // only resume if no other players are missing
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
    this.backgroundManager.setSegment('IDLE');
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
