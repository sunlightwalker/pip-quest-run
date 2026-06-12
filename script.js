// ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();        
    tg.expand();       
}

const userId = tg?.initDataUnsafe?.user?.id || "local_host_user";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

function saveCoinsToSystem(finalScore) {
    console.log(`Игрок ${username} (ID: ${userId}) набрал крышек: ${finalScore}`);
    const url = "СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ_НА_СВОЙ_СЕРВЕР_ПОЗЖЕ"; 

    if (url.includes("СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ")) {
        let currentBalance = parseInt(localStorage.getItem("total_caps") || "0");
        currentBalance += finalScore;
        localStorage.setItem("total_caps", currentBalance);
        return; 
    }

    const data = { telegram_id: userId, username: username, score: finalScore };
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error(err));
}

function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.width === undefined ? obj.x : obj.x + obj.width; }

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ПЕРСОНАЖА И ВРАГОВ
const imgRun = new Image(); imgRun.src = 'hero_land.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_run.png'; 
const barrelImg = new Image(); barrelImg.src = 'barrel.png';
const trashImg = new Image(); trashImg.src = 'trash.png';
const roachImg = new Image(); roachImg.src = 'roach.png';
const atomSheetImg = new Image(); atomSheetImg.src = 'atom_sheet.png';

// ПЕРСОНАЖ
function Dinosaur (x, dividerY) {
    this.width = 65; 
    this.height = 80;
    this.x = x;
    this.baseY = dividerY - this.height; 
    this.y = this.baseY;
    this.vy = 0;
    this.normalJumpVelocity = -12; 
    this.longJumpVelocity = -15.5;   
    this.animTicks = 0;
    this.bobY = 0; 
    this.landTimer = 0; 
    this.isLanding = false; 
}

Dinosaur.prototype.draw = function(context) {
    if (this.isLanding) {
        context.drawImage(imgLand, this.x, this.y, this.width, this.height);
    } else if (this.y < this.baseY) {
        context.drawImage(imgJump, this.x, this.y, this.width, this.height);
    } else {
        context.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
    }
};

Dinosaur.prototype.update = function(modifier) {
    this.animTicks += modifier * 60;
    this.bobY = Math.sin(this.animTicks * 0.1) * 3; 

    if (this.isLanding) {
        this.landTimer -= modifier * 60;
        if (this.landTimer <= 0) this.isLanding = false;
    }
};

Dinosaur.prototype.jump = function(type) {
    if (this.y >= this.baseY) {
        this.vy = (type === 'long') ? this.longJumpVelocity : this.normalJumpVelocity;
    }
};

Dinosaur.prototype.physics = function(gravity, modifier) {
    this.y += this.vy * (modifier * 60);
    this.vy += gravity * (modifier * 60);
    if (this.y > this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        if (!this.isLanding) { this.isLanding = true; this.landTimer = 8; }
    }
};

// ПОЛ (ДОРОГА ПУСТОШИ)
function Divider (gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = 6;
    this.x = 0;
    this.y = gameHeight - this.height - Math.floor(0.2 * gameHeight);
}
Divider.prototype.draw = function(context) {
    context.fillStyle = "#2b2b26";
    context.fillRect(this.x, this.y, this.width, this.height);
};

// МОЩНОЕ ЯДЕРНОЕ СОЛНЦЕ С СВЕЧЕНИЕМ И ЛУЧАМИ
function PostApocalypseSun(gameWidth) {
    this.x = gameWidth / 2; // По центру экрана для эпичности
    this.y = 80;
    this.radius = 55;
    this.angle = 0;
}
PostApocalypseSun.prototype.draw = function(context, modifier) {
    this.angle += 0.15 * modifier; 
    
    context.save();
    context.translate(this.x, this.y);
    
    // Эффект Glow (сияние) вокруг солнца
    let glow = context.createRadialGradient(0, 0, this.radius - 10, 0, 0, this.radius + 120);
    glow.addColorStop(0, "rgba(255, 140, 0, 0.6)");
    glow.addColorStop(0.4, "rgba(255, 69, 0, 0.2)");
    glow.addColorStop(1, "rgba(255, 69, 0, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(0, 0, this.radius + 120, 0, Math.PI * 2);
    context.fill();

    // Вращающиеся солнечные лучи
    context.rotate(this.angle);
    context.strokeStyle = "rgba(255, 165, 0, 0.18)";
    for (let i = 0; i < 16; i++) {
        context.rotate(Math.PI / 8);
        context.lineWidth = i % 2 === 0 ? 8 : 4; // Разная толщина лучей
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 500);
        context.stroke();
    }
    context.restore();

    // Само ядро солнца
    let sunGradient = context.createRadialGradient(this.x, this.y, 5, this.x, this.y, this.radius);
    sunGradient.addColorStop(0, "#ffffff");
    sunGradient.addColorStop(0.2, "#fffacd");
    sunGradient.addColorStop(0.7, "#ffa500");
    sunGradient.addColorStop(1, "#ff4500");
    
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = sunGradient;
    context.fill
