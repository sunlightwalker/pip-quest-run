function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.x + obj.width; }

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
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
        this.landTimer--;
        if (this.landTimer <= 0) this.isLanding = false; 
    } else if (this.y < this.baseY) {
        context.drawImage(imgJump, this.x, this.y, this.width, this.height);
    } else {
        this.animTicks++;
        this.bobY = Math.sin(this.animTicks * 0.1) * 3; 
        context.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
    }
};

Dinosaur.prototype.jump = function(type) {
    // Упрощенная и надежная проверка для смартфонов: если на земле — прыгаем!
    if (this.y >= this.baseY) {
        this.vy = (type === 'long') ? this.longJumpVelocity : this.normalJumpVelocity;
    }
};

Dinosaur.prototype.update = function(divider, gravity) {
    this.y += this.vy;
    this.vy += gravity;
    if (this.y > this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        if (!this.isLanding) { this.isLanding = true; this.landTimer = 8; }
    }
};

// ПОЛ
function Divider (gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = 4;
    this.x = 0;
    this.y = gameHeight - this.height - Math.floor(0.2 * gameHeight);
}
Divider.prototype.draw = function(context) {
    context.fillStyle = "#000000";
    context.fillRect(this.x, this.y, this.width, this.height);
};

// ВРАГИ
function Cactus(gameWidth, groundY, forceType) {
    let rand = Math.random();
    this.isFlying = false;
    if (forceType === "roach" || (rand > 0.8)) {
        this.img = roachImg;
        this.width = 45; this.height = 45;
        this.y = groundY - 140; // Таракан теперь летит ВЫШЕ, над коробками
        this.isFlying = true;
    } else if (rand < 0.4) {
        this.img = barrelImg;
        this.width = 35; this.height = 50;
    } else {
        this.img = trashImg;
        this.width = 70; this.height = 45; 
    }
    this.x = gameWidth;
    if (!this.isFlying) this.y = groundY - this.height;
}
Cactus.prototype.draw = function(context) {
    context.drawImage(this.img, this.x, this.y, this.width, this.height);
};

// КРЫШКА АТОМ-КОЛА (С ДВИЖЕНИЕМ ВВЕРХ-ВНИЗ)
function AtomCap(x, y, isAir) {
    this.width = 35;
    this.height = 35;
    this.x = x;
    this.baseY = y; // Запоминаем стартовую высоту
    this.y = y;
    this.isAir = isAir; // Находится ли в воздухе
    this.totalFrames = 5; 
    this.currentFrame = 0;
    this.animSpeed = 8; 
    this.tickCount = 0;
    this.waveTicks = Math.random() * 100; // Случайный сдвиг фазы движения
}

AtomCap.prototype.update = function(speed) {
    this.x += speed;
    
    // Анимация вращения монеты
    this.tickCount++;
    if (this.tickCount >= this.animSpeed) {
        this.tickCount = 0;
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }

    // Движение Вверх-Вниз (синусоидальный эффект покачивания)
    this.waveTicks += 0.05;
    let amplitude = this.isAir ? 25 : 8; // Воздушные крышки качаются сильнее
    this.y = this.baseY + Math.sin(this.waveTicks) * amplitude;
};

AtomCap.prototype.draw = function(context) {
    if (!atomSheetImg.complete || atomSheetImg.width === 0) return;
    let frameWidth = atomSheetImg.width / this.totalFrames;
    context.drawImage(
        atomSheetImg,
        this.currentFrame * frameWidth, 0, frameWidth, atomSheetImg.height,
        this.x, this.y, this.width, this.height
    );
};

// ГЛАВНЫЙ КЛАСС ИГРЫ
function Game () {
    var canvas = document.getElementById("game");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    
    this.touchStartTime = 0;

    // СВЕРХНАДЕЖНОЕ НАЖАТИЕ ДЛЯ СМАРТФОНОВ (touch-события вместо pointer)
    const handleStart = (e) => {
        if (e.cancelable) e.preventDefault(); // Защита от скролла страницы браузером
        if (this.startTimer > 0 || this.paused) return;
        this.touchStartTime = Date.now();
    };

    const handleEnd = (e) => {
        if (this.startTimer > 0 || this.paused) return;
        let pressDuration = Date.now() - this.touchStartTime;
        if (pressDuration > 220) this.dino.jump('long');
        else this.dino.jump('normal');
    };

    // Слушатели для мобилок
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: true });
    
    // Резервные слушатели для ПК мыши
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mouseup', handleEnd);

    this.gravity = 0.6; 
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(50, this.divider.y);
    
    this.cacti = [];
    this.atomCaps = [];
    
    this.runSpeed = -4; 
    this.paused = false;
    this.score = 0;
    this.scoreTicks = 0; 
    this.gameTicks = 0; 
    this.startTimer = 120; 

    // Раздельные таймеры спавна, чтобы объекты не слипались
    this.cactusSpawnTimer = 0;
    this.capSpawnTimer = 0;
}

