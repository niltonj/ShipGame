// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
const game = {
    score: 0,
    lives: 3,
    isRunning: true,
    bossAppeared: false,
    bossDefeated: false,
    keys: {},
    mouseX: canvas.width / 2,
    mouseY: canvas.height / 2,
    useMouseControl: false
};

// Player ship
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 50,
    speed: 5,
    bullets: [],
    fireRate: 250,
    lastShot: 0
};

// Enemies array
const enemies = [];
const enemyBullets = [];

// Boss object
let boss = null;

// Star background for scrolling effect
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2
    });
}

// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    game.useMouseControl = false;
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouseX = e.clientX - rect.left;
    game.mouseY = e.clientY - rect.top;
    game.useMouseControl = true;
});

canvas.addEventListener('click', () => {
    game.useMouseControl = true;
    shootBullet();
});

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
});

// Draw functions
function drawPlayer() {
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(player.x - 8, player.y + player.height, 16, 8);
}

function drawBullet(bullet) {
    ctx.fillStyle = bullet.enemy ? '#ff0000' : '#ffff00';
    ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
}

function drawEnemy(enemy) {
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y + enemy.height);
    ctx.lineTo(enemy.x - enemy.width / 2, enemy.y);
    ctx.lineTo(enemy.x + enemy.width / 2, enemy.y);
    ctx.closePath();
    ctx.fill();
}

function drawBoss() {
    if (!boss) return;
    
    // Boss body
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(boss.x - boss.width / 2, boss.y, boss.width, boss.height);
    
    // Boss eyes
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(boss.x - 20, boss.y + 20, 15, 15);
    ctx.fillRect(boss.x + 5, boss.y + 20, 15, 15);
    
    // Boss health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = canvas.width / 2 - healthBarWidth / 2;
    const healthBarY = 50;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    const currentHealthWidth = (boss.health / boss.maxHealth) * healthBarWidth;
    ctx.fillStyle = boss.health > boss.maxHealth * 0.3 ? '#00ff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Boss name
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHEFÃO', canvas.width / 2, healthBarY - 10);
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

// Update functions
function updatePlayer() {
    if (game.useMouseControl) {
        // Mouse control
        player.x = game.mouseX;
        player.y = game.mouseY;
    } else {
        // Keyboard control
        if (game.keys['ArrowLeft'] || game.keys['a']) {
            player.x -= player.speed;
        }
        if (game.keys['ArrowRight'] || game.keys['d']) {
            player.x += player.speed;
        }
        if (game.keys['ArrowUp'] || game.keys['w']) {
            player.y -= player.speed;
        }
        if (game.keys['ArrowDown'] || game.keys['s']) {
            player.y += player.speed;
        }
        
        // Auto-fire with keyboard
        if (game.keys[' ']) {
            shootBullet();
        }
    }
    
    // Keep player in bounds
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function shootBullet() {
    const now = Date.now();
    if (now - player.lastShot > player.fireRate) {
        player.bullets.push({
            x: player.x,
            y: player.y,
            speed: 7
        });
        player.lastShot = now;
    }
}

function updateBullets() {
    // Update player bullets
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        player.bullets[i].y -= player.bullets[i].speed;
        if (player.bullets[i].y < 0) {
            player.bullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    if (boss || Math.random() < 0.98) return;
    
    enemies.push({
        x: Math.random() * (canvas.width - 60) + 30,
        y: -50,
        width: 30,
        height: 40,
        speed: 2,
        health: 1,
        lastShot: Date.now()
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // Enemy shoots
        const now = Date.now();
        if (now - enemy.lastShot > 1500 && Math.random() < 0.02) {
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height,
                speed: 4,
                enemy: true
            });
            enemy.lastShot = now;
        }
        
        // Remove if off screen
        if (enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}

function spawnBoss() {
    if (game.score >= 500 && !game.bossAppeared && !boss) {
        game.bossAppeared = true;
        boss = {
            x: canvas.width / 2,
            y: 50,
            width: 100,
            height: 80,
            health: 50,
            maxHealth: 50,
            speed: 3,
            direction: 1,
            lastShot: Date.now()
        };
        // Clear regular enemies
        enemies.length = 0;
    }
}

function updateBoss() {
    if (!boss) return;
    
    // Boss movement (side to side)
    boss.x += boss.speed * boss.direction;
    if (boss.x <= boss.width / 2 || boss.x >= canvas.width - boss.width / 2) {
        boss.direction *= -1;
    }
    
    // Boss shoots
    const now = Date.now();
    if (now - boss.lastShot > 800) {
        // Boss shoots 3 bullets
        for (let i = -1; i <= 1; i++) {
            enemyBullets.push({
                x: boss.x + i * 30,
                y: boss.y + boss.height,
                speed: 5,
                enemy: true
            });
        }
        boss.lastShot = now;
    }
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function checkCollisions() {
    // Player bullets vs enemies
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (bullet.x > enemy.x - enemy.width / 2 &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.y > enemy.y &&
                bullet.y < enemy.y + enemy.height) {
                enemies.splice(j, 1);
                player.bullets.splice(i, 1);
                game.score += 10;
                updateScore();
                break;
            }
        }
        
        // Check collision with boss
        if (boss && bullet.x > boss.x - boss.width / 2 &&
            bullet.x < boss.x + boss.width / 2 &&
            bullet.y > boss.y &&
            bullet.y < boss.y + boss.height) {
            boss.health--;
            player.bullets.splice(i, 1);
            game.score += 5;
            updateScore();
            
            if (boss.health <= 0) {
                game.bossDefeated = true;
                gameOver(true);
            }
        }
    }
    
    // Enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (bullet.x > player.x - player.width / 2 &&
            bullet.x < player.x + player.width / 2 &&
            bullet.y > player.y &&
            bullet.y < player.y + player.height) {
            enemyBullets.splice(i, 1);
            game.lives--;
            updateLives();
            if (game.lives <= 0) {
                gameOver(false);
            }
        }
    }
    
    // Enemies vs player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.x > player.x - player.width / 2 - enemy.width / 2 &&
            enemy.x < player.x + player.width / 2 + enemy.width / 2 &&
            enemy.y + enemy.height > player.y &&
            enemy.y < player.y + player.height) {
            enemies.splice(i, 1);
            game.lives--;
            updateLives();
            if (game.lives <= 0) {
                gameOver(false);
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = 'Pontos: ' + game.score;
}

function updateLives() {
    document.getElementById('lives').textContent = 'Vidas: ' + game.lives;
}

function gameOver(victory) {
    game.isRunning = false;
    const gameOverDiv = document.getElementById('game-over');
    const messageElement = document.getElementById('game-over-message');
    
    if (victory) {
        messageElement.textContent = '🎉 VITÓRIA! 🎉';
        messageElement.style.color = '#00ff00';
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Você derrotou o chefão!';
        subtitle.style.fontSize = '24px';
        subtitle.style.marginTop = '10px';
        messageElement.appendChild(subtitle);
    } else {
        messageElement.textContent = 'GAME OVER';
        messageElement.style.color = '#ff0000';
    }
    
    gameOverDiv.classList.remove('hidden');
}

// Main game loop
function gameLoop() {
    if (!game.isRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw
    updateStars();
    drawStars();
    
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBoss();
    checkCollisions();
    
    // Spawn enemies (if no boss)
    if (!boss) {
        spawnEnemy();
    }
    
    // Spawn boss
    spawnBoss();
    
    // Draw everything
    drawPlayer();
    player.bullets.forEach(drawBullet);
    enemyBullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    drawBoss();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
