// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM ---
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const userId = tg?.initDataUnsafe?.user?.id || "local_host_user";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

// --- ЗАГРУЗКА РЕСУРСОВ ---
const assets = {
    run: 'hero_land.png', jump: 'hero_jump.png', land: 'hero_run.png',
    barrel: 'barrel.png', trash: 'trash.png', roach: 'roach.png', atom: 'atom_sheet.png'
};
const images = {};
let loadedImages = 0;
const totalImages = Object.keys(assets).length;

function loadResources(callback) {
    Object.keys(assets).forEach(key => {
        images[key] = new Image();
        images[key].onload = () => { loadedImages++; if(loadedImages === totalImages) callback(); };
        images[key].onerror = () => { loadedImages++; if(loadedImages === totalImages) callback(); };
        images[key].src = assets[key];
    });
}

// --- КЛАССЫ (ГОРОД, СОЛНЦЕ, ГЕРОЙ) ---
function CityBackground(gameWidth, groundY) {
    this.buildings = [];
    for(let i=0; i<15; i++) this.buildings.push({x: i*100, w: 80, h: 100+Math.random()*150});
}
CityBackground.prototype.update = function(speed) {
    this.buildings.forEach(b => {
        b.x += speed * 0.1;
        if(b.x + b.w < 0) b.x = 640;
    });
};
CityBackground.prototype.draw = function(ctx, groundY) {
    ctx.fillStyle = "#5d4037";
    this.buildings.forEach(b => ctx.fillRect(b.x, groundY - b.h, b.w, b.h));
};

function PostApocalypseSun() {
    this.angle = 0;
}
PostApocalypseSun.prototype.draw = function(ctx) {
    this.angle += 0.01;
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath(); ctx.arc(500, 80, 40, 0, Math.PI*2); ctx.fill();
};

// --- ОСНОВНОЙ ЦИКЛ ---
function initGame() {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();
    let score = 0;
    let groundY = 300;
    let sun = new PostApocalypseSun();
    let city = new CityBackground(640, groundY);

    function loop(now) {
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        
        // Отрисовка
        ctx.fillStyle = "#f5da9e";
        ctx.fillRect(0, 0, 640, 360);
        
        sun.draw(ctx);
        city.update(-4);
        city.draw(ctx, groundY);
        
        // Земля
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(0, groundY, 640, 60);
        
        // Герой (рисуем картинку, если загрузилась)
        if(images.run.complete) ctx.drawImage(images.run, 50, groundY-80, 65, 80);
        else { ctx.fillStyle="#000"; ctx.fillRect(50, groundY-80, 65, 80); }

        score++;
        ctx.fillStyle = "#000";
        ctx.fillText("Крышки: " + Math.floor(score/10), 500, 30);
        
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// Запуск
loadResources(initGame);
