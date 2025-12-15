import Lottie from 'lottie-web';
import { AvatarBackgrounds } from '../utils/constants.js';
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
    
    // Heart animations
    this.heartAnimations = [];
    
    // Audio
    this.audioContext = null;
    this.errorSoundBuffer = null;
    
    // Event listeners
    this.playerActiveListener = null;
  }

  init() {
    console.log('[Game1Scene] Initializing...');
    this.setupHTML();
    this.initializeAudio();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="error-flash-overlay"></div>
      <div class="game1-content">
        <div class="game1-title">
          <p>De Verloren Wereld</p>
          <div class="hearts-container"></div>
        </div>
        <div class="game1-container">
          <div class="game1-timer-container">
            <div class="game1-timer-tooltip"></div>
            <div class="game1-timer-animation"></div>
          </div>
          <div id="player-blocks-container"></div>
        </div>
        <div class="game1-footer">
          <div class="game1-footer-avatars"></div>
        </div>
      </div>
    `;
  }

  async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load error sound
      const response = await fetch('./assets/audio/errors/memory.wav');
      const arrayBuffer = await response.arrayBuffer();
      this.errorSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log('[Game1Scene] Audio initialized successfully');
    } catch (error) {
      console.error('[Game1Scene] Failed to initialize audio:', error);
    }
  }

  playErrorSound() {
    if (!this.audioContext || !this.errorSoundBuffer) {
      console.warn('[Game1Scene] Audio not ready');
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.errorSoundBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('[Game1Scene] Failed to play error sound:', error);
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
    this.isActive = true;
    this.isPaused = false;
    this.container.classList.remove('hidden');
    
    // fetch active players
    this.activePlayers = this.playerManager.getActivePlayerIds();
    console.log('[Game1Scene] Active players:', this.activePlayers);
    
    // generate player blocks
    this.generatePlayerBlocks();
    
    // setup hearts
    this.setupHearts();
    
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

    for (let playerId = 1; playerId <= 4; playerId++) {
      const block = document.createElement('div');
      block.className = 'code-block';
      block.dataset.playerId = playerId;
      block.style.backgroundColor = AvatarBackgrounds[playerId - 1];
      block.innerHTML = `
        <img src="../assets/images/avatar_${playerId}.png" />
      `
      container.appendChild(block);
    }

    this.playerBlocks = Array.from(container.querySelectorAll('.code-block'));
  }

  setupHearts() {
    const heartsContainer = this.container.querySelector('.hearts-container');
    heartsContainer.innerHTML = '';
    this.heartAnimations = [];
    
    for (let i = 0; i < this.maxFails; i++) {
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
      
      // Start on first frame (unbroken heart)
      heartAnimation.goToAndStop(0, true);
      
      this.heartAnimations.push(heartAnimation);
    }
  } 

  startGameLogic() {
    this.failCount = 0;
    this.updateAttemptsDisplay();
    
    this.startCountdown("Onthoud de volgorde!");
  }

  startCountdown(tooltip = "Ben je er klaar voor?") {
    const game1CountdownTooltip = document.querySelector(".game1-timer-tooltip");
    const game1CountdownContainer = document.querySelector(".game1-timer-container");
    const game1PlayerBlocksContainer = document.querySelector("#player-blocks-container");
    const game1CountdownAnimationContainer = document.querySelector(".game1-timer-animation");
    
    let game1CountdownAnimation = Lottie.loadAnimation({
      container: game1CountdownAnimationContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: `./assets/animations/countdown_3.json`,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      }
    });

    game1CountdownTooltip.innerHTML = tooltip;
    game1CountdownAnimation.play();
    game1CountdownContainer.classList.add('active');

    game1CountdownAnimation.addEventListener('complete', async () => {
      game1CountdownContainer.classList.remove('active');
      await this.delay(100);
      this.revealPlayerBlocks();
      await this.delay(100);
      game1CountdownAnimation.destroy();
      this.startNewSequence();
    })
  }

  startNewSequence() {
    this.sequence = this.generateSequence();
    this.playerInput = [];
        
    setTimeout(() => {
      this.showSequence();
    }, 1000);
  }

  generateSequence() {
    const sequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      let newNumber;
      do {
        newNumber = Math.floor(Math.random() * 4) + 1;
      } while (i > 0 && newNumber === sequence[i - 1]);
      sequence.push(newNumber);
    }
    console.log(sequence);
    return sequence;
  }

  async hidePlayerBlocks() {
    for (let i = 0; i < this.playerBlocks.length; i++) {
      const block = this.playerBlocks[i];
      block.classList.remove('visible');
      await this.delay(100); // Stagger delay between each block
    }
  }

  async revealPlayerBlocks() {
    for (let i = 0; i < this.playerBlocks.length; i++) {
      const block = this.playerBlocks[i];
      block.classList.add('visible');
      await this.delay(100); // Stagger delay between each block
    }
  }

  async showSequence() {
    this.isShowingSequence = true;
    this.isAcceptingInput = false;
    
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.isPaused) return;
      
      const playerId = this.sequence[i];
      await this.activatePlayerBlock(playerId);
      await this.delay(200);
    }
    
    this.isShowingSequence = false;
    this.isAcceptingInput = true;
    this.playerInput = [];
  }

  async activatePlayerBlock(playerId) {
    const block = this.playerBlocks.find(b => parseInt(b.dataset.playerId) === playerId);
    if (block) {
      block.classList.add('active');
      await this.delay(600);
      block.classList.remove('active');
    }
  }

  /**
  * @param ms - Duration of delay (in ms)
  */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handlePlateActivation(playerId) {
    if (!this.isAcceptingInput || this.isPaused || !this.isActive) return;
    
    if (playerId < 1 || playerId > 4) return;
    
    console.log(`[Game1Scene] Player ${playerId} stepped on plate`);
    
    const block = this.playerBlocks.find(b => parseInt(b.dataset.playerId) === playerId);
    if (block) {
      block.classList.add('active');
      setTimeout(() => {
        block.classList.remove('active');
      }, 300);
    }
    
    this.playerInput.push(playerId);
    
    const currentIndex = this.playerInput.length - 1;
    if (this.playerInput[currentIndex] !== this.sequence[currentIndex]) {
      this.handleWrongInput();
      return;
    }
    
    if (this.playerInput.length === this.sequence.length) {
      this.handleSequenceComplete();
    }
  }

  handleWrongInput() {
    this.isAcceptingInput = false;
    this.failCount++;
    this.playHeartAnimation(this.failCount - 1);
    this.playErrorSound();
    this.triggerErrorFlash();
    this.updateAttemptsDisplay();
    
    this.playerBlocks.forEach(block => block.classList.add('error'));
    
    setTimeout(() => {
      this.playerBlocks.forEach(block => block.classList.remove('error'));
      this.hidePlayerBlocks();
      
      if (this.failCount >= this.maxFails) {
        setTimeout(() => {
          this.onGameComplete();
        }, 1500);
      } else {
        setTimeout(() => {
          this.startCountdown("Oei! Probeer nog eens");
        }, 1000);
      }
    }, 800);
  }

  playHeartAnimation(index) {
    if (index >= 0 && index < this.heartAnimations.length) {
      const heart = this.heartAnimations[index];
      heart.goToAndPlay(0, true);
    }
  }

  handleSequenceComplete() {
    this.isAcceptingInput = false;
    
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
