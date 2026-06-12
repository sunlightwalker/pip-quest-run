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
    this.longJumpVelocity = -16;   
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
    } else if (this.vy !== 0 || this.y < this.baseY) {
        context.drawImage(imgJump, this.x, this.y, this.width, this.height);
    } else {
        this.animTicks++;
        this.bobY = Math.sin(this.animTicks * 0.1) * 3; 
        context.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
    }
};

Dinosaur.prototype.jump = function(type) {
    if (!this.isLanding && this.y === this.baseY && this.vy === 0) {
        this.vy = (type === 'long') ? this.longJumpVelocity : this.normalJumpVelocity;
    }
};

Dinosaur.prototype.update = function(divider, gravity) {
    this.y += this.vy;
    this.vy += gravity;
    if (bottomWall(this) > topWall(divider) && this.vy > 0) {
        this.y = this.baseY;
        this.vy = 0;
        if (!this.isLanding) { this.isLanding = true; this.landTimer = 8; }
    }
};

// ПОЛ / РАЗДЕЛИТЕЛЬ
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
        this.width = 40; this.height = 40;
        this.y = groundY - 150; 
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

// КРЫШКА АТОМ-КОЛА (5 КАДРОВ АНИМАЦИИ)
function AtomCap(x, y) {
    this.width = 35;
    this.height = 35;
    this.x = x;
    this.y = y;
    this.totalFrames = 5; // Настроено на 5 кадровый шаблон
    this.currentFrame = 0;
    this.animSpeed = 8; 
    this.tickCount = 0;
}

AtomCap.prototype.update = function(speed) {
    this.x += speed;
    this.tickCount++;
    if (this.tickCount >= this.animSpeed) {
        this.tickCount = 0;
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
};

AtomCap.prototype.draw = function(context) {
    if (!atomSheetImg.complete) return;
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
    this.isReadyToJump = false;

    // Управление
    canvas.addEventListener('pointerdown', (e) => {
        if (this.startTimer > 0 || this.paused) return;
        this.touchStartTime = Date.now();
        this.isReadyToJump = true;
    });
    canvas.addEventListener('pointerup', (e) => {
        if (!this.isReadyToJump) return;
        this.isReadyToJump = false;
        let pressDuration = Date.now() - this.touchStartTime;
        if (pressDuration > 200) this.dino.jump('long');
        else this.dino.jump('normal');
    });

    this.gravity = 0.6; 
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(50, this.divider.y);
    this.cacti = [];
    this.atomCaps = [];
    
    this.runSpeed = -4; // Стартовая скорость (медленно как в Дино)
    this.paused = false;
    this.score = 0;
    this.scoreTicks = 0; 
    this.gameTicks = 0; // Для ускорения
    this.startTimer = 120; 
}

// СПАВН ЦЕПОЧЕК КРЫШЕК (КАК В СОНИКЕ)
Game.prototype.spawnCapWave = function() {
    let type = Math.random();
    let count = 3 + Math.floor(Math.random() * 3); // 3-5 крышек в ряд
    let startX = this.width + 50;

    for (let i = 0; i < count; i++) {
        let x = startX + (i * 45);
        let y;
        if (type > 0.5) {
            // Цепочка по земле
            y = this.divider.y - 40;
        } else {
            // Цепочка дугой в воздухе
            y = this.divider.y - 120 - Math.sin(i * 0.8) * 40;
        }
        this.atomCaps.push(new AtomCap(x, y));
    }
};

Game.prototype.update = function () {
    if(this.paused) return;
    if (this.startTimer > 0) { this.startTimer--; return; }
    
    this.gameTicks++;
    
    // ПЛАВНОЕ УСКОРЕНИЕ (каждые 600 кадров / 10 сек)
    if (this.gameTicks % 600 === 0 && this.runSpeed > -10) {
        this.runSpeed -= 0.5;
    }

    this.dino.update(this.divider, this.gravity);
    
    // Удаление объектов за экраном
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    if(this.atomCaps.length > 0 && rightWall(this.atomCaps[0]) < 0) this.atomCaps.shift();
    
    // Спавн препятствий
    if(this.cacti.length == 0 || (this.width - leftWall(this.cacti[this.cacti.length-1]) > 300)) {
        if(Math.random() < 0.02) this.cacti.push(new Cactus(this.width, this.divider.y));
    }

    // Спавн крышек волнами
    if(this.atomCaps.length == 0) {
        if(Math.random() < 0.03) this.spawnCapWave();
    }
    
    // Движение врагов
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].x += this.runSpeed;
    
    // Движение и сбор крышек
    for (let i = 0; i < this.atomCaps.length; i++) {
        this.atomCaps[i].update(this.runSpeed);
        let cap = this.atomCaps[i];
        if (rightWall(this.dino) >= leftWall(cap) && 
            leftWall(this.dino) <= rightWall(cap) && 
            bottomWall(this.dino) >= topWall(cap) && 
            topWall(this.dino) <= bottomWall(cap)) {
                this.score += 10; // +10 за сбор
                this.atomCaps.splice(i, 1);
                i--;
        }
    }
    
    // Столкновения с врагами
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 20 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 20 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 10 >= topWall(this.cacti[i])) {
               this.paused = true;
               alert("ИГРА ОКОНЧЕНА!\nСобрано крышек: " + this.score);
               window.location.reload(); 
        }
    }
    
    // ПАССИВНЫЙ ДОХОД (+1 крышка раз в полсекунды)
    this.scoreTicks++;
    if (this.scoreTicks >= 30) {
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
