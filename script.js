const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let score = 0;
let playerY = 250;
let playerVy = 0;
let isJumping = false;

// Слушатели нажатий
canvas.addEventListener('touchstart', () => { if(!isJumping) { playerVy = -15; isJumping = true; } });
canvas.addEventListener('mousedown', () => { if(!isJumping) { playerVy = -15; isJumping = true; } });

function update() {
    // Гравитация
    playerVy += 0.8;
    playerY += playerVy;

    // Пол
    if (playerY > 250) {
        playerY = 250;
        playerVy = 0;
        isJumping = false;
    }

    score++;
}

function draw() {
    // Небо
    ctx.fillStyle = "#f5da9e";
    ctx.fillRect(0, 0, 640, 360);

    // Солнце
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.arc(500, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    // Земля
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(0, 300, 640, 60);

    // Игрок (Монополист)
    ctx.fillStyle = "#000";
    ctx.fillRect(50, playerY, 50, 50);

    // Счёт
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("Крышки: " + Math.floor(score/10), 500, 30);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
