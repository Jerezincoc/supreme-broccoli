// --- INICIALIZAÇÃO ---
const mainView = new View('tetris', COLS, ROWS, 1);
const nextView = new View('next', 6, 6, 0.6); 
const holdView = new View('hold', 6, 6, 0.6); 
const game = new Game();
const audio = new SoundManager(); 

// --- ESTADO GLOBAL ---
const state = {
    isMenu: true,
    isPaused: false,
    lastTime: 0,
    dropCounter: 0,
    dropInterval: 1000,
    lockDelay: 500,
    lockTimer: 0,
    gameTime: 0,       // Tempo decorrido em segundos
    gameTimer: 0,      // Acumulador de ms
    isSprintWon: false, // Flag de vitória do Sprint
    
    // Sistema de Input (Teclado + Touch + Mouse)
    keys: {
        left: { isDown: false, timer: 0 },
        right: { isDown: false, timer: 0 },
        down: { isDown: false, timer: 0 }
    },
    
    // Configurações de Velocidade (DAS/ARR)
    DAS: 130, // Delay antes de correr
    ARR: 40,  // Velocidade da corrida

config: JSON.parse(localStorage.getItem('neonTetrisConfig')) || {
    ghost: false,
    startLevel: 1,
    sound: true 
},


    wallet: parseInt(localStorage.getItem('neonTetrisWallet')) || 0,
    inventory: JSON.parse(localStorage.getItem('neonTetrisInventory')) || {
        themes: ['default'],
        modes: ['classic'],
        extras: []
    },
    equipped: JSON.parse(localStorage.getItem('neonTetrisEquipped')) || {
        theme: 'default',
        mode: 'classic',
        extras: {} // Objeto para rastrear extras ligados/desligados
    },
    
    // Lista de Produtos (Isso define o que tem na loja)
    shopCatalog: {
        themes: [
            { id: 'default', name: 'Cyberpunk', price: 0, desc: 'O visual clássico neon. Equilíbrio perfeito.' },
            { id: 'vaporwave', name: 'Vaporwave', price: 2000, desc: 'Estética Retrô anos 80. Cores pastéis e relaxantes.' },
            { id: 'gameboy', name: 'Retro Boy', price: 5000, desc: 'A nostalgia do portátil verde monocromático.' },
            { id: 'terminal', name: 'Matrix Hacker', price: 7500, desc: 'Entre na Matrix. Tudo verde, tudo código.' },
            { id: 'dracula', name: 'Conde Dracula', price: 9000, desc: 'Tema gótico com alto contraste e tons vampíricos.' },
            { id: 'cotton', name: 'Algodão Doce', price: 12000, desc: 'Doce e suave. Cuidado para não ter cáries.' },
            { id: 'gold', name: 'Luxo Dourado', price: 20000, desc: 'Ostentação pura. Peças feitas de ouro maciço.' }
        ],
        modes: [
            { id: 'classic', name: 'Clássico', price: 0, desc: 'O jogo padrão. A velocidade aumenta a cada nível.' },
            { id: 'sprint', name: 'Sprint 40L', price: 15000, desc: 'Speedrun! Limpe 40 linhas no menor tempo possível.' },
            { id: 'blitz', name: 'Blitz (2 Min)', price: 10000, desc: 'Time Attack! Faça o maior score possível em 2 minutos.' },
            { id: 'master', name: 'Master 20G', price: 30000, desc: 'Só para insanos. Gravidade instantânea o tempo todo.' },
        ],
        extras: [
            { id: 'ghost', name: 'Rastro Fantasma', price: 8000, desc: 'As peças deixam um rastro visual quando se movem.' },
            { id: 'confetti', name: 'Chuva de Confete', price: 12000, desc: 'Explosão de alegria ao fazer um Tetris!' },
            { id: 'oldschool', name: 'Sons 8-Bit', price: 5000, desc: 'Efeitos sonoros originais de 1989.' }
        ]
    }
}

// 🔧 Garantir que as chaves de extras sempre existam (compatível com saves antigos)
if (!state.inventory.extras) {
    state.inventory.extras = [];
}
if (!state.equipped.extras) {
    state.equipped.extras = {};
}
state.config.ghost = !!state.equipped.extras['ghost'];
localStorage.setItem('neonTetrisConfig', JSON.stringify(state.config));

