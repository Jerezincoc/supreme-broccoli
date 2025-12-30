class View {
    constructor(elementId, width, height, scale) {
        this.canvas = document.getElementById(elementId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width * BLOCK_SIZE;
        this.canvas.height = height * BLOCK_SIZE;
        this.ctx.scale(scale, scale);
        this.particles = [];
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBlock(x, y, colorId, isGhost = false) {
        if (colorId === 0) return;
        const ctx = this.ctx;
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;

        if (isGhost) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = COLORS[colorId];
            ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = COLORS[colorId];
            ctx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = COLORS[colorId];
            ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            
            // Efeito de brilho simples
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(px, py, BLOCK_SIZE, 4);
            ctx.fillRect(px, py, 4, BLOCK_SIZE);
        }
    }

    drawMatrix(matrix, offset, isGhost = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(x + offset.x, y + offset.y, value, isGhost);
                }
            });
        });
    }

    createExplosion(x, y, colorId) {
        const color = COLORS[colorId];
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x * BLOCK_SIZE + BLOCK_SIZE/2,
                y: y * BLOCK_SIZE + BLOCK_SIZE/2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color
            });
        }
    }

    drawParticles() {
        this.particles.forEach((p, index) => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 5, 5);
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // Gravidade
            p.life -= 0.05;

            if (p.life <= 0) this.particles.splice(index, 1);
        });
        this.ctx.globalAlpha = 1.0;
    }

    shakeScreen() {
        const wrapper = document.querySelector('.game-wrapper');
        wrapper.classList.remove('shake');
        void wrapper.offsetWidth;
        wrapper.classList.add('shake');
    }
}