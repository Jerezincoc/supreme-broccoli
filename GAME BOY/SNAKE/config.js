// Carrega a skin salva ou usa Branco padrão
const savedSkin = localStorage.getItem('snakeActiveSkin') || '#ffffff';

const GameConfig = {
    // --- VISUAL ---
    gridSize: 40,
    tileSize: 15,
    colors: {
        // A cabeça continua com a string 'rainbow' para acionar a animação no draw()
        snakeHead: savedSkin, 
        
        snakeBody: (hue) => {
            // SE FOR RAINBOW, o corpo acompanha a animação do tempo (levemente mais escuro)
            if (savedSkin === 'rainbow') return `hsl(${(Date.now() / 5) % 360}, 100%, 40%)`; 
            
            // Se for Branco (padrão), usa o modo RGB de corpo (hue rotation)
            if (savedSkin === '#ffffff') return `hsl(${hue}, 100%, 40%)`; 
            
            // Se for outra skin, usa a cor sólida da skin (escurecida)
            return adjustColor(savedSkin, -40); 
        },
        shadow: (hue) => {
            // SE FOR RAINBOW, a sombra usa a animação do tempo
            if (savedSkin === 'rainbow') return `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`;
            if (savedSkin === '#ffffff') return `hsl(${hue}, 100%, 50%)`;
            return savedSkin;
        },
        walls: '#ff3939ff',
        background: '#000000'
    },

    // --- VELOCIDADES (ms) ---
    speed: {
        normal: 100,
        dash: 20,
        ghostDelayInitial: 1.20,
        ghostMinDelay: 0.35
    },

    // --- PONTUAÇÃO E COMBO ---
    gameplay: {
        comboTime: 12,
        fruitLifeTime: 15,
        ghostStartScore: 70,
        ghostSpawnRate: 70,
        ghostSpeedUpStart: 350,
        maxGhosts: 5
    },

    // --- FRUTAS ---
    fruits: {
        normal: { color: '#ffff00', glow: '#ffaa00', points: 1, grow: 1, type: 'normal' },
        bonus:  { color: '#00ffff', glow: '#0088ff', points: 5, grow: 5, type: 'bonus' }, 
        bad1:   { color: '#ff5500', glow: '#ff0000', points: 0, grow: -3, type: 'bad' }, 
        bad2:   { color: '#ff0000', glow: '#880000', points: 0, grow: -5, type: 'bad' }  
    }
};

// Função auxiliar para escurecer cor HEX (para o corpo da cobra)
function adjustColor(color, amount) {
    if (color === 'rainbow') return color;
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}