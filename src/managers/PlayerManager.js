import { PlayerConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class PlayerManager {
  constructor() {
    this.players = new Map();
    this.keyStates = new Map();
    this.keyTimers = new Map();
    this.isListening = false;
    
    // Initialize player slots
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
        score: 0,
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
    
    // Clear all timers
    this.keyTimers.forEach(timer => clearTimeout(timer));
    this.keyTimers.clear();
  }

  handleKeyDown = (event) => {
    if (!this.isListening) return;
    
    const key = event.key.toLowerCase();
    
    // Check if this key is mapped to a player
    const player = this.getPlayerByKey(key);
    if (!player) return;
    
    // Prevent repeat events
    if (this.keyStates.get(key)) return;
    
    this.keyStates.set(key, true);
    
    // Set timer for plate activation threshold
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
    
    // Clear activation timer if key released before threshold
    if (this.keyTimers.has(key)) {
      clearTimeout(this.keyTimers.get(key));
      this.keyTimers.delete(key);
    }
    
    // Set timer for plate deactivation
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
      player.isActive = true;
      player.joinedAt = Date.now();
      console.log(`[PlayerManager] Player ${playerId} joined the game`);
      gameEvents.emit(Events.PLAYER_JOIN, { playerId, player });
    } else {
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

  getPlayersOnPlate() {
    return Array.from(this.players.values()).filter(p => p.isActive && p.isOnPlate);
  }

  areAllActivePlayersOnPlate() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return false;
    return activePlayers.every(p => p.isOnPlate);
  }

  updatePlayerScore(playerId, points) {
    const player = this.players.get(playerId);
    if (player) {
      player.score += points;
      console.log(`[PlayerManager] Player ${playerId} score: ${player.score} (+${points})`);
    }
  }

  getPlayerScore(playerId) {
    return this.players.get(playerId)?.score || 0;
  }

  getTotalScore() {
    return this.getActivePlayers().reduce((sum, p) => sum + p.score, 0);
  }

  resetScores() {
    this.players.forEach(player => {
      player.score = 0;
    });
  }

  reset() {
    console.log('[PlayerManager] Resetting all players');
    this.players.forEach(player => {
      player.isActive = false;
      player.isOnPlate = false;
      player.score = 0;
      player.joinedAt = null;
    });
    
    this.keyStates.clear();
    this.keyTimers.forEach(timer => clearTimeout(timer));
    this.keyTimers.clear();
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }
}