// --- ELEMENTOS UI ---
const els = {
    mainMenu: document.getElementById('main-menu'),
    configMenu: document.getElementById('config-menu'),
    pauseMenu: document.getElementById('pause-overlay'),
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    highScore: document.getElementById('highscore'),
    soundBtn: document.getElementById('btn-sound'),
    levelInput: document.getElementById('start-level'),
    levelDisplay: document.getElementById('lvl-display'),
    timeDisplay: document.getElementById('time-display')
};


let highScore = localStorage.getItem('neonTetrisHighScore') || 0;
const bodyEl = document.body;

function showGameUI() {
    bodyEl.classList.remove('menu-active');
}
function hideGameUI() {
    bodyEl.classList.add('menu-active');
}
els.highScore.innerText = highScore;

// --- LOOP DO JOGO ---
function update(time = 0) {
    if (!state.isMenu && !state.isPaused && !game.gameOver && !state.isSprintWon) {
        const currentTime = time || performance.now();
        const deltaTime = currentTime - state.lastTime;
        state.lastTime = currentTime;

        // --- LÓGICA DO CRONÔMETRO ---
        state.gameTimer += deltaTime;
        
        if (state.gameTimer >= 1000) {
            state.gameTimer -= 1000; // Remove 1 segundo do acumulador
            
            if (state.equipped.mode === 'blitz') {
                // MODO BLITZ (Contagem Regressiva)
                if (state.gameTime > 0) {
                    state.gameTime--; // Diminui 1 segundo
                }
                
                // Se zerou (ou ficou negativo por erro), Game Over
                if (state.gameTime <= 0) {
                    state.gameTime = 0;
                    els.timeDisplay.innerText = "00:00";
                    handleGameOver(); // ACABOU O TEMPO!
                    return; // Para tudo
                }
            } else {
                // OUTROS MODOS (Contagem Progressiva)
                state.gameTime++;
            }

            // Formata MM:SS na tela
            const mins = Math.floor(state.gameTime / 60).toString().padStart(2, '0');
            const secs = (state.gameTime % 60).toString().padStart(2, '0');
            els.timeDisplay.innerText = `${mins}:${secs}`;
        }

        // --- FÍSICA E INPUTS (Isso não muda) ---
        handleInput(deltaTime);

        state.dropCounter += deltaTime;
        if (state.dropCounter > state.dropInterval) {
            playerDrop();
        }

        const isTouchingGround = checkCollision(0, 1);
        if (isTouchingGround) {
            state.lockTimer += deltaTime;
            if (state.lockTimer > state.lockDelay) {
                lockPiece();
            }
        } else {
            state.lockTimer = 0;
        }
        
        draw();
    }
    requestAnimationFrame(update);
}

// Logica de movimento repetido (DAS/ARR)
function handleInput(dt) {
    const move = (dir) => {
        game.playerMove(dir);
        if (checkCollision(0, 1)) state.lockTimer = 0;
        audio.move();
    };

    // Esquerda
    if (state.keys.left.isDown) {
        state.keys.left.timer += dt;
        if (state.keys.left.timer > state.DAS) {
            move(-1);
            state.keys.left.timer -= state.ARR;
        }
    }

    // Direita
    if (state.keys.right.isDown) {
        state.keys.right.timer += dt;
        if (state.keys.right.timer > state.DAS) {
            move(1);
            state.keys.right.timer -= state.ARR;
        }
    }

    // Baixo (Soft Drop)
    if (state.keys.down.isDown) {
        state.keys.down.timer += dt;
        if (state.keys.down.timer > state.ARR / 2) { // Mais rapido que lateral
            game.player.pos.y++;
            if (game.collide(game.arena, game.player)) {
                game.player.pos.y--;
            } else {
                state.dropCounter = 0;
                audio.move();
            }
            state.keys.down.timer = 0;
        }
    }
}

function draw() {
    mainView.clear();
    mainView.drawMatrix(game.arena, {x:0, y:0});
    
    if (state.config.ghost) {
        const ghostPos = { ...game.player.pos };
        while (!game.collide(game.arena, { pos: ghostPos, matrix: game.player.matrix })) {
            ghostPos.y++;
        }
        ghostPos.y--;
        mainView.drawMatrix(game.player.matrix, ghostPos, true);
    }

    mainView.drawMatrix(game.player.matrix, game.player.pos);
    mainView.drawParticles();

    nextView.clear();
    if(game.player.next) nextView.drawMatrix(game.player.next, {x:1, y:1});
    
    holdView.clear();
    if(game.player.hold) holdView.drawMatrix(game.player.hold, {x:1, y:1});
}

