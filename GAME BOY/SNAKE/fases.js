const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const levelEl = document.getElementById('level-info');
const gameOverScreen = document.getElementById('game-over-screen');
const levelScreen = document.getElementById('level-complete-screen');
const pauseScreen = document.getElementById('pause-screen');
const energyBar = document.getElementById('energy-bar');
const gameContainer = document.getElementById('game-container');

// HUD extra (iguais ao infinito)
const timerBar = document.getElementById('timer-bar');
const comboBar = document.getElementById('combo-bar');
const comboDisplay = document.getElementById('combo-display');

// --- SOM (Mesmo sistema do infinito) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'eat') {
        // frequência escala com combo, igual infinito
        osc.type = 'square';
        osc.frequency.setValueAtTime(600 + (combo * 50), now); 
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); 
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'bonus') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
        gain.gain.setValueAtTime(0.1, now); 
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now); 
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

function shakeScreen() {
    gameContainer.classList.remove('shake');
    void gameContainer.offsetWidth; 
    gameContainer.classList.add('shake');
}

// --- VARIAVEIS VIA CONFIG ---
const GRID_SIZE = GameConfig.gridSize; 
let TILE_SIZE = GameConfig.tileSize;
let WIDTH, HEIGHT;

let isGameOver = false;
let isLevelComplete = false;
let isPaused = false;
let lastFrameTime = 0;
let lastMoveTime = 0;
let currentLevel = 1;
let score = 0;

let baseSpeed = 100; 
let currentSpeed = 100;
const BASE_SPEED = 80; // escolha o valor que você curtir (100 = mais lento, 30 = bem rápido)
const DASH_SPEED = GameConfig.speed.dash; 

let dashEnergy = 100;
let isDashActive = false;

let fruitTimer = 0;
let fruitMaxTime = GameConfig.gameplay.fruitLifeTime;

let snake = [];
let dx = 0, dy = 0; 
let nextDx = 0, nextDy = 0;
let growing = 0;
let snakeHue = 120; // Fases começa verde, diferente do infinito

let activeFruits = [], particles = [], walls = [];

// COMBO (mesmo sistema do infinito)
let combo = 1;
let comboTimer = 0;

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
    constructor(x, y, color) { 
        this.x = x; 
        this.y = y; 
        this.color = color; 
        this.vx = (Math.random() - 0.5) * 10; 
        this.vy = (Math.random() - 0.5) * 10; 
        this.life = 1.0; 
    }
    update() { 
        this.x += this.vx; 
        this.y += this.vy; 
        this.life -= 0.05; 
    }
    draw(ctx) { 
        ctx.globalAlpha = Math.max(0, this.life); 
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.globalAlpha = 1.0; 
    }
}
function spawnParticles(x, y, color) {
    const px = x * TILE_SIZE + TILE_SIZE/2; 
    const py = y * TILE_SIZE + TILE_SIZE/2;
    for(let i=0; i<8; i++) particles.push(new Particle(px, py, color));
}

function getEmptyPosition() {
    let x, y, invalid;
    do {
        invalid = false;
        x = Math.floor(Math.random() * GRID_SIZE); 
        y = Math.floor(Math.random() * GRID_SIZE);
        if (snake.some(s => s.x === x && s.y === y)) invalid = true;
        if (walls.some(w => w.x === x && w.y === y)) invalid = true;
        if (activeFruits.some(f => f.x === x && f.y === y)) invalid = true;
    } while (invalid);
    return { x, y };
}

function spawnFruits() {
    activeFruits = []; 
    // igual infinito: vida da fruta + variação leve
    fruitMaxTime = GameConfig.gameplay.fruitLifeTime + Math.random() * 2; 
    fruitTimer = 0; 
    
    // Fases usa frutas do config, sempre 2
    for (let i = 0; i < 2; i++) {
        let type; 
        const chance = Math.random(); 
        if (chance < 0.16) { 
            type = (Math.random() < 0.5) ? GameConfig.fruits.bad1 : GameConfig.fruits.bad2; 
        } else { 
            type = (Math.random() < 0.7) ? GameConfig.fruits.normal : GameConfig.fruits.bonus; 
        }
        
        const pos = getEmptyPosition();
        activeFruits.push({ 
            ...type, 
            x: pos.x, 
            y: pos.y, 
            scale: 0, 
            scaleDir: 0.1 
        });
    }
}

