import { SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';
import Lottie from 'lottie-web';

export default class Intro2Scene {
  constructor(container, playerManager) {
    this.isActive = false;
    this.introTimer = null;
    this.container = container;
    
    this.playerManager = playerManager;
    this.animation = null;
    this.audio = null;
    this.hasTriggeredTransition = false;
    this.video = null;
  }

  init() {
    console.log('[Intro2Scene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="intro-content">
        <div class="intro-animation" id="intro2-animation"></div>
        <video class="intro-video" id="intro2-video" style="display: none; width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
          <source src="assets/videos/demo_game_2.mp4" type="video/mp4">
        </video>
      </div>
    `;
    
    // Load audio
    this.audio = new Audio('assets/audio/voiceovers/_MEMORY_SUCCESS.m4a');
  }
  
  loadAnimation() {
    const animationContainer = document.getElementById('intro2-animation');
    
    this.animation = Lottie.loadAnimation({
      container: animationContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'assets/animations/process_screen.json'
    });
    
    // Set up complete listener
    this.animation.addEventListener('complete', () => {
      if (!this.hasTriggeredTransition) {
        console.log('[Intro2Scene] Animation complete, showing video');
        this.hasTriggeredTransition = true;
        this.fadeOutAnimationAndPlayVideo();
      }
    });
  }

  start() {
    this.isActive = true;
    this.hasTriggeredTransition = false;
    this.container.classList.remove('hidden');
    
    // Load animation and get video reference
    this.loadAnimation();
    this.video = document.getElementById('intro2-video');
    
    // Start playing immediately
    this.playDemo();
  }

  playDemo() {
    console.log('[Intro2Scene] Starting demo...');
    
    // Start audio
    this.audio.play().catch(err => console.error('[Intro2Scene] Audio playback error:', err));
    
    if (this.animation) {
      console.log('[Intro2Scene] Playing animation from frame 200 to 400...');
      // Play the second segment of the animation (frames 200-400)
      this.animation.playSegments([200, 400], true);
    } else {
      console.error('[Intro2Scene] Animation not loaded!');
    }
  }

  fadeOutAnimationAndPlayVideo() {
    const animationContainer = document.getElementById('intro2-animation');
    
    console.log('[Intro2Scene] Fading out animation and playing video');
    
    // Fade out animation
    animationContainer.style.transition = 'opacity 0.5s';
    animationContainer.style.opacity = '0';
    
    setTimeout(() => {
      animationContainer.style.display = 'none';
      this.video.style.display = 'block';
      
      console.log('[Intro2Scene] Starting video playback');
      
      this.video.play().catch(err => console.error('[Intro2Scene] Video playback error:', err));
      
      this.video.addEventListener('ended', () => {
        console.log('[Intro2Scene] Video ended');
        this.handleVideoComplete();
      });
    }, 500);
  }
  
  handleVideoComplete() {
    console.log('[Intro2Scene] Video complete, emitting scene complete event');
    this.onIntroComplete();
  }

  onIntroComplete() {
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'intro2' });
    }
  }

  cleanup() {
    this.isActive = false;

    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }

    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }

    this.container.classList.add('hidden');
  }
}