function checkCollision(xOffset, yOffset) {
    const tempPlayer = {
        matrix: game.player.matrix,
        pos: { x: game.player.pos.x + xOffset, y: game.player.pos.y + yOffset }
    };
    return game.collide(game.arena, tempPlayer);
}

function playerDrop() {
    game.player.pos.y++;
    if (game.collide(game.arena, game.player)) {
        game.player.pos.y--; 
    }
    state.dropCounter = 0;
}

function lockPiece() {
    game.merge(game.arena, game.player);
    audio.drop();

    const result = game.arenaSweep();
    const cleared = result.lines;

    // ... (mantém toda a parte de efeitos, textos flutuantes e sons igualzinho estava) ...
    // COPIE A LÓGICA DE TEXTOS E EFEITOS AQUI (T-Spin, Tetris, etc.)
    if (cleared.length > 0 || result.isTSpin) {
         if (cleared.length > 0) audio.clear(cleared.length);
         cleared.forEach(line => {
            for(let x=0; x<COLS; x++) mainView.createExplosion(x, line.y, line.color);
        });
        // ... (seu codigo de showFloatingText) ...
    }
    // ... (fim da copia) ...

    game.resetPiece();
    state.lockTimer = 0;
    state.dropCounter = 0;
    
    updateStats(); // Atualiza contador de linhas/nivel

    // REGRA SPRINT: Venceu ao limpar 40 linhas?
    if (state.equipped.mode === 'sprint' && game.player.lines >= 40) {
        handleSprintWin(); // Função nova de vitória
    } else if (game.gameOver) {
        handleGameOver();
    }
}

