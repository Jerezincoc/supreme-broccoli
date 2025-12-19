const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const timerBar = document.getElementById('timer-bar');
const energyBar = document.getElementById('energy-bar');
const comboBar = document.getElementById('combo-bar');
const comboDisplay = document.getElementById('combo-display');
const gameContainer = document.getElementById('game-container');

// --- SOM ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'eat') {
        osc.type = 'square'; osc.frequency.setValueAtTime(600 + (combo * 50), now); 
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'bonus') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'die') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

function shakeScreen() {
    gameContainer.classList.remove('shake');
    void gameContainer.offsetWidth; 
    gameContainer.classList.add('shake');
}

// --- VARIAVEIS DE ESTADO (Usando GameConfig) ---
const GRID_SIZE = GameConfig.gridSize; 
let TILE_SIZE = GameConfig.tileSize;
let WIDTH, HEIGHT;

let isGameOver = false;
let isPaused = false;
let lastTime = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

let currentSpeed = GameConfig.speed.normal;
let dashEnergy = 100;
let isDashActive = false;

// Frutas
let fruitTimer = 0;
let fruitMaxTime = GameConfig.gameplay.fruitLifeTime;

// Snake
let snake = [];
let dx = 0, dy = 0; 
let nextDx = 0, nextDy = 0;
let growing = 0;
let snakeHue = 300; 
let activeFruits = [], particles = [];

// Combo
let combo = 1;
let comboTimer = 0;

// Ghost
let ghosts = []; 
let ghostTimer = 0;
let ghostDelay = GameConfig.speed.ghostDelayInitial;
let nextGhostScore = GameConfig.gameplay.ghostStartScore;
let nextSpeedChangeScore = GameConfig.gameplay.ghostSpeedUpStart; // QUE ISSO SEJA PROVISORIO COM FE EM DEUS 


highScoreEl.innerText = highScore;

function resize() {
    WIDTH = Math.min(window.innerWidth, 800); 
    if(window.innerWidth < 800) WIDTH = window.innerWidth - 20;
    HEIGHT = window.innerHeight * 0.6; 
    if(window.innerWidth > 800) HEIGHT = window.innerHeight * 0.8;
    TILE_SIZE = Math.floor(Math.min(WIDTH, HEIGHT) / GRID_SIZE);
    canvas.width = TILE_SIZE * GRID_SIZE;
    canvas.height = TILE_SIZE * GRID_SIZE;
    draw();
}
window.addEventListener('resize', resize);

