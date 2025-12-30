const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const chaosBar = document.getElementById('chaos-timer-bar');
const chaosText = document.getElementById('chaos-event');
const energyBar = document.getElementById('energy-bar');
const gameContainer = document.getElementById('game-container');

// ---------------- SOM ----------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'eat') {
        if (currentEvent === 'trap') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'chaos') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.8);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
    }
}

function shakeScreen() {
    gameContainer.classList.remove('shake');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('shake');
}

// ---------------- CONFIG ----------------
const GRID_SIZE = GameConfig.gridSize;
let TILE_SIZE = GameConfig.tileSize;
let WIDTH, HEIGHT;

let isGameOver = false;
let isPaused = false;

let score = 0;

let currentSpeed = GameConfig.speed.normal;
let dashEnergy = 100;
let isDashActive = false;

// tempos separados
let lastUpdateTime = performance.now(); // para update(dt)
let lastMoveTime = performance.now();   // para movimento

// SNAKE
let snake = [];
let dx = 0, dy = 0;
let nextDx = 0, nextDy = 0;
let growing = 0;
let activeFruits = [];

// ---------------- SISTEMA DE CAOS ----------------
let chaosTimer = 0;
const CHAOS_INTERVAL = 20; // segundos por evento
let currentEvent = null;
let chaosTextTimer = 0;

const CHAOS_EVENTS = ['inverted', 'turbo', 'dark', 'walls', 'trap', 'slow', 'ghosts', 'giant'];

let chaosGhosts = [];
let ghostMoveTimer = 0;
const GHOST_SPEED = 0.70; // segundos por movimento

let chaosFruitEaten = false;
let lastPenaltyTextTime = 0;

// ---------------- UTILS ----------------
function resize() {
    WIDTH = Math.min(window.innerWidth, 800);
    if (window.innerWidth < 800) WIDTH = window.innerWidth - 20;

    HEIGHT = window.innerHeight * 0.6;
    if (window.innerWidth > 800) HEIGHT = window.innerHeight * 0.8;

    TILE_SIZE = Math.floor(Math.min(WIDTH, HEIGHT) / GRID_SIZE);

    canvas.width = TILE_SIZE * GRID_SIZE;
    canvas.height = TILE_SIZE * GRID_SIZE;

    draw();
}
window.addEventListener('resize', resize);

function getEmptyPosition() {
    let x, y, invalid;
    do {
        invalid = false;
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);

        if (snake.some(s => s.x === x && s.y === y)) invalid = true;
        if (activeFruits.some(f => f.x === x && f.y === y)) invalid = true;
    } while (invalid);
    return { x, y };
}

function spawnFruit() {
    activeFruits = [];
    const pos = getEmptyPosition();
    activeFruits.push({
        color: '#fff',
        glow: '#ff0000',
        points: 1,
        grow: 1,
        x: pos.x,
        y: pos.y
    });
}

function spawnChaosGhosts() {
    chaosGhosts = [];
    for (let i = 0; i < 5; i++) {
        let gx, gy;
        if (Math.random() < 0.5) {
            gx = Math.random() < 0.5 ? 0 : GRID_SIZE - 1;
            gy = Math.floor(Math.random() * GRID_SIZE);
        } else {
            gx = Math.floor(Math.random() * GRID_SIZE);
            gy = Math.random() < 0.5 ? 0 : GRID_SIZE - 1;
        }
        chaosGhosts.push({ x: gx, y: gy });
    }
}

// ---------------- EVENTO DE CAOS ----------------
function triggerChaosEvent() {
    playSound('chaos');

    chaosGhosts = [];
    gameContainer.classList.remove('danger-border');

    let next = currentEvent;
    while (next === currentEvent) {
        next = CHAOS_EVENTS[Math.floor(Math.random() * CHAOS_EVENTS.length)];
    }
    currentEvent = next;

    chaosFruitEaten = false;

    let text = "";
    if (currentEvent === 'inverted') text = "CONTROLES INVERTIDOS!";
    if (currentEvent === 'turbo')    text = "VELOCIDADE MÁXIMA!";
    if (currentEvent === 'dark')     text = "APAGÃO TOTAL!";
    if (currentEvent === 'walls')    text = "PAREDES INVISÍVEIS!";
    if (currentEvent === 'trap')     text = "PONTOS TÓXICOS (-2)";
    if (currentEvent === 'slow')     text = "CÂMERA LENTA";
    if (currentEvent === 'ghosts') {
        text = "5 FANTASMAS (FUJA!)";
        spawnChaosGhosts();
    }
    if (currentEvent === 'giant')    text = "COBRA GIGANTE!";

    chaosText.innerText = text;
    chaosTextTimer = 4;
    chaosText.style.opacity = 1;

    if (currentEvent === 'walls') {
        gameContainer.classList.add('danger-border');
    }
}

