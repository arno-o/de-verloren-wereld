export const DEV_MODE = {
  ENABLED: false,
  START_SCENE: 'game2', // options: null, 'idle', 'player-select', 'intro', 'game1', 'game2', 'outro'
  MOCK_PLAYERS: 2,
  RESET_KEY: 'm'
};

export const BackgroundStates = {
  IDLE: 'IDLE',
  TRANSITION: 'TRANSITION',
  GAME: 'GAME'
};

export const BackgroundConfig = {
  FPS: 25,
  SEGMENTS: {
    // Idle: 0-8 seconds (frames 0-200)
    IDLE: {
      startFrame: 0,
      endFrame: 200,
      loop: true
    },
    // Transition: 8-10 seconds (frames 200-250)
    TRANSITION: {
      startFrame: 200,
      endFrame: 250,
      loop: false
    },
    // Game: 10-14 seconds (frames 250-350)
    GAME: {
      startFrame: 250,
      endFrame: 350,
      loop: true
    }
  }
};

// Game state constants
export const GameStates = {
  IDLE: 'idle',
  PLAYER_SELECT: 'player-select',
  INTRO: 'intro',
  GAME_1: 'game1',
  PLAYER_CHECK_1: 'player-check-1',
  GAME_2: 'game2',
  PLAYER_CHECK_2: 'player-check-2',
  OUTRO: 'outro',
  TRANSITION: 'transition'
};

// Player configuration
export const PlayerConfig = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  PLATE_KEYS: {
    PLAYER_1: 'a',
    PLAYER_2: 'z',
    PLAYER_3: 'e',
    PLAYER_4: 'r'
  },
  PLATE_HOLD_THRESHOLD: 100,
  PLATE_LEAVE_THRESHOLD: 100
};

// Scene configuration
export const SceneConfig = {
  PLAYER_SELECT_WAIT: 1000, // should be 15000 in production
  PLAYER_LEAVE_WAIT: 5000,
  MIN_PLAYERS_GRACE_PERIOD: 10000,
  PLAYER_CHECK_PAUSE: 5000,
  INTRO_DURATION: 1000,
  OUTRO_DURATION: 20000,
  TRANSITION_DURATION: 1000,
};

// Scene IDs matching HTML elements
export const SceneIds = {
  IDLE: 'scene-idle',
  PLAYER_SELECT: 'scene-player-select',
  INTRO: 'scene-intro',
  GAME_1: 'scene-game1',
  PLAYER_CHECK: 'scene-player-check',
  GAME_2: 'scene-game2',
  OUTRO: 'scene-outro'
};

export const AvatarColors = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3'
];