// СПАВН ЦЕПОЧЕК КРЫШЕК СВЕРХУ И СНИЗУ
Game.prototype.spawnCapWave = function() {
    let type = Math.random() > 0.5; // true = Воздух, false = Земля
    let count = 3 + Math.floor(Math.random() * 3); 
    let startX = this.width + 100;

    // Проверяем, чтобы рядом не было кактуса в момент спавна
    if (this.cacti.length > 0) {
        let lastCactus = this.cacti[this.cacti.length - 1];
        if (this.width - lastCactus.x < 150) return; // Слишком близко к врагу, отменяем спавн
    }

    for (let i = 0; i < count; i++) {
        let x = startX + (i * 45);
        let y;
        if (!type) {
            y = this.divider.y - 45; // Снизу на земле
        } else {
            y = this.divider.y - 125 - Math.sin(i * 0.8) * 35; // Сверху красивой дугой
        }
        this.atomCaps.push(new AtomCap(x, y, type));
    }
};

Game.prototype.update = function () {
    if(this.paused) return;
    if (this.startTimer > 0) { this.startTimer--; return; }
    
    this.gameTicks++;
    
    // ПЛАВНОЕ УСКОРЕНИЕ (каждые 10 сек)
    if (this.gameTicks % 600 === 0 && this.runSpeed > -9) {
        this.runSpeed -= 0.4;
    }

    this.dino.update(this.divider, this.gravity);
    
    // Очистка памяти
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    if(this.atomCaps.length > 0 && rightWall(this.atomCaps[0]) < 0) this.atomCaps.shift();
    
    // НЕЗАВИСИМЫЙ СПАВН ВРАГОВ
    this.cactusSpawnTimer++;
    if (this.cactusSpawnTimer > 110) { 
        if (Math.random() < 0.4) {
            this.cacti.push(new Cactus(this.width, this.divider.y));
            this.cactusSpawnTimer = 0; // Сброс таймера только при успешном спавне
        }
    }

    // НЕЗАВИСИМЫЙ СПАВН КРЫШЕК (С интервалом, чтобы не пересекаться с врагами)
    this.capSpawnTimer++;
    if (this.capSpawnTimer > 160 && this.atomCaps.length === 0) {
        this.spawnCapWave();
        this.capSpawnTimer = 0;
    }
    
    // Движение врагов
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].x += this.runSpeed;
    
    // Движение и сбор крышек
    for (let i = 0; i < this.atomCaps.length; i++) {
        this.atomCaps[i].update(this.runSpeed);
        let cap = this.atomCaps[i];
        if (rightWall(this.dino) - 5 >= leftWall(cap) && 
            leftWall(this.dino) + 5 <= rightWall(cap) && 
            bottomWall(this.dino) - 5 >= topWall(cap) && 
            topWall(this.dino) + 5 <= bottomWall(cap)) {
                this.score += 10; 
                this.atomCaps.splice(i, 1);
                i--;
        }
    }
    
    // Столкновения с врагами
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 18 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 18 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 8 >= topWall(this.cacti[i]) &&
           topWall(this.dino) + 8 <= bottomWall(this.cacti[i])) {
               this.paused = true;
               alert("ИГРА ОКОНЧЕНА!\nСобрано крышек: " + this.score);
               window.location.reload(); 
        }
    }
    
    // ПАССИВНЫЙ ДОХОД (+1 за шаги)
    this.scoreTicks++;
    let pointsSpeed = this.runSpeed < -6 ? 20 : 30; // При ускорении очки капают быстрее!
    if (this.scoreTicks >= pointsSpeed) {
        this.score += 1;
        this.scoreTicks = 0;
    }
};

Game.prototype.draw = function () {
    this.context.clearRect(0, 0, this.width, this.height);
    this.divider.draw(this.context);
    this.dino.draw(this.context);
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].draw(this.context);
    for (let i = 0; i < this.atomCaps.length; i++) this.atomCaps[i].draw(this.context);
    
    if (this.startTimer > 0) {
        let secondsLeft = Math.ceil(this.startTimer / 60);
        this.context.fillStyle = "#000000";
        this.context.font = "bold 40px Courier New";
        this.context.textAlign = "center";
        this.context.fillText(secondsLeft, this.width / 2, this.height / 2);
    }
    
    this.context.fillStyle = "#000000";
    this.context.font = "bold 20px Courier New";
    this.context.textAlign = "right";
    this.context.fillText("CAPS: " + this.score, this.width - 20, 40);
};

var game = new Game();
function main () {
    game.update();
    game.draw();
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
