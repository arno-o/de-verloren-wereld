import Lottie from 'lottie-web';

import { SceneConfig } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class IntroScene {
  constructor(container, playerManager, backgroundManager) {
    this.isActive = false;
    this.introTimer = null;
    this.container = container;
    
    this.backgroundManager = backgroundManager;
    this.playerManager = playerManager;

    this.audio = null;
    this.video = null;
    this.animation = null;
    this.hasTriggeredTransition = false;
  }

  init() {
    console.log('[IntroScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="intro-content">
        <div class="intro-animation" id="intro-animation"></div>
        <div class="intro-video-backdrop" id="intro-video-backdrop">
          <div class="intro-video-title">Hoe werkt het?</div>
          <div class="intro-video-frame">
            <video class="intro-video" id="intro-video">
              <source src="assets/videos/demo_game_1.mp4" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    `;

    // Load audio
    this.audio = new Audio('assets/audio/voiceovers/_MEMORY_INTRO.m4a');
  }
  
  loadAnimation() {
    const animationContainer = document.getElementById('intro-animation');
    
    this.animation = Lottie.loadAnimation({
      container: animationContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'assets/animations/process.json'
    });
  }

  start() {
    this.isActive = true;
    this.hasTriggeredTransition = false;
    this.container.classList.remove('hidden');
    
    this.loadAnimation();
    this.video = document.getElementById('intro-video');
    
    this.playDemo();
  }

  playDemo() {
    let progress = document.querySelector("#progress-bar-over");
    progress.style.transition = "width 0.5s ease";
    progress.style.width = "20%";
    
    this.animation.addEventListener('DOMLoaded', () => {
      this.animation.playSegments([0, 250], true);
    })
    
    // Listen for animation complete
    this.animation.addEventListener('complete', () => {
      this.backgroundManager.setSegment('PROCESS_DOWN', () => {
        this.backgroundManager.setSegment('IDLE');
        this.fadeOutAnimationAndPlayVideo();
      })
    });
  }

  fadeOutAnimationAndPlayVideo() {
    const animationContainer = document.getElementById('intro-animation');
    const videoBackdrop = document.getElementById('intro-video-backdrop');
    
    // fade out animation
    animationContainer.style.transition = 'opacity 0.5s';
    animationContainer.style.opacity = '0';

    this.audio.play().catch(err => console.error('[IntroScene] Audio playback error:', err));
    
    setTimeout(() => {
      animationContainer.style.display = 'none';
      videoBackdrop.classList.add('visible');
      this.video.play().catch(err => console.error('[IntroScene] Video playback error:', err));
      
      this.video.addEventListener('ended', () => {
        this.video.style.opacity = '0';
        videoBackdrop.classList.remove('visible');
        this.onIntroComplete();
      });
    }, 500);
  }
  
  onIntroComplete() {
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'intro' });
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