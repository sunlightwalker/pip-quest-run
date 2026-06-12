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
const imgRun = new Image(); imgRun.src = 'hero_run.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_land.png'; 
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

// ПОЛ
function Divider (gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = 4;
    this.x = 0;
    this.y = gameHeight - this.height - Math.floor(0.2 * gameHeight);
}
Divider.prototype.draw = function(context) {
    context.fillStyle = "#333333";
    context.fillRect(this.x, this.y, this.width, this.height);
};

// СОЛНЦЕ С ЛУЧАМИ
function PostApocalypseSun() {
    this.x = 120;
    this.y = 100;
    this.radius = 45;
    this.angle = 0;
}
PostApocalypseSun.prototype.draw = function(context, modifier) {
    this.angle += 0.2 * modifier; 
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    
    context.strokeStyle = "rgba(240, 210, 140, 0.15)";
    context.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
        context.rotate(Math.PI / 6);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 400);
        context.stroke();
    }
    context.restore();

    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(245, 222, 179, 0.6)";
    context.fill();
};

// РАЗРУШЕННЫЕ ЗДАНИЯ (ФОН)
function CityBackground(gameWidth, groundY) {
    this.gameWidth = gameWidth;
    this.groundY = groundY;
    this.buildings = [];
    this.parallaxSpeedFactor = 0.15;

    let currentX = 0;
    while (currentX < gameWidth + 300) {
        let width = 60 + Math.random() * 80;
        let height = 100 + Math.random() * 150;
        this.buildings.push({ x: currentX, width: width, height: height, seed: Math.random() });
        currentX += width - 5; 
    }
}

CityBackground.prototype.update = function(gameSpeed, modifier) {
    let speed = gameSpeed * this.parallaxSpeedFactor * (modifier * 60);
    
    for (let i = 0; i < this.buildings.length; i++) {
        this.buildings[i].x += speed;
    }

    if (this.buildings[0].x + this.buildings[0].width < 0) {
        let lastBuilding = this.buildings[this.buildings.length - 1];
        let first = this.buildings.shift();
        first.x = lastBuilding.x + lastBuilding.width - 5;
        first.height = 100 + Math.random() * 150;
        this.buildings.push(first);
    }
};

CityBackground.prototype.draw = function(context) {
    context.fillStyle = "rgba(110, 115, 105, 0.35)";
    
    for (let i = 0; i < this.buildings.length; i++) {
        let b = this.buildings[i];
        context.fillRect(b.x, this.groundY - b.height, b.width, b.height);
        
        context.fillStyle = "rgba(230, 235, 225, 1.0)";
        context.beginPath();
        if (b.seed > 0.5) {
            context.moveTo(b.x, this.groundY - b.height);
            context.lineTo(b.x + b.width * 0.4, this.groundY - b.height);
            context.lineTo(b.x, this.groundY - b.height + b.height * 0.2);
        } else {
            context.moveTo(b.x + b.width, this.groundY - b.height);
            context.lineTo(b.x + b.width * 0.5, this.groundY - b.height);
            context.lineTo(b.x + b.width, this.groundY - b.height + b.height * 0.3);
        }
        context.fill();
        context.fillStyle = "rgba(110, 115, 105, 0.35)";
    }
};

