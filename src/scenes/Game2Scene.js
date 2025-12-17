import gsap from 'gsap';
import Lottie from 'lottie-web';
import { gameEvents, Events } from '../utils/events.js';

export default class Game2Scene {
  constructor(container, playerManager, voiceoverManager) {
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
    this.totalBlocksSpawned = 0;
    this.blocksNeededToClear = 25;
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.upcomingBlockColorQueue = [];
    this.currentlyFallingBlocks = [];
    this.gameAreaHeight = 0;
    this.lastSpawnedBlockColorId = null;
    
    // Heart animations
    this.heartAnimations = [];
    
    // Audio
    this.audioContext = null;
    this.errorSoundBuffer = null;
    this.voiceoverManager = voiceoverManager;
  }

  init() {
    console.log('[Game2Scene] Initializing...');
    this.setupHTML();
    this.initializeAudio();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="error-flash-overlay"></div>

      <div class="game2-content">
        <div class="game2-title">
          <p>De Verloren Wereld</p>
          <div class="game2-stats">
            <div class="hearts-container"></div>
          </div>
        </div>
        <div class="game2-container">
          <div class="game2-timer-container">
            <div class="game2-timer-tooltip"></div>
            <div class="game2-timer-animation"></div>
          </div>
          <div id="blocks-container"></div>
        </div>
        <div class="game2-footer">
          <div class="game2-footer-avatars"></div>
        </div>
      </div>
    `;
  }

  async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const response = await fetch('./assets/audio/errors/tetris.wav');
      const arrayBuffer = await response.arrayBuffer();
      this.errorSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      console.log('[Game2Scene] Audio initialized successfully');
    } catch (error) {
      console.error('[Game2Scene] Failed to initialize audio:', error);
    }
  }

  playErrorSound() {
    if (!this.audioContext || !this.errorSoundBuffer) {
      console.warn('[Game2Scene] Audio not ready');
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.errorSoundBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('[Game2Scene] Failed to play error sound:', error);
    }
  }

  triggerErrorFlash() {
    const overlay = this.container.querySelector('.error-flash-overlay');
    if (!overlay) return;

    overlay.classList.add('active');

    setTimeout(() => {
      overlay.classList.remove('active');
    }, 600);
  }

  start() {
    console.log('[Game2Scene] Starting game 2...');
    this.isActive = true;
    this.isPaused = false;
    this.container.classList.remove('hidden');
    
    // Update progress bar
    let progress = document.querySelector("#progress-bar-over");
    gsap.to(progress, { width: "80%", duration: 0.5, ease: "power2.out" });
    
    this.pauseListener = () => this.handleGamePause();
    this.resumeListener = () => this.handleGameResume();
    gameEvents.on(Events.GAME_PAUSE, this.pauseListener);
    gameEvents.on(Events.GAME_RESUME, this.resumeListener);
    
    this.playerPadActivationListener = (data) => this.handlePlayerPadActivation(data.playerId);
    gameEvents.on(Events.PLAYER_ACTIVE, this.playerPadActivationListener);
    
    this.setupHearts();
    this.startCountdown();
  }

  setupHearts() {
    const heartsContainer = this.container.querySelector('.hearts-container');
    heartsContainer.innerHTML = '';
    this.heartAnimations = [];
    
    for (let i = 0; i < this.remainingLives; i++) {
      const heartDiv = document.createElement('div');
      heartDiv.className = 'heart-item';
      heartsContainer.appendChild(heartDiv);
      
      const heartAnimation = Lottie.loadAnimation({
        container: heartDiv,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: './assets/ui/heart.json',
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
        }
      });
      
      heartAnimation.goToAndStop(0, true);
      
      this.heartAnimations.push(heartAnimation);
    }
  }

  startCountdown(tooltip = "Ben je er klaar voor?") {
    const game2CountdownTooltip = document.querySelector(".game2-timer-tooltip");
    const game2CountdownContainer = document.querySelector(".game2-timer-container");
    const game2CountdownAnimationContainer = document.querySelector(".game2-timer-animation");
    
    let game2CountdownAnimation = Lottie.loadAnimation({
      container: game2CountdownAnimationContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: `./assets/animations/countdown_3.json`,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      }
    });

    game2CountdownTooltip.innerHTML = tooltip;
    game2CountdownAnimation.play();
    game2CountdownContainer.classList.add('active');

    game2CountdownAnimation.addEventListener('complete', async () => {
      game2CountdownContainer.classList.remove('active');
      await this.delay(100);
      game2CountdownAnimation.destroy();
      this.initializeGameState();
    })
  }

  initializeGameState() {
    this.remainingLives = 3;
    this.totalBlocksCleared = 0;
    this.totalBlocksSpawned = 0;
    this.currentlyFallingBlocks = [];
    this.lastSpawnedBlockColorId = null;
    
    const blocksContainer = this.container.querySelector('#blocks-container');
    if (blocksContainer) {
      blocksContainer.innerHTML = '';
    }
    
    this.updateBlocksCounter();
    
    this.upcomingBlockColorQueue = this.generateRandomBlockColorSequence();
    
    const gameArea = this.container.querySelector('.game2-container');
    this.gameAreaHeight = gameArea.clientHeight;
    
    setTimeout(() => {
      if (this.isActive) {
        this.spawnNextBlockFromQueue();
        this.startGameAnimationLoop();
      }
    }, 1000);
  }

  generateRandomBlockColorSequence() {
    const sequence = [];

    // Start with 10 blocks in queue
    for (let i = 0; i < 10; i++) {
      const randomColorId = Math.floor(Math.random() * 4) + 1;
      sequence.push(randomColorId);
    }

    return sequence;
  }

  addBlockToQueue() {
    // Add a new random block to the queue
    const randomColorId = Math.floor(Math.random() * 4) + 1;
    this.upcomingBlockColorQueue.push(randomColorId);
  }

  spawnNextBlockFromQueue() {
    if (this.isPaused || !this.isActive) return;
    if (this.upcomingBlockColorQueue.length === 0) return;
    
    let blockColorId = this.upcomingBlockColorQueue.shift();
    
    // Keep looking for a different color if we have consecutive same colors
    let attempts = 0;
    while (this.lastSpawnedBlockColorId === blockColorId && this.upcomingBlockColorQueue.length > 0 && attempts < 5) {
      this.upcomingBlockColorQueue.push(blockColorId); // put at end instead of beginning
      blockColorId = this.upcomingBlockColorQueue.shift();
      attempts++;
    }
    
    this.createAndSpawnFallingBlock(blockColorId);
  }

  createAndSpawnFallingBlock(blockColorId) {
    this.lastSpawnedBlockColorId = blockColorId;
    this.totalBlocksSpawned++;
    
    const blocksContainer = this.container.querySelector('#blocks-container');
    const blockElement = document.createElement('div');
    blockElement.className = 'falling-block spinning';
    blockElement.dataset.blockColorId = blockColorId;
    blockElement.style.left = `${Math.random() * 80 + 10}%`;
    blockElement.style.top = '0px';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = `./assets/avatars/png/avatar_${blockColorId}.png`;
    avatarImg.alt = `avatar ${blockColorId}`;
    blockElement.appendChild(avatarImg);
    
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
    // Don't spawn more blocks if we've already spawned enough
    if (this.totalBlocksSpawned >= this.blocksNeededToClear) {
      return;
    }

    const baseSpawnDelay = 2500;
    const minimumSpawnDelay = 1200;
    const gameProgress = this.totalBlocksCleared / this.blocksNeededToClear;
    const currentSpawnDelay = Math.max(minimumSpawnDelay, baseSpawnDelay - (gameProgress * 1300));
    
    const shouldSpawnDoubleBlock = this.totalBlocksCleared >= 18 && this.totalBlocksCleared < 23 && Math.random() > 0.7;
    
    // Keep the queue filled
    while (this.upcomingBlockColorQueue.length < 5) {
      this.addBlockToQueue();
    }
    
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
    const baseSpeed = 100; // pixels per second
    let speedIncrease = 0;
    
    if (this.totalBlocksCleared > 15) {
      speedIncrease = 45 + ((this.totalBlocksCleared - 15) * 3);
    } else {
      speedIncrease = this.totalBlocksCleared * 3;
    }
    
    const currentFallSpeed = baseSpeed + speedIncrease;
    
    const deltaSeconds = deltaTime / 1000;
    
    for (let i = this.currentlyFallingBlocks.length - 1; i >= 0; i--) {
      const block = this.currentlyFallingBlocks[i];
      block.yPosition += currentFallSpeed * deltaSeconds;
      block.element.style.top = `${block.yPosition}px`;
      
      if (block.yPosition >= this.gameAreaHeight - 60) {
        this.handleBlockReachedBottom(block);
        this.removeFallingBlockFromGame(i);
      }
    }
  }

  handlePlayerPadActivation(playerId) {
    if (!this.isActive || this.isPaused) return;
    
    const playerIndicator = this.container.querySelector(`.indicator[data-player="${playerId}"]`);
    if (playerIndicator) {
      playerIndicator.classList.add('active');
      setTimeout(() => playerIndicator.classList.remove('active'), 200);
    }
    
    // Find the lowest (most urgent) matching block
    let lowestMatchingBlockIndex = -1;
    let lowestYPosition = -1;
    
    for (let i = 0; i < this.currentlyFallingBlocks.length; i++) {
      const block = this.currentlyFallingBlocks[i];
      if (block.colorId === playerId && block.yPosition > lowestYPosition) {
        lowestYPosition = block.yPosition;
        lowestMatchingBlockIndex = i;
      }
    }
    
    if (lowestMatchingBlockIndex !== -1) {
      const block = this.currentlyFallingBlocks[lowestMatchingBlockIndex];
      this.handleBlockClearedByPlayer(block);
      this.removeFallingBlockFromGame(lowestMatchingBlockIndex);
    } else if (this.currentlyFallingBlocks.length > 0) {
      this.decreasePlayerLife();
    }
  }

  handleBlockClearedByPlayer(block) {
    block.element.classList.add('cleared');
    this.totalBlocksCleared++;
    this.updateBlocksCounter();
    
    // Check if we've cleared enough blocks to complete the game
    if (this.totalBlocksCleared >= this.blocksNeededToClear) {
      // Wait for current falling blocks to clear before ending
      setTimeout(() => {
        if (this.currentlyFallingBlocks.length === 0) {
          this.handleGameComplete();
        }
      }, 500);
    }
  }

  handleBlockReachedBottom(block) {
    block.element.classList.add('missed');
    this.decreasePlayerLife();
  }

  removeFallingBlockFromGame(blockIndex) {
    const block = this.currentlyFallingBlocks[blockIndex];
    if (!block) return; // Guard clause to prevent undefined access
    
    setTimeout(() => {
      if (block.element && block.element.parentNode) {
        block.element.parentNode.removeChild(block.element);
      }
    }, 300);
    this.currentlyFallingBlocks.splice(blockIndex, 1);
  }

  updateBlocksCounter() {
    const counterElement = this.container.querySelector('.game2-footer-avatars');
    if (counterElement) {
      counterElement.textContent = `${this.totalBlocksCleared}/25`;
    }
  }

  decreasePlayerLife() {
    this.remainingLives--;
    this.playErrorSound();
    this.triggerErrorFlash();
    
    const heartIndex = this.heartAnimations.length - this.remainingLives - 1;
    if (heartIndex >= 0 && heartIndex < this.heartAnimations.length) {
      const heartAnimation = this.heartAnimations[heartIndex];
      heartAnimation.setDirection(1);
      heartAnimation.play();
    }
    
    if (this.remainingLives <= 0) {
      this.handleGameOver();
    }
  }

  handleGameOver() {
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
    const gameArea = this.container.querySelector('.game2-container');
    gameArea.innerHTML = '<div class="game-over-message"><h3>Helaas!</h3></div>';
    
    this.voiceoverManager.play('_GAME2_FAIL', {
      onComplete: () => {
        this.handleGameComplete(true);
      }
    })
  }

  handleGamePause() {
    this.isPaused = true;
    const pauseOverlay = this.container.querySelector('.pause-overlay');
    pauseOverlay.classList.remove('hidden');
  }

  handleGameResume() {
    this.isPaused = false;
    const pauseOverlay = this.container.querySelector('.pause-overlay');
    pauseOverlay.classList.add('hidden');
    this.lastFrameTime = performance.now();
  }

  handleGameComplete(fail = false) {
    if (this.isActive) {
      this.isActive = false;
      console.log('Game 2 ended');

      if (fail) {
        // Fail voiceover already played in handleGameOver, just complete the scene
        gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'game2' });
      } else {
        // Play success voiceover, then complete the scene
        this.voiceoverManager.play('_GAME2_PASS', {
          onComplete: () => {
            gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'game2' });
          }
        });
      }

      gsap.to(document.documentElement, {
        "--saturation": "0%",
        duration: 3,
        ease: "power2.inOut"
      });
    }
  }

  /**
  * @param ms - Duration of delay (in ms)
  */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanup() {
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
    
    // clean up heart animations
    this.heartAnimations.forEach(animation => {
      if (animation) animation.destroy();
    });
    this.heartAnimations = [];
    
    this.container.classList.add('hidden');
  }
}
