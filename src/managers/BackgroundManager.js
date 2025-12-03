import lottie from '../../node_modules/lottie-web/build/player/esm/lottie_canvas.min.js';
import { BackgroundStates, BackgroundConfig } from '../utils/constants.js';

class BackgroundManager {
  constructor() {
    this.animation = null;
    this.container = null;
    this.currentState = null;
    this.isLoaded = false;
    this.onStateChangeComplete = null;
  }

  async init(container) {
    this.container = container;

    return new Promise((resolve, reject) => {
      console.log('[BackgroundManager] Loading animation...');
      
      this.animation = lottie.loadAnimation({
        container: this.container,
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        path: './assets/animations/background.json',
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice',
          clearCanvas: true,
        }
      });

      this.animation.addEventListener('DOMLoaded', () => {
        console.log('[BackgroundManager] Animation loaded successfully');
        console.log(`[BackgroundManager] Total frames: ${this.animation.totalFrames}`);
        console.log(`[BackgroundManager] Duration: ${this.animation.totalFrames / BackgroundConfig.FPS}s`);
        this.isLoaded = true;
        resolve();
      });

      this.animation.addEventListener('error', (error) => {
        console.error('[BackgroundManager] Failed to load animation:', error);
        reject(error);
      });

      // Handle loop point for manual segment looping
      this.animation.addEventListener('complete', () => {
        this._onAnimationComplete();
      });
    });
  }

  setState(state, onComplete = null) {
    if (!this.isLoaded) {
      console.warn('[BackgroundManager] Animation not loaded yet');
      return;
    }

    if (!BackgroundStates[state]) {
      console.error(`[BackgroundManager] Invalid state: ${state}`);
      return;
    }

    console.log(`[BackgroundManager] Setting state: ${state}`);
    this.currentState = state;
    this.onStateChangeComplete = onComplete;

    const config = BackgroundConfig.SEGMENTS[state];
    
    // Play the segment
    this.animation.playSegments([config.startFrame, config.endFrame], true);
  }

  _onAnimationComplete() {
    if (!this.currentState) return;

    const config = BackgroundConfig.SEGMENTS[this.currentState];

    if (config.loop) {
      this.animation.playSegments([config.startFrame, config.endFrame], true);
    } else {
      console.log(`[BackgroundManager] ${this.currentState} complete`);
      
      if (this.onStateChangeComplete) {
        this.onStateChangeComplete();
        this.onStateChangeComplete = null;
      }
    }
  }


  transitionToGame() {
    console.log('[BackgroundManager] Starting transition to Game...');
    
    this.setState('TRANSITION', () => {
      // After transition completes, start the game loop
      this.setState('GAME');
    });
  }

  goToIdle() {
    this.setState('IDLE');
  }

  goToGame() {
    this.setState('GAME');
  }

  pause() {
    if (this.animation) {
      this.animation.pause();
    }
  }

  play() {
    if (this.animation) {
      this.animation.play();
    }
  }

  setSpeed(speed) {
    if (this.animation) {
      this.animation.setSpeed(speed);
    }
  }

  destroy() {
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    this.isLoaded = false;
    this.currentState = null;
  }
}

export default BackgroundManager;