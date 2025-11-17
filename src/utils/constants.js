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
  PLATE_HOLD_THRESHOLD: 500, // half a second before they're seeon on the plate
  PLATE_LEAVE_THRESHOLD: 1000 // 1s wait before it counts as a leave
};

// Scene configuration
export const SceneConfig = {
  PLAYER_SELECT_WAIT: 15000, // 15s wait after players join before game starts
  PLAYER_LEAVE_WAIT: 5000, // 5s wait for player to return before removing them
  MIN_PLAYERS_GRACE_PERIOD: 10000, // 10s grace period when below min players during check
  PLAYER_CHECK_PAUSE: 5000, // 5s pause to check if player returns
  OUTRO_DURATION: 20000, // 20s outro before returning to idle
  TRANSITION_DURATION: 1000 // 1s fade transition
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