// ---------------- INIT ----------------
function initGame() {
    resize();
    const center = Math.floor(GRID_SIZE / 2);

    snake = [
        { x: center, y: center },
        { x: center, y: center + 1 },
        { x: center, y: center + 2 }
    ];

    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;

    score = 0;
    growing = 0;

    dashEnergy = 100;
    isDashActive = false;
    currentSpeed = GameConfig.speed.normal;

    isPaused = false;
    pauseScreen.style.display = 'none';

    chaosTimer = 0;
    currentEvent = null;
    chaosGhosts = [];
    ghostMoveTimer = 0;
    chaosFruitEaten = false;
    chaosTextTimer = 0;
    chaosText.style.opacity = 0;
    gameContainer.classList.remove('danger-border');

    activeFruits = [];
    spawnFruit();

    scoreEl.innerText = score;
    isGameOver = false;
    gameOverScreen.style.display = 'none';

    lastUpdateTime = performance.now();
    lastMoveTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ---------------- UPDATE ----------------
function update(dt) {
    // timer do caos
    chaosTimer += dt;
    if (chaosTimer >= CHAOS_INTERVAL) {
        // penalidade: passou o evento sem comer fruta
        if (!chaosFruitEaten) {
            const penalty = 3;
            score = Math.max(0, score - penalty);
            scoreEl.innerText = score;

            chaosText.innerText = `SEM FRUTA: -${penalty}`;
            chaosText.style.opacity = 1;
            chaosTextTimer = 2; // mostra rapidinho a penalidade

            gameContainer.style.borderColor = "#ff00ff";
            setTimeout(() => {
                gameContainer.style.borderColor = "#ff3939";
            }, 150);
        }

        chaosTimer = 0;
        triggerChaosEvent();
    }

    // barra de caos
    let remainingPct = 100 - (chaosTimer / CHAOS_INTERVAL) * 100;
    remainingPct = Math.max(0, Math.min(100, remainingPct));
    chaosBar.style.width = `${remainingPct}%`;

    // texto do evento
    if (chaosTextTimer > 0) {
        chaosTextTimer -= dt;
        if (chaosTextTimer <= 0) {
            chaosTextTimer = 0;
            chaosText.style.opacity = 0;
        }
    }

    // fantasmas
    if (currentEvent === 'ghosts') {
        ghostMoveTimer += dt;
        if (ghostMoveTimer >= GHOST_SPEED) {
            ghostMoveTimer = 0;
            chaosGhosts.forEach(g => {
                const head = snake[0];
                if (g.x < head.x) g.x++;
                else if (g.x > head.x) g.x--;
                if (g.y < head.y) g.y++;
                else if (g.y > head.y) g.y--;
                if (g.x === head.x && g.y === head.y) die();
            });
        }
    }

    // velocidade
    let targetSpeed = GameConfig.speed.normal;

    if (currentEvent === 'turbo') {
        targetSpeed = GameConfig.speed.dash;
        dashEnergy = 100;
    } else if (currentEvent === 'slow') {
        targetSpeed = 400; // bem mais lento
    } else {
        if (isDashActive && dashEnergy > 0) {
            targetSpeed = GameConfig.speed.dash;
            dashEnergy -= 1.0;
        } else {
            if (dashEnergy < 100) dashEnergy += 0.5;
        }
    }

    currentSpeed = targetSpeed;
    energyBar.style.width = `${Math.max(0, dashEnergy)}%`;
}

// ---------------- MOVE ----------------
function move() {
    if (nextDx !== -dx || snake.length === 1) dx = nextDx;
    if (nextDy !== -dy || snake.length === 1) dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (currentEvent === 'walls') {
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return die();
        }
    } else {
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
    }

    if (snake.some(s => s.x === head.x && s.y === head.y)) return die();

    if (currentEvent === 'ghosts' && chaosGhosts.some(g => g.x === head.x && g.y === head.y)) {
        return die();
    }

    snake.unshift(head);

    const fruitIndex = activeFruits.findIndex(f => f.x === head.x && f.y === head.y);
    if (fruitIndex !== -1) {
        const fruit = activeFruits[fruitIndex];

        chaosFruitEaten = true;

    if (currentEvent === 'trap') {

    // 33% de chance de -5, 67% de chance de -2
    if (Math.random() < 0.33) {
        score -= 5;
    } else {
        score += 1;
    }

    gameContainer.style.borderColor = "purple";
    setTimeout(() => gameContainer.style.borderColor = "#ff3939", 200);

} else {

    let pts = fruit.points;

    if (currentEvent === 'points') 
        pts *= 3;

    score += pts;
}

        growing += fruit.grow;
        playSound('eat');
        spawnFruit();
    }

    if (growing > 0) {
        growing--;
    } else if (growing < 0) {
        snake.pop();
        snake.pop();
        growing++;
    } else {
        snake.pop();
    }

    if (snake.length === 0) return die();

    scoreEl.innerText = score;
}