function createWalls(level) {
    walls = [];
    if (level === 1) return;

    const center = Math.floor(GRID_SIZE / 2);

    // 1) PAREDES NORMAIS ATÉ DENSIDADE 58
    const density = Math.min((level - 1) * 2, 6); // limite 58

    for (let i = 0; i < density; i++) {
        let wx = 2 + Math.floor(Math.random() * (GRID_SIZE / 2 - 2)) * 2;
        let wy = 2 + Math.floor(Math.random() * (GRID_SIZE / 2 - 2)) * 2;

        // paredes "espelhadas"
        walls.push({ x: wx, y: wy, kind: 'static', visible: true });
        walls.push({ x: GRID_SIZE - 1 - wx, y: wy, kind: 'static', visible: true });
        walls.push({ x: wx, y: GRID_SIZE - 1 - wy, kind: 'static', visible: true });
        walls.push({ x: GRID_SIZE - 1 - wx, y: GRID_SIZE - 1 - wy, kind: 'static', visible: true });
    }

    // não bloquear o centro
    walls = walls.filter(w => Math.abs(w.x - center) > 2 || Math.abs(w.y - center) > 2);

    // 2) LÓGICA "A CADA 30 LEVELS"
    // level 1–30: phase 0
    // level 31–60: phase 1 (paredes piscando)
    // level 61–90: phase 2 (pisca + mexe)
    const phase = Math.floor((level - 1) / 30);

    function getEmptyForWall() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (
            (Math.abs(pos.x - center) <= 2 && Math.abs(pos.y - center) <= 2) ||
            walls.some(w => w.x === pos.x && w.y === pos.y) ||
            snake.some(s => s.x === pos.x && s.y === pos.y)
        );
        return pos;
    }

    // FASE 1: PAREDES QUE APARECEM / DESAPARECEM (blink)
    if (phase >= 1) {
        const blinkCount = 4 + phase * 2;
        for (let i = 0; i < blinkCount; i++) {
            const p = getEmptyForWall();
            walls.push({
                x: p.x,
                y: p.y,
                kind: 'blink',
                visible: Math.random() < 0.5,
                timer: 0,
                interval: 0.5 + Math.random() * 0.8
            });
        }
    }

    // FASE 2+: PAREDES MÓVEIS
    if (phase >= 2) {
        const moveCount = 3 + phase * 2;
        for (let i = 0; i < moveCount; i++) {
            const p = getEmptyForWall();
            const horizontal = Math.random() < 0.5;
            walls.push({
                x: p.x,
                y: p.y,
                kind: 'moving',
                visible: true,
                dx: horizontal ? 1 : 0,
                dy: horizontal ? 0 : 1,
                dir: Math.random() < 0.5 ? 1 : -1,
                stepTimer: 0,
                stepInterval: 0.25 + Math.random() * 0.25
            });
        }
    }
}

function initGame() {
    resize();
    
    // --- VERIFICAÇÃO DE CHEAT DE NÍVEL ---
    const savedStartLevel = localStorage.getItem('snakeStartLevel');
    
    if (savedStartLevel) {
        // Se tiver cheat salvo, começa no nível 11
        currentLevel = parseInt(savedStartLevel);
        // Remove o cheat para não ficar pulando para sempre (consome o item)
        localStorage.removeItem('snakeStartLevel'); 
    } else {
        // Se não tiver cheat, começa no 1
        currentLevel = 1;
    }
    // -------------------------------------

    startLevel();
}
function nextLevel() { 
    currentLevel++; 
    startLevel(); 
}

function startLevel() {
    const center = Math.floor(GRID_SIZE / 2);
    snake = [
        {x: center, y: center}, 
        {x: center, y: center+1}, 
        {x: center, y: center+2}
    ];
    dx = 0; dy = -1; 
    nextDx = 0; nextDy = -1;
    score = 0; 
    growing = 0; 
    snakeHue = 120;
    
    // Velocidade fixa em todas as fases
    baseSpeed = BASE_SPEED;
    currentSpeed = BASE_SPEED;

    
    dashEnergy = 100; 
    isDashActive = false; 
    isPaused = false; 
    pauseScreen.style.display = 'none';

    // reset combo + HUD
    combo = 1;
    comboTimer = 0;
    if (comboBar) comboBar.style.width = '0%';
    if (comboDisplay) comboDisplay.style.opacity = 0;

    createWalls(currentLevel); 
    spawnFruits();
    scoreEl.innerText = score; 
    levelEl.innerText = `${currentLevel} (Meta: ${targetScore()})`;
    isGameOver = false; 
    isLevelComplete = false;
    gameOverScreen.style.display = 'none'; 
    levelScreen.style.display = 'none';
    const now = performance.now();
    lastFrameTime = now;
    lastMoveTime = now;
    requestAnimationFrame(gameLoop);

}

function targetScore() { 
    // continua infinito de fases, mas você pode limitar se quiser
    return 5 + (currentLevel * 3); 
}

