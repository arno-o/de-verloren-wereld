import lottie from '../../node_modules/lottie-web/build/player/esm/lottie_canvas.min.js';
import { BackgroundConfig } from '../utils/constants.js';

class BackgroundManager {
  constructor() {
    this.animation = null;
    this.container = null;
    this.currentSegment = null;
    this.isLoaded = false;
    this.completeHandler = null;
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
    });
  }

  /**
   * Set and play a specific segment of the background animation
   * @param {string} segmentName - Name of the segment (must match BackgroundConfig.SEGMENTS keys)
   * @param {Function} onComplete - Optional callback when non-looping segment completes
   */
  setSegment(segmentName, onComplete = null) {
    if (!this.isLoaded) {
      console.warn('[BackgroundManager] Animation not loaded yet');
      return;
    }

    const config = BackgroundConfig.SEGMENTS[segmentName];
    if (!config) {
      console.error(`[BackgroundManager] Unknown segment: ${segmentName}`);
      return;
    }

    console.log(`[BackgroundManager] Setting segment: ${segmentName} (frames ${config.startFrame}-${config.endFrame}, loop: ${config.loop})`);
    
    this.currentSegment = segmentName;

    if (this.completeHandler) {
      this.animation.removeEventListener('complete', this.completeHandler);
      this.completeHandler = null;
    }

    this.completeHandler = () => {
      console.log(`[BackgroundManager] Segment ${segmentName} completed`);
      
      if (config.loop) {
        this.animation.playSegments([config.startFrame, config.endFrame], true);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    this.animation.addEventListener('complete', this.completeHandler);
    this.animation.playSegments([config.startFrame, config.endFrame], true);
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

  destroy() {
    if (this.completeHandler && this.animation) {
      this.animation.removeEventListener('complete', this.completeHandler);
      this.completeHandler = null;
    }
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    this.isLoaded = false;
    this.currentSegment = null;
  }
}

export default BackgroundManager;