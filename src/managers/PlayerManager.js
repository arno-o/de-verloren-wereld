import { PlayerConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerManager {
  constructor() {
    this.players = new Map();
    this.keyStates = new Map();
    this.keyTimers = new Map();
    this.isListening = false;
    this.initialPlayers = new Set(); // players who started the game
    this.gameStarted = false; // track if game has started
    
    this.initializePlayers();
  }

  initializePlayers() {
    const keys = Object.values(PlayerConfig.PLATE_KEYS);
    keys.forEach((key, index) => {
      this.players.set(index + 1, {
        id: index + 1,
        key: key,
        isActive: false,
        isOnPlate: false,
        joinedAt: null
      });
      this.keyStates.set(key, false);
    });
  }

  startListening() {
    if (this.isListening) return;
    
    console.log('[PlayerManager] Starting to listen for plate inputs...');
    this.isListening = true;
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stopListening() {
    console.log('[PlayerManager] Stopping plate input listening');
    this.isListening = false;
    
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    // clear all timers
    this.keyTimers.forEach(timer => clearTimeout(timer));
    this.keyTimers.clear();
  }

  handleKeyDown = (event) => {
    if (!this.isListening) return;
    
    const key = event.key.toLowerCase();
    
    // check if this key is mapped to a player
    const player = this.getPlayerByKey(key);
    if (!player) return;
    
    // prevent repeat events
    if (this.keyStates.get(key)) return;
    
    this.keyStates.set(key, true);
    
    // set timer for plate activation threshold
    const timer = setTimeout(() => {
      this.activatePlayer(player.id);
    }, PlayerConfig.PLATE_HOLD_THRESHOLD);
    
    this.keyTimers.set(key, timer);
  }

  handleKeyUp = (event) => {
    if (!this.isListening) return;
    
    const key = event.key.toLowerCase();
    const player = this.getPlayerByKey(key);
    if (!player) return;
    
    this.keyStates.set(key, false);
    
    // clear activation timer if key released before threshold
    if (this.keyTimers.has(key)) {
      clearTimeout(this.keyTimers.get(key));
      this.keyTimers.delete(key);
    }
    
    // set timer for plate deactivation
    const timer = setTimeout(() => {
      this.deactivatePlayer(player.id);
    }, PlayerConfig.PLATE_LEAVE_THRESHOLD);
    
    this.keyTimers.set(`${key}-leave`, timer);
  }

  activatePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    const wasActive = player.isActive;
    player.isOnPlate = true;
    
    if (!wasActive) {
      // if game hasn't started, allow them to join
      if (!this.gameStarted) {
        player.isActive = true;
        player.joinedAt = Date.now();
        console.log(`[PlayerManager] Player ${playerId} joined the game`);
        gameEvents.emit(Events.PLAYER_JOIN, { playerId, player });
      } else {
        // game already started - they can't join
        console.log(`[PlayerManager] Player ${playerId} tried to join but game already started`);
      }
    } else {
      // player returning to plate
      console.log(`[PlayerManager] Player ${playerId} back on plate`);
      gameEvents.emit(Events.PLAYER_ACTIVE, { playerId, player });
    }
  }

  deactivatePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.isOnPlate = false;
    console.log(`[PlayerManager] Player ${playerId} left plate`);
    gameEvents.emit(Events.PLAYER_INACTIVE, { playerId, player });
    
    // if game hasn't started yet, leaving plate means they're out completely
    if (!this.gameStarted && player.isActive) {
      console.log(`[PlayerManager] Player ${playerId} left during selection, removing them`);
      this.removePlayer(playerId);
    }
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player || !player.isActive) return;
    
    player.isActive = false;
    player.isOnPlate = false;
    player.joinedAt = null;
    
    console.log(`[PlayerManager] Player ${playerId} removed from game`);
    gameEvents.emit(Events.PLAYER_LEAVE, { playerId, player });
  }

  getPlayerByKey(key) {
    for (const player of this.players.values()) {
      if (player.key === key) {
        return player;
      }
    }
    return null;
  }

  getActivePlayers() {
    return Array.from(this.players.values()).filter(p => p.isActive);
  }

  getActivePlayerIds() {
    return this.getActivePlayers().map(p => p.id);
  }

  getActivePlayerCount() {
    return this.getActivePlayers().length;
  }

  getInitialPlayers() {
    return Array.from(this.initialPlayers).map(id => this.players.get(id)).filter(p => p);
  }

  getInitialPlayerCount() {
    return this.initialPlayers.size;
  }

  lockInPlayers() {
    // lock in the current active players as the initial game players
    this.gameStarted = true;
    this.initialPlayers.clear();
    const activePlayers = this.getActivePlayers();
    activePlayers.forEach(player => {
      this.initialPlayers.add(player.id);
    });
    console.log(`[PlayerManager] Locked in initial players:`, Array.from(this.initialPlayers));
  }

  isInitialPlayer(playerId) {
    return this.initialPlayers.has(playerId);
  }

  getPlayersOnPlate() {
    return Array.from(this.players.values()).filter(p => p.isActive && p.isOnPlate);
  }

  areAllActivePlayersOnPlate() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return false;
    return activePlayers.every(p => p.isOnPlate);
  }

  reset() {
    console.log('[PlayerManager] Resetting all players');
    this.players.forEach(player => {
      player.isActive = false;
      player.isOnPlate = false;
      player.joinedAt = null;
    });
    
    this.keyStates.clear();
    this.keyTimers.forEach(timer => clearTimeout(timer));
    this.keyTimers.clear();
    this.initialPlayers.clear();
    this.gameStarted = false;
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }
}
