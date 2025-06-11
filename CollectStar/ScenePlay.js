// Platform Game - Fixed Player Sprite Rendering

// Setup Canvas
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
canvas.style.border = '2px solid #333';
document.body.appendChild(canvas);

// Setup styling untuk body
document.body.style.margin = '0';
document.body.style.padding = '20px';
document.body.style.display = 'flex';
document.body.style.justifyContent = 'center';
document.body.style.alignItems = 'center';
document.body.style.minHeight = '100vh';
document.body.style.background = 'linear-gradient(135deg, #87ceeb 0%, #b6e388 100%)';
document.body.style.fontFamily = 'Arial, sans-serif';

const ctx = canvas.getContext('2d');

const assets = {
    sky: null,
    ground: null,
    star: null,
    dude: null,
    play: null,
    musuh: null
};

let assetsLoaded = false;
let loadedCount = 0;
const totalAssets = 6;

let score = 0;
let gameRunning = false;
let showMenu = true;
let highScore = 0;
let level = 1;
let maxLevel = 5;
let showNextLevel = false;
let showGameOver = false;

const player = {
    x: 40,
    y: 150,
    width: 70,      // Lebih kecil agar collision lebih pas
    height: 90,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    speed: 160,
    jumpPower: 390,
    bounce: 0.2,
    currentFrame: 0,
    animationTimer: 0,
    facing: 'right',
    frameWidth: 32,
    frameHeight: 48
};

const basePlatforms = [
    { x: 0, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 120, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 240, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 360, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 480, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 600, y: 570, width: 120, height: 24, type: 'ground' },
    { x: 720, y: 570, width: 80, height: 24, type: 'ground' },
    { x: 80,  y: 430, width: 180, height: 22, type: 'platform' },
    { x: 270, y: 340, width: 180, height: 22, type: 'platform' },
    { x: 460, y: 250, width: 180, height: 22, type: 'platform' },
    { x: 40,  y: 150, width: 180, height: 22, type: 'platform' }
];
let platforms = [];
let stars = [];
let enemies = [];

const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

const gravity = 300;
const deltaTime = 1/60;

function loadAssets() {
    assets.sky = new Image();
    assets.sky.onload = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.sky.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.sky.src = 'Sky.png';

    assets.ground = new Image();
    assets.ground.onload = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.ground.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.ground.src = 'assets/platform.png';

    assets.star = new Image();
    assets.star.onload = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.star.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.star.src = 'assets/star.png';

    assets.dude = new Image();
    assets.dude.onload = () => {
        loadedCount++;
        player.frameWidth = assets.dude.width / 8;
        player.frameHeight = assets.dude.height;
        checkAllAssetsLoaded();
    };
    assets.dude.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.dude.src = 'assets/dude.png';

    assets.play = new Image();
    assets.play.onload = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.play.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.play.src = 'assets/play.png';

    assets.musuh = new Image();
    assets.musuh.onload = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.musuh.onerror = () => { loadedCount++; checkAllAssetsLoaded(); };
    assets.musuh.src = 'assets/musuh.png';
}

function checkAllAssetsLoaded() {
    if (loadedCount >= totalAssets) {
        assetsLoaded = true;
        gameRunning = false;
        init();
    }
}

function createPlatformsAndStars() {
    platforms = basePlatforms.map(p => ({ ...p }));

    for (let i = 2; i <= level; i++) {
        let extraCount = Math.min(i, 5);
        for (let j = 0; j < extraCount; j++) {
            let width = 80 + Math.random() * 60;
            let height = 18 + Math.random() * 8;
            let x = 40 + Math.random() * (canvas.width - 160);
            let y = 120 + Math.random() * 400;
            platforms.push({
                x, y, width, height, type: 'platform'
            });
        }
    }

    stars = [];
    let starCount = 12 + (level - 1) * 3;
    for (let i = 0; i < starCount; i++) {
        const floatingPlatforms = platforms.filter(p => p.type === 'platform');
        const plat = floatingPlatforms[Math.floor(Math.random() * floatingPlatforms.length)];
        const margin = 20;
        const starWidth = 50;
        const maxX = plat.width - starWidth - margin;
        const minX = margin;
        let starX = plat.x + minX + Math.random() * (maxX - minX);
        if (maxX <= minX) {
            starX = plat.x + (plat.width - starWidth) / 2;
        }
        stars.push({
            x: starX,
            y: plat.y - 40,
            width: starWidth,
            height: 37,
            velocityY: 0,
            collected: false,
            bounce: Math.random() * 0.4 + 0.4
        });
    }

    // Tambahkan musuh mulai level 3, bertambah hingga max 5
    enemies = [];
    let enemyCount = 0;
    if (level >= 3) {
        enemyCount = Math.min(level - 2, 5); // level 3 = 1 musuh, dst, max 5
    }
    for (let i = 0; i < enemyCount; i++) {
        const plats = platforms.filter(p => p.type === 'platform');
        const plat = plats[Math.floor(Math.random() * plats.length)];
        let ex = plat.x + 10 + Math.random() * (plat.width - 60);
        if (plat.width < 60) ex = plat.x + plat.width / 2 - 20;
        enemies.push({
            x: ex,
            y: plat.y - 40,
            width: 40,
            height: 40,
            vx: Math.random() < 0.5 ? 60 : -60,
            plat: plat
        });
    }
}

