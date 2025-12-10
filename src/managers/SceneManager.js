import { SceneIds } from '../utils/constants.js';
import IdleScene from '../scenes/IdleScene.js';
import PlayerSelectScene from '../scenes/PlayerSelectScene.js';
import IntroScene from '../scenes/IntroScene.js';
import Game1Scene from '../scenes/Game1Scene.js';
import PlayerCheckScene from '../scenes/PlayerCheckScene.js';
import Game2Scene from '../scenes/Game2Scene.js';
import OutroScene from '../scenes/OutroScene.js';

export default class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.isTransitioning = false;
    this.playerManager = null;
  }

  init(playerManager) {
    console.log('[SceneManager] Initializing scenes...');
    this.playerManager = playerManager;
    
    const idleContainer = document.getElementById(SceneIds.IDLE);
    const playerSelectContainer = document.getElementById(SceneIds.PLAYER_SELECT);
    const introContainer = document.getElementById(SceneIds.INTRO);
    const game1Container = document.getElementById(SceneIds.GAME_1);
    const playerCheckContainer = document.getElementById(SceneIds.PLAYER_CHECK);
    const game2Container = document.getElementById(SceneIds.GAME_2);
    const outroContainer = document.getElementById(SceneIds.OUTRO);

    this.scenes.set('idle', new IdleScene(idleContainer));
    this.scenes.set('player-select', new PlayerSelectScene(playerSelectContainer, playerManager));
    this.scenes.set('intro', new IntroScene(introContainer, playerManager));
    this.scenes.set('game1', new Game1Scene(game1Container, playerManager));
    this.scenes.set('player-check', new PlayerCheckScene(playerCheckContainer, playerManager));
    this.scenes.set('game2', new Game2Scene(game2Container, playerManager));
    this.scenes.set('outro', new OutroScene(outroContainer, playerManager));

    this.scenes.forEach(scene => scene.init());
  }

  async switchScene(sceneName, options = {}, transitionDuration = 300) {
    if (this.isTransitioning) {
      console.warn('[SceneManager] Already transitioning, ignoring request');
      return;
    }

    const nextScene = this.scenes.get(sceneName);
    if (!nextScene) {
      console.error(`[SceneManager] Scene "${sceneName}" not found`);
      return;
    }

    console.log(`[SceneManager] Switching to scene: ${sceneName}`);
    this.isTransitioning = true;

    if (this.currentScene) {
      await this.fadeOut(this.currentScene.container, transitionDuration);
      this.currentScene.cleanup();
    }

    this.currentScene = nextScene;
    this.currentScene.start(options);
    await this.fadeIn(this.currentScene.container, transitionDuration);

    this.isTransitioning = false;
  }

  fadeOut(element, duration) {
    return new Promise(resolve => {
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ease-out`;
      
      requestAnimationFrame(() => {
        element.style.opacity = '0';
      });

      setTimeout(resolve, duration);
    });
  }

  fadeIn(element, duration) {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-in`;
      
      requestAnimationFrame(() => {
        element.style.opacity = '1';
      });

      setTimeout(resolve, duration);
    });
  }

  getScene(sceneName) {
    return this.scenes.get(sceneName);
  }

  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Hide the current scene immediately without switching to another scene.
   * Useful for showing background animations between scenes.
   * Does not set isTransitioning flag so switchScene can be called after.
   */
  hideCurrentScene(transitionDuration = 300) {
    if (this.currentScene) {
      this.currentScene.cleanup();
      this.currentScene = null;
    }
  }
}
