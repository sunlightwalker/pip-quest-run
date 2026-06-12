const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const userId = tg?.initDataUnsafe?.user?.id || "local";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

// Загрузка ресурсов
const imgRun = new Image(); imgRun.src = 'hero_land.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_run.png'; 
const barrelImg = new Image(); barrelImg.src = 'barrel.png';
const trashImg = new Image(); trashImg.src = 'trash.png';
const roachImg = new Image(); roachImg.src = 'roach.png';
const atomSheetImg = new Image(); atomSheetImg.src = 'atom_sheet.png';

// Класс Солнце (Маленькое оранжевое)
function PostApocalypseSun() {}
PostApocalypseSun.prototype.draw = function(context) {
    context.fillStyle = "#FF4500";
    context.beginPath();
    context.arc(550, 60, 20, 0, Math.PI * 2);
    context.fill();
};

// Класс Здания (с вывеской)
function CityBackground(gameWidth, groundY) {
    this.buildings = [];
    for(let i=0; i<8; i++) {
        this.buildings.push({ x: i*120, w: 100, h: 100 + Math.random()*150, isVegas: (i === 3) });
    }
}
CityBackground.prototype.update = function(speed) {
    this.buildings.forEach(b => {
        b.x += speed * 0.5;
        if(b.x + b.w < 0) b.x = 640;
    });
};
CityBackground.prototype.draw = function(context, groundY) {
    context.fillStyle = "#2F2F2F";
    this.buildings.forEach(b => {
        context.fillRect(b.x, groundY - b.h, b.w, b.h);
        if(b.isVegas) {
            context.fillStyle = "#FFD700";
            context.font = "bold 16px Courier New";
            context.fillText("LAS VEGAS", b.x + 5, groundY - b.h + 20);
            context.fillStyle = "#2F2F2F";
        }
    });
};

// Инициализация игры
function Game() {
    this.dividerY = 300;
    this.sun = new PostApocalypseSun();
    this.city = new CityBackground(640, this.dividerY);
    this.runSpeed = -4;
    this.lastTime = performance.now();

    // Управление только тач
    canvas.addEventListener('touchstart', (e) => { 
        this.dinoJump(); 
    }, { passive: false });
}

Game.prototype.dinoJump = function() { /* Логика прыжка */ };

Game.prototype.draw = function() {
    // Градиент неба
    let grad = ctx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, "#8B4513");
    grad.addColorStop(1, "#FF8C00");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    this.sun.draw(ctx);
    this.city.draw(ctx, this.dividerY);
    
    // Пол
    ctx.fillStyle = "#333";
    ctx.fillRect(0, this.dividerY, 640, 60);
};

function loop(now) {
    game.draw();
    requestAnimationFrame(loop);
}

const game = new Game();
requestAnimationFrame(loop);
