function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.x + obj.width; }

// ЗАГРУЗКА ИГРОВЫХ КАРТИНОК
const imgRun = new Image(); imgRun.src = 'hero_land.png'; 
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_run.png'; 
const barrelImg = new Image(); barrelImg.src = 'barrel.png';
const trashImg = new Image(); trashImg.src = 'trash.png';
const roachImg = new Image(); roachImg.src = 'roach.png';

function Dinosaur (x, dividerY) {
    this.width = 65; 
    this.height = 80;
    this.x = x;
    this.baseY = dividerY - this.height; 
    this.y = this.baseY;
    this.vy = 0;
    
    this.normalJumpVelocity = -11.5; 
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
    }
    else if (this.vy !== 0 || this.y < this.baseY) {
        context.drawImage(imgJump, this.x, this.y, this.width, this.height);
    } 
    else {
        this.animTicks++;
        this.bobY = Math.sin(this.animTicks * 0.1) * 3; 
        context.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
    }
};

Dinosaur.prototype.jump = function(type) {
    if (!this.isLanding && this.y === this.baseY) {
        this.vy = (type === 'long') ? this.longJumpVelocity : this.normalJumpVelocity;
    }
};

Dinosaur.prototype.update = function(divider, gravity) {
    this.y += this.vy;
    this.vy += gravity;
    
    if (bottomWall(this) > topWall(divider) && this.vy > 0) {
        this.y = this.baseY;
        this.vy = 0;
        
        if (!this.isLanding) {
            this.isLanding = true;
            this.landTimer = 8; 
        }
    }
};

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

function Cactus(gameWidth, groundY, forceType) {
    let rand = Math.random();
    this.isFlying = false;

    if (forceType === "roach" || (rand > 0.75 && !forceType)) {
        this.img = roachImg;
        this.width = 40; this.height = 40;
        this.y = groundY - 155; 
        this.isFlying = true;
    } else if (rand < 0.4) {
        this.img = barrelImg;
        this.width = 35; this.height = 50;
    } else {
        this.img = trashImg;
        this.width = 75; this.height = 48; // Большой мусор
    }
    
    this.x = gameWidth;
    if (!this.isFlying) this.y = groundY - this.height;
}

Cactus.prototype.draw = function(context) {
    context.drawImage(this.img, this.x, this.y, this.width, this.height);
};

function Game () {
    var canvas = document.getElementById("game");
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext("2d");
    
    this.touchStartTime = 0;
    this.isReadyToJump = false;

    // ЖЕЛЕЗНОЕ СЕНСОРНОЕ УПРАВЛЕНИЕ (PointerEvents работают везде)
    canvas.addEventListener('pointerdown', (e) => {
        if (this.startTimer > 0 || this.paused) return;
        if (this.dino.y === this.dino.baseY) {
            this.touchStartTime = Date.now();
            this.isReadyToJump = true;
        }
    });

    canvas.addEventListener('pointerup', (e) => {
        if (!this.isReadyToJump) return;
        this.isReadyToJump = false;

        let pressDuration = Date.now() - this.touchStartTime;

        // Если зажали дольше 220мс — прыжок дальний, если просто тапнули — обычный
        if (pressDuration > 220) {
            this.dino.jump('long');
        } else {
            this.dino.jump('normal');
        }
    });

    // Клавиатура для ПК тоже остается
    window.addEventListener("keydown", (e) => { 
        if (e.key === " ") this.dino.jump('normal');
        if (e.key === "ArrowUp") this.dino.jump('long');
    });
    
    this.gravity = 0.65; 
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(Math.floor(0.1 * this.width), this.divider.y);
    this.cacti = [];
    
    this.runSpeed = -3.2; 
    this.paused = false;
    this.score = 0;
    this.startTimer = 180; 
}

Game.prototype.spawnCactus = function(prob, forceType) {
    if(Math.random() <= prob) {
        this.cacti.push(new Cactus(this.width, this.divider.y, forceType));
    }
};

Game.prototype.update = function () {
    if(this.paused) return;
    if (this.startTimer > 0) {
        this.startTimer--;
        return;
    }
    
    this.dino.update(this.divider, this.gravity);
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    
    if(this.cacti.length == 0) {
        this.spawnCactus(0.5);
    } else {
        let lastCactus = this.cacti[this.cacti.length - 1];
        let distance = this.width - leftWall(lastCactus);
        
        if (!lastCactus.isFlying && distance > 150 && distance < 160) {
            this.spawnCactus(0.25, "roach"); 
        } 
        else if (distance > 380) {
            this.spawnCactus(0.02); 
        }
    }
    
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].x += this.runSpeed;
    
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 15 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 15 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 4 >= topWall(this.cacti[i]) && 
           topWall(this.dino) + 4 <= bottomWall(this.cacti[i])) {
               this.paused = true;
               alert("ИГРА ОКОНЧЕНА!\nКапитал сохранен: " + this.score + " крышек.");
               window.location.reload(); // Автоматически перезагрузит страницу при клике на окне смерти
        }
    }
    this.score++;
};

Game.prototype.draw = function () {
    this.context.clearRect(0, 0, this.width, this.height);
    this.divider.draw(this.context);
    this.dino.draw(this.context);
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].draw(this.context);
    
    if (this.startTimer > 0) {
        let secondsLeft = Math.ceil(this.startTimer / 60);
        this.context.fillStyle = "#000000";
        this.context.font = "bold 40px 'Courier New', monospace";
        this.context.textAlign = "center";
        this.context.fillText(secondsLeft, this.width / 2, this.height / 2);
        this.context.textAlign = "left"; 
    }
    
    this.context.fillStyle = "#000000";
    this.context.font = "bold 16px monospace";
    this.context.fillText("CAPS: " + this.score, this.width - 130, 30);
};

var game = new Game();
function main () {
    game.update();
    game.draw();
    window.requestAnimationFrame(main);
}
window.requestAnimationFrame(main);