class Particle {
    constructor(x, y, color) { this.x = x; this.y = y; this.color = color; this.vx = (Math.random() - 0.5) * 10; this.vy = (Math.random() - 0.5) * 10; this.life = 1.0; }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
    draw(ctx) { ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
}
function spawnParticles(x, y, color) {
    const px = x * TILE_SIZE + TILE_SIZE/2; const py = y * TILE_SIZE + TILE_SIZE/2;
    for(let i=0; i<8; i++) particles.push(new Particle(px, py, color));
}

function getEmptyPosition() {
    let x, y, invalid;
    do {
        invalid = false;
        x = Math.floor(Math.random() * GRID_SIZE); y = Math.floor(Math.random() * GRID_SIZE);
        if (snake.some(s => s.x === x && s.y === y)) invalid = true;
        if (activeFruits.some(f => f.x === x && f.y === y)) invalid = true;
        if (ghosts.some(g => g.x === x && g.y === y)) invalid = true;
    } while (invalid);
    return { x, y };
}

function spawnFruits() {
    activeFruits = []; 
    // Random levemente variado baseado no config
    fruitMaxTime = GameConfig.gameplay.fruitLifeTime + Math.random() * 2; 
    fruitTimer = 0; 
    
    for (let i = 0; i < 2; i++) {
        let type; const chance = Math.random(); 
        if (chance < 0.16) { type = (Math.random() < 0.5) ? GameConfig.fruits.bad1 : GameConfig.fruits.bad2; } 
        else { type = (Math.random() < 0.7) ? GameConfig.fruits.normal : GameConfig.fruits.bonus; }
        const pos = getEmptyPosition();
        activeFruits.push({ ...type, x: pos.x, y: pos.y, scale: 0, scaleDir: 0.1 });
    }
}

function initGame() {
    resize();
    const center = Math.floor(GRID_SIZE / 2);
    snake = [{x: center, y: center}, {x: center, y: center+1}, {x: center, y: center+2}];
    dx = 0; dy = -1; nextDx = 0; nextDy = -1;
    score = 0; growing = 0; snakeHue = 300;
    
    dashEnergy = 100; isDashActive = false; currentSpeed = GameConfig.speed.normal;
    combo = 1; comboTimer = 0;
    isPaused = false; pauseScreen.style.display = 'none';
    
    ghosts = []; 
    ghostDelay = GameConfig.speed.ghostDelayInitial;
    nextGhostScore = GameConfig.gameplay.ghostStartScore;
    nextSpeedChangeScore = GameConfig.gameplay.ghostSpeedUpStart;

    spawnFruits();
    scoreEl.innerText = score; isGameOver = false;
    gameOverScreen.style.display = 'none';
    lastTime = performance.now(); requestAnimationFrame(gameLoop);
}

function update(dt) {
    particles.forEach((p, index) => { p.update(); if(p.life <= 0) particles.splice(index, 1); });
    
    // Fruta
    fruitTimer += dt;
    const fPct = 100 - ((fruitTimer / fruitMaxTime) * 100);
    timerBar.style.width = `${Math.max(0, fPct)}%`;
    if (fruitTimer >= fruitMaxTime) { spawnFruits(); combo = 1; }

    // Combo
    if (combo > 1) {
        comboTimer -= dt;
        const cPct = (comboTimer / GameConfig.gameplay.comboTime) * 100;
        comboBar.style.width = `${Math.max(0, cPct)}%`;
        if (comboTimer <= 0) { combo = 1; comboDisplay.style.opacity = 0; }
    } else { comboBar.style.width = '0%'; }
// Energia Turbo e Cheats
    const activeCheat = localStorage.getItem('cheatActive');

    if (activeCheat === 'TURBO_PERM') {
        currentSpeed = GameConfig.speed.dash; // Velocidade Máxima travada
        dashEnergy = 100; // Energia infinita
    } else {
        // Lógica Normal
        if (isDashActive && dashEnergy > 0) { 
            currentSpeed = GameConfig.speed.dash; 
            dashEnergy -= 1.0; 
        } else { 
            currentSpeed = GameConfig.speed.normal; 
            if (dashEnergy < 100) dashEnergy += 0.5; 
        }
    }
    energyBar.style.width = `${Math.max(0, dashEnergy)}%`;

    // Ghost
    if (ghosts.length > 0) {
        ghostTimer += dt;
        if (ghostTimer >= ghostDelay) { 
            ghostTimer = 0;
            ghosts.forEach(g => {
                const head = snake[0];
                if (g.x < head.x) g.x++; else if (g.x > head.x) g.x--;
                if (g.y < head.y) g.y++; else if (g.y > head.y) g.y--;
                if (g.x === head.x && g.y === head.y) die();
            });
        }
    }

    activeFruits.forEach(f => {
        f.scale += f.scaleDir;
        if(f.scale > 0.2) f.scaleDir = -0.02; if(f.scale < -0.1) f.scaleDir = 0.02;
    });
}

function move() {
    if (nextDx !== -dx || snake.length === 1) dx = nextDx; if (nextDy !== -dy || snake.length === 1) dy = nextDy;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0) head.x = GRID_SIZE - 1; if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1; if (head.y >= GRID_SIZE) head.y = 0;

    if (snake.some(s => s.x === head.x && s.y === head.y)) return die();
    if (ghosts.some(g => g.x === head.x && g.y === head.y)) return die();

    snake.unshift(head);
    const fruitIndex = activeFruits.findIndex(f => f.x === head.x && f.y === head.y);
    if (fruitIndex !== -1) {
        const fruit = activeFruits[fruitIndex];
        
        let points = fruit.points;
        if (points > 0) points = points * combo; 
        score += points; 
        
        // --- LOGICA SPAWN CONFIGURADA ---
        if (score >= nextSpeedChangeScore) {
            ghostDelay = Math.max(GameConfig.speed.ghostMinDelay, ghostDelay - 0.2);
            nextSpeedChangeScore += 50;
        }

        if (score >= nextGhostScore) {
            if (ghosts.length < GameConfig.gameplay.maxGhosts) {
                let spawnX = (Math.random() < 0.5) ? 0 : GRID_SIZE - 1;
                let spawnY = (Math.random() < 0.5) ? 0 : GRID_SIZE - 1;
                ghosts.push({ x: spawnX, y: spawnY });
            }
            nextGhostScore += GameConfig.gameplay.ghostSpawnRate;
        }

        if(score < 0) score = 0;
        growing += fruit.grow; spawnParticles(head.x, head.y, fruit.color);
        
        if (fruit.type === 'bonus') playSound('bonus');
        else if (fruit.type === 'normal') playSound('eat');
        else { playSound('die'); combo = 1; }

        if (fruit.points > 0) {
            combo++;
            comboTimer = GameConfig.gameplay.comboTime;
            comboDisplay.innerText = `x${combo}`;
            comboDisplay.style.opacity = 1;
        }
        snakeHue = (snakeHue + 15) % 360; 
        spawnFruits();
    }
    if (growing > 0) growing--; else if (growing < 0) { snake.pop(); snake.pop(); growing++; } else snake.pop();
    
    if (snake.length === 0) return die();
    scoreEl.innerText = score;
}

