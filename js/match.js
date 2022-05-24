class Match {
  constructor(canvas, ctx, game) {
    this.game = game;
    this.canvas = canvas;
    this.ctx = ctx;
    this.background = null;
    this.backgroundMoveSpeed = 1;
    this.spaceship = null;
    this.alienArmy = null;
    this.score = 0;

    this.spaceshipShootingStart = null;
    this.spaceshipMoveStart = null;
    this.aliensShootingStart = Date.now();

    this.requestId = null;
    this.matchOn = false;
    this.lose = false;
    this.win = false;
    this.newRound = false;
    this.stopAnimationFrame = false;
    this.init();
  }

  init() {
    this.matchOn = true;
    this.background = new Background(
      this.canvas,
      this.ctx,
      this.backgroundMoveSpeed
    );
    this.spaceship = new Spaceship(this.canvas, this.ctx, this);
    this.alienArmy = new AlienArmy(this.canvas, this.ctx, 100, 100, this);
    this.createEventListeners();

    this.runEveryFrame();
  }

  createEventListeners() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft") {
        this.spaceship.ArrowLeft = true;
        this.spaceship.move();
        this.spaceshipMoveStart = Date.now();
      }
      if (e.code === "ArrowRight") {
        this.spaceship.ArrowRight = true;
        this.spaceship.move();
        this.spaceshipMoveStart = Date.now();
      }
      if (e.code === "Space") {
        this.spaceship.Space = true;
        this.spaceship.shoot();
        this.spaceshipShootingStart = Date.now();
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft") {
        this.spaceship.ArrowLeft = false;
        this.spaceshipMoveStart = null;
      }
      if (e.code === "ArrowRight") {
        this.spaceship.ArrowRight = false;
        this.spaceshipMoveStart = null;
      }
      if (e.code === "Space") {
        this.spaceship.Space = false;
        this.spaceshipShootingStart = null;
      }
    });
  }

  moveAll(currentTime) {
    this.background.move();
    this.alienArmy.moveBullets();
    if (this.spaceship) {
      this.spaceship.moveBullets();
      // Spaceship moving
      if (currentTime > this.spaceshipMoveStart + 10) {
        this.spaceshipMoveStart = Date.now();
        this.spaceship.move();
      }
    }
  }

  drawAll() {
    this.game.clearCanvas();
    this.background.draw();
    this.alienArmy.drawArmy();
    this.alienArmy.drawBullets();
    if (this.spaceship) {
      this.spaceship.draw();
      this.spaceship.drawLives();
      this.spaceship.drawBullets();
    }
    this.drawScore();
    this.drawHighScore();
  }

  checkCollision() {
    if (this.spaceship) {
      // Collision between bullets
      this.spaceship.checkCollisionWithBullets(this.alienArmy.aliensBullets);

      // Collision between bullets and ships
      if (this.alienArmy.aliens.length > 0) {
        this.spaceship.checkCollisionWithAliens(this.alienArmy.aliens);
      }
      this.alienArmy.checkCollisionWithSpaceship(this.spaceship);
    }
  }

  checkBoundaries() {
    // Alien Army
    this.alienArmy.checkBoundariesForBullets();
    // Spaceship
    this.spaceship.checkBoundariesForBullets();
  }

  spaceshipShooting(currentTime) {
    // Spaceship
    if (this.spaceship) {
      // Spaceship Shooting
      if (currentTime > this.spaceshipShootingStart + 100) {
        this.spaceshipShootingStart = Date.now();
        this.spaceship.shoot();
      }
    }
  }

  aliensShooting(currentTime) {
    if (this.alienArmy.aliens.length > 0) {
      if (currentTime > this.aliensShootingStart + 500) {
        this.aliensShootingStart = Date.now();
        this.alienArmy.shoot();
      }
    }
  }

  shooting(currentTime) {
    this.spaceshipShooting(currentTime);
    this.aliensShooting(currentTime);
  }

  ///////// RUN EVERY FRAME //////////
  runEveryFrame() {
    if (this.lose || this.win) {
      cancelAnimationFrame(this.requestId);
      return;
    }
    if (this.newRound) {
      cancelAnimationFrame(this.requestId);
      this.startNewRound();
      return;
    }
    if (this.stopAnimationFrame) {
      cancelAnimationFrame(this.requestId);
      return;
    }

    const currentTime = Date.now();
    this.drawAll();
    this.checkCollision();
    this.checkBoundaries();
    this.shooting(currentTime);
    this.moveAll(currentTime);
    this.requestId = window.requestAnimationFrame(() => {
      this.runEveryFrame();
    });
  }

  drawScore() {
    this.ctx.font = "16px serif";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(`Score: ${this.score}`, 5, 20);
  }

  trackScoreAndHighScore() {
    this.score += 1;
    if (this.highScore <= this.score) {
      this.highScore = this.score;
    }
  }

  // When your spaceship is hit by a bullet, it freeze, all the bullets disappear and you lose a life
  startNewRound() {
    this.newRound = false;
    setTimeout(() => {
      this.clearBullets();
      this.runEveryFrame();
    }, 500);
  }

  hasWon() {
    setTimeout(() => {
      this.win = true;
      this.drawEnd("win");
    }, 200);
  }
  hasLost() {
    this.lose = true;
    // this.requestId = null;
    this.drawEnd("lose");
  }

  drawEnd(result) {
    this.ctx.fillRect(
      this.canvas.width / 5,
      this.canvas.height / 3,
      (this.canvas.width / 5) * 3,
      this.canvas.height / 3
    );
    // const myWidth = this.ctx.measureText("My text").width;
    this.ctx.testBaseline = "middle";
    this.ctx.font = "30px serif";
    this.ctx.fillStyle = "red";
    this.ctx.textAlign = "center";

    if (result === "lose") {
      this.ctx.fillText(
        `You lost`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    }
    if (result === "win") {
      this.ctx.fillText(
        `You Won`,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    }
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );
  }

  clearBullets() {
    this.alienArmy.clearAmmunition();
    this.spaceship.clearAmmunition();
  }

  drawHighScore() {
    this.ctx.font = "16px serif";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      `High score: ${this.game.highScore}`,
      this.canvas.width - 100,
      20
    );
  }
}