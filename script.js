const bird = document.getElementById('bird');
const gameContainer = document.getElementById('game-container');
const pipesContainer = document.getElementById('pipes-container');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const uiScreen = document.getElementById('ui-screen');
const uiTitle = document.getElementById('ui-title');
const uiSubtitle = document.getElementById('ui-subtitle');
const startBtn = document.getElementById('start-btn');

// Game Constants and Variables
const GRAVITY = 0.4;
const JUMP_VELOCITY = -7;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 1500; // ms
const PIPE_WIDTH = 60;
const GAP_SIZE = 170; // vertical gap between pipes

let birdY = 300;
let velocity = 0;
let isPlaying = false;
let isGameOver = false;
let score = 0;
let highScore = localStorage.getItem('neonFlappyHighScore') || 0;
let pipes = [];
let lastPipeSpawnTime = 0;
let animationFrameId;

// Initialize High Score Display
highScoreEl.innerText = highScore;

// Event Listeners
window.addEventListener('keydown', handleInput);
window.addEventListener('touchstart', handleInput);
window.addEventListener('mousedown', (e) => {
    // Avoid triggering jump if clicking the start button
    if (e.target !== startBtn) {
        handleInput(e);
    }
});

startBtn.addEventListener('click', startGame);

function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    
    if (isPlaying && !isGameOver) {
        jump();
    }
}

function jump() {
    velocity = JUMP_VELOCITY;
    
    // Rotate bird upwards slightly when jumping
    bird.style.transform = `rotate(-20deg)`;
}

function startGame() {
    // Reset Variables
    birdY = gameContainer.clientHeight / 2;
    velocity = 0;
    score = 0;
    pipes = [];
    isGameOver = false;
    isPlaying = true;
    
    // Update DOM
    pipesContainer.innerHTML = '';
    currentScoreEl.innerText = score;
    uiScreen.classList.remove('active');
    bird.style.top = `${birdY}px`;
    bird.style.transform = `rotate(0deg)`;
    
    lastPipeSpawnTime = performance.now();
    
    // Start Loop
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameOver = true;
    isPlaying = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonFlappyHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    
    uiTitle.innerHTML = 'GAME<br>OVER';
    uiTitle.style.background = 'linear-gradient(to right, #f43f5e, #fb923c)';
    uiTitle.style.webkitBackgroundClip = 'text';
    uiTitle.style.textShadow = '0 0 30px rgba(244, 63, 94, 0.4)';
    
    uiSubtitle.innerText = `Score: ${score}`;
    startBtn.innerText = 'PLAY AGAIN';
    
    uiScreen.classList.add('active');
    
    // Fall animation
    bird.style.transform = `rotate(90deg)`;
}

function spawnPipe(timestamp) {
    if (timestamp - lastPipeSpawnTime > PIPE_SPAWN_RATE) {
        const containerHeight = gameContainer.clientHeight;
        const minPipeHeight = 50;
        const maxPipeHeight = containerHeight - GAP_SIZE - minPipeHeight;
        
        // Random height for the top pipe
        const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
        
        const topPipe = document.createElement('div');
        topPipe.classList.add('pipe', 'top');
        topPipe.style.height = `${topPipeHeight}px`;
        topPipe.style.left = `${gameContainer.clientWidth}px`;
        
        const bottomPipe = document.createElement('div');
        bottomPipe.classList.add('pipe', 'bottom');
        bottomPipe.style.height = `${containerHeight - topPipeHeight - GAP_SIZE}px`;
        bottomPipe.style.left = `${gameContainer.clientWidth}px`;
        
        pipesContainer.appendChild(topPipe);
        pipesContainer.appendChild(bottomPipe);
        
        pipes.push({
            topEl: topPipe,
            bottomEl: bottomPipe,
            x: gameContainer.clientWidth,
            passed: false
        });
        
        lastPipeSpawnTime = timestamp;
    }
}

function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= PIPE_SPEED;
        
        p.topEl.style.left = `${p.x}px`;
        p.bottomEl.style.left = `${p.x}px`;
        
        // Score updating
        if (!p.passed && p.x + PIPE_WIDTH < 50) { // 50 is bird left position
            score++;
            currentScoreEl.innerText = score;
            p.passed = true;
            
            // Score animation
            currentScoreEl.style.transform = 'scale(1.5)';
            setTimeout(() => {
                currentScoreEl.style.transform = 'scale(1)';
            }, 150);
        }
        
        // Remove off-screen pipes
        if (p.x + PIPE_WIDTH < 0) {
            p.topEl.remove();
            p.bottomEl.remove();
            pipes.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Floor/Ceiling collision
    if (birdY < 0 || birdY + bird.clientHeight > gameContainer.clientHeight) {
        gameOver();
        return;
    }
    
    // Pipe collision
    const birdRect = bird.getBoundingClientRect();
    // Reduce hitbox slightly for better feel
    const hitboxMargin = 4;
    const birdHitbox = {
        left: birdRect.left + hitboxMargin,
        right: birdRect.right - hitboxMargin,
        top: birdRect.top + hitboxMargin,
        bottom: birdRect.bottom - hitboxMargin
    };
    
    for (let p of pipes) {
        const topRect = p.topEl.getBoundingClientRect();
        const bottomRect = p.bottomEl.getBoundingClientRect();
        
        if (
            (birdHitbox.right > topRect.left && birdHitbox.left < topRect.right && birdHitbox.top < topRect.bottom) ||
            (birdHitbox.right > bottomRect.left && birdHitbox.left < bottomRect.right && birdHitbox.bottom > bottomRect.top)
        ) {
            gameOver();
            return;
        }
    }
}

function gameLoop(timestamp) {
    if (!isPlaying) return;
    
    // Physics
    velocity += GRAVITY;
    birdY += velocity;
    bird.style.top = `${birdY}px`;
    
    // Rotation logic based on velocity
    if (velocity > 3) {
        bird.style.transform = `rotate(${Math.min(90, velocity * 4)}deg)`;
    }
    
    spawnPipe(timestamp);
    updatePipes();
    checkCollisions();
    
    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}