function die() { 
    playSound('die'); shakeScreen();
    isGameOver = true; 
    
    // 1. SALVA AS MOEDAS (Dinheiro)
    let totalCoins = parseInt(localStorage.getItem('snakeCoins') || '0');
    totalCoins += score;
    localStorage.setItem('snakeCoins', totalCoins);

    // 2. SALVA O RECORDE (High Score) - [ESTA PARTE TINHA SUMIDO]
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore; // Atualiza na tela
    }

    finalScoreEl.innerText = score; 
    gameOverScreen.style.display = 'flex'; 
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ghost
    ghosts.forEach(g => {
        const gx = g.x * TILE_SIZE + TILE_SIZE/2;
        const gy = g.y * TILE_SIZE + TILE_SIZE/2;
        ctx.fillStyle = `rgba(255, 0, 0, ${0.6 + Math.random()*0.4})`;
        ctx.shadowBlur = 15; ctx.shadowColor = '#f00';
        ctx.beginPath(); ctx.arc(gx, gy, TILE_SIZE/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(gx - 3, gy - 2, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 3, gy - 2, 2, 0, Math.PI*2); ctx.fill();
    });

    // Frutas
    activeFruits.forEach(f => {
        const px = f.x * TILE_SIZE + TILE_SIZE/2, py = f.y * TILE_SIZE + TILE_SIZE/2;
        const size = (TILE_SIZE/2) * (1 + f.scale); 
        ctx.shadowBlur = 20; ctx.shadowColor = f.glow; ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        if(f.type === 'bad') { ctx.fillStyle = '#000'; ctx.font = `${Math.floor(size)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('-', px, py); }
    });

// Snake
    snake.forEach((s, i) => {
        const px = s.x * TILE_SIZE;
        const py = s.y * TILE_SIZE;
        
        // COR MÁGICA DO ARCO-IRIS
        let headColor = GameConfig.colors.snakeHead;
        if (headColor === 'rainbow') {
            // Calcula cor baseada no tempo (pisca rápido)
            headColor = `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`;
        }

        ctx.shadowBlur = (i === 0) ? 20 : 10;
        ctx.shadowColor = GameConfig.colors.shadow(snakeHue);
        
        // Se for a cabeça (i===0), usa a cor calculada (headColor)
        // Se for corpo, usa a função do config
        ctx.fillStyle = (i === 0) ? headColor : GameConfig.colors.snakeBody(snakeHue);
        
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        if(i===0){ 
            ctx.fillStyle='#000'; ctx.shadowBlur=0; 
            ctx.beginPath(); ctx.arc(px+TILE_SIZE/2, py+TILE_SIZE/2, 2, 0, Math.PI*2); ctx.fill(); 
        }
    });

    ctx.shadowBlur = 10; particles.forEach(p => p.draw(ctx)); ctx.shadowBlur = 0;
}

function gameLoop(time) {
    if (isGameOver) return;
    requestAnimationFrame(gameLoop);
    if (isPaused) return;

    const seconds = (time - lastTime) / 1000;
    update(seconds);
    if (time - lastTime > currentSpeed) { lastTime = time; move(); draw(); } else draw();
}

// --- FUNÇÃO NOVA: SÓ PARA CONTROLAR O PAUSE ---
function togglePause() {
    if (isGameOver) return; // Se morreu, não pausa
    
    isPaused = !isPaused; // Inverte: se tava pausado, despausa. Se não, pausa.
    
    // Mostra ou esconde a tela de pause
    if (isPaused) {
        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
    }
}

// --- FUNÇÃO DE TECLAS ATUALIZADA ---
function handleInput(key) {
    // Se apertar P, chama a função lá de cima
    if (key === 'p' || key === 'P') {
        togglePause();
        return;
    }
    
    // Se o jogo estiver pausado, nenhuma outra tecla funciona
    if (isPaused) return;

    // Comandos do Jogo (Reiniciar, Mover, etc)
    if (isGameOver && key === 'Space') initGame();
    // (Se for no fases.js, tem a linha do nextLevel aqui)
    
    if (!isGameOver) {
        if ((key === 'ArrowUp' || key === 'w' || key === 'Up') && dy === 0) { nextDx = 0; nextDy = -1; }
        if ((key === 'ArrowDown' || key === 's' || key === 'Down') && dy === 0) { nextDx = 0; nextDy = 1; }
        if ((key === 'ArrowLeft' || key === 'a' || key === 'Left') && dx === 0) { nextDx = -1; nextDy = 0; }
        if ((key === 'ArrowRight' || key === 'd' || key === 'Right') && dx === 0) { nextDx = 1; nextDy = 0; }
    }
}
function startDash() { isDashActive = true; }
function endDash() { isDashActive = false; }

document.addEventListener('keydown', e => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].indexOf(e.key) > -1) e.preventDefault();
    if (e.code === 'Space' && !isPaused) handleInput('Space');
    if (e.key === 'Shift') isDashActive = true;
    handleInput(e.key);
});
document.addEventListener('keyup', e => { if (e.key === 'Shift') isDashActive = false; });

initGame();