function update(dt) {
    // Partículas
    particles.forEach((p, index) => { 
        p.update(); 
        if (p.life <= 0) particles.splice(index, 1); 
    });

    // --- FRUTA + TIMER (igual infinito) ---
    fruitTimer += dt;
    const fPct = 100 - ((fruitTimer / fruitMaxTime) * 100);
    if (timerBar) timerBar.style.width = `${Math.max(0, fPct)}%`;
    if (fruitTimer >= fruitMaxTime) { 
        spawnFruits(); 
        // se deixar a fruta sumir, combo cai
        combo = 1; 
        if (comboDisplay) comboDisplay.style.opacity = 0;
    }

    // --- COMBO VISUAL (igual infinito) ---
    if (combo > 1) {
        comboTimer -= dt;
        const cPct = (comboTimer / GameConfig.gameplay.comboTime) * 100;
        if (comboBar) comboBar.style.width = `${Math.max(0, cPct)}%`;
        if (comboTimer <= 0) {
            combo = 1;
            if (comboDisplay) comboDisplay.style.opacity = 0;
        }
    } else {
        if (comboBar) comboBar.style.width = '0%';
    }

    // --- Energia Turbo e Cheats ---
    const activeCheat = localStorage.getItem('cheatActive');

    if (activeCheat === 'TURBO_PERM') {
        // Turbo infinito
        currentSpeed = DASH_SPEED; 
        dashEnergy = 100;
    } else {
        // Lógica Normal
        if (isDashActive && dashEnergy > 0) { 
            currentSpeed = DASH_SPEED; 
            dashEnergy -= 1.0; 
        } else { 
            currentSpeed = baseSpeed; // velocidade da fase
            if (dashEnergy < 100) dashEnergy += 0.5; 
        }
    }
    energyBar.style.width = `${Math.max(0, dashEnergy)}%`;

    // Frutas pulsando
    activeFruits.forEach(f => {
        f.scale += f.scaleDir;
        if (f.scale > 0.2) f.scaleDir = -0.02; 
        if (f.scale < -0.1) f.scaleDir = 0.02;
    });

    // --- PAREDES INTELIGENTES ---
    walls.forEach(w => {
        // Paredes piscando
        if (w.kind === 'blink') {
            w.timer += dt;
            if (w.timer >= w.interval) {
                w.visible = !w.visible;
                w.timer = 0;
            }
        }
        // Paredes móveis
        else if (w.kind === 'moving') {
            w.stepTimer += dt;
            if (w.stepTimer >= w.stepInterval) {
                w.stepTimer = 0;

                const dir = w.dir || 1;
                const nx = (w.x + (w.dx || 0) * dir + GRID_SIZE) % GRID_SIZE;
                const ny = (w.y + (w.dy || 0) * dir + GRID_SIZE) % GRID_SIZE;

                if (!snake.some(s => s.x === nx && s.y === ny) &&
                    !activeFruits.some(f => f.x === nx && f.y === ny)) {
                    w.x = nx;
                    w.y = ny;
                } else {
                    w.dir = -dir;
                }
            }
        }
    });
}

function move() {
    if (nextDx !== -dx || snake.length === 1) dx = nextDx; 
    if (nextDy !== -dy || snake.length === 1) dy = nextDy;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0) head.x = GRID_SIZE - 1; 
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1; 
    if (head.y >= GRID_SIZE) head.y = 0;

    if (snake.some(s => s.x === head.x && s.y === head.y)) return die();
    if (walls.some(w => w.x === head.x && w.y === head.y && w.visible !== false)) return die();

    snake.unshift(head);

    const fruitIndex = activeFruits.findIndex(f => f.x === head.x && f.y === head.y);
    if (fruitIndex !== -1) {
        const fruit = activeFruits[fruitIndex];
        
        // Pontos com combo (igual infinito)
        let points = fruit.points;
        if (points > 0) points = points * combo; 
        score += points; 
        if (score < 0) score = 0;

        growing += fruit.grow; 
        spawnParticles(head.x, head.y, fruit.color);
        
        if (fruit.type === 'bonus') {
            playSound('bonus');
        } else if (fruit.type === 'normal') {
            playSound('eat');
        } else {
            // fruta ruim derruba combo
            playSound('die'); 
            shakeScreen();
            combo = 1;
            if (comboDisplay) comboDisplay.style.opacity = 0;
        }

        // Só frutas com pontos positivos sobem o combo
        if (fruit.points > 0) {
            combo++;
            comboTimer = GameConfig.gameplay.comboTime;
            if (comboDisplay) {
                comboDisplay.innerText = `x${combo}`;
                comboDisplay.style.opacity = 1;
            }
        }

        snakeHue = (snakeHue + 15) % 360; 
        spawnFruits();
    }

    if (growing > 0) growing--; 
    else if (growing < 0) { 
        snake.pop(); 
        snake.pop(); 
        growing++; 
    } else {
        snake.pop();
    }
    
    if (snake.length === 0) return die();
    scoreEl.innerText = score;

    if (score >= targetScore()) { 
        isLevelComplete = true; 
        levelScreen.style.display = 'flex'; 
    }
}

