// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Paddle dimensions and position
const paddleWidth = 10;
const paddleHeight = 80;
const paddleSpeed = 6;

// Player paddle (left)
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Computer paddle (right)
const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 6,
    dx: 5,
    dy: 5,
    speed: 5
};

// Game state
let isGameRunning = false;
let mouseY = canvas.height / 2;

// Keyboard input tracking
const keys = {};

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        isGameRunning = !isGameRunning;
    }

    if (e.key.toLowerCase() === 'r') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw paddles
    drawPaddle(player);
    drawPaddle(computer);

    // Draw ball
    drawBall();
}

// Update functions
function updatePlayerPaddle() {
    // Mouse control
    if (mouseY > canvas.height / 2) {
        player.y = Math.min(player.y + paddleSpeed, canvas.height - player.height);
    } else if (mouseY < canvas.height / 2) {
        player.y = Math.max(player.y - paddleSpeed, 0);
    }

    // Arrow keys control
    if (keys['ArrowUp']) {
        player.y = Math.max(player.y - paddleSpeed, 0);
    }
    if (keys['ArrowDown']) {
        player.y = Math.min(player.y + paddleSpeed, canvas.height - player.height);
    }

    // Boundary check
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function updateComputerPaddle() {
    // Simple AI: track the ball
    const computerCenter = computer.y + computer.height / 2;
    const difficulty = 3; // AI speed factor

    if (computerCenter < ball.y - 35) {
        computer.y = Math.min(computer.y + difficulty, canvas.height - computer.height);
    } else if (computerCenter > ball.y + 35) {
        computer.y = Math.max(computer.y - difficulty, 0);
    }

    // Boundary check
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Ball collision with paddles
    // Player paddle collision
    if (
        ball.dx < 0 &&
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx *= -1;
        ball.x = player.x + player.width + ball.radius;

        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy += hitPos * 3;
    }

    // Computer paddle collision
    if (
        ball.dx > 0 &&
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx *= -1;
        ball.x = computer.x - ball.radius;

        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy += hitPos * 3;
    }

    // Ball out of bounds (scoring)
    if (ball.x - ball.radius < 0) {
        computer.score++;
        resetBall();
    }

    if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() * 2 - 1) * ball.speed;
}

function resetGame() {
    player.score = 0;
    computer.score = 0;
    player.y = canvas.height / 2 - player.height / 2;
    computer.y = canvas.height / 2 - computer.height / 2;
    resetBall();
    isGameRunning = false;
    updateScore();
}

function updateScore() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// Game loop
function gameLoop() {
    drawGame();

    if (isGameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    } else {
        // Draw "Press SPACE to start" message
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }

    updateScore();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
