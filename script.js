// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM ---
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const userId = tg?.initDataUnsafe?.user?.id || "local_host_user";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

function saveCoinsToSystem(finalScore) {
    const url = "СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ_НА_СВОЙ_СЕРВЕР_ПОЗЖЕ"; 
    if (url.includes("СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ")) {
        let currentBalance = parseInt(localStorage.getItem("total_caps") || "0");
        currentBalance += finalScore;
        localStorage.setItem("total_caps", currentBalance);
        return; 
    }
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegram_id: userId, username: username, score: finalScore }) }).catch(err => console.error(err));
}

// --- ВСЕ КЛАССЫ И ЛОГИКА (БЕЗ ИЗМЕНЕНИЙ) ---
function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.width === undefined ? obj.x : obj.x + obj.width; }

const imgRun = new Image(); imgRun.src = 'hero_land.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_run.png'; 
const barrelImg = new Image(); barrelImg.src = 'barrel.png';
const trashImg = new Image(); trashImg.src = 'trash.png';
const roachImg = new Image(); roachImg.src = 'roach.png';
const atomSheetImg = new Image(); atomSheetImg.src = 'atom_sheet.png';

function Dinosaur(x, dividerY) {
    this.width = 65; this.height = 80; this.x = x; this.baseY = dividerY - this.height; 
    this.y = this.baseY; this.vy = 0; this.animTicks = 0; this.isLanding = false; this.landTimer = 0;
}
Dinosaur.prototype.draw = function(ctx) {
    let img = this.isLanding ? imgLand : (this.y < this.baseY ? imgJump : imgRun);
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
};
Dinosaur.prototype.update = function(modifier) { this.animTicks += modifier * 60; if (this.isLanding) { this.landTimer -= modifier * 60; if (this.landTimer <= 0) this.isLanding = false; } };
Dinosaur.prototype.jump = function(type) { if (this.y >= this.baseY) this.vy = (type === 'long') ? -15.5 : -12; };
Dinosaur.prototype.physics = function(gravity, modifier) {
    this.y += this.vy * (modifier * 60); this.vy += gravity * (modifier * 60);
    if (this.y > this.baseY) { this.y = this.baseY; this.vy = 0; if (!this.isLanding) { this.isLanding = true; this.landTimer = 8; } }
};

function Divider(w, h) { this.width = w; this.height = 4; this.x = 0; this.y = h - 60; }
Divider.prototype.draw = function(ctx) { ctx.fillStyle = "#333"; ctx.fillRect(this.x, this.y, this.width, this.height); };

// --- НОВЫЙ ДИЗАЙН: СОЛНЦЕ И ГОРОД ---
function PostApocalypseSun() {}
PostApocalypseSun.prototype.draw = function(ctx) {
    ctx.fillStyle = "#FF4500";
    ctx.beginPath(); ctx.arc(550, 60, 20, 0, Math.PI * 2); ctx.fill();
};

function CityBackground(w, groundY) {
    this.buildings = [];
    for(let i=0; i<10; i++) this.buildings.push({ x: i*120, w: 100, h: 100 + Math.random()*150, isVegas: (i === 3) });
}
CityBackground.prototype.update = function(speed, modifier) {
    this.buildings.forEach(b => { b.x += speed * 0.15 * (modifier * 60); if(b.x + b.w < 0) b.x = 640; });
};
CityBackground.prototype.draw = function(ctx, groundY) {
    ctx.fillStyle = "#2F2F2F";
    this.buildings.forEach(b => {
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
        if(b.isVegas) { ctx.fillStyle = "#FFD700"; ctx.font = "bold 16px Courier New"; ctx.fillText("LAS VEGAS", b.x + 5, groundY - b.h + 20); ctx.fillStyle = "#2F2F2F"; }
    });
};

// --- ГЛАВНЫЙ КЛАСС ---
function Game() {
    this.canvas = document.getElementById("game");
    this.width = this.canvas.width; this.height = this.canvas.height;
    this.context = this.canvas.getContext("2d");
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(50, this.divider.y);
    this.sun = new PostApocalypseSun();
    this.cityBg = new CityBackground(this.width, this.divider.y);
    this.cacti = []; this.atomCaps = []; this.runSpeed = -4; this.paused = false; this.score = 0; this.lastTime = performance.now();
    
    // Управление только тач
    this.canvas.addEventListener('touchstart', (e) => { this.dino.jump('normal'); }, { passive: false });
}

Game.prototype.update = function(modifier) {
    if(this.paused) return;
    this.dino.update(modifier); this.dino.physics(0.6, modifier);
    this.cityBg.update(this.runSpeed, modifier);
    this.score += 0.1;
};

Game.prototype.draw = function(modifier) {
    let grad = this.context.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, "#8B4513"); grad.addColorStop(1, "#FF8C00");
    this.context.fillStyle = grad; this.context.fillRect(0, 0, this.width, this.height);
    
    this.sun.draw(this.context);
    this.cityBg.draw(this.context, this.divider.y);
    this.divider.draw(this.context);
    this.dino.draw(this.context);
    this.context.fillStyle = "#000"; this.context.fillText("CAPS: " + Math.floor(this.score), 580, 30);
};

var game = new Game();
function main(now) {
    let modifier = (now - game.lastTime) / 1000;
    game.lastTime = now;
    game.update(modifier);
    game.draw(modifier);
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
