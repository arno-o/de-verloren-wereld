export const DEV_MODE = {
  ENABLED: true,
  START_SCENE: 'game1', // options: null, 'idle', 'player-select', 'intro', 'game1', 'game2', 'outro'
  MOCK_PLAYERS: 2,
  RESET_KEY: 'm'
};

export const BackgroundStates = {
  IDLE: 'IDLE',
  TRANSITION_START: 'TRANSITION_START',
  GAME: 'GAME',
  TRANSITION_END: 'TRANSITION_END',
  PROCESS_UP: 'PROCESS_UP',
  PROCESS_DOWN: 'PROCESS_DOWN'
};

export const BackgroundConfig = {
  FPS: 25,
  SEGMENTS: {
    IDLE: {
      startFrame: 0,
      endFrame: 200,
      loop: true
    },
    TRANSITION_START: {
      startFrame: 200,
      endFrame: 250,
      loop: false
    },
    GAME: {
      startFrame: 250,
      endFrame: 350,
      loop: true
    },
    TRANSITION_END: {
      startFrame: 350,
      endFrame: 400,
      loop: false
    },
    PROCESS_UP: {
      startFrame: 400,
      endFrame: 450,
      loop: false
    },
    PROCESS_DOWN: {
      startFrame: 450,
      endFrame: 500,
      loop: false
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
    PLAYER_2: 'b',
    PLAYER_3: 'c',
    PLAYER_4: 'd'
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
  PROCESS_HOLD_DURATION: 3000, // time to hold on process screen before continuing
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
  '#6ECFF6',
  '#F68935',
  '#6BA743',
  '#7575dfff'
];

export const AvatarBackgrounds = [
  '#123779',
  '#FEC035',
  '#A3CA99',
  '#D298C4'
]