// Funcao pra criar texto flutuante (Coloca no final do main.js)
// Atualize essa função no final do seu main.js
function showFloatingText(text, yPos, color = '#fff') { // Adicionei color = '#fff'
    const div = document.createElement('div');
    div.innerText = text;
    div.style.position = 'absolute';
    div.style.left = '50%';
    div.style.top = '40%'; // Pode usar yPos se quiser ajustar altura
    div.style.transform = 'translate(-50%, -50%)';
    div.style.color = color; // Usa a cor passada
    div.style.fontFamily = "'Press Start 2P', cursive";
    div.style.fontSize = '1.2em'; // Um pouco menor pra caber na loja
    div.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`; // Brilho da mesma cor
    div.style.pointerEvents = 'none';
    div.style.zIndex = '200'; // Bem alto pra ficar em cima da loja
    div.className = 'pop'; 
    
    document.querySelector('.game-wrapper').appendChild(div);
    
    setTimeout(() => div.remove(), 1000);
}
// --- NOVA FUNÇÃO DE CONTAGEM ---
function startCountdown(onComplete) {
    const overlay = document.getElementById('countdown-overlay');
    const text = document.getElementById('countdown-text');
    let count = 3;

    // Garante que o pause menu sumiu
    els.pauseMenu.classList.add('hidden');
    els.mainMenu.classList.add('hidden');
    
    // Mostra o overlay de contagem
    overlay.classList.remove('hidden');
    text.innerText = count;
    audio.move(); // Faz um bip

    // Cria um intervalo que roda a cada 1 segundo (quase)
    const timer = setInterval(() => {
        count--;
        
        if (count > 0) {
            text.innerText = count;
            audio.move(); // Bip
        } else if (count === 0) {
            text.innerText = "GO!";
            audio.rotate(); // Bip mais agudo no GO
        } else {
            // Acabou
            clearInterval(timer);
            overlay.classList.add('hidden');
            onComplete(); // Roda o que tiver que rodar (começar jogo ou despausar)
        }
    }, 800); // 800ms pra ser mais rapidinho que 1s
}

// --- START GAME ATUALIZADO ---
function startGame() {
    audio.resume();
    
    // --- 1. RESET TOTAL DE VARIÁVEIS ---
    game.gameOver = false;
    state.isSprintWon = false;
    state.isPaused = false;     // Garante que não começa pausado
    state.gameTimer = 0;        // Zera os milissegundos acumulados
    
    // Reseta pontuação e grid
    game.arena.forEach(row => row.fill(0));
    game.player.score = 0;
    game.player.lines = 0;
    game.player.combo = -1;
    game.player.hold = null;
    game.player.level = parseInt(state.config.startLevel); // Nivel padrão

    // --- 2. CONFIGURAÇÃO ESPECÍFICA DO MODO ---
    const mode = state.equipped.mode; // Pega o modo atual (blitz, sprint, classic)

    if (mode === 'blitz') {
        // BLITZ: TEM que começar com 120s
        state.gameTime = 120;
        els.timeDisplay.innerText = "02:00"; 
    } else {
        // OUTROS: Começam com 0s
        state.gameTime = 0;
        els.timeDisplay.innerText = "00:00";
    }

    // Configurações de Nível e Display
    if (mode === 'master') {
        game.player.level = 20; // Master começa no maximo
        els.level.parentElement.querySelector('small').innerText = "NÍVEL";
        els.level.innerText = "M";
    } else if (mode === 'sprint') {
        // Sprint começa com linhas restantes
        els.level.parentElement.querySelector('small').innerText = "RESTAM";
        els.level.innerText = "40";
    } else {
        // Classic e Blitz mostram nivel normal
        els.level.parentElement.querySelector('small').innerText = "NÍVEL";
        els.level.innerText = game.player.level;
    }

    game.resetPiece();
    updateStats(); 
    
    // Ação: Remove o menu-active e mostra os painéis
    showGameUI(); 

    startCountdown(() => {
        state.isMenu = false;
        state.lastTime = performance.now(); 
        update();
    });
}

function updateStats() {
    els.score.innerText = game.player.score;
    
    // No modo Sprint, mostramos quantas faltam pra 40
    if (state.equipped.mode === 'sprint') {
        const linesLeft = Math.max(0, 40 - game.player.lines);
        els.level.innerText = linesLeft;
        
        // Mantem velocidade fixa ou aumenta? Sprint geralmente é fixo ou progressivo.
        // Vamos manter gravidade padrão baseada no nivel selecionado no menu
        state.dropInterval = Math.max(100, 1000 - (parseInt(state.config.startLevel) * 50));
    } 
    // No modo Master, trava no nível 20 (Velocidade Maxima)
    else if (state.equipped.mode === 'master') {
        els.level.innerText = "M"; // M de Master
        state.dropInterval = 0; // Gravidade Instantânea (20G)
    } 
    // Modos Classic e Blitz
    else {
        els.level.innerText = game.player.level;
        state.dropInterval = Math.max(100, 1000 - (game.player.level * 50));
    }
    
    if (game.player.score > highScore) {
        highScore = game.player.score;
        localStorage.setItem('neonTetrisHighScore', highScore);
        els.highScore.innerText = highScore;
    }
}


// --- CONTROLES DE FLUXO ---
// (A função startGame correta já está definida lá em cima, não repetimos aqui!)

function handleGameOver() {
    audio.gameOver();
    
    // ... (restante da sua lógica de score e wallet) ...
    
    els.pauseMenu.classList.remove('hidden');
    document.getElementById('pause-title').innerText = "GAME OVER";
    
    // ... (restante da sua lógica de mensagem) ...
    
    document.getElementById('btn-restart').classList.remove('hidden');
    document.getElementById('btn-menu').classList.remove('hidden');
    
    hideGameUI(); // Ação: Esconde os painéis laterais
}

function togglePause() {
    if (state.isMenu || game.gameOver) return;

    if (state.isPaused) {
        // Despausando
        startCountdown(() => {
            state.isPaused = false;
            state.lastTime = performance.now();
            showGameUI(); // Ação: Garante que os painéis estão visíveis
        });
    } else {
        // Pausando
        state.isPaused = true;
        els.pauseMenu.classList.remove('hidden');
        document.getElementById('pause-title').innerText = "PAUSE";
        document.getElementById('pause-msg').innerText = "Pressione P para voltar";
        document.getElementById('btn-restart').classList.add('hidden');
        document.getElementById('btn-menu').classList.remove('hidden');
        hideGameUI(); // Ação: Esconde os painéis laterais
    }
}
// --- SETUP CONTROLES MOBILE (CORRIGIDO PARA MOUSE E TOUCH) ---
function setupMobileControls() {
    // Helper universal para ligar Touch e Mouse
    const bindBtn = (id, keyName) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        // Função de inicio (apertou)
        const startAction = (e) => {
            if (e.cancelable) e.preventDefault(); // Evita scroll/zoom
            audio.resume();
            
            if (state.keys[keyName]) {
                state.keys[keyName].isDown = true;
                state.keys[keyName].timer = 0;
                
                // Trigger imediato
                if (keyName === 'left') { game.playerMove(-1); audio.move(); }
                if (keyName === 'right') { game.playerMove(1); audio.move(); }
            }
        };

        // Função de fim (soltou)
        const endAction = (e) => {
            if (e.cancelable) e.preventDefault();
            if (state.keys[keyName]) {
                state.keys[keyName].isDown = false;
            }
        };

        // Adiciona ouvintes para TOQUE (Celular)
        btn.addEventListener('touchstart', startAction, { passive: false });
        btn.addEventListener('touchend', endAction);
        
        // Adiciona ouvintes para MOUSE (PC)
        btn.addEventListener('mousedown', startAction);
        btn.addEventListener('mouseup', endAction);
        btn.addEventListener('mouseleave', endAction); // Se arrastar o mouse pra fora
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-down', 'down');

    // --- Botão de Girar (Híbrido) ---
    const spinBtn = document.getElementById('btn-rotate');
    if (spinBtn) {
        const spinAction = (e) => {
            if (e.cancelable) e.preventDefault();
            audio.resume();
            game.playerRotate(1);
            audio.rotate();
            if (checkCollision(0, 1)) state.lockTimer = 0;
        };
        spinBtn.addEventListener('touchstart', spinAction, { passive: false });
        spinBtn.addEventListener('mousedown', spinAction);
    }

    // --- Botão de Drop (Híbrido) ---
    const dropBtn = document.getElementById('btn-drop');
    if (dropBtn) {
        const dropAction = (e) => {
            if (e.cancelable) e.preventDefault();
            audio.resume();
            mainView.shakeScreen();
            while (!game.collide(game.arena, game.player)) {
                game.player.pos.y++;
            }
            game.player.pos.y--;
            audio.drop();
            lockPiece();
        };
        dropBtn.addEventListener('touchstart', dropAction, { passive: false });
        dropBtn.addEventListener('mousedown', dropAction);
    }
}

// --- INPUT HANDLERS (TECLADO FÍSICO) ---
document.addEventListener('keydown', event => {
    if (state.isMenu) return;
    if (event.keyCode === 80) { togglePause(); return; }
    if (state.isPaused || game.gameOver) return;

    if (event.keyCode === 38 || event.keyCode === 87) { // Cima
        game.playerRotate(1);
        audio.rotate();
        if (checkCollision(0, 1)) state.lockTimer = 0;
    }
    else if (event.keyCode === 67) { // C
        game.playerHold();
        state.lockTimer = 0;
        audio.hold();
    }
    else if (event.keyCode === 32) { // Espaço
        mainView.shakeScreen();
        while (!game.collide(game.arena, game.player)) {
            game.player.pos.y++;
        }
        game.player.pos.y--;
        audio.drop();
        lockPiece();
    }
    else if (event.keyCode === 37 || event.keyCode === 65) {
        if (!state.keys.left.isDown) {
            state.keys.left.isDown = true;
            state.keys.left.timer = 0;
            game.playerMove(-1);
            audio.move();
        }
    }
    else if (event.keyCode === 39 || event.keyCode === 68) {
        if (!state.keys.right.isDown) {
            state.keys.right.isDown = true;
            state.keys.right.timer = 0;
            game.playerMove(1);
            audio.move();
        }
    }
    else if (event.keyCode === 40 || event.keyCode === 83) {
        state.keys.down.isDown = true;
    }
});

document.addEventListener('keyup', event => {
    if (event.keyCode === 37 || event.keyCode === 65) state.keys.left.isDown = false;
    else if (event.keyCode === 39 || event.keyCode === 68) state.keys.right.isDown = false;
    else if (event.keyCode === 40 || event.keyCode === 83) state.keys.down.isDown = false;
});

// --- UI LISTENERS ---
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

document.getElementById('btn-menu').addEventListener('click', () => {
    els.pauseMenu.classList.add('hidden');
    els.mainMenu.classList.remove('hidden');
    state.isMenu = true;
    hideGameUI(); // Ação: Mantém os painéis escondidos (pois ainda está no menu)
});

document.getElementById('btn-config').addEventListener('click', () => {
    els.mainMenu.classList.add('hidden');
    els.configMenu.classList.remove('hidden');
    els.soundBtn.innerText = state.config.sound ? "ON" : "OFF";
    els.soundBtn.className = state.config.sound ? "toggle-btn" : "toggle-btn off";
    els.levelInput.value = state.config.startLevel;
    els.levelDisplay.innerText = state.config.startLevel;
    hideGameUI();
});



document.getElementById('btn-back').addEventListener('click', () => {
    els.configMenu.classList.add('hidden');
    els.mainMenu.classList.remove('hidden');
    localStorage.setItem('neonTetrisConfig', JSON.stringify(state.config));
});


if (els.soundBtn) {
    els.soundBtn.addEventListener('click', () => {
        state.config.sound = !state.config.sound;
        const isMuted = audio.toggleMute();
        els.soundBtn.innerText = !isMuted ? "ON" : "OFF";
        els.soundBtn.className = !isMuted ? "toggle-btn" : "toggle-btn off";
    });
}

els.levelInput.addEventListener('input', (e) => {
    state.config.startLevel = e.target.value;
    els.levelDisplay.innerText = e.target.value;
});

// --- SISTEMA DE LOJA ---

const shopEls = {
    menu: document.getElementById('shop-menu'),
    coins: document.getElementById('shop-coins'),
    list: document.getElementById('shop-items'),
    tabs: document.querySelectorAll('.tab-btn')
};

let currentTab = 'themes';

function openShop() {
    els.mainMenu.classList.add('hidden');
    shopEls.menu.classList.remove('hidden');
    updateShopUI();
    hideGameUI(); // Ação: Esconde os painéis
}

function updateShopUI() {
    // Estas linhas são seguras
    shopEls.coins.innerText = state.wallet;
    shopEls.list.innerHTML = '';
    
    // 🛑 PONTO DE FIX: CHECA SE O ELEMENTO DE DETALHES EXISTE ANTES DE USAR
    const detailsEl = document.getElementById('shop-details');
    if (detailsEl) {
        detailsEl.innerText = "Selecione um item para ver os detalhes.";
    }
    // ----------------------------------------------------------------------

    const items = state.shopCatalog[currentTab];
    
    // Se por algum motivo o catálogo estiver vazio, o loop não trava, ele só termina.
    if (!items || items.length === 0) return; 

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        
        const isOwned = state.inventory[currentTab].includes(item.id);
        
        let isEquipped = false;
        if (currentTab === 'themes') {
            isEquipped = state.equipped.theme === item.id;
        } else if (currentTab === 'modes') {
            isEquipped = state.equipped.mode === item.id;
        } else if (currentTab === 'extras') {
            isEquipped = state.equipped.extras[item.id] === true;
        }
        
        let priceText = `${item.price} 💎`;
        if (isEquipped) { div.classList.add('equipped'); priceText = "EQUIPADO"; }
        else if (isOwned) { div.classList.add('owned'); priceText = "EQUIPAR"; }

        div.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">${priceText}</span>
        `;

        // PONTO DE FIX: Só adiciona o mouse enter se o elemento existir
        if (detailsEl) {
            div.onmouseenter = () => {
                detailsEl.innerText = item.desc;
                detailsEl.style.color = "#fff";
            };
        }

        div.onclick = () => handleItemClick(item, isOwned, isEquipped);
        
        shopEls.list.appendChild(div); // Finalmente adiciona o item
    });
}

