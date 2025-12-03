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
    this.sequence = [];
    this.playerInput = [];
    this.isShowingSequence = false;
    this.isAcceptingInput = false;
    this.playerBlocks = [];
    this.activePlayers = [];
    this.failCount = 0;
    this.maxFails = 3;
    this.sequenceLength = 4;
    
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
          <p class="round-info">Pogingen over: <span class="attempts-left">3</span></p>
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
    this.failCount = 0;
    this.updateAttemptsDisplay();
    
    this.startNewSequence();
  }

  startNewSequence() {
    this.sequence = this.generateSequence();
    this.playerInput = [];
    
    console.log('[Game1Scene] Generated sequence:', this.sequence);
    
    setTimeout(() => {
      this.showSequence();
    }, 1000);
  }

  generateSequence() {
    const sequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      sequence.push(Math.floor(Math.random() * 4) + 1);
    }
    return sequence;
  }

  async showSequence() {
    this.isShowingSequence = true;
    this.isAcceptingInput = false;
    this.updateInstruction('Onthoud de volgorde...');
    
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.isPaused) return;
      
      const playerId = this.sequence[i];
      await this.activatePlayerBlock(playerId);
      await this.delay(200);
    }
    
    this.isShowingSequence = false;
    this.isAcceptingInput = true;
    this.playerInput = [];
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
    
    // accept input from any plate (1-4)
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
    
    // check if sequence is complete
    if (this.playerInput.length === this.sequence.length) {
      this.handleSequenceComplete();
    }
  }

  handleWrongInput() {
    console.log('[Game1Scene] Wrong input!');
    this.isAcceptingInput = false;
    this.failCount++;
    this.updateAttemptsDisplay();
    
    this.playerBlocks.forEach(block => block.classList.add('error'));
    
    setTimeout(() => {
      this.playerBlocks.forEach(block => block.classList.remove('error'));
      
      if (this.failCount >= this.maxFails) {
        this.updateInstruction('Te veel fouten! Door naar het volgende spel...');
        setTimeout(() => {
          this.onGameComplete();
        }, 1500);
      } else {
        this.updateInstruction(`Fout! Nog ${this.maxFails - this.failCount} poging(en) over...`);
        setTimeout(() => {
          this.startNewSequence();
        }, 1000);
      }
    }, 800);
  }

  handleSequenceComplete() {
    console.log('[Game1Scene] Sequence complete!');
    this.isAcceptingInput = false;
    
    this.updateInstruction('Gelukt! 🎉');
    setTimeout(() => {
      this.onGameComplete();
    }, 1500);
  }

  updateAttemptsDisplay() {
    const attemptsLeft = this.container.querySelector('.attempts-left');
    if (attemptsLeft) {
      attemptsLeft.textContent = this.maxFails - this.failCount;
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
