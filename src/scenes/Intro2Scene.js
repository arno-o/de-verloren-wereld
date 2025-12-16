import gsap from 'gsap';
import Lottie from 'lottie-web';
import { gameEvents, Events } from '../utils/events.js';

export default class Intro2Scene {
  constructor(container, playerManager, backgroundManager) {
    this.isActive = false;
    this.introTimer = null;
    this.container = container;
    
    this.backgroundManager = backgroundManager;
    this.playerManager = playerManager;

    this.animation = null;
    this.audio = null;
    this.backgroundMusic = null;
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
        <div class="intro-video-backdrop" id="intro2-video-backdrop">
          <div class="intro-video-title">Hoe werkt het?</div>
          <div class="intro-video-frame">
            <video class="intro-video" id="intro2-video">
              <source src="assets/videos/demo_game_2.mp4" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
    `;
    
    // Load audio
    this.audio = new Audio('assets/audio/voiceovers/_MEMORY_SUCCESS.m4a');
    
    // Load background music
    this.backgroundMusic = new Audio('assets/audio/music/background-bring-sound-back.mp3');
  }
  
  loadAnimation() {
    const animationContainer = document.getElementById('intro2-animation');
    
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
    
    // Update progress bar
    let progress = document.querySelector("#progress-bar-over");
    gsap.to(progress, { width: "60%", duration: 0.5, ease: "power2.out" });
    
    // Start background music
    this.backgroundMusic.play().catch(err => console.error('[Intro2Scene] Background music playback error:', err));
    this.backgroundMusic.volume = 0.20;
    
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
    
    this.animation.addEventListener('DOMLoaded', () => {
      this.animation.playSegments([250, 450], true);
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
    const animationContainer = document.getElementById('intro2-animation');
    const videoBackdrop = document.getElementById('intro2-video-backdrop');
    
    console.log('[Intro2Scene] Fading out animation and playing video');
    
    // Fade out animation
    animationContainer.style.transition = 'opacity 0.5s';
    animationContainer.style.opacity = '0';
    
    setTimeout(() => {
      animationContainer.style.display = 'none';
      videoBackdrop.classList.add('visible');
      
      console.log('[Intro2Scene] Starting video playback');
      
      this.video.play().catch(err => console.error('[Intro2Scene] Video playback error:', err));
      
      this.video.addEventListener('ended', () => {
        console.log('[Intro2Scene] Video ended');
        this.video.style.opacity = '0';
        videoBackdrop.classList.remove('visible');
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

  returnToIdle() {
    console.log('[Intro2Scene] Returning to idle, stopping background music');
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
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