function nextLevel() {
    if (score > highScore) highScore = score;
    level++;
    if (level > maxLevel) {
        level = 1;
        score = 0;
    }
    showNextLevel = true;
    gameRunning = false;
}

function drawNextLevel() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Level ' + level, canvas.width / 2, canvas.height / 2 - 80);

    ctx.font = '32px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Siap untuk tantangan berikutnya?', canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '28px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 + 10);

    const playBtnR = 60;
    const playBtnX = canvas.width / 2;
    const playBtnY = canvas.height / 2 + 100;

    if (assets.play && assets.play.complete && assets.play.naturalHeight !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(playBtnX, playBtnY, playBtnR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(assets.play, playBtnX - playBtnR, playBtnY - playBtnR, playBtnR * 2, playBtnR * 2);
        ctx.restore();
    } else {
        ctx.beginPath();
        ctx.arc(playBtnX, playBtnY, playBtnR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = '#0F0';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('PLAY', playBtnX, playBtnY + 10);
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updatePlayer() {
    if (keys['ArrowLeft']) {
        player.velocityX = -player.speed;
        player.facing = 'left';
        player.animationTimer++;
        if (player.animationTimer > 8) {
            player.currentFrame = (player.currentFrame + 1) % 4;
            player.animationTimer = 0;
        }
    } else if (keys['ArrowRight']) {
        player.velocityX = player.speed;
        player.facing = 'right';
        player.animationTimer++;
        if (player.animationTimer > 8) {
            player.currentFrame = (player.currentFrame + 1) % 4;
            player.animationTimer = 0;
        }
    } else {
        player.velocityX = 0;
        player.animationTimer = 0;
    }

    if (keys['ArrowUp'] && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }

    let prevX = player.x;
    let prevY = player.y;

    player.velocityY += gravity * deltaTime;
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;

    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }

    player.onGround = false;

    // Hanya deteksi tabrakan dari atas (landing)
    for (let platform of platforms) {
        if (isColliding(player, platform)) {
            if (prevY + player.height <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = -player.velocityY * player.bounce;
                player.onGround = true;
            }
            // Tidak ada else, jadi player bisa lewat samping/bawah platform
        }
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }
}

function updateStars() {
    for (let star of stars) {
        if (!star.collected) {
            star.velocityY += gravity * deltaTime * 0.5;
            star.y += star.velocityY * deltaTime;

            for (let platform of platforms) {
                if (isColliding(star, platform) && star.velocityY > 0) {
                    star.y = platform.y - star.height;
                    star.velocityY = -star.velocityY * star.bounce;
                }
            }

            if (star.y + star.height > canvas.height) {
                star.y = canvas.height - star.height;
                star.velocityY = -star.velocityY * star.bounce;
            }

            if (isColliding(player, star)) {
                collectStar(star);
            }
        }
    }
}

function updateEnemies() {
    for (let enemy of enemies) {
        enemy.x += enemy.vx * deltaTime;
        if (enemy.x < enemy.plat.x) {
            enemy.x = enemy.plat.x;
            enemy.vx *= -1;
        }
        if (enemy.x + enemy.width > enemy.plat.x + enemy.plat.width) {
            enemy.x = enemy.plat.x + enemy.plat.width - enemy.width;
            enemy.vx *= -1;
        }
        if (isColliding(player, enemy)) {
            showGameOver = true;
            gameRunning = false;
        }
    }
}

function collectStar(star) {
    star.collected = true;
    score += 10;

    let activeStars = stars.filter(s => !s.collected).length;
    if (activeStars === 0) {
        nextLevel();
    }
}

function drawBackground() {
    if (assets.sky && assets.sky.complete && assets.sky.naturalHeight !== 0) {
        ctx.drawImage(assets.sky, 0, 0, canvas.width, canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPlatforms() {
    for (let platform of platforms) {
        if (assets.ground && assets.ground.complete && assets.ground.naturalHeight !== 0) {
            ctx.drawImage(assets.ground, 
                platform.x, platform.y, 
                platform.width, platform.height);
        } else {
            if (platform.type === 'ground') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.fillStyle = '#228B22';
                ctx.fillRect(platform.x, platform.y, platform.width, 8);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            } else {
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(platform.x, platform.y, platform.width, 6);
                ctx.strokeStyle = '#8B7355';
                ctx.lineWidth = 1;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
    }
}

function drawPlayer() {
    if (assets.dude && assets.dude.complete && assets.dude.naturalHeight !== 0) {
        const frameCount = 8;
        const frameWidth = assets.dude.width / frameCount;
        const frameHeight = assets.dude.height;

        let frameX = 0;
        let frameY = 0;

        if (player.velocityX === 0) {
            frameX = 4 * frameWidth;
        } else if (player.facing === 'left') {
            frameX = (player.currentFrame % 4) * frameWidth;
        } else {
            frameX = (player.currentFrame % 4) * frameWidth;
        }

        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (player.facing === 'left') {
            ctx.scale(-1, 1);
        }
        ctx.drawImage(
            assets.dude,
            frameX, frameY,
            frameWidth, frameHeight,
            -player.width / 2, -player.height / 2,
            player.width, player.height
        );
        ctx.restore();
    } else {
        drawFallbackPlayer();
    }
}

function drawFallbackPlayer() {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(player.x + 2, player.y + 1, player.width - 22, 26);
    ctx.fillStyle = '#000';
    if (player.facing === 'left') {
        ctx.fillRect(player.x + 22, player.y + 20, 2, 1);
        ctx.fillRect(player.x + 24, player.y + 20,2, 1);
    } else {
        ctx.fillRect(player.x + player.width - 28, player.y + 10, 2, 2);
        ctx.fillRect(player.x + player.width - 16, player.y + 10, 2, 1);
    }
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x + 12, player.y + 44, player.width - 24, 40);
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(player.x + 4, player.y + 52, 14, 28);
    ctx.fillRect(player.x + player.width - 18, player.y + 52, 14, 28);
    ctx.fillStyle = '#000080';
    if (player.velocityX !== 0) {
        const offset = Math.sin(Date.now() * 0.02) * 4;
        ctx.fillRect(player.x + 18, player.y + 84, 14, 22);
        ctx.fillRect(player.x + player.width - 32, player.y + 84 + offset, 14, 22);
    } else {
        ctx.fillRect(player.x + 18, player.y + 84, 14, 22);
        ctx.fillRect(player.x + player.width - 32, player.y + 84, 14, 22);
    }
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 16, player.y + player.height - 8, 18, 8);
    ctx.fillRect(player.x + player.width - 34, player.y + player.height - 8, 18, 8);
}

function drawStars() {
    for (let star of stars) {
        if (!star.collected) {
            if (assets.star && assets.star.complete && assets.star.naturalHeight !== 0) {
                ctx.drawImage(assets.star, star.x, star.y, star.width, star.height);
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                let centerX = star.x + star.width / 2;
                let centerY = star.y + star.height / 2;
                let radius = star.width / 3;
                for (let i = 0; i < 5; i++) {
                    let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    let x = centerX + Math.cos(angle) * radius;
                    let y = centerY + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        if (assets.musuh && assets.musuh.complete && assets.musuh.naturalHeight !== 0) {
            ctx.drawImage(assets.musuh, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = "#c00";
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.fillStyle = "#fff";
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 8, 8);
        }
    }
}

function drawScore() {
    ctx.save();
    const barWidth = 240;
    const barHeight = 56;
    const barX = 16;
    const barY = 12;
    const radius = 22;

    ctx.beginPath();
    ctx.moveTo(barX + radius, barY);
    ctx.lineTo(barX + barWidth - radius, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
    ctx.lineTo(barX + barWidth, barY + barHeight - radius);
    ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
    ctx.lineTo(barX + radius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
    ctx.lineTo(barX, barY + radius);
    ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY + barHeight);
    grad.addColorStop(0, "#ffe066");
    grad.addColorStop(1, "#ff8fab");
    ctx.fillStyle = grad;
    ctx.shadowColor = "#ffb703";
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ff5e00";
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "#ffd700";
    drawCuteStar(ctx, barX + 18, barY + 14, 10, 5);
    drawCuteStar(ctx, barX + barWidth - 18, barY + barHeight - 14, 10, 5);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(barX + 50, barY + barHeight - 12, 7, 0, Math.PI * 2);
    ctx.arc(barX + barWidth - 50, barY + barHeight - 12, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#ffb3c6";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barX + barWidth / 2, barY + barHeight - 18, 12, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e85d04";
    ctx.stroke();

    ctx.font = 'bold 28px Comic Sans MS, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#222';
    ctx.fillText('Score: ' + score, barX + barWidth / 2, barY + barHeight / 2 - 2);

    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.fillText('Level: ' + level, canvas.width - 18, 28);
    ctx.fillStyle = '#FFF';
    ctx.fillText('Level: ' + level, canvas.width - 20, 26);

    ctx.restore();
}

function drawCuteStar(ctx, cx, cy, r, n) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 2 * n; i++) {
        let angle = (i * Math.PI) / n;
        let rad = i % 2 === 0 ? r : r / 2.2;
        ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawLoadingScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFF';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
    const barWidth = 200;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = canvas.height / 2 + 50;
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#0F0';
    const progress = loadedCount / totalAssets;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    ctx.textAlign = 'left';
}

function drawMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Collect Star', canvas.width / 2, canvas.height / 2 - 80);

    ctx.font = '28px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 - 20);

    const playBtnR = 70;
    const playBtnX = canvas.width / 2;
    const playBtnY = canvas.height / 2 + 70;

    if (assets.play && assets.play.complete && assets.play.naturalHeight !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(playBtnX, playBtnY, playBtnR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(assets.play, playBtnX - playBtnR, playBtnY - playBtnR, playBtnR * 2, playBtnR * 2);
        ctx.restore();
    } else {
        ctx.beginPath();
        ctx.arc(playBtnX, playBtnY, playBtnR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = '#0F0';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('PLAY', playBtnX, playBtnY + 15);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KAMU KALAH!', canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = '32px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Ayo coba lagi!', canvas.width / 2, canvas.height / 2);

    // Tombol RESTART lucu
    const btnW = 200;
    const btnH = 70;
    const btnX = canvas.width / 2 - btnW / 2;
    const btnY = canvas.height / 2 + 70;

    // Gradasi merah ke oranye
    const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(1, '#ff9900');

    // Kotak rounded
    ctx.save();
    ctx.beginPath();
    const radius = 28;
    ctx.moveTo(btnX + radius, btnY);
    ctx.lineTo(btnX + btnW - radius, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + radius);
    ctx.lineTo(btnX + btnW, btnY + btnH - radius);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - radius, btnY + btnH);
    ctx.lineTo(btnX + radius, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - radius);
    ctx.lineTo(btnX, btnY + radius);
    ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = "#ffb703";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#b22222";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Hiasan bintang kecil
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        let angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        let x = btnX + btnW / 2 + Math.cos(angle) * 32;
        let y = btnY + btnH / 2 + Math.sin(angle) * 22;
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Tulisan RESTART
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Comic Sans MS, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESTART', btnX + btnW / 2, btnY + btnH / 2 + 4);
    ctx.restore();
}
canvas.addEventListener('click', function(e) {
    if (showGameOver) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const btnW = 200;
        const btnH = 70;
        const btnX = canvas.width / 2 - btnW / 2;
        const btnY = canvas.height / 2 + 70;
        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
            showGameOver = false;
            showMenu = true;
            score = 0;
            level = 1;
            player.x = 100;
            player.y = 450;
            player.velocityX = 0;
            player.velocityY = 0;
            player.onGround = false;
            player.speed = 160;
            createPlatformsAndStars();
        }
        return;
    }
    if (showNextLevel) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const playBtnR = 60;
        const playBtnX = canvas.width / 2;
        const playBtnY = canvas.height / 2 + 100;
        const dist = Math.sqrt((mx - playBtnX) ** 2 + (my - playBtnY) ** 2);
        if (dist <= playBtnR) {
            showNextLevel = false;
            gameRunning = true;
            createPlatformsAndStars();
            player.x = 100;
            player.y = 450;
            player.velocityX = 0;
            player.velocityY = 0;
            player.onGround = false;
            player.speed = 160 + (level - 1) * 30;
        }
        return;
    }
    if (showMenu) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const playBtnR = 70;
        const playBtnX = canvas.width / 2;
        const playBtnY = canvas.height / 2 + 70;
        const dist = Math.sqrt((mx - playBtnX) ** 2 + (my - playBtnY) ** 2);
        if (dist <= playBtnR) {
            showMenu = false;
            gameRunning = true;
            score = 0;
            level = 1;
            player.speed = 160;
            createPlatformsAndStars();
        }
    }
});

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!assetsLoaded) {
        drawLoadingScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (showMenu) {
        drawBackground();
        drawMenu();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (showGameOver) {
        drawBackground();
        drawPlatforms();
        drawStars();
        drawEnemies();
        drawPlayer();
        drawScore();
        drawGameOver();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (showNextLevel) {
        drawBackground();
        drawPlatforms();
        drawStars();
        drawEnemies();
        drawPlayer();
        drawScore();
        drawNextLevel();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!gameRunning) return;

    updatePlayer();
    updateStars();
    updateEnemies();

    drawBackground();
    drawPlatforms();
    drawStars();
    drawEnemies();
    drawPlayer();
    drawScore();

    updateHighScore();

    requestAnimationFrame(gameLoop);
}

function init() {
    createPlatformsAndStars();
    console.log('Game initialized with musuh & game over!');
}

loadAssets();
gameLoop();