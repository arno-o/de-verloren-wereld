export default class VoiceoverManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = 1.0;
        this.onComplete = null;
    }

    static VOICELINES = {
        MEMORY_INTRO: 'assets/audio/voiceovers/_MEMORY_INTRO.m4a',
        MEMORY_SUCCESS: 'assets/audio/voiceovers/_MEMORY_SUCCESS.m4a',
        MEMORY_FAIL: 'assets/audio/voiceovers/_MEMORY_FAIL.m4a',

        TETRIS_INTRO: 'assets/audio/voiceovers/_TETRIS_INTRO.m4a',
        TETRIS_SUCCESS: 'assets/audio/voiceovers/_TETRIS_SUCCESS.m4a',
    };

    init() {
        console.log('[VoiceoverManager] Initialized');
    }

    play(voicelineKey, options = {}) {
        const {
            volume = this.volume,
            stopCurrent = true,
            onComplete = null
        } = options;

        const path = VoiceoverManager.VOICELINES[voicelineKey];
        if (!path) {
            console.error(`[VoiceoverManager] Voiceline "${voicelineKey}" not found`);
            return Promise.reject(new Error(`Voiceline "${voicelineKey}" not found`));
        }

        if (stopCurrent && this.currentAudio) {
            this.stop();
        }

        return new Promise((resolve, reject) => {
            let audio = new Audio(path);

            audio.volume = volume;
            this.currentAudio = audio;
            this.isPlaying = true;
            this.onComplete = onComplete;

            const handleEnded = () => {
                this.isPlaying = false;
                if (this.onComplete) {
                    this.onComplete();
                    this.onComplete = null;
                }
                cleanup();
                resolve();
            };

            const handleError = (error) => {
                console.error(`[VoiceoverManager] Error playing ${voicelineKey}:`, error);
                this.isPlaying = false;
                cleanup();
                reject(error);
            };

            const cleanup = () => {
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
            };

            audio.addEventListener('ended', handleEnded, { once: true });
            audio.addEventListener('error', handleError, { once: true });

            audio.play()
                .then(() => {
                    console.log(`[VoiceoverManager] Playing: ${voicelineKey}`);
                })
                .catch(handleError);
        });
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.isPlaying = false;

            if (this.onComplete) {
                this.onComplete = null;
            }

            console.log('[VoiceoverManager] Stopped current audio');
        }
    }

    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPlaying = false;
            console.log('[VoiceoverManager] Paused audio');
        }
    }

    resume() {
        if (this.currentAudio && !this.isPlaying) {
            this.currentAudio.play()
                .then(() => {
                    this.isPlaying = true;
                    console.log('[VoiceoverManager] Resumed audio');
                })
                .catch(error => {
                    console.error('[VoiceoverManager] Error resuming audio:', error);
                });
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }

    getState() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.currentAudio?.currentTime || 0,
            duration: this.currentAudio?.duration || 0,
            volume: this.volume
        };
    }

    destroy() {
        this.stop();
    }
}
