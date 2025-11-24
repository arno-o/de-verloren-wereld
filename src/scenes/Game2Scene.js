import { AvatarColors } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class Game2Scene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.isPaused = false;
    this.gameTimer = null;
    this.pauseListener = null;
    this.resumeListener = null;
    this.playerPadActivationListener = null;
    
    // game state
    this.remainingLives = 3;
    this.totalBlocksCleared = 0;
    this.totalBlocksToSpawn = 12;
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.upcomingBlockColorQueue = [];
    this.currentlyFallingBlocks = [];
    this.gameAreaHeight = 0;
    this.lastSpawnedBlockColorId = null;
  }

  init() {
    console.log('[Game2Scene] Initializing...');
    this.createGameHTML();
  }

  createGameHTML() {
    this.container.innerHTML = `
      <div class="game2-content">
        <h2>Spel 2 - Vallende Blokken</h2>
        <div class="game-stats">
          <div class="stat">
            <span class="stat-label">levens:</span>
            <span class="stat-value lives-count">3</span>
          </div>
          <div class="stat">
            <span class="stat-label">blokken:</span>
            <span class="stat-value blocks-count">0/12</span>
          </div>
        </div>
        <div class="game-area" id="tetris-area">
          <div class="blocks-container" id="blocks-container"></div>
        </div>
        <div class="player-indicators">
          <div class="indicator player-1" data-player="1">
            <span>speler 1</span>
          </div>
          <div class="indicator player-2" data-player="2">
            <span>speler 2</span>
          </div>
          <div class="indicator player-3" data-player="3">
            <span>speler 3</span>
          </div>
          <div class="indicator player-4" data-player="4">
            <span>speler 4</span>
          </div>
        </div>
        <div class="pause-overlay hidden">
          <p>wachten op speler...</p>
        </div>
      </div>
    `;
  }

  start() {
    console.log('[Game2Scene] Starting game 2...');
    this.isActive = true;
    this.isPaused = false;
    this.container.classList.remove('hidden');
    
    this.pauseListener = () => this.handleGamePause();
    this.resumeListener = () => this.handleGameResume();
    gameEvents.on(Events.GAME_PAUSE, this.pauseListener);
    gameEvents.on(Events.GAME_RESUME, this.resumeListener);
    
    this.playerPadActivationListener = (data) => this.handlePlayerPadActivation(data.playerId);
    gameEvents.on(Events.PLAYER_ACTIVE, this.playerPadActivationListener);
    
    this.initializeGameState();
  }

  initializeGameState() {
    this.remainingLives = 3;
    this.totalBlocksCleared = 0;
    this.currentlyFallingBlocks = [];
    
    // generate sequence of block colors to spawn
    this.upcomingBlockColorQueue = this.generateRandomBlockColorSequence();
    
    const gameArea = this.container.querySelector('#tetris-area');
    this.gameAreaHeight = gameArea.clientHeight;
    
    this.updateStatisticsDisplay();
    
    // start spawning blocks after delay
    setTimeout(() => {
      this.spawnNextBlockFromQueue();
      this.startGameAnimationLoop();
    }, 1000);
  }

  generateRandomBlockColorSequence() {
    const sequence = [];
    // generate random color ids (1-4) for each block
    for (let i = 0; i < this.totalBlocksToSpawn; i++) {
      const randomColorId = Math.floor(Math.random() * 4) + 1;
      sequence.push(randomColorId);
    }
    return sequence;
  }

  spawnNextBlockFromQueue() {
    if (this.isPaused || !this.isActive) return;
    if (this.upcomingBlockColorQueue.length === 0) return;
    
    const blockColorId = this.upcomingBlockColorQueue.shift();
    
    // ensure consecutive blocks have different colors when spawning simultaneously
    if (this.lastSpawnedBlockColorId === blockColorId && this.upcomingBlockColorQueue.length > 0) {
      // put this color back and get next different one
      this.upcomingBlockColorQueue.unshift(blockColorId);
      const nextBlockColorId = this.upcomingBlockColorQueue.shift();
      this.createAndSpawnFallingBlock(nextBlockColorId);
    } else {
      this.createAndSpawnFallingBlock(blockColorId);
    }
  }

  createAndSpawnFallingBlock(blockColorId) {
    this.lastSpawnedBlockColorId = blockColorId;
    
    const blockColor = AvatarColors[blockColorId - 1];
    
    const blocksContainer = this.container.querySelector('#blocks-container');
    const blockElement = document.createElement('div');
    blockElement.className = 'falling-block';
    blockElement.style.backgroundColor = blockColor;
    blockElement.style.borderColor = blockColor;
    blockElement.dataset.blockColorId = blockColorId;
    blockElement.style.left = `${Math.random() * 80 + 10}%`;
    blockElement.style.top = '0px';
    
    blocksContainer.appendChild(blockElement);
    
    const fallingBlock = {
      element: blockElement,
      colorId: blockColorId,
      yPosition: 0,
      xPosition: parseFloat(blockElement.style.left)
    };
    
    this.currentlyFallingBlocks.push(fallingBlock);
    
    this.scheduleNextBlockSpawn();
  }

  scheduleNextBlockSpawn() {
    const baseSpawnDelay = 2500;
    const minimumSpawnDelay = 1000;
    const gameProgress = this.totalBlocksCleared / this.totalBlocksToSpawn;
    const currentSpawnDelay = Math.max(minimumSpawnDelay, baseSpawnDelay - (gameProgress * 1500));
    
    // spawn 2 blocks simultaneously near end game for difficulty
    const shouldSpawnDoubleBlock = this.totalBlocksCleared >= 8 && Math.random() > 0.5;
    
    if (this.upcomingBlockColorQueue.length > 0) {
      setTimeout(() => this.spawnNextBlockFromQueue(), currentSpawnDelay);
      
      if (shouldSpawnDoubleBlock && this.upcomingBlockColorQueue.length > 0) {
        setTimeout(() => this.spawnNextBlockFromQueue(), currentSpawnDelay + 300);
      }
    }
  }

  startGameAnimationLoop() {
    this.lastFrameTime = performance.now();
    
    const animationLoop = (currentTime) => {
      if (!this.isActive) return;
      
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      
      if (!this.isPaused) {
        this.updateFallingBlockPositions(deltaTime);
      }
      
      this.animationFrame = requestAnimationFrame(animationLoop);
    };
    
    this.animationFrame = requestAnimationFrame(animationLoop);
  }

  updateFallingBlockPositions(deltaTime) {
    // increase speed over time
    const gameProgress = this.totalBlocksCleared / this.totalBlocksToSpawn;
    const baseSpeed = 80; // pixels per second
    const speedIncrease = gameProgress * 40;
    const currentFallSpeed = baseSpeed + speedIncrease;
    
    // convert deltaTime from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;
    
    for (let i = this.currentlyFallingBlocks.length - 1; i >= 0; i--) {
      const block = this.currentlyFallingBlocks[i];
      block.yPosition += currentFallSpeed * deltaSeconds;
      block.element.style.top = `${block.yPosition}px`;
      
      // check if block reached bottom
      if (block.yPosition >= this.gameAreaHeight - 60) {
        this.handleBlockReachedBottom(block);
        this.removeFallingBlockFromGame(i);
      }
    }
  }

  handlePlayerPadActivation(playerId) {
    if (!this.isActive || this.isPaused) return;
    
    // flash the player's indicator card
    const playerIndicator = this.container.querySelector(`.indicator[data-player="${playerId}"]`);
    if (playerIndicator) {
      playerIndicator.classList.add('active');
      setTimeout(() => playerIndicator.classList.remove('active'), 200);
    }
    
    // check if any falling block matches this player's color
    let foundMatchingBlock = false;
    for (let i = this.currentlyFallingBlocks.length - 1; i >= 0; i--) {
      const block = this.currentlyFallingBlocks[i];
      if (block.colorId === playerId) {
        this.handleBlockClearedByPlayer(block);
        this.removeFallingBlockFromGame(i);
        foundMatchingBlock = true;
        break; // only clear one block per press
      }
    }
    
    // player pressed wrong color
    if (!foundMatchingBlock && this.currentlyFallingBlocks.length > 0) {
      this.decreasePlayerLife();
    }
  }

  handleBlockClearedByPlayer(block) {
    block.element.classList.add('cleared');
    this.totalBlocksCleared++;
    this.updateStatisticsDisplay();
    
    // check if all blocks have been cleared
    if (this.totalBlocksCleared >= this.totalBlocksToSpawn && this.currentlyFallingBlocks.length <= 1) {
      setTimeout(() => this.handleGameComplete(), 500);
    }
  }

  handleBlockReachedBottom(block) {
    block.element.classList.add('missed');
    this.decreasePlayerLife();
  }

  removeFallingBlockFromGame(blockIndex) {
    const block = this.currentlyFallingBlocks[blockIndex];
    setTimeout(() => {
      if (block.element.parentNode) {
        block.element.parentNode.removeChild(block.element);
      }
    }, 300);
    this.currentlyFallingBlocks.splice(blockIndex, 1);
  }

  decreasePlayerLife() {
    this.remainingLives--;
    this.updateStatisticsDisplay();
    
    // flash screen red as damage feedback
    const gameArea = this.container.querySelector('#tetris-area');
    gameArea.classList.add('damage');
    setTimeout(() => gameArea.classList.remove('damage'), 300);
    
    if (this.remainingLives <= 0) {
      this.handleGameOver();
    }
  }

  updateStatisticsDisplay() {
    const livesElement = this.container.querySelector('.lives-count');
    const blocksElement = this.container.querySelector('.blocks-count');
    
    if (livesElement) livesElement.textContent = this.remainingLives;
    if (blocksElement) blocksElement.textContent = `${this.totalBlocksCleared}/${this.totalBlocksToSpawn}`;
  }

  handleGameOver() {
    console.log('[Game2Scene] game over');
    this.isActive = false;
    
    // remove all falling blocks from screen
    this.currentlyFallingBlocks.forEach(block => {
      if (block.element.parentNode) {
        block.element.parentNode.removeChild(block.element);
      }
    });
    this.currentlyFallingBlocks = [];
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // show game over message briefly before moving on
    const gameArea = this.container.querySelector('#tetris-area');
    gameArea.innerHTML = '<div class="game-over-message"><h3>game over!</h3></div>';
    
    setTimeout(() => {
      this.handleGameComplete();
    }, 2000);
  }

  handleGamePause() {
    console.log('[Game2Scene] game paused');
    this.isPaused = true;
    const pauseOverlay = this.container.querySelector('.pause-overlay');
    pauseOverlay.classList.remove('hidden');
  }

  handleGameResume() {
    console.log('[Game2Scene] game resumed');
    this.isPaused = false;
    const pauseOverlay = this.container.querySelector('.pause-overlay');
    pauseOverlay.classList.add('hidden');
    this.lastFrameTime = performance.now();
  }

  handleGameComplete() {
    console.log('[Game2Scene] game 2 completed');
    if (this.isActive || this.remainingLives <= 0) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'game2' });
    }
  }

  cleanup() {
    console.log('[Game2Scene] cleaning up...');
    this.isActive = false;
    this.isPaused = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
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
    
    if (this.playerPadActivationListener) {
      gameEvents.off(Events.PLAYER_ACTIVE, this.playerPadActivationListener);
      this.playerPadActivationListener = null;
    }
    
    // remove all falling blocks from screen
    this.currentlyFallingBlocks.forEach(block => {
      if (block.element.parentNode) {
        block.element.parentNode.removeChild(block.element);
      }
    });

    this.currentlyFallingBlocks = [];
    
    this.container.classList.add('hidden');
  }
}
