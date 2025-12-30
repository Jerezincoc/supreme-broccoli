const options = document.querySelectorAll('.option');
const sndBlip = document.getElementById('snd-blip');
const sndStart = document.getElementById('snd-start');

let currentIndex = 0;
let isLocked = false; // Trava o menu quando escolhe um jogo

// Função para tocar sons (lida com erro de navegador)
function playSound(audio) {
    if (!audio) return;
    const clone = audio.cloneNode(); // Clona para permitir sons sobrepostos rápidos
    clone.volume = 0.5;
    clone.play().catch(() => console.log("Som bloqueado até interação"));
}

// Atualiza a classe .selected no HTML
function updateSelection() {
    options.forEach((opt, index) => {
        if (index === currentIndex) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

// Ação de entrar no jogo
function selectGame() {
    if (isLocked) return;
    
    const selectedOption = options[currentIndex];
    const link = selectedOption.getAttribute('data-link');

    // Se o link estiver vazio ou for placeholder
    if (!link || link === '#') {
        alert("JOGO EM MANUTENÇÃO!");
        return;
    }

    isLocked = true;
    playSound(sndStart);
    selectedOption.classList.add('chosen'); // Ativa animação de piscar

    // Espera 2 segundos antes de mudar de página
    setTimeout(() => {
        window.location.href = link;
    }, 2000);
}

// Controles de Teclado
document.addEventListener('keydown', (e) => {
    if (isLocked) return;

    if (e.key === 'ArrowUp') {
        currentIndex--;
        if (currentIndex < 0) currentIndex = options.length - 1;
        playSound(sndBlip);
        updateSelection();
    } 
    else if (e.key === 'ArrowDown') {
        currentIndex++;
        if (currentIndex >= options.length) currentIndex = 0;
        playSound(sndBlip);
        updateSelection();
    } 
    else if (e.key === 'Enter' || e.key === ' ') {
        selectGame();
    }
});

// Inicializa a seleção visualmente
updateSelection();