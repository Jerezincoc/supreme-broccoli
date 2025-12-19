// Arquivo: loja.js (Sessão de Variáveis Globais)

// Configuração das Skins - TORNADA GLOBAL (window.)
window.SKINS = [
    { id: 'default', name: 'Padrão', color: '#ffffff', price: 0 },
    { id: 'bronze', name: 'Bronze', color: '#cd7f32', price: 500 },
    { id: 'silver', name: 'Prata', color: '#c0c0c0', price: 2000 },
    { id: 'gold', name: 'OURO', color: '#ffd700', price: 5000 },
    { id: 'red', name: 'Rubi', color: '#ff0000', price: 100 },
    { id: 'green', name: 'Esmeralda', color: '#00ff00', price: 200 },
    { id: 'blue', name: 'Safira', color: '#0000ff', price: 500 },
    { id: 'pink', name: 'Chiclete', color: '#ff00aa', price: 1000 },
    { id: 'dark', name: 'Ninja', color: '#333333', price: 10000 },
    { id: 'rainbow', name: 'Arco-Íris', color: 'rainbow', price: 20000 } 
];

const coinsEl = document.getElementById('user-coins');
const shopModal = document.getElementById('shop-modal');
const shopGrid = document.getElementById('shop-grid');
const toast = document.getElementById('toast');

// Tornar essas variáveis globais para que cheats.js possa manipular o estado
window.userCoins = parseInt(localStorage.getItem('snakeCoins') || '0');
window.ownedSkins = JSON.parse(localStorage.getItem('snakeOwnedSkins') || '["default"]');
window.activeSkin = localStorage.getItem('snakeActiveSkin') || '#ffffff';

if(coinsEl) coinsEl.innerText = window.userCoins; // Use window.userCoins aqui também
// O resto do seu código (funções) não precisa mudar.

function showToast(msg, type = 'error') {
    toast.innerText = msg;
    toast.className = 'show'; // Reseta classes
    if (type === 'success') toast.classList.add('success');
    
    // Remove depois de 3 segundos
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

function openShop() { renderShop(); shopModal.style.display = 'flex'; }
function closeShop() { shopModal.style.display = 'none'; }

function renderShop() {
    shopGrid.innerHTML = '';
    SKINS.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        
        const isOwned = ownedSkins.includes(skin.id);
        const isActive = activeSkin === skin.color;

        if (isOwned) item.classList.add('owned');
        if (isActive) item.classList.add('active');

        item.onclick = () => tryBuyOrEquip(skin);

        // Se for rainbow, usa classe especial, senão usa cor normal
        let previewStyle = `background:${skin.color}; box-shadow: 0 0 10px ${skin.color}`;
        let previewClass = "skin-preview";
        if (skin.id === 'rainbow') {
            previewStyle = "";
            previewClass = "skin-preview rainbow-preview";
        }

        item.innerHTML = `
            <div class="${previewClass}" style="${previewStyle}"></div>
            <div style="font-size:0.8rem; color:#fff; margin-bottom:5px;">${skin.name}</div>
            <div class="skin-price">${skin.price} $</div>
            <div class="skin-owned-text">${isActive ? 'EQUIPADO' : 'EQUIPAR'}</div>
        `;
        shopGrid.appendChild(item);
    });
}

function tryBuyOrEquip(skin) {
    if (ownedSkins.includes(skin.id)) {
        activeSkin = skin.color;
        localStorage.setItem('snakeActiveSkin', activeSkin);
        showToast("Skin Equipada!", "success");
        renderShop();
    } else {
        if (userCoins >= skin.price) {
            userCoins -= skin.price;
            ownedSkins.push(skin.id);
            localStorage.setItem('snakeCoins', userCoins);
            localStorage.setItem('snakeOwnedSkins', JSON.stringify(ownedSkins));
            if(coinsEl) coinsEl.innerText = userCoins;
            showToast("Compra realizada!", "success");
            renderShop();
        } else {
            showToast("Moedas insuficientes!");
        }
    }
}