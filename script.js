// ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
// Этот блок автоматически связывает игру с мессенджером
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();        // Сообщаем TG, что игра загрузилась успешно
    tg.expand();       // Раскрываем игру на весь экран смартфона
}

// Получаем реальные данные игрока из Telegram. Если тестируем на ПК — включаются "гостевые" настройки
const userId = tg?.initDataUnsafe?.user?.id || "local_host_user";
const username = tg?.initDataUnsafe?.user?.username || "Scavenger";

// ФУНКЦИЯ СОХРАНЕНИЯ ОЧКОВ В СИСТЕМУ
function saveCoinsToSystem(finalScore) {
    console.log(`Игрок ${username} (ID: ${userId}) набрал крышек: ${finalScore}`);

    // ======================================================================
    // КОГДА СОЗДАШЬ СВОЙ СЕРВЕР, ПРОСТО ЗАМЕНИ URL НИЖЕ НА СВОЮ ССЫЛКУ!
    // Пример: const url = "https://my-tg-bot-server.ru/api/save";
    // ======================================================================
    const url = "СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ_НА_СВОЙ_СЕРВЕР_ПОЗЖЕ"; 

    // Если ссылки еще нет, спасаем очки — пишем в локальную память телефона (localStorage)
    if (url.includes("СЮДА_ТЫ_ВСТАВИШЬ_ССЫЛКУ")) {
        let currentBalance = parseInt(localStorage.getItem("total_caps") || "0");
        currentBalance += finalScore;
        localStorage.setItem("total_caps", currentBalance);
        console.log("Сервер не подключен. Очки сохранены в память телефона. Общий баланс: " + currentBalance);
        return; 
    }

    // Если ссылка на сервер есть — отправляем данные в твою базу данных
    const data = {
        telegram_id: userId,
        username: username,
        score: finalScore
    };

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => console.log("Успешно отправлено на сервер!"))
    .catch(err => console.error("Ошибка сети при отправке на сервер:", err));
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ХИТБОКСОВ
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
        this.width = 45; 
        this.height = 45;
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

Cactus.prototype.update = function(speed) {
    this.x += speed;
    if (this.isFlying) {
        this.moveTimer++;
        if (this.moveTimer >= this.moveInterval) {
            this.directionY *= -1; 
            this.moveTimer = 0;
        }
        this.y += this.directionY * this.speedY;
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

AtomCap.prototype.update = function(speed) {
    this.x += speed;
    this.tickCount++;
    if (this.tickCount >= this.animSpeed) {
        this.tickCount = 0;
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
    this.waveTicks += 0.05;
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

Game.prototype.update = function () {
    if(this.paused) return;
    if (this.startTimer > 0) { this.startTimer--; return; }
    
    this.gameTicks++;
    
    if (this.gameTicks % 600 === 0 && this.runSpeed > -9) {
        this.runSpeed -= 0.4;
    }

    this.dino.update(this.divider, this.gravity);
    
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    if(this.atomCaps.length > 0 && rightWall(this.atomCaps[0]) < 0) this.atomCaps.shift();
    
    this.cactusSpawnTimer++;
    if (this.cactusSpawnTimer > 110) { 
        if (Math.random() < 0.4) {
            this.cacti.push(new Cactus(this.width, this.divider.y));
            this.cactusSpawnTimer = 0; 
        }
    }

    this.capSpawnTimer++;
    if (this.capSpawnTimer > 160 && this.atomCaps.length === 0) {
        this.spawnCapWave();
        this.capSpawnTimer = 0;
    }
    
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].update(this.runSpeed);
    
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
    
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 18 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 18 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 8 >= topWall(this.cacti[i]) &&
           topWall(this.dino) + 8 <= bottomWall(this.cacti[i])) {
               this.paused = true;
               
               // ОТПРАВКА ОЧКОВ ПРИ СМЕРТИ ПЕРСОНАЖА
               saveCoinsToSystem(this.score);

               alert(`ИГРА ОКОНЧЕНА!\nИгрок: ${username}\nСобрано за забег: ${this.score} крышек.`);
               window.location.reload(); 
        }
    }
    
    this.scoreTicks++;
    let pointsSpeed = this.runSpeed < -6 ? 20 : 30; 
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