function handleItemClick(item, isOwned, isEquipped) {
    if (isEquipped && currentTab !== 'extras') return; // Já está usando (só retorna se não for extra)

    if (isOwned) {
        // --- LOGICA DE EQUIPAR / TOGGLE ---
        if (currentTab === 'themes') {
            state.equipped.theme = item.id;
            applyTheme(item.id);
        } else if (currentTab === 'modes') {
            state.equipped.mode = item.id;
        } else if (currentTab === 'extras') {
            // EXTRAS: Lógica de Toggle ON/OFF
            const isCurrentlyOn = state.equipped.extras[item.id] === true;
            
            // Tenta ligar se estiver desligado, ou desliga
            state.equipped.extras[item.id] = !isCurrentlyOn;
            
            // CHAMA A FUNÇÃO REAL:
            applyExtra(item.id, !isCurrentlyOn); 
        }

        // Salva e atualiza visual
        localStorage.setItem('neonTetrisEquipped', JSON.stringify(state.equipped));
        updateShopUI();
        audio.hold(); // Som de confirmação
        
    } else {
        // --- LOGICA DE COMPRAR ---
        if (state.wallet >= item.price) {
            if(confirm(`Comprar ${item.name}?`)) {
                state.wallet -= item.price;
                state.inventory[currentTab].push(item.id);
                
                localStorage.setItem('neonTetrisWallet', state.wallet);
                localStorage.setItem('neonTetrisInventory', JSON.stringify(state.inventory));
                
                audio.hold(); 
                updateShopUI();
            }
        } else {
            // Falta Grana (Visual Neon)
            showFloatingText("FALTA GRANA!", 300, "#ff0055"); 
            const coinsEl = document.getElementById('shop-coins');
            coinsEl.style.color = '#ff0055';
            coinsEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                coinsEl.style.color = 'var(--neon-green)'; 
                coinsEl.style.transform = 'scale(1)';
            }, 500);
        }
    }
}