function die() { 
    playSound('die'); 
    shakeScreen();
    isGameOver = true; 
    
    // Salva as moedas
    let totalCoins = parseInt(localStorage.getItem('snakeCoins') || '0');
    totalCoins += score; 
    localStorage.setItem('snakeCoins', totalCoins);

    finalScoreEl.innerText = score; 
    gameOverScreen.style.display = 'flex'; 
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Paredes (usa cor do config, respeita visibilidade)
    ctx.shadowBlur = 10; 
    ctx.shadowColor = '#ff0000ff'; 
    ctx.fillStyle = GameConfig.colors.walls;
    walls.forEach(w => {
        if (w.visible === false) return;
        const px = w.x * TILE_SIZE, py = w.y * TILE_SIZE;
        ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    });

    // Frutas
    activeFruits.forEach(f => {
        const px = f.x * TILE_SIZE + TILE_SIZE/2, 
              py = f.y * TILE_SIZE + TILE_SIZE/2;
        const size = (TILE_SIZE/2) * (1 + f.scale); 
        ctx.shadowBlur = 20; 
        ctx.shadowColor = f.glow; 
        ctx.fillStyle = f.color;
        ctx.beginPath(); 
        ctx.arc(px, py, size, 0, Math.PI * 2); 
        ctx.fill();
        ctx.fillStyle = '#000'; 
        ctx.font = `${Math.floor(size)}px Arial`; 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        if(f.type === 'bad') ctx.fillText('!', px, py);
    });

    // Snake
    snake.forEach((s, i) => {
        const px = s.x * TILE_SIZE;
        const py = s.y * TILE_SIZE;
        
        // CABEÇA ARCO-ÍRIS OPCIONAL
        let headColor = GameConfig.colors.snakeHead;
        if (headColor === 'rainbow') {
            headColor = `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`;
        }

        ctx.shadowBlur = (i === 0) ? 20 : 10;
        ctx.shadowColor = GameConfig.colors.shadow(snakeHue);
        
        ctx.fillStyle = (i === 0) ? headColor : GameConfig.colors.snakeBody(snakeHue);
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        
        if(i === 0){ 
            ctx.fillStyle='#000'; 
            ctx.shadowBlur=0; 
            ctx.beginPath(); 
            ctx.arc(px+TILE_SIZE/2, py+TILE_SIZE/2, 2, 0, Math.PI*2); 
            ctx.fill(); 
        }
    });

    ctx.shadowBlur = 10; 
    particles.forEach(p => p.draw(ctx)); 
    ctx.shadowBlur = 0;
}

function gameLoop(time) {
    if (isGameOver || isLevelComplete) return;
    requestAnimationFrame(gameLoop);
    if (isPaused) return;

    // Primeiro frame: inicializa
    if (!lastFrameTime) {
        lastFrameTime = time;
        lastMoveTime = time;
    }

    // dt REAL entre frames (em segundos)
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    // Atualiza timers (fruta, combo, paredes) em tempo real
    update(dt);

    // Movimento da cobra controlado só por currentSpeed
    if (time - lastMoveTime > currentSpeed) {
        lastMoveTime = time;
        move();
    }

    // Desenho sempre
    draw();
}


// --- PAUSE ---
function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
    }
}

// --- INPUT ---
function handleInput(key) {
    // Pause
    if (key === 'p' || key === 'P') {
        togglePause();
        return;
    }
    
    if (isPaused) return;

    // Comandos globais
    if (isGameOver && key === 'Space') {
        initGame();
        return;
    }

    // Próxima fase quando completar
    if (isLevelComplete && key === 'Space') {
        nextLevel();
        return;
    }
    
    if (!isGameOver && !isLevelComplete) {
        if ((key === 'ArrowUp' || key === 'w' || key === 'Up') && dy === 0) { 
            nextDx = 0; nextDy = -1; 
        }
        if ((key === 'ArrowDown' || key === 's' || key === 'Down') && dy === 0) { 
            nextDx = 0; nextDy = 1; 
        }
        if ((key === 'ArrowLeft' || key === 'a' || key === 'Left') && dx === 0) { 
            nextDx = -1; nextDy = 0; 
        }
        if ((key === 'ArrowRight' || key === 'd' || key === 'Right') && dx === 0) { 
            nextDx = 1; nextDy = 0; 
        }
    }
}

function startDash() { isDashActive = true; }
function endDash() { isDashActive = false; }

document.addEventListener('keydown', e => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].indexOf(e.key) > -1) 
        e.preventDefault();
    if (e.code === 'Space' && !isPaused) handleInput('Space');
    if (e.key === 'Shift') isDashActive = true;
    handleInput(e.key);
});
document.addEventListener('keyup', e => { 
    if (e.key === 'Shift') isDashActive = false; 
});

initGame();
