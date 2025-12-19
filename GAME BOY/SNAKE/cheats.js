// Arquivo: cheats.js
// Deve ser carregado APÓS loja.js no index.html.

// --- 1. MAPA CENTRAL DE CHEATS ---
const CHEAT_ACTIONS = {
    // CHAVE STRING: FUNÇÃO A EXECUTAR
    "AHRAGA": unlockAllSkinsCheat,
    "TURBO": activatePermanentTurbo, // Exemplo
    "ZERA": resetGameProgress,      // NOVO: Zera tudo
    "R": activateLevelSkip
};

// --- 2. FUNÇÕES DE AÇÃO ---

// ZERA: Limpa todo o progresso salvo
function resetGameProgress() {
    // 1. Limpa todas as chaves de progresso do navegador
    localStorage.removeItem('snakeHighScore');
    localStorage.removeItem('snakeCoins');
    localStorage.removeItem('snakeOwnedSkins');
    localStorage.removeItem('snakeActiveSkin');
    localStorage.removeItem('cheatActive'); 
    
    // 2. Reseta as variáveis de estado globais (do loja.js)
    if (typeof window.userCoins !== 'undefined') window.userCoins = 0;
    if (typeof window.ownedSkins !== 'undefined') window.ownedSkins = ["default"];
    if (typeof window.activeSkin !== 'undefined') window.activeSkin = '#ffffff';

    // 3. Notifica e Força Recarregamento do Menu (para o reset ser visível)
    if (typeof showToast !== 'undefined') {
        showToast("Cheat 'ZERA' Ativado! Progresso e Skins Resetados.", "success");
    }
    
    // Recarrega o menu após 1 segundo para aplicar as mudanças
    setTimeout(() => {
        window.location.reload(); 
    }, 1000); 
}

// AHRAGA: Desbloqueia todas as skins
function unlockAllSkinsCheat() {
    if (typeof SKINS === 'undefined' || typeof showToast === 'undefined' || typeof renderShop === 'undefined') {
        console.error("ERRO: O arquivo loja.js não carregou as dependências globais.");
        return;
    }
    
    const allIds = window.SKINS.map(s => s.id);
    
    let currentOwnedSkins = JSON.parse(localStorage.getItem('snakeOwnedSkins') || '["default"]');
    
    window.ownedSkins = [...new Set([...currentOwnedSkins, ...allIds])];
    localStorage.setItem('snakeOwnedSkins', JSON.stringify(window.ownedSkins));
    
    renderShop();
    showToast("Cheat 'AHRAGA' Ativado! Todas as Skins Desbloqueadas.", "success");
}

// TURBO (Exemplo de cheat que precisa de lógica no jogo)
function activatePermanentTurbo() {
    localStorage.setItem('cheatActive', 'TURBO_PERM');
    if (typeof showToast !== 'undefined') {
        showToast("Cheat 'TURBO' Ativado! Ative a verificação em infinito.js.", "success");
    }
}

// --- FUNÇÃO PARA ACUMULAR PULO DE FASES ---
function activateLevelSkip() {
    // 1. Lê o que já está salvo (ou assume 1 se não tiver nada)
    let savedLevel = parseInt(localStorage.getItem('snakeStartLevel') || '1');
    
    // 2. Soma +10 ao valor atual
    let newLevel = savedLevel + 10;
    
    // 3. Salva o novo valor acumulado
    localStorage.setItem('snakeStartLevel', newLevel);
    
    if (typeof showToast !== 'undefined') {
        showToast(`Cheat 'PULAR' Acumulado! Próximo jogo: Nível ${newLevel}.`, "success");
    }
}

// --- 3. LÓGICA DE DETECÇÃO GERAL ---
let keySequence = "";
const MAX_KEY_SEQ_LENGTH = 15;

document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    
    if (key.length !== 1 || !/[A-Z]/.test(key)) return; 

    keySequence += key;
    if (keySequence.length > MAX_KEY_SEQ_LENGTH) {
        keySequence = keySequence.substring(keySequence.length - MAX_KEY_SEQ_LENGTH);
    }

    if (CHEAT_ACTIONS[keySequence]) {
        CHEAT_ACTIONS[keySequence]();
        keySequence = "";
        return;
    }

    let isPartialMatch = false;
    for (const cheatCode in CHEAT_ACTIONS) {
        if (cheatCode.startsWith(keySequence)) {
            isPartialMatch = true;
            break;
        }
    }

    if (!isPartialMatch) {
        keySequence = key.substring(0, 1);
    }
});