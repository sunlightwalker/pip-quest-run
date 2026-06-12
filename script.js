// --- ИНИЦИАЛИЗАЦИЯ И ЗАГРУЗКА ---
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const assets = {
    run: 'hero_land.png', jump: 'hero_jump.png', land: 'hero_run.png',
    barrel: 'barrel.png', trash: 'trash.png', roach: 'roach.png', atom: 'atom_sheet.png'
};
const images = {};
let loaded = 0;

Object.keys(assets).forEach(key => {
    images[key] = new Image();
    images[key].onload = () => { loaded++; if(loaded === Object.keys(assets).length) initGame(); };
    images[key].onerror = () => { loaded++; if(loaded === Object.keys(assets).length) initGame(); };
    images[key].src = assets[key];
});

// --- КЛАССЫ ИГРЫ (ОСНОВА) ---
function Dinosaur(x, groundY) {
    this.width = 65; this.height = 80; this.x = x;
    this.y = groundY - this.height; this.vy = 0;
    this.groundY = groundY;
}
Dinosaur.prototype.draw = function(ctx) {
    ctx.drawImage(images.run || new Image(), this.x, this.y, this.width, this.height);
};

// --- ФУНКЦИЯ ЗАПУСКА ---
function initGame() {
    let lastTime = performance.now();
    let score = 0;
    let groundY = 300;
    let dino = new Dinosaur(50, groundY);

    function update(dt) {
        score++;
    }

    function draw() {
        ctx.fillStyle = "#f5da9e";
        ctx.fillRect(0, 0, 640, 360);
        
        // Солнце
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath(); ctx.arc(500, 80, 40, 0, Math.PI*2); ctx.fill();
        
        // Земля
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(0, groundY, 640, 60);
        
        dino.draw(ctx);
        ctx.fillStyle = "#000";
        ctx.fillText("Крышки: " + Math.floor(score/10), 500, 30);
    }

    function loop(now) {
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        update(dt);
        draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
