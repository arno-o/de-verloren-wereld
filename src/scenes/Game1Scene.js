import { AvatarColors } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class Game1Scene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.isPaused = false;
    this.gameTimer = null;
    this.pauseListener = null;
    this.resumeListener = null;
    
    // Game state
    this.sequence = []; // Random sequence of player IDs
    this.currentRound = 0; // Current round (starts at 0, shows 1 player, then 2, etc.)
    this.playerInput = []; // Current player input
    this.isShowingSequence = false; // True when showing the sequence to players
    this.isAcceptingInput = false; // True when waiting for plate activations
    this.playerBlocks = []; // DOM references to the player blocks
    this.activePlayers = []; // List of active player IDs
    
    // Event listeners
    this.playerActiveListener = null;
  }

  init() {
    console.log('[Game1Scene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="game1-content">
        <h2>Spel 1 - Geheugen Spel</h2>
        <div class="game-area">
          <div class="code-wrapper" id="player-blocks-container">
            <!-- Player blocks will be generated dynamically -->
          </div>
        </div>
        <div class="game-info">
          <p class="round-info">Ronde: <span class="round-number">0</span></p>
          <p class="instruction">Onthoud de volgorde...</p>
        </div>
        <div class="pause-overlay hidden">
          <p>Wachten op speler...</p>
        </div>
      </div>
    `;
  }

  start() {
    console.log('[Game1Scene] Starting game 1...');
    this.isActive = true;
    this.isPaused = false;
    this.container.classList.remove('hidden');
    
    // fetch active players
    this.activePlayers = this.playerManager.getActivePlayerIds();
    console.log('[Game1Scene] Active players:', this.activePlayers);
    
    // generate player blocks
    this.generatePlayerBlocks();
    
    this.pauseListener = () => this.handlePause();
    this.resumeListener = () => this.handleResume();
    gameEvents.on(Events.GAME_PAUSE, this.pauseListener);
    gameEvents.on(Events.GAME_RESUME, this.resumeListener);
    
    this.playerActiveListener = (data) => this.handlePlateActivation(data.playerId);
    gameEvents.on(Events.PLAYER_ACTIVE, this.playerActiveListener);
    
    // run game logic
    this.startGameLogic();
  }

  generatePlayerBlocks() {
    const container = this.container.querySelector('#player-blocks-container');
    container.innerHTML = '';
    
    // Always create 4 blocks (for all 4 possible players)
    for (let playerId = 1; playerId <= 4; playerId++) {
      const block = document.createElement('div');
      block.className = 'code-block';
      block.dataset.playerId = playerId;
      block.innerHTML = `<span class="player-label">Speler ${playerId}</span>`;
      container.appendChild(block);
    }
    
    this.playerBlocks = Array.from(container.querySelectorAll('.code-block'));
  }

  startGameLogic() {
    // Generate random sequence using active player IDs
    this.sequence = this.generateSequence();
    this.currentRound = 0;
    this.playerInput = [];
    
    console.log('[Game1Scene] Generated sequence:', this.sequence);
    
    // Start first round after a short delay
    setTimeout(() => {
      this.startRound();
    }, 1000);
  }

  generateSequence() {
    // Create a shuffled sequence of all 4 player IDs
    const sequence = [1, 2, 3, 4];
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }

  startRound() {
    if (this.isPaused) return;
    
    this.currentRound++;
    this.playerInput = [];
    this.updateRoundDisplay();
    this.updateInstruction('Onthoud de volgorde...');
    
    console.log(`[Game1Scene] Starting round ${this.currentRound}`);
    
    // Show sequence up to current round
    this.showSequence();
  }

  async showSequence() {
    this.isShowingSequence = true;
    this.isAcceptingInput = false;
    
    // Show each player block in sequence up to current round
    for (let i = 0; i < this.currentRound; i++) {
      if (this.isPaused) return;
      
      const playerId = this.sequence[i];
      await this.activatePlayerBlock(playerId);
      await this.delay(200); // Short delay between activations
    }
    
    this.isShowingSequence = false;
    this.isAcceptingInput = true;
    this.updateInstruction('Stap op jullie velden in de juiste volgorde!');
  }

  async activatePlayerBlock(playerId) {
    const block = this.playerBlocks.find(b => parseInt(b.dataset.playerId) === playerId);
    if (block) {
      block.classList.add('active');
      await this.delay(600);
      block.classList.remove('active');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handlePlateActivation(playerId) {
    if (!this.isAcceptingInput || this.isPaused || !this.isActive) return;
    
    // Accept input from any plate (1-4)
    if (playerId < 1 || playerId > 4) return;
    
    console.log(`[Game1Scene] Player ${playerId} stepped on plate`);
    
    // visual feedback
    const block = this.playerBlocks.find(b => parseInt(b.dataset.playerId) === playerId);
    if (block) {
      block.classList.add('active');
      setTimeout(() => {
        block.classList.remove('active');
      }, 300);
    }
    
    // add to player input
    this.playerInput.push(playerId);
    
    // check if input is correct so far
    const currentIndex = this.playerInput.length - 1;
    if (this.playerInput[currentIndex] !== this.sequence[currentIndex]) {
      // wrong input
      this.handleWrongInput();
      return;
    }
    
    // check if round is complete
    if (this.playerInput.length === this.currentRound) {
      this.handleRoundComplete();
    }
  }

  handleWrongInput() {
    console.log('[Game1Scene] Wrong input!');
    this.isAcceptingInput = false;
    this.updateInstruction('Fout! Probeer opnieuw...');
    
    // flash all player blocks red or show error
    this.playerBlocks.forEach(block => block.classList.add('error'));
    setTimeout(() => {
      this.playerBlocks.forEach(block => block.classList.remove('error'));
      // restart current round
      setTimeout(() => this.startRound(), 500);
    }, 800);
  }

  handleRoundComplete() {
    console.log(`[Game1Scene] Round ${this.currentRound} complete!`);
    this.isAcceptingInput = false;
    
    if (this.currentRound === 4) {
      // game complete
      this.updateInstruction('Gelukt! 🎉');
      setTimeout(() => {
        this.onGameComplete();
      }, 1500);
    } else {
      // next round
      this.updateInstruction('Correct!');
      setTimeout(() => {
        this.startRound();
      }, 1000);
    }
  }

  updateRoundDisplay() {
    const roundNumber = this.container.querySelector('.round-number');
    if (roundNumber) {
      roundNumber.textContent = this.currentRound;
    }
  }

  updateInstruction(text) {
    const instruction = this.container.querySelector('.instruction');
    if (instruction) {
      instruction.textContent = text;
    }
  }

  handlePause() {
    console.log('[Game1Scene] Game paused');
    this.isPaused = true;
    const overlay = this.container.querySelector('.pause-overlay');
    overlay.classList.remove('hidden');
    
    // Pause game logic here
  }

  handleResume() {
    console.log('[Game1Scene] Game resumed');
    this.isPaused = false;
    const overlay = this.container.querySelector('.pause-overlay');
    overlay.classList.add('hidden');
    
    // Resume game logic here
  }

  onGameComplete() {
    console.log('[Game1Scene] Game 1 completed');
    if (this.isActive && !this.isPaused) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'game1' });
    }
  }

  update(deltaTime) {
    // Called each frame if needed
    if (!this.isActive || this.isPaused) return;
    
    // Implement game loop here
  }

  cleanup() {
    console.log('[Game1Scene] Cleaning up...');
    this.isActive = false;
    this.isPaused = false;
    
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    
    if (this.pauseListener) {
      gameEvents.off(Events.GAME_PAUSE, this.pauseListener);
      this.pauseListener = null;
    }
    
    if (this.resumeListener) {
      gameEvents.off(Events.GAME_RESUME, this.resumeListener);
      this.resumeListener = null;
    }
    
    if (this.playerActiveListener) {
      gameEvents.off(Events.PLAYER_ACTIVE, this.playerActiveListener);
      this.playerActiveListener = null;
    }
    
    this.container.classList.add('hidden');
  }
}