// ВРАГИ
function Cactus(gameWidth, groundY, forceType) {
    let rand = Math.random();
    this.isFlying = false;
    
    if (forceType === "roach" || (rand > 0.8)) {
        this.img = roachImg;
        this.width = 45; this.height = 45;
        this.baseY = groundY - 130; 
        this.y = this.baseY;
        this.isFlying = true;
        
        this.moveTimer = 0;
        this.moveInterval = 80 + Math.floor(Math.random() * 40); 
        this.directionY = Math.random() > 0.5 ? 1 : -1; 
        this.speedY = 1.2; 
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

Cactus.prototype.update = function(speed, modifier) {
    this.x += speed * (modifier * 60);
    if (this.isFlying) {
        this.moveTimer += modifier * 60;
        if (this.moveTimer >= this.moveInterval) {
            this.directionY *= -1; 
            this.moveTimer = 0;
        }
        this.y += this.directionY * this.speedY * (modifier * 60);
        let maxUp = this.baseY - 50;
        let maxDown = this.baseY + 40;
        if (this.y < maxUp) { this.y = maxUp; this.directionY = 1; }
        if (this.y > maxDown) { this.y = maxDown; this.directionY = -1; }
    }
};

Cactus.prototype.draw = function(context) {
    context.drawImage(this.img, this.x, this.y, this.width, this.height);
};

// КРЫШКА АТОМ-КОЛА
function AtomCap(x, y, isAir) {
    this.width = 35;
    this.height = 35;
    this.x = x;
    this.baseY = y; 
    this.y = y;
    this.isAir = isAir; 
    this.totalFrames = 5; 
    this.currentFrame = 0;
    this.animSpeed = 8; 
    this.tickCount = 0;
    this.waveTicks = Math.random() * 100; 
}

AtomCap.prototype.update = function(speed, modifier) {
    this.x += speed * (modifier * 60);
    this.tickCount += modifier * 60;
    if (this.tickCount >= this.animSpeed) {
        this.tickCount = 0;
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
    this.waveTicks += 0.05 * (modifier * 60);
    let amplitude = this.isAir ? 25 : 8; 
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
    this.lastTime = performance.now(); 

    const handleStart = (e) => {
        if (e.cancelable) e.preventDefault(); 
        if (this.startTimer > 0 || this.paused) return;
        this.touchStartTime = Date.now();
    };

    const handleEnd = (e) => {
        if (this.startTimer > 0 || this.paused) return;
        let pressDuration = Date.now() - this.touchStartTime;
        if (pressDuration > 220) this.dino.jump('long');
        else this.dino.jump('normal');
    };

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: true });
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mouseup', handleEnd);

    this.gravity = 0.6; 
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(50, this.divider.y);
    
    this.sun = new PostApocalypseSun();
    this.cityBg = new CityBackground(this.width, this.divider.y);

    this.cacti = [];
    this.atomCaps = [];
    
    this.runSpeed = -4; 
    this.paused = false;
    this.score = 0;
    this.scoreTicks = 0; 
    this.gameTicks = 0; 
    this.startTimer = 120; 

    this.cactusSpawnTimer = 0;
    this.capSpawnTimer = 0;
}

Game.prototype.spawnCapWave = function() {
    let type = Math.random() > 0.5; 
    let count = 3 + Math.floor(Math.random() * 3); 
    let startX = this.width + 100;

    if (this.cacti.length > 0) {
        let lastCactus = this.cacti[this.cacti.length - 1];
        if (this.width - lastCactus.x < 150) return; 
    }

    for (let i = 0; i < count; i++) {
        let x = startX + (i * 45);
        let y;
        if (!type) {
            y = this.divider.y - 45; 
        } else {
            y = this.divider.y - 125 - Math.sin(i * 0.8) * 35; 
        }
        this.atomCaps.push(new AtomCap(x, y, type));
    }
};

Game.prototype.update = function (modifier) {
    if(this.paused) return;
    if (this.startTimer > 0) { this.startTimer -= modifier * 60; return; }
    
    this.gameTicks += modifier * 60;
    
    if (this.gameTicks >= 600 && this.runSpeed > -9) {
        this.runSpeed -= 0.4;
        this.gameTicks = 0;
    }

    this.dino.update(modifier);
    this.dino.physics(this.gravity, modifier);
    this.cityBg.update(this.runSpeed, modifier);
    
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    if(this.atomCaps.length > 0 && rightWall(this.atomCaps[0]) < 0) this.atomCaps.shift();
    
    this.cactusSpawnTimer += modifier * 60;
    if (this.cactusSpawnTimer > 110) { 
        if (Math.random() < 0.4) {
            this.cacti.push(new Cactus(this.width, this.divider.y));
            this.cactusSpawnTimer = 0; 
        }
    }

    this.capSpawnTimer += modifier * 60;
    if (this.capSpawnTimer > 160 && this.atomCaps.length === 0) {
        this.spawnCapWave();
        this.capSpawnTimer = 0;
    }
    
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].update(this.runSpeed, modifier);
    
    for (let i = 0; i < this.atomCaps.length; i++) {
        this.atomCaps[i].update(this.runSpeed, modifier);
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
    
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 18 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 18 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 8 >= topWall(this.cacti[i]) &&
           topWall(this.dino) + 8 <= bottomWall(this.cacti[i])) {
               this.paused = true;
               saveCoinsToSystem(this.score);
               alert(`ИГРА ОКОНЧЕНА!\nИгрок: ${username}\nСобрано за забег: ${this.score} крышек.`);
               window.location.reload(); 
        }
    }
    
    this.scoreTicks += modifier * 60;
    let pointsSpeed = this.runSpeed < -6 ? 20 : 30; 
    if (this.scoreTicks >= pointsSpeed) {
        this.score += 1;
        this.scoreTicks = 0;
    }
};

Game.prototype.draw = function (modifier) {
    this.context.fillStyle = "rgba(230, 235, 225, 1.0)";
    this.context.fillRect(0, 0, this.width, this.height);
    
    this.sun.draw(this.context, modifier);
    this.cityBg.draw(this.context);
    
    this.divider.draw(this.context);
    this.dino.draw(this.context);
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].draw(this.context);
    for (let i = 0; i < this.atomCaps.length; i++) this.atomCaps[i].draw(this.context);
    
    if (this.startTimer > 0) {
        let secondsLeft = Math.ceil(this.startTimer / 60);
        this.context.fillStyle = "#333333";
        this.context.font = "bold 40px Courier New";
        this.context.textAlign = "center";
        this.context.fillText(secondsLeft, this.width / 2, this.height / 2);
    }
    
    this.context.fillStyle = "#333333";
    this.context.font = "bold 20px Courier New";
    this.context.textAlign = "right";
    this.context.fillText("CAPS: " + this.score, this.width - 20, 40);
};

var game = new Game();
function main (now) {
    let modifier = (now - game.lastTime) / 1000;
    if (modifier > 0.1) modifier = 0.1; 
    game.lastTime = now;

    game.update(modifier);
    game.draw(modifier);
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