// ---------------- DIE ----------------
function die() {
    if (isGameOver) return;
    playSound('die');
    shakeScreen();
    isGameOver = true;

    let totalCoins = parseInt(localStorage.getItem('snakeCoins') || '0');
    totalCoins += score;
    localStorage.setItem('snakeCoins', totalCoins);

    finalScoreEl.innerText = score;
    gameOverScreen.style.display = 'flex';
}

// ---------------- DRAW ----------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentEvent !== 'dark') {
        ctx.strokeStyle = '#333';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    if (currentEvent === 'ghosts') {
        chaosGhosts.forEach(g => {
            const gx = g.x * TILE_SIZE + TILE_SIZE / 2;
            const gy = g.y * TILE_SIZE + TILE_SIZE / 2;
            ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + Math.random() * 0.5})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ff';
            ctx.beginPath();
            ctx.arc(gx, gy, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    activeFruits.forEach(f => {
        const px = f.x * TILE_SIZE + TILE_SIZE / 2;
        const py = f.y * TILE_SIZE + TILE_SIZE / 2;
        const size = TILE_SIZE / 2;

        ctx.shadowBlur = (currentEvent === 'dark') ? 40 : 20;

        if (currentEvent === 'trap') {
            ctx.fillStyle = '#aa00ff';
            ctx.shadowColor = '#aa00ff';
        } else {
            ctx.fillStyle = f.color;
            ctx.shadowColor = f.glow;
        }

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    });

    snake.forEach((s, i) => {
        let px = s.x * TILE_SIZE;
        let py = s.y * TILE_SIZE;
        let sSize = TILE_SIZE;

        if (currentEvent === 'giant') {
            const inflate = 15;
            px -= inflate / 2;
            py -= inflate / 2;
            sSize += inflate;
        }

        ctx.shadowBlur = (i === 0) ? 20 : 0;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = (i === 0) ? '#fff' : '#ff0000';
        ctx.fillRect(px, py, sSize, sSize);
    });

    if (currentEvent === 'dark') {
        const head = snake[0];
        const hx = head.x * TILE_SIZE + TILE_SIZE / 2;
        const hy = head.y * TILE_SIZE + TILE_SIZE / 2;

        const gradient = ctx.createRadialGradient(hx, hy, 40, hx, hy, 250);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.2, "rgba(0,0,0,0.8)");
        gradient.addColorStop(1, "black");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ---------------- LOOP ----------------
function gameLoop(now) {
    if (isGameOver) return;
    requestAnimationFrame(gameLoop);

    if (isPaused) {
        lastUpdateTime = now;
        lastMoveTime = now;
        return;
    }

    const dt = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;

    update(dt);

    if (now - lastMoveTime > currentSpeed) {
        lastMoveTime = now;
        move();
    }

    draw();
}

// ---------------- CONTROLES ----------------
function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    pauseScreen.style.display = isPaused ? 'flex' : 'none';
}

function handleInput(key) {
    if (key === 'p' || key === 'P') {
        togglePause();
        return;
    }
    if (isPaused) return;

    if (isGameOver && key === 'Space') initGame();

    if (!isGameOver) {
        let up = 'ArrowUp', down = 'ArrowDown', left = 'ArrowLeft', right = 'ArrowRight';
        let w = 'w', s = 's', a = 'a', d = 'd';

        if (currentEvent === 'inverted') {
            up = 'ArrowDown'; down = 'ArrowUp';
            left = 'ArrowRight'; right = 'ArrowLeft';
            w = 's'; s = 'w'; a = 'd'; d = 'a';
        }

        if ((key === up || key === w) && dy === 0) { nextDx = 0; nextDy = -1; }
        if ((key === down || key === s) && dy === 0) { nextDx = 0; nextDy = 1; }
        if ((key === left || key === a) && dx === 0) { nextDx = -1; nextDy = 0; }
        if ((key === right || key === d) && dx === 0) { nextDx = 1; nextDy = 0; }
    }
}

document.addEventListener('keydown', e => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].indexOf(e.key) > -1) {
        e.preventDefault();
    }
    if (e.code === 'Space' && !isPaused) handleInput('Space');
    if (e.key === 'Shift') isDashActive = true;
    handleInput(e.key);
});

document.addEventListener('keyup', e => {
    if (e.key === 'Shift') isDashActive = false;
});

// ---------------- START ----------------
initGame();
