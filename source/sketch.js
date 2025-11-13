// Лекція 3 — "Збирач монет"
// Керування: стрілки клавіатури або дотик на мобільному
// Стани: start → play → gameover
// Очки + рекорд (localStorage), таймер 30 секунд

let state = 'start';
let player, coins = [], coinCounter = 0;
let score = 0, best = 0;
let timeLeft = 30;        // секунд
const COIN_COUNT = 5;

function setup() {
  createCanvas(720, 420);
  textFont('Verdana');
  textSize(18);
  best = int(localStorage.getItem('best') || 0);
  initGame();
}

function initGame() {
  // Початкові значення
  player = { x: width/2, y: height/2, r: 16, speed: 220 }; // px/сек
  enemy = { x: width/4, y: height/4, r: 16, speed: 120 }; // px/сек
  coins = [];
  for (let i = 0; i < COIN_COUNT; i++) coins.push(spawnCoin());
  score = 0;
  timeLeft = 30;
  state = 'start';
}

function draw() {
  background(245);

  if (state === 'start') {
    drawScene();
    drawHUD();
    drawStartOverlay();
    return;
  }

  // Обчислюємо dt у секундах
  const dt = deltaTime / 1000;

  if (state === 'play') {
    updatePlayer(dt);
    enemyUpdate(dt);
    collectCoinsIfAny();
    updateTimer(dt);
  }

  drawScene();
  drawHUD();

  if (state === 'gameover') drawGameOverOverlay();
}

function drawScene() {
  // Монети
  noStroke();
  for (const c of coins) {
    fill(255, 204, 0);
    circle(c.x, c.y, c.r * 2);
  }
  // Гравець
  fill(80, 140, 255);
  circle(player.x, player.y, player.r * 2);
  fill(255,0,0)
  circle(enemy.x,enemy.y, enemy.r *2);
}

function drawHUD() {
  fill(20);
  textAlign(LEFT, TOP);
  text(`Очки: ${score}`, 10, 10);
  text(`Рекорд: ${best}`, 10, 34);
  // Таймер
  text(`Час: ${max(0, Math.ceil(timeLeft))} с`, 10, 58);
  
  // Швидкість ворога
  text(`Швидкість ворога: ${enemy.speed}`, width/2.8, 10);
  
  // FPS (необов'язково)
  textAlign(RIGHT, TOP);
  text(`FPS: ${frameRate().toFixed(0)}`, width - 10, 10);
}

function drawStartOverlay() {
  fill(0, 120);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Збирач монет', width/2, height/2 - 40);
  textSize(16);
  text('Стрілки — рух | Дотик — на мобільному\nНатисни [Space] щоб почати', width/2, height/2 + 10);
}

function drawGameOverOverlay() {
  fill(0, 140);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(26);
  text('Гру закінчено!', width/2, height/2 - 30);
  textSize(18);
  text(`\nРезультат: ${score}\nРекорд: ${best}\n Складність ворога: ${enemyDifficultyOut()}\n\n[Space] — ще раз   |   [S] — на стартове меню`, width/2, height/2 + 30);
}
function enemyDifficultyOut(){
  if(enemy.speed <= 150) return 'low';
  if(enemy.speed > 150 && enemy.speed <= 180) return 'medium';
  if(enemy.speed > 180 && enemy.speed <= 210) return 'hard';
  if(enemy.speed > 210) return 'extreme';
}
function updatePlayer(dt) {
  // Клавіатура
  let dx = 0, dy = 0;
  if (keyIsDown(LEFT_ARROW))  dx -= 1;
  if (keyIsDown(RIGHT_ARROW)) dx += 1;
  if (keyIsDown(UP_ARROW))    dy -= 1;
  if (keyIsDown(DOWN_ARROW))  dy += 1;

  // Тач: рух до першого дотику (простий варіант)
  if (touches.length > 0) {
    const tx = touches[0].x, ty = touches[0].y;
    const vx = tx - player.x, vy = ty - player.y;
    const len = max(1, Math.hypot(vx, vy));
    dx = vx / len; dy = vy / len;
  }

  // Нормалізація для діагоналі
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  // Межі
  player.x = constrain(player.x, player.r, width - player.r);
  player.y = constrain(player.y, player.r, height - player.r);
}
function enemyUpdate(dt){
  let dx = player.x - enemy.x, dy = player.y - enemy.y;
  
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  }
  
  enemy.x += dx * enemy.speed * dt;
  enemy.y += dy * enemy.speed * dt;
  
  if(dist(player.x, player.y, enemy.x, enemy.y) < player.r + enemy.r){ state = 'gameover' }
  if(coinCounter === 5){
    enemy.speed += 10;
    coinCounter = 0;
  }
  
  enemy.x = constrain(enemy.x, enemy.r, width - enemy.r)
  enemy.y = constrain(enemy.y, enemy.r, height - enemy.r)
}

function collectCoinsIfAny() {
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (dist(player.x, player.y, c.x, c.y) < player.r + c.r) {
      score++;
      coinCounter++;
      coins[i] = spawnCoinSafe(); // нова монета
    }
  }
}

function updateTimer(dt) {
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    state = 'gameover';
    if (score > best) {
      best = score;
      localStorage.setItem('best', best);
    }
  }
}

function spawnCoin() {
  return {
    x: random(20, width - 20),
    y: random(70, height - 20),
    r: 12
  };
}

// Уникаємо появи монети "всередині" гравця
function spawnCoinSafe() {
  let c;
  let attempts = 0;
  do {
    c = spawnCoin();
    attempts++;
    if (attempts > 50) break;
  } while ((dist(player.x, player.y, c.x, c.y) < player.r + c.r + 20) && dist(enemy.x, enemy.y, c.x, c.y) < enemy.r + c.r + 20);
  return c;
}

// Керування станами
function keyPressed() {
  if (key === ' ' && state === 'start') state = 'play';
  else if (key === ' ' && state === 'gameover') {
    initGame();
    state = 'play';
  } else if ((key === 's' || key === 'S') && state === 'gameover') {
    initGame();  // повертаємось у стартове меню
  }
}
