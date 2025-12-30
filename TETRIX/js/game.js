class Game {
    constructor() {
        this.arena = this.createMatrix(COLS, ROWS);
        this.piecesBag = [];
        
        this.player = {
            pos: {x: 0, y: 0},
            matrix: null,
            type: null,
            next: null,
            nextType: null,
            hold: null,
            holdType: null,
            canHold: true,
            score: 0,
            level: 1,
            lines: 0,
            combo: -1,
            backToBack: false,
            // NOVO: Rastrear ultimo movimento pra T-Spin
            lastMove: null // 'move', 'rotate', 'drop'
        };
        
        this.gameOver = false;
        this.targetScore = 500;
        
        this.fillBag();
        this.resetPiece();
    }

    createMatrix(w, h) {
        const matrix = [];
        while (h--) matrix.push(new Array(w).fill(0));
        return matrix;
    }

    createPiece(type) {
        if (!PIECES[type]) return null;
        return PIECES[type].map(row => [...row]);
    }

    fillBag() {
        const pieces = [1, 2, 3, 4, 5, 6, 7];
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        this.piecesBag = pieces;
    }

    getNextType() {
        if (this.piecesBag.length === 0) this.fillBag();
        return this.piecesBag.pop();
    }

    collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    }

    // NOVO: Detecta se é T-Spin (3 cantos bloqueados + ultimo movimento foi giro)
    isTSpin() {
        // 1. Só vale pra peça T (ID 1 na nossa lista constants.js?? Conferir se T é 1)
        // No seu constants.js: 1=T, 2=O, 3=L, 4=J, 5=I, 6=S, 7=Z
        if (this.player.type !== 1) return false; 

        // 2. Ultimo movimento TEM que ser rotação
        if (this.player.lastMove !== 'rotate') return false;

        // 3. Checa os 4 cantos da matriz 3x3
        // Cantos: (0,0), (2,0), (0,2), (2,2)
        const corners = [
            {x: 0, y: 0}, {x: 2, y: 0},
            {x: 0, y: 2}, {x: 2, y: 2}
        ];

        let blockedCorners = 0;
        corners.forEach(c => {
            const absX = this.player.pos.x + c.x;
            const absY = this.player.pos.y + c.y;
            
            // Bloqueado se: fora da tela OU tem bloco na arena
            if (absX < 0 || absX >= COLS || absY >= ROWS || 
               (absY >= 0 && this.arena[absY][absX] !== 0)) {
                blockedCorners++;
            }
        });

        // Regra oficial: Pelo menos 3 cantos bloqueados = T-Spin
        return blockedCorners >= 3;
    }

    arenaSweep() {
        // Verifica T-Spin ANTES de limpar as linhas
        const tSpin = this.isTSpin();

        let rowCount = 0;
        let linesCleared = [];

        outer: for (let y = this.arena.length - 1; y > 0; --y) {
            for (let x = 0; x < this.arena[y].length; ++x) {
                if (this.arena[y][x] === 0) continue outer;
            }

            const rowColor = this.arena[y].find(c => c !== 0);
            linesCleared.push({ y: y, color: rowColor });
            
            const row = this.arena.splice(y, 1)[0].fill(0);
            this.arena.unshift(row);
            ++y;
            rowCount++;
        }
        
        // PONTUAÇÃO
        if (rowCount > 0 || tSpin) { // Pontua se limpar linha OU se fez T-Spin (mesmo sem linha)
            this.player.combo++;
            
            let score = 0;
            
            // Tabela de Pontos (Baseada na oficial)
            if (tSpin) {
                // T-Spin vale muito!
                const tSpinScores = [400, 800, 1200, 1600]; // 0, 1, 2, 3 linhas
                score = tSpinScores[rowCount] * this.player.level;
            } else {
                // Normal
                const normalScores = [0, 100, 300, 500, 800];
                score = normalScores[rowCount] * this.player.level;
            }

            // Back-to-Back (Tetris ou T-Spin seguidos)
            // Se for (Tetris OU T-Spin) E o anterior tbm foi
            const isDifficult = (rowCount === 4 || tSpin);
            
            if (isDifficult) {
                if (this.player.backToBack) {
                    score = Math.floor(score * 1.5);
                }
                this.player.backToBack = true;
            } else if (rowCount > 0) {
                // Se limpou linha facil (1, 2 ou 3 sem tspin), perde o b2b
                this.player.backToBack = false;
            }
            // Se fez T-Spin sem linha (rowCount 0), mantem o b2b como tava

            // Combo
            if (this.player.combo > 0 && rowCount > 0) {
                score += (50 * this.player.combo * this.player.level);
            }

            this.player.score += score;
            if (rowCount > 0) this.player.lines += rowCount;
            this.checkLevelUp();
            
            return { 
                lines: linesCleared, 
                score: score, 
                combo: this.player.combo, 
                isTetris: rowCount === 4,
                isTSpin: tSpin,
                isB2B: (isDifficult && this.player.backToBack)
            };
        } else {
            this.player.combo = -1;
            return { lines: [] };
        }
    }

    checkLevelUp() {
        if (this.player.score >= this.targetScore) {
            this.player.level++;
            this.targetScore += (this.player.level * 800);
            return true;
        }
        return false;
    }

    resetPiece() {
        if (!this.player.nextType) {
            this.player.nextType = this.getNextType();
            this.player.next = this.createPiece(this.player.nextType);
        }

        this.player.type = this.player.nextType;
        this.player.matrix = this.player.next;

        this.player.nextType = this.getNextType();
        this.player.next = this.createPiece(this.player.nextType);
        
        this.player.pos.y = 0;
        this.player.pos.x = (this.arena[0].length / 2 | 0) - (this.player.matrix[0].length / 2 | 0);
        this.player.canHold = true;
        this.player.lastMove = 'none'; // Reseta movimento

        if (this.collide(this.arena, this.player)) {
            this.gameOver = true;
        }
    }

    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.arena, this.player)) {
            this.player.pos.x -= dir;
        } else {
            this.player.lastMove = 'move'; // Marca movimento
        }
    }

    playerRotate(dir) {
        const originalPos = { ...this.player.pos };
        this.rotate(this.player.matrix, dir);
        
        const kicks = [
            {x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0},
            {x: 0, y: -1}, {x: 2, y: 0}, {x: -2, y: 0}
        ];

        for (const offset of kicks) {
            this.player.pos.x += offset.x;
            this.player.pos.y += offset.y;
            
            if (!this.collide(this.arena, this.player)) {
                this.player.lastMove = 'rotate'; // Marca rotação (importante pro T-Spin)
                return;
            }
            
            this.player.pos.x = originalPos.x;
            this.player.pos.y = originalPos.y;
        }

        this.rotate(this.player.matrix, -dir);
    }

    playerHold() {
        if (!this.player.canHold) return;

        if (this.player.holdType === null) {
            this.player.holdType = this.player.type;
            this.player.hold = this.createPiece(this.player.holdType);
            this.resetPiece();
        } else {
            const tempType = this.player.type;
            this.player.type = this.player.holdType;
            this.player.holdType = tempType;

            this.player.matrix = this.createPiece(this.player.type);
            this.player.hold = this.createPiece(this.player.holdType);
            this.player.pos.y = 0;
            this.player.pos.x = (this.arena[0].length / 2 | 0) - (this.player.matrix[0].length / 2 | 0);
        }
        
        this.player.canHold = false;
        this.player.lastMove = 'none';
    }
}