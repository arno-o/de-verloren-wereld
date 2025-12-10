class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
  }

  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(listener => {
      listener(data);
    });
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export const gameEvents = new EventEmitter();

// Event names
export const Events = {
  SCENE_COMPLETE: 'scene:complete',
  SCENE_START: 'scene:start',
  STATE_CHANGE: 'state:change',
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',
  PLAYER_ACTIVE: 'player:active',
  PLAYER_INACTIVE: 'player:inactive',
  PLAYERS_READY: 'players:ready',
  RESET_TO_IDLE: 'reset:idle',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume'
};
