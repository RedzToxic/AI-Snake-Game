const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const restartBtn = document.getElementById('restartBtn');

const GRID_SIZE = 17;
const CELL_SIZE = canvas.width / GRID_SIZE;
const INITIAL_SNAKE_LENGTH = 3;
const WIN_SCORE = (GRID_SIZE * GRID_SIZE) - INITIAL_SNAKE_LENGTH;

const GRASS_LIGHT = '#2d5a2d';
const GRASS_DARK = '#1f4a1f';
const SNAKE_HEAD = '#2255aa';
const SNAKE_BODY = '#113366';

const MOVE_DURATION = 150;

let snake = [];
let prevSnake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = 0;
let moveStartTime = 0;
let isGameOver = false;
let gameWon = false;

function initGame() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    prevSnake = snake.map(s => ({ ...s }));
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    highScore = 0;
    isGameOver = false;
    gameWon = false;
    spawnFood();
    messageElement.style.display = 'none';
    moveStartTime = performance.now();
    
    requestAnimationFrame(gameLoop);
}

function spawnFood() {
    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
        validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function update() {
    direction = { ...nextDirection };

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame(false);
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame(false);
        return;
    }

    prevSnake = snake.map(s => ({ ...s }));
    
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        
        if (score > highScore) {
            highScore = score;
        }
        
        if (score >= WIN_SCORE) {
            gameWon = true;
            endGame(true);
            return;
        }
        
        spawnFood();
    } else {
        snake.pop();
    }
}

function drawDeadEyes(head) {
    const eyeSize = CELL_SIZE / 5;
    const eyeOffset = CELL_SIZE / 4;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let i = -1; i <= 1; i += 2) {
        const eyeX = head.x * CELL_SIZE + CELL_SIZE / 2 + i * eyeOffset;
        const eyeY = head.y * CELL_SIZE + CELL_SIZE / 2;
        
        ctx.beginPath();
        ctx.moveTo(eyeX - eyeSize, eyeY - eyeSize);
        ctx.lineTo(eyeX + eyeSize, eyeY + eyeSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(eyeX - eyeSize, eyeY + eyeSize);
        ctx.lineTo(eyeX + eyeSize, eyeY - eyeSize);
        ctx.stroke();
    }
}

function drawInterpolated(progress) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const isEven = (x + y) % 2 === 0;
            ctx.fillStyle = isEven ? GRASS_LIGHT : GRASS_DARK;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }

    ctx.fillStyle = '#aa3333';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    if (prevSnake.length > 0) {
        const interpolatedSnake = prevSnake.map((prev, i) => {
            const curr = snake[i];
            if (!curr) return { ...prev };
            return {
                x: prev.x + (curr.x - prev.x) * progress,
                y: prev.y + (curr.y - prev.y) * progress
            };
        });

        ctx.strokeStyle = SNAKE_BODY;
        ctx.lineWidth = CELL_SIZE - 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (interpolatedSnake.length > 1) {
            ctx.beginPath();
            ctx.moveTo(
                interpolatedSnake[0].x * CELL_SIZE + CELL_SIZE / 2,
                interpolatedSnake[0].y * CELL_SIZE + CELL_SIZE / 2
            );
            for (let i = 1; i < interpolatedSnake.length; i++) {
                ctx.lineTo(
                    interpolatedSnake[i].x * CELL_SIZE + CELL_SIZE / 2,
                    interpolatedSnake[i].y * CELL_SIZE + CELL_SIZE / 2
                );
            }
            ctx.stroke();
        }

        if (interpolatedSnake.length > 1) {
            const tail = interpolatedSnake[interpolatedSnake.length - 1];
            ctx.fillStyle = SNAKE_BODY;
            ctx.beginPath();
            ctx.arc(
                tail.x * CELL_SIZE + CELL_SIZE / 2,
                tail.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 2 - 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const head = interpolatedSnake[0];
        ctx.fillStyle = SNAKE_HEAD;
        ctx.beginPath();
        ctx.arc(
            head.x * CELL_SIZE + CELL_SIZE / 2,
            head.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        if (isGameOver && !gameWon) {
            drawDeadEyes(head);
        } else {
            const eyeRadius = CELL_SIZE / 6;
            const eyeOffset = CELL_SIZE / 4;
            const eyeAngle = Math.atan2(
                food.y - head.y,
                food.x - head.x
            );

            ctx.fillStyle = '#ffffff';
            for (let i = -1; i <= 1; i += 2) {
                const eyeX = head.x * CELL_SIZE + CELL_SIZE / 2 + Math.cos(eyeAngle + i * 0.6) * eyeOffset;
                const eyeY = head.y * CELL_SIZE + CELL_SIZE / 2 + Math.sin(eyeAngle + i * 0.6) * eyeOffset;
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#000000';
            for (let i = -1; i <= 1; i += 2) {
                const eyeX = head.x * CELL_SIZE + CELL_SIZE / 2 + Math.cos(eyeAngle + i * 0.6) * (eyeOffset + 2);
                const eyeY = head.y * CELL_SIZE + CELL_SIZE / 2 + Math.sin(eyeAngle + i * 0.6) * (eyeOffset + 2);
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, eyeRadius / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function gameLoop(timestamp) {
    const elapsed = timestamp - moveStartTime;
    const progress = Math.min(elapsed / MOVE_DURATION, 1);
    
    drawInterpolated(progress);
    
    if (!isGameOver && progress >= 1) {
        update();
        moveStartTime = timestamp;
    }
    
    if (!isGameOver || (isGameOver && progress < 1)) {
        requestAnimationFrame(gameLoop);
    }
}

function endGame(won) {
    isGameOver = true;
    gameWon = won;
    
    messageElement.className = won ? 'win' : 'lose';
    messageTitle.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    
    if (won) {
        messageText.innerHTML = `You filled the entire play space!<br>Score: ${score} | High Score: ${highScore}`;
    } else {
        messageText.innerHTML = `Your score was ${score}<br>High Score: ${highScore}`;
    }
    messageElement.style.display = 'block';
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    const key = e.key.toLowerCase();

    if ((key === 'w' || key === 'arrowup') && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 's' || key === 'arrowdown') && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'a' || key === 'arrowleft') && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'd' || key === 'arrowright') && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
    }
});

restartBtn.addEventListener('click', initGame);

initGame();
