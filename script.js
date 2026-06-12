// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP ---
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();        
    tg.expand();       
}

const userId = tg?.initDataUnsafe?.user?.id || "local_host_user";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

// --- ФУНКЦИЯ СОХРАНЕНИЯ ОЧКОВ ---
function saveCoinsToSystem(finalScore) {
    const url = "СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ_НА_СВОЙ_СЕРВЕР_ПОЗЖЕ"; 
    if (url.includes("СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ")) {
        let currentBalance = parseInt(localStorage.getItem("total_caps") || "0");
        currentBalance += finalScore;
        localStorage.setItem("total_caps", currentBalance);
        return; 
    }
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: userId, username: username, score: finalScore })
    }).catch(err => console.error(err));
}

// --- ЗАГРУЗКА ИЗОБРАЖЕНИЙ (БЕЗОПАСНАЯ) ---
const assets = {
    run: 'hero_land.png', jump: 'hero_jump.png', land: 'hero_run.png',
    barrel: 'barrel.png', trash: 'trash.png', roach: 'roach.png', atom: 'atom_sheet.png'
};
const images = {};
let loadedImages = 0;
const totalImages = Object.keys(assets).length;

function loadImages(callback) {
    for (let key in assets) {
        images[key] = new Image();
        images[key].onload = () => { loadedImages++; if(loadedImages === totalImages) callback(); };
        images[key].onerror = () => { loadedImages++; if(loadedImages === totalImages) callback(); };
        images[key].src = assets[key];
    }
}

// --- КЛАССЫ ИГРЫ ---
function Dinosaur(x, dividerY) {
    this.width = 65; this.height = 80; this.x = x;
    this.baseY = dividerY - this.height; this.y = this.baseY;
    this.vy = 0; this.animTicks = 0; this.isLanding = false; this.landTimer = 0;
}

Dinosaur.prototype.draw = function(ctx) {
    let img = images.run;
    if (this.isLanding) img = images.land;
    else if (this.y < this.baseY) img = images.jump;
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
};

// --- ОСНОВНАЯ ЛОГИКА ---
function Game() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.lastTime = performance.now();
    this.paused = false;
    this.score = 0;
    this.dino = new Dinosaur(50, this.height - 80);
    this.cacti = [];
    this.runSpeed = -6;
}

Game.prototype.update = function(modifier) {
    if (this.paused) return;
    this.dino.update ? this.dino.update(modifier) : null;
    // Логика игры...
};

Game.prototype.draw = function() {
    this.ctx.fillStyle = "#f5da9e"; // Цвет фона
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.dino.draw(this.ctx);
    // Отрисовка остального...
};

// --- ЗАПУСК ИГРЫ ПОСЛЕ ЗАГРУЗКИ КАРТИНОК ---
const game = new Game();
function main(now) {
    let modifier = (now - game.lastTime) / 1000;
    game.lastTime = now;
    game.update(modifier);
    game.draw();
    window.requestAnimationFrame(main);
}

// Стартуем загрузку
loadImages(() => {
    console.log("Все ресурсы загружены, запускаем игру!");
    window.requestAnimationFrame(main);
});