// Lembre-se: Você precisa da função applyExtra (mesmo que vazia) logo abaixo disso.

// Função Placeholder para mudar temas (implementaremos visual depois)
// --- SISTEMA DE CORES DOS TEMAS ---
const THEME_COLORS = {
    'default': {
        vars: {
            '--bg-color': '#15151a',
            '--panel-bg': '#202028',
            '--neon-blue': '#00f3ff',
            '--neon-pink': '#ff0055',
            '--neon-green': '#00ff9d',
            '--text-color': '#fff'
        },
        // Cores originais do Neon Tetrix
        pieces: [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF']
    },
    'vaporwave': {
        vars: {
            '--bg-color': '#2b1055',
            '--panel-bg': '#341c66',
            '--neon-blue': '#00ffff',
            '--neon-pink': '#ff71ce',
            '--neon-green': '#fffb96',
            '--text-color': '#fff'
        },
        // Tons pasteis neon (Rosa, Ciano, Roxo)
        pieces: [null, '#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96', '#ffb967', '#01cdfe']
    },
    'gameboy': {
        vars: {
            '--bg-color': '#0f380f',
            '--panel-bg': '#306230',
            '--neon-blue': '#8bac0f',
            '--neon-pink': '#9bbc0f',
            '--neon-green': '#0f380f',
            '--text-color': '#9bbc0f'
        },
        // 4 tons de verde monocromático
        pieces: [null, '#9bbc0f', '#8bac0f', '#306230', '#9bbc0f', '#8bac0f', '#306230', '#9bbc0f']
    },
    'terminal': { // Matrix
        vars: {
            '--bg-color': '#000000',
            '--panel-bg': '#001100',
            '--neon-blue': '#00ff00',
            '--neon-pink': '#003300',
            '--neon-green': '#00cc00',
            '--text-color': '#00ff00'
        },
        // Tudo verde hacker, só mudando a intensidade
        pieces: [null, '#00ff00', '#00cc00', '#009900', '#33ff33', '#00ff00', '#00cc00', '#009900']
    },
    'dracula': {
        vars: {
            '--bg-color': '#282a36',
            '--panel-bg': '#44475a',
            '--neon-blue': '#bd93f9',
            '--neon-pink': '#ff5555',
            '--neon-green': '#50fa7b',
            '--text-color': '#f8f8f2'
        },
        // Paleta Dracula (Roxo, Rosa, Verde, Laranja)
        pieces: [null, '#ff79c6', '#8be9fd', '#50fa7b', '#bd93f9', '#ffb86c', '#f1fa8c', '#6272a4']
    },
    'cotton': {
        vars: {
            '--bg-color': '#ffebf0',
            '--panel-bg': '#fff0f5',
            '--neon-blue': '#89cff0',
            '--neon-pink': '#ffb7b2',
            '--neon-green': '#b0f2c2',
            '--text-color': '#555555'
        },
        // Doces e Tons Suaves
        pieces: [null, '#ffb7b2', '#a0e6ff', '#b0f2c2', '#e0b0ff', '#fff5ba', '#ffdac1', '#a0e6ff']
    },
    'gold': {
        vars: {
            '--bg-color': '#1a1000',
            '--panel-bg': '#2e2000',
            '--neon-blue': '#ffd700',
            '--neon-pink': '#daa520',
            '--neon-green': '#ffffff',
            '--text-color': '#ffd700'
        },
        // Ouro, Bronze, Prata e Diamante
        pieces: [null, '#ffd700', '#daa520', '#b8860b', '#cd853f', '#ffd700', '#daa520', '#e5e4e2']
    }
};

function applyExtra(extraId, status) {
    console.log(`Extra: ${extraId} setado para ${status}`);

    // Isso aqui usa a lógica do Ghost Piece (Rastro Fantasma)
    if (extraId === 'ghost') {
        state.config.ghost = status; 
        localStorage.setItem('neonTetrisConfig', JSON.stringify(state.config));
    }
    
    // Lógica futura: Sons 8-bit, Confetti, etc.
}
function applyTheme(themeId) {
    const theme = THEME_COLORS[themeId] || THEME_COLORS['default'];
    const root = document.documentElement;

    // 1. Aplica as variáveis CSS (Fundo e Painéis)
    for (const [key, value] of Object.entries(theme.vars)) {
        root.style.setProperty(key, value);
    }
    
    // 2. Aplica as Cores das Peças (Aqui tá o pulo do gato!)
    // Atualiza o array global COLORS que o jogo usa pra desenhar
    COLORS = [...theme.pieces]; 
    
    // Força o redesenho da tela pra atualizar na hora
    if (typeof draw === 'function') draw();
}

// Event Listeners da Loja
document.getElementById('btn-shop').addEventListener('click', openShop);

document.getElementById('btn-shop-back').addEventListener('click', () => {
    shopEls.menu.classList.add('hidden');
    els.mainMenu.classList.remove('hidden');
});

shopEls.tabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Tira active de todos
        shopEls.tabs.forEach(b => b.classList.remove('active'));
        // Põe no clicado
        e.target.classList.add('active');
        currentTab = e.target.dataset.tab;
        updateShopUI();
    });
});

