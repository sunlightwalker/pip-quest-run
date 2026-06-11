function topWall(obj) { return obj.y; }
function bottomWall(obj) { return obj.y + obj.height; }
function leftWall(obj) { return obj.x; }
function rightWall(obj) { return obj.x + obj.width; }

// ЗАГРУЗКА ИГРОВЫХ КАРТИНОК
const imgRun = new Image(); imgRun.src = 'hero_run.png';
const imgJump = new Image(); imgJump.src = 'hero_jump.png';
const imgLand = new Image(); imgLand.src = 'hero_land.png'; 
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
    this.jumpVelocity = -14; // Чуть уменьшили силу прыжка под новую скорость
    
    this.animTicks = 0;
    this.bobY = 0; 
    
    this.landTimer = 0; 
    this.isLanding = false; 
}

Dinosaur.prototype.draw = function(context) {
    if (this.isLanding) {
        context.drawImage(imgLand, this.x, this.y, this.width, this.height);
        this.landTimer--;
        if (this.landTimer <= 0) {
            this.isLanding = false; 
        }
    }
    else if (this.vy !== 0 || this.y < this.baseY) {
        context.drawImage(imgJump, this.x, this.y, this.width, this.height);
    } 
    else {
        this.animTicks++;
        this.bobY = Math.sin(this.animTicks * 0.15) * 3; // Замедлили покачивание под темп бега
        context.drawImage(imgRun, this.x, this.y + this.bobY, this.width, this.height);
    }
};

Dinosaur.prototype.jump = function() {
    if (!this.isLanding) {
        this.vy = this.jumpVelocity;
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
            this.landTimer = 10; // Уменьшили задержку на колене для плавности
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

function Cactus(gameWidth, groundY) {
    let rand = Math.random();
    this.isFlying = false;

    if (rand < 0.4) {
        // Бочка на земле
        this.img = barrelImg;
        this.width = 35; this.height = 50;
    } else if (rand < 0.75) {
        // Мусор на земле
        this.img = trashImg;
        this.width = 55; this.height = 35;
    } else {
        // ТАРАКАН-БЛОКИРАТОР: Летит высоко под потолком прыжка!
        this.img = roachImg;
        this.width = 40; this.height = 40;
        this.y = groundY - 145; // ПОДНЯЛИ ВЫШЕ: перекрывает прыжок, проходим строго снизу пешком!
        this.isFlying = true;
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
    
    document.spacePressed = false;
    window.addEventListener("keydown", (e) => { 
        if (e.key === " " || e.key === "ArrowUp") document.spacePressed = true; 
    });
    window.addEventListener("keyup", (e) => { 
        if (e.key === " " || e.key === "ArrowUp") document.spacePressed = false; 
    });
    
    this.gravity = 0.75; // Уменьшили гравитацию, прыжок стал более плавным и размеренным
    this.divider = new Divider(this.width, this.height);
    this.dino = new Dinosaur(Math.floor(0.1 * this.width), this.divider.y);
    this.cacti = [];
    
    this.runSpeed = -4.5; // СРЕДНЯЯ СКОРОСТЬ (Было -6.5, теперь бег комфортный и контролируемый)
    this.paused = false;
    this.noOfFrames = 0;
    this.score = 0;
}

Game.prototype.spawnCactus = function(prob) {
    if(Math.random() <= prob) this.cacti.push(new Cactus(this.width, this.divider.y));
};

Game.prototype.update = function () {
    if(this.paused) return;
    
    if (document.spacePressed == true && bottomWall(this.dino) >= topWall(this.divider)) {
        this.dino.jump();
    }
    
    this.dino.update(this.divider, this.gravity);
    
    if(this.cacti.length > 0 && rightWall(this.cacti[0]) < 0) this.cacti.shift();
    
    if(this.cacti.length == 0) {
        this.spawnCactus(0.5);
    } else if (this.cacti.length > 0 && this.width - leftWall(this.cacti[this.cacti.length-1]) > 320) {
        // Увеличили дистанцию между препятствиями, чтобы игрок успевал среагировать
        this.spawnCactus(0.02); 
    } 
    
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].x += this.runSpeed;
    
    // Проверка хитбоксов
    for(let i = 0; i < this.cacti.length; i++){
        if(rightWall(this.dino) - 12 >= leftWall(this.cacti[i]) && 
           leftWall(this.dino) + 12 <= rightWall(this.cacti[i]) && 
           bottomWall(this.dino) - 4 >= topWall(this.cacti[i]) && 
           topWall(this.dino) + 4 <= bottomWall(this.cacti[i])) {
               this.paused = true;
               alert("ИГРА ОКОНЧЕНА!\nКапитал сохранен: " + this.score + " крышек.\nНажми F5 для перезапуска.");
        }
    }
    this.noOfFrames++;
    this.score = Math.floor(this.noOfFrames/10);
};

Game.prototype.draw = function () {
    this.context.clearRect(0, 0, this.width, this.height);
    this.divider.draw(this.context);
    this.dino.draw(this.context);
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].draw(this.context);
    
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
