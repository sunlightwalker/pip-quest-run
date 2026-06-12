// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM ---
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

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
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(err => console.error(err));
}

function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.width === undefined ? obj.x : obj.x + obj.width; }

// --- ЗАГРУЗКА РЕСУРСОВ ---
const imgRun = new Image(); imgRun.src = 'hero_land.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_run.png'; 
const barrelImg = new Image(); barrelImg.src = 'barrel.png';
const trashImg = new Image(); trashImg.src = 'trash.png';
const roachImg = new Image(); roachImg.src = 'roach.png';
const atomSheetImg = new Image(); atomSheetImg.src = 'atom_sheet.png';

// --- КЛАССЫ ИГРЫ ---
function Dinosaur (x, dividerY) {
    this.width = 65; this.height = 80; this.x = x;
    this.baseY = dividerY - this.height; this.y = this.baseY;
    this.vy = 0; this.normalJumpVelocity = -12; this.longJumpVelocity = -15.5;   
    this.animTicks = 0; this.bobY = 0; this.landTimer = 0; this.isLanding = false; 
}
Dinosaur.prototype.draw = function(ctx) {
    if (this.isLanding) ctx.drawImage(imgLand, this.x, this.y, this.width, this.height);
    else if (this.y < this.baseY) ctx.drawImage(imgJump, this.x, this.y, this.width, this.height);
    else ctx.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
};
Dinosaur.prototype.update = function(m) { this.animTicks += m * 60; this.bobY = Math.sin(this.animTicks * 0.1) * 3; if (this.isLanding) { this.landTimer -= m * 60; if (this.landTimer <= 0) this.isLanding = false; } };
Dinosaur.prototype.jump = function(type) { if (this.y >= this.baseY) this.vy = (type === 'long') ? this.longJumpVelocity : this.normalJumpVelocity; };
Dinosaur.prototype.physics = function(g, m) { this.y += this.vy * (m * 60); this.vy += g * (m * 60); if (this.y > this.baseY) { this.y = this.baseY; this.vy = 0; if (!this.isLanding) { this.isLanding = true; this.landTimer = 8; } } };

function Divider(w, h) { this.width = w; this.height = 4; this.x = 0; this.y = h - Math.floor(0.2 * h); }
Divider.prototype.draw = function(ctx) { ctx.fillStyle = "#333"; ctx.fillRect(this.x, this.y, this.width, this.height); };

// --- ФОН: СЕРЫЙ ГОРОД И КРАСНЫЙ НЕОН ---
function CityBackground(w, groundY) {
    this.buildings = [];
    for(let i=0; i<10; i++) this.buildings.push({ x: i*120, w: 100, h: 100 + Math.random()*150, isVegas: (i === 3) });
}
CityBackground.prototype.update = function(speed, m) { this.buildings.forEach(b => { b.x += speed * 0.15 * (m * 60); if(b.x + b.w < 0) b.x = 640; }); };
CityBackground.prototype.draw = function(ctx, groundY) {
    ctx.fillStyle = "#555555";
    this.buildings.forEach(b => {
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
        if(b.isVegas) {
            ctx.shadowBlur = 15; ctx.shadowColor = "red";
            ctx.fillStyle = "#FF0000"; ctx.font = "bold 16px Courier New";
            ctx.fillText("LAS VEGAS", b.x + 5, groundY - b.h + 20);
            ctx.shadowBlur = 0; ctx.fillStyle = "#555555";
        }
    });
};

function Cactus(w, groundY, type) {
    let rand = Math.random(); this.isFlying = (type === "roach" || rand > 0.8);
    this.img = this.isFlying ? roachImg : (rand < 0.4 ? barrelImg : trashImg);
    this.width = this.isFlying ? 45 : (rand < 0.4 ? 35 : 70); this.height = this.isFlying ? 45 : (rand < 0.4 ? 50 : 45);
    this.x = w; this.y = this.isFlying ? groundY - 130 : groundY - this.height;
    this.baseY = this.y; this.directionY = 1; this.speedY = 1.2;
}
Cactus.prototype.update = function(s, m) { this.x += s * (m * 60); if(this.isFlying) { this.y += this.directionY * this.speedY; if(this.y < this.baseY - 50 || this.y > this.baseY + 40) this.directionY *= -1; } };
Cactus.prototype.draw = function(ctx) { ctx.drawImage(this.img, this.x, this.y, this.width, this.height); };

function AtomCap(x, y, isAir) { this.width = 35; this.height = 35; this.x = x; this.y = y; this.isAir = isAir; this.currentFrame = 0; this.tickCount = 0; }
AtomCap.prototype.update = function(s, m) { this.x += s * (m * 60); this.tickCount++; if(this.tickCount % 8 === 0) this.currentFrame = (this.currentFrame + 1) % 5; };
AtomCap.prototype.draw = function(ctx) { if(atomSheetImg.complete) ctx.drawImage(atomSheetImg, this.currentFrame * (atomSheetImg.width/5), 0, atomSheetImg.width/5, atomSheetImg.height, this.x, this.y, this.width, this.height); };

// --- ГЛАВНЫЙ ЦИКЛ ---
function Game() {
    this.canvas = document.getElementById("game"); this.width = this.canvas.width; this.height = this.canvas.height; this.context = this.canvas.getContext("2d");
    this.divider = new Divider(this.width, this.height); this.dino = new Dinosaur(50, this.divider.y);
    this.cityBg = new CityBackground(this.width, this.divider.y); this.cacti = []; this.atomCaps = []; this.runSpeed = -4; this.paused = false; this.score = 0; this.lastTime = performance.now(); this.startTimer = 120;
    this.canvas.addEventListener('touchstart', (e) => { if(this.startTimer <= 0) this.dino.jump('normal'); }, { passive: false });
}
Game.prototype.update = function(m) {
    if(this.paused || this.startTimer > 0) { if(this.startTimer > 0) this.startTimer -= m * 60; return; }
    this.dino.update(m); this.dino.physics(0.6, m); this.cityBg.update(this.runSpeed, m);
    this.cacti.forEach(c => c.update(this.runSpeed, m)); this.atomCaps.forEach(a => a.update(this.runSpeed, m));
    if(Math.random() < 0.02) this.cacti.push(new Cactus(this.width, this.divider.y));
    this.score += 0.1;
};
Game.prototype.draw = function(m) {
    ctx.fillStyle = "#333333"; ctx.fillRect(0,0, this.width, this.height);
    this.cityBg.draw(ctx, this.divider.y); this.divider.draw(ctx); this.dino.draw(ctx);
    this.cacti.forEach(c => c.draw(ctx)); this.atomCaps.forEach(a => a.draw(ctx));
    ctx.fillStyle = "#fff"; ctx.fillText("CAPS: " + Math.floor(this.score), 580, 30);
};

var game = new Game();
function main(now) {
    let m = (now - game.lastTime) / 1000; game.lastTime = now;
    game.update(m); game.draw(m); window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
