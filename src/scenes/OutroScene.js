import { AvatarColors } from '../utils/constants.js';
import { gameEvents, Events } from '../utils/events.js';

export default class OutroScene {
  constructor(container, playerManager) {
    this.container = container;
    this.playerManager = playerManager;
    this.isActive = false;
    this.results = null;
    this.outroTimer = null;
  }

  init() {
    console.log('[OutroScene] Initializing...');
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="outro-content">
        <h2>Geweldig gedaan!</h2>
        <div class="final-scores">
          <!-- Final scores will be displayed here -->
        </div>
        <div class="outro-story">
          <p class="outro-message">
            <!-- Dynamic outro message based on performance -->
          </p>
        </div>
        <div class="outro-visuals">
          <!-- Add outro visuals/animations here -->
        </div>
      </div>
    `;
  }

  start(options = {}) {
    console.log('[OutroScene] Starting outro scene...');
    this.isActive = true;
    this.results = options.results || { totalScore: 0, players: [] };
    this.container.classList.remove('hidden');
    
    // Display results
    this.displayResults();
    
    // Play outro
    this.playOutro();
  }

  displayResults() {
    const scoresContainer = this.container.querySelector('.final-scores');
    const messageContainer = this.container.querySelector('.outro-message');
    
    // Sort players by score
    const sortedPlayers = [...this.results.players].sort((a, b) => b.score - a.score);
    
    // Display scores
    scoresContainer.innerHTML = `
      <h3>Eindscores</h3>
      ${sortedPlayers.map((player, index) => `
        <div class="final-score-item" style="border-left: 4px solid ${AvatarColors[player.id - 1]}">
          <span class="rank">#${index + 1}</span>
          <span class="player-name">Speler ${player.id}</span>
          <span class="score">${player.score} punten</span>
        </div>
      `).join('')}
      <div class="total-score">
        <strong>Totaal:</strong> ${this.results.totalScore} punten
      </div>
    `;
    
    // Dynamic message based on performance
    const avgScore = this.results.totalScore / sortedPlayers.length;
    let message = '';
    
    if (avgScore >= 150) {
      message = 'Fantastisch! Jullie zijn echte helden van De Verloren Wereld!';
    } else if (avgScore >= 100) {
      message = 'Geweldig gedaan! Jullie hebben het avontuur succesvol voltooid!';
    } else if (avgScore >= 50) {
      message = 'Goed gespeeld! Jullie hebben jullie best gedaan!';
    } else {
      message = 'Wat een avontuur! Bedankt voor het spelen!';
    }
    
    messageContainer.textContent = message;
  }

  playOutro() {
    // Auto-complete after timer
    // In production, this would match your outro audio/video duration
    this.outroTimer = setTimeout(() => {
      this.onOutroComplete();
    }, 8000); // Give time to see scores, outro plays 20s in GameStateManager
    
    // TODO: Add your audio/video playback here
    // const audio = new Audio('path/to/outro.mp3');
    // audio.play();
  }

  onOutroComplete() {
    console.log('[OutroScene] Outro completed');
    if (this.isActive) {
      gameEvents.emit(Events.SCENE_COMPLETE, { scene: 'outro' });
    }
  }

  cleanup() {
    console.log('[OutroScene] Cleaning up...');
    this.isActive = false;
    this.results = null;
    
    if (this.outroTimer) {
      clearTimeout(this.outroTimer);
      this.outroTimer = null;
    }
    
    this.container.classList.add('hidden');
  }
}
