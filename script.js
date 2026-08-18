const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const difficultySelect = document.getElementById('difficulty');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.dot');
const bestScoreEl = document.getElementById('bestScore');

const settings = {
  easy: { ai: 2.7, ball: 5.0 },
  normal: { ai: 3.8, ball: 5.6 },
  hard: { ai: 5.0, ball: 6.2 }
};
const paddle = { width: 12, height: 92, speed: 8 };
const player = { x: 22, y: canvas.height / 2 - paddle.height / 2, score: 0 };
const computer = { x: canvas.width - paddle.width - 22, y: canvas.height / 2 - paddle.height / 2, score: 0 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 8, dx: 5.6, dy: 2.4 };
let running = false;
let inputY = canvas.height / 2;
let touchActive = false;
let keys = {};
let bestScore = Number(localStorage.getItem('neon-pong-best') || 0);
bestScoreEl.textContent = bestScore;

function currentSettings() { return settings[difficultySelect.value]; }
function setStatus(text, color = 'var(--yellow)') { statusText.textContent = text; statusDot.style.background = color; statusDot.style.boxShadow = `0 0 12px ${color}`; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function movePlayerTo(y) { player.y = clamp(y - paddle.height / 2, 0, canvas.height - paddle.height); }
function pointerToCanvas(event) { const rect = canvas.getBoundingClientRect(); return (event.clientY - rect.top) * (canvas.height / rect.height); }

function resetBall(direction = Math.random() > .5 ? 1 : -1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  const speed = currentSettings().ball;
  ball.dx = direction * speed;
  ball.dy = (Math.random() * 2 - 1) * speed * .62;
}

function resetGame() {
  player.score = 0; computer.score = 0;
  player.y = canvas.height / 2 - paddle.height / 2;
  computer.y = canvas.height / 2 - paddle.height / 2;
  resetBall(); running = false;
  startButton.textContent = '开始游戏'; setStatus('准备开始'); updateScore();
}

function updateScore() {
  document.getElementById('playerScore').textContent = player.score;
  document.getElementById('computerScore').textContent = computer.score;
}

function scorePoint(winner) {
  winner.score += 1;
  if (winner === player && winner.score > bestScore) { bestScore = winner.score; localStorage.setItem('neon-pong-best', bestScore); bestScoreEl.textContent = bestScore; }
  if (winner.score >= 7) { running = false; startButton.textContent = '再来一局'; setStatus(winner === player ? '你赢了！' : '电脑获胜', winner === player ? 'var(--cyan)' : 'var(--pink)'); }
  else resetBall(winner === player ? 1 : -1);
}

function update() {
  const speed = paddle.speed;
  if (keys.ArrowUp || keys.w) player.y -= speed;
  if (keys.ArrowDown || keys.s) player.y += speed;
  if (!touchActive && !keys.ArrowUp && !keys.ArrowDown && !keys.w && !keys.s) movePlayerTo(inputY);
  player.y = clamp(player.y, 0, canvas.height - paddle.height);

  const aiSpeed = currentSettings().ai;
  const target = ball.y - paddle.height / 2;
  if (computer.y < target - 8) computer.y += aiSpeed;
  if (computer.y > target + 8) computer.y -= aiSpeed;
  computer.y = clamp(computer.y, 0, canvas.height - paddle.height);

  ball.x += ball.dx; ball.y += ball.dy;
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) { ball.dy *= -1; ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius); }

  const hit = (p, isPlayer) => ball.dx * (isPlayer ? 1 : -1) < 0 && ball.x + (isPlayer ? -ball.radius : ball.radius) < (isPlayer ? p.x + p.width : p.x) + (isPlayer ? 0 : 0) && ball.x + (isPlayer ? -ball.radius : ball.radius) > (isPlayer ? p.x : p.x - p.width) && ball.y > p.y && ball.y < p.y + paddle.height;
  if (hit(player, true)) { ball.dx = Math.abs(ball.dx) * 1.015; ball.x = player.x + paddle.width + ball.radius; ball.dy += ((ball.y - (player.y + paddle.height / 2)) / (paddle.height / 2)) * 2.4; }
  if (hit(computer, false)) { ball.dx = -Math.abs(ball.dx) * 1.015; ball.x = computer.x - ball.radius; ball.dy += ((ball.y - (computer.y + paddle.height / 2)) / (paddle.height / 2)) * 2.4; }
  ball.dy = clamp(ball.dy, -8.5, 8.5);
  if (ball.x < -20) scorePoint(computer);
  if (ball.x > canvas.width + 20) scorePoint(player);
}

function roundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function draw() {
  ctx.fillStyle = '#080b16'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(137,146,172,.16)'; ctx.setLineDash([8, 12]); ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); ctx.setLineDash([]);
  ctx.shadowBlur = 20; ctx.shadowColor = '#63f5e8'; ctx.fillStyle = '#63f5e8'; roundedRect(player.x, player.y, paddle.width, paddle.height, 6);
  ctx.shadowColor = '#ff5ca8'; ctx.fillStyle = '#ff5ca8'; roundedRect(computer.x, computer.y, paddle.width, paddle.height, 6);
  ctx.shadowColor = '#ffd166'; ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  if (!running) { ctx.fillStyle = 'rgba(8,11,22,.42)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#f3f6ff'; ctx.font = '500 22px Space Grotesk, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(player.score >= 7 || computer.score >= 7 ? '点击“再来一局”继续' : '点击开始，或按空格键', canvas.width / 2, canvas.height / 2); }
}

function loop() { if (running) update(); draw(); updateScore(); requestAnimationFrame(loop); }
function toggleGame() { if (player.score >= 7 || computer.score >= 7) resetGame(); running = !running; startButton.textContent = running ? '暂停游戏' : '继续游戏'; setStatus(running ? '游戏进行中' : '已暂停', running ? 'var(--cyan)' : 'var(--yellow)'); }

startButton.addEventListener('click', toggleGame);
resetButton.addEventListener('click', resetGame);
difficultySelect.addEventListener('change', () => { resetBall(); setStatus(`难度：${difficultySelect.options[difficultySelect.selectedIndex].text}`); });
document.addEventListener('keydown', (event) => { keys[event.key] = true; if (event.key === ' ' || event.code === 'Space') { event.preventDefault(); toggleGame(); } if (event.key.toLowerCase() === 'r') resetGame(); });
document.addEventListener('keyup', (event) => { keys[event.key] = false; });
canvas.addEventListener('mousemove', (event) => { inputY = pointerToCanvas(event); touchActive = false; });
canvas.addEventListener('pointerdown', (event) => { touchActive = true; inputY = pointerToCanvas(event); movePlayerTo(inputY); canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', (event) => { if (touchActive) { inputY = pointerToCanvas(event); movePlayerTo(inputY); } });
canvas.addEventListener('pointerup', () => { touchActive = false; });
resetGame(); loop();
