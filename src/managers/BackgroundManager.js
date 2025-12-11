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
    if (!this.isLoaded) { return; }

    const config = BackgroundConfig.SEGMENTS[segmentName];
    if (!config) { return; }
    
    this.currentSegment = segmentName;

    if (this.completeHandler) {
      this.animation.removeEventListener('complete', this.completeHandler);
      this.completeHandler = null;
    }

    this.completeHandler = () => {      
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