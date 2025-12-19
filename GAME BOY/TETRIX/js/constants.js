const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;

// MUDEI DE 'const' PARA 'let' PRA PODER TROCAR NOS TEMAS
let COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // I
    '#0DFF72', // S
    '#F538FF', // Z
    '#FF8E0D', // L
    '#FFE138', // J
    '#3877FF'  // O
];

const PIECES = [
    null,
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[2, 2], [2, 2]],                   // O
    [[0, 3, 0], [0, 3, 0], [0, 3, 3]], // L
    [[0, 4, 0], [0, 4, 0], [4, 4, 0]], // J
    [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]], // I
    [[0, 6, 6], [6, 6, 0], [0, 0, 0]], // S
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]], // Z
];