function handleSprintWin() {
    state.isSprintWon = true;
    audio.hold(); // Som de vitória (ou crie um audio.win())
    
    // Bonus de grana por tempo (ex: 10000 / segundos gastos)
    const timeBonus = Math.floor(10000 / (state.gameTime || 1));
    state.wallet += timeBonus;
    localStorage.setItem('neonTetrisWallet', state.wallet);

    els.pauseMenu.classList.remove('hidden');
    document.getElementById('pause-title').innerText = "SPRINT COMPLETO!";
    document.getElementById('pause-title').style.color = "var(--neon-green)";
    
    document.getElementById('pause-msg').innerHTML = 
        `Tempo: ${els.timeDisplay.innerText}<br>` +
        `<span style="color:var(--neon-blue);">Recompensa: +${timeBonus} 💎</span>`;
        
    document.getElementById('btn-restart').classList.remove('hidden');
    document.getElementById('btn-menu').classList.remove('hidden');
}

// --- CHEAT CODES PARA TESTES (DEV TOOLS) ---
document.addEventListener('keydown', (e) => {
    // Tecla 9: DESBLOQUEAR TUDO (GOD MODE)
    if (e.key === '9') {
        // 1. Enche o bolso
        state.wallet = 999999;
        
        // 2. Adiciona todos os itens do catalogo no inventario
        state.shopCatalog.themes.forEach(item => {
            if(!state.inventory.themes.includes(item.id)) state.inventory.themes.push(item.id);
        });
        state.shopCatalog.modes.forEach(item => {
            if(!state.inventory.modes.includes(item.id)) state.inventory.modes.push(item.id);
        });
        state.shopCatalog.extras.forEach(item => {
            if(!state.inventory.extras.includes(item.id)) state.inventory.extras.push(item.id);
        });

        // 3. Salva e Atualiza
        localStorage.setItem('neonTetrisWallet', state.wallet);
        localStorage.setItem('neonTetrisInventory', JSON.stringify(state.inventory));
        
        if (!shopEls.menu.classList.contains('hidden')) updateShopUI(); // Atualiza loja se estiver aberta
        showFloatingText("GOD MODE: TUDO LIBERADO!", 100, "#00ff00");
        audio.hold();
        console.log("CHEATS: Tudo desbloqueado!");
    }

    // Tecla 0: RESETAR TUDO (FACTORY RESET)
    if (e.key === '0') {
        if(confirm("Tem certeza que quer apagar todo o progresso e bloquear tudo?")) {
            // 1. Zera tudo
            state.wallet = 0;
            state.inventory = {
                themes: ['default'],
                modes: ['classic'],
                extras: []
            };
            // Volta pro tema padrao pra nao bugar
            state.equipped = { theme: 'default', mode: 'classic' };
            applyTheme('default');

            // 2. Salva o reset
            localStorage.setItem('neonTetrisWallet', state.wallet);
            localStorage.setItem('neonTetrisInventory', JSON.stringify(state.inventory));
            localStorage.setItem('neonTetrisEquipped', JSON.stringify(state.equipped));

            if (!shopEls.menu.classList.contains('hidden')) updateShopUI();
            showFloatingText("RESET COMPLETO!", 100, "#ff0000");
            audio.gameOver();
            console.log("CHEATS: Resetado!");
        }
    }
});
// INICIALIZA TUDO
// INICIALIZA TUDO
applyTheme(state.equipped.theme); // Carrega o tema salvo
setupMobileControls(); 

// 🛑 FIX 1: ESCONDE A INTERFACE NA PRIMEIRA CARGA 
if (state.isMenu) hideGameUI(); 
// ----------------------------------------------------

update();