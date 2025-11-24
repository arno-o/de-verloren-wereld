export const DEV_MODE = {
  ENABLED: true,
  START_SCENE: 'game2', // options: null, 'idle', 'player-select', 'intro', 'game1', 'game2', 'outro'
  MOCK_PLAYERS: 2,
  RESET_KEY: 'm'
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