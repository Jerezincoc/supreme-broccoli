class SoundManager {
    constructor() {
        // Inicializa o contexto de audio (navegadores modernos)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Volume mestre (pra nao estourar o ouvido)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15; // 15% de volume ta bom
        this.masterGain.connect(this.ctx.destination);
        
        this.muted = false;
    }

    // O navegador bloqueia som ate o usuario interagir
    // Vamos chamar isso no botao START
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 0.15;
        return this.muted;
    }

    // Gerador de Bips Genérico
    playTone(freq, type, duration, slideTo = null) {
        if (this.muted) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type; // 'square', 'sawtooth', 'triangle', 'sine'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        // Envelope de volume (Fade out rapido)
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- EFEITOS ESPECIFICOS ---

    move() {
        // Bip curto e seco
        this.playTone(300, 'square', 0.05);
    }

    rotate() {
        // Bip agudo
        this.playTone(400, 'triangle', 0.05, 600);
    }

    drop() {
        // Batida grave
        this.playTone(150, 'sawtooth', 0.1, 50);
    }

    hold() {
        // Som technologico
        this.playTone(600, 'sine', 0.1);
    }

    clear(lines) {
        // Acorde dependendo de quantas linhas
        const base = 440; // La
        if (lines >= 1) this.playTone(base, 'square', 0.1);
        if (lines >= 2) setTimeout(() => this.playTone(base * 1.25, 'square', 0.1), 50);
        if (lines >= 3) setTimeout(() => this.playTone(base * 1.5, 'square', 0.1), 100);
        if (lines >= 4) { // TETRIS!
            setTimeout(() => this.playTone(base * 2, 'square', 0.4), 150);
        }
    }

    gameOver() {
        // Som de derrota triste (descendo frequencia)
        this.playTone(300, 'sawtooth', 1.0, 10);
    }
}