// Game Configuration
const MAZE_WIDTH = 25;
const MAZE_HEIGHT = 25;
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 5;

// Responsive cell size: smaller on mobile
function getCellSize() {
    const w = window.innerWidth || 375;
    if (w < 500) return 24;
    if (w < 700) return 28;
    return 30;
}
let CELL_SIZE = getCellSize();

// Game State
let canvas, ctx;
let maze = [];
let player = { x: 1, y: 1 };
let goal = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 };
let problemsSolved = 0;
let currentLevel = 1;
let problemPoints = [];
let currentProblem = null;
let playerPixelX = CELL_SIZE + CELL_SIZE / 2;
let playerPixelY = CELL_SIZE + CELL_SIZE / 2;

// Initialize game
function init() {
    try {
        CELL_SIZE = getCellSize();
        
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context!');
            return;
        }
        
        canvas.width = MAZE_WIDTH * CELL_SIZE;
        canvas.height = MAZE_HEIGHT * CELL_SIZE;
        
        console.log('Canvas size set to:', canvas.width, 'x', canvas.height);
        
        generateMaze();
        console.log('Maze generated, size:', maze.length, 'x', maze[0] ? maze[0].length : 0);
        
        generateProblemPoints();
        console.log('Problem points generated:', problemPoints.length);
        
        updateUI();
        
        draw();
        console.log('Initial draw completed');
        
        // Event listeners
        document.addEventListener('keydown', handleKeyPress);
        
        // Mobile: D-pad touch controls
        setupDpad();
        
        const submitBtn = document.getElementById('submitAnswer');
        const skipBtn = document.getElementById('skipProblem');
        const newGameBtn = document.getElementById('newGame');
        const answerInput = document.getElementById('answerInput');
        
        if (submitBtn) submitBtn.addEventListener('click', checkAnswer);
        if (skipBtn) skipBtn.addEventListener('click', skipProblem);
        if (newGameBtn) {
            // Remove any existing listeners by cloning
            const newBtn = newGameBtn.cloneNode(true);
            newGameBtn.parentNode.replaceChild(newBtn, newGameBtn);
            
            // Add event listener to the new button
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('New Game button clicked!');
                newGame();
                return false;
            });
            
            // Also add onclick as backup
            newBtn.onclick = function(e) {
                e.preventDefault();
                console.log('New Game button onclick triggered!');
                newGame();
                return false;
            };
            
            console.log('New Game button event listeners attached');
        } else {
            console.error('New Game button not found!');
        }
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') checkAnswer();
            });
        }
        
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error starting game. Please check the console for details.');
    }
}

// Generate maze using recursive backtracking
function generateMaze() {
    // Initialize maze with walls
    maze = [];
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        maze[y] = [];
        for (let x = 0; x < MAZE_WIDTH; x++) {
            maze[y][x] = 1; // 1 = wall, 0 = path
        }
    }
    
    // Start from (1, 1)
    const stack = [{ x: 1, y: 1 }];
    maze[1][1] = 0;
    
    const directions = [
        { dx: 0, dy: -2 }, // up
        { dx: 2, dy: 0 },  // right
        { dx: 0, dy: 2 },  // down
        { dx: -2, dy: 0 }  // left
    ];
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];
        
        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            
            if (nx > 0 && nx < MAZE_WIDTH - 1 && 
                ny > 0 && ny < MAZE_HEIGHT - 1 && 
                maze[ny][nx] === 1) {
                neighbors.push({ x: nx, y: ny, dx: dir.dx, dy: dir.dy });
            }
        }
        
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[current.y + next.dy / 2][current.x + next.dx / 2] = 0;
            maze[next.y][next.x] = 0;
            stack.push({ x: next.x, y: next.y });
        } else {
            stack.pop();
        }
    }
    
    // Ensure start and goal are paths
    maze[1][1] = 0;
    maze[MAZE_HEIGHT - 2][MAZE_WIDTH - 2] = 0;
}

// Generate points where math problems will appear
function generateProblemPoints() {
    problemPoints = [];
    const numProblems = 5 + currentLevel;
    
    // Find all path cells
    const pathCells = [];
    for (let y = 1; y < MAZE_HEIGHT - 1; y++) {
        for (let x = 1; x < MAZE_WIDTH - 1; x++) {
            if (maze[y][x] === 0 && !(x === 1 && y === 1) && 
                !(x === MAZE_WIDTH - 2 && y === MAZE_HEIGHT - 2)) {
                pathCells.push({ x, y });
            }
        }
    }
    
    // Randomly select problem points
    for (let i = 0; i < numProblems && pathCells.length > 0; i++) {
        const index = Math.floor(Math.random() * pathCells.length);
        problemPoints.push(pathCells[index]);
        pathCells.splice(index, 1);
    }
}

// Generate a random math problem (only equations now)
function generateProblem() {
    return generateEquation();
}

function generateEquation() {
    // Generate equation where x is always a whole number
    // Strategy: Pick x (whole number), pick a and b, then calculate c = ax + b
    
    // Pick x as a whole number between -20 and 20
    const x = Math.floor(Math.random() * 41) - 20;
    
    // Pick a (coefficient) - avoid zero
    let a = Math.floor(Math.random() * 20) - 10;
    if (a === 0) {
        a = Math.random() < 0.5 ? 1 : -1;
    }
    
    // Pick b (constant term)
    const b = Math.floor(Math.random() * 20) - 10;
    
    // Calculate c = ax + b (this ensures x is a whole number)
    const c = a * x + b;
    
    // Build the equation string
    let problem = '';
    if (a === 1) {
        problem = `x`;
    } else if (a === -1) {
        problem = `-x`;
    } else {
        problem = `${a}x`;
    }
    
    if (b > 0) {
        problem += ` + ${b}`;
    } else if (b < 0) {
        problem += ` - ${Math.abs(b)}`;
    }
    
    problem += ` = ${c}`;
    
    return {
        text: problem,
        answer: x, // x is guaranteed to be a whole number
        type: 'equation'
    };
}

function generateInequality() {
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 20) - 10;
    const c = Math.floor(Math.random() * 20) - 10;
    const operators = ['<', '>', '≤', '≥'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    
    // ax + b op c
    let answer;
    if (op === '<' || op === '≤') {
        answer = (c - b) / a;
    } else {
        answer = (c - b) / a;
    }
    
    let problem = '';
    if (a === 1) {
        problem = `x`;
    } else {
        problem = `${a}x`;
    }
    
    if (b > 0) {
        problem += ` + ${b}`;
    } else if (b < 0) {
        problem += ` - ${Math.abs(b)}`;
    }
    
    problem += ` ${op} ${c}`;
    
    // For inequalities, accept any number that satisfies the condition
    return {
        text: problem,
        answer: Math.round(answer * 100) / 100,
        type: 'inequality',
        operator: op,
        a: a,
        b: b,
        c: c
    };
}

// Check if player is at a problem point
function checkProblemPoint() {
    const cellX = Math.floor(playerPixelX / CELL_SIZE);
    const cellY = Math.floor(playerPixelY / CELL_SIZE);
    
    for (let i = 0; i < problemPoints.length; i++) {
        const point = problemPoints[i];
        if (point.x === cellX && point.y === cellY) {
            // Show problem modal
            currentProblem = generateProblem();
            document.getElementById('problemText').textContent = currentProblem.text;
            document.getElementById('answerInput').value = '';
            document.getElementById('feedback').textContent = '';
            document.getElementById('mathModal').classList.add('show');
            document.getElementById('answerInput').focus();
            
            // Remove this problem point
            problemPoints.splice(i, 1);
            return true;
        }
    }
    return false;
}

// Check answer
function checkAnswer() {
    if (!currentProblem) {
        console.error('No current problem to check!');
        return;
    }
    
    const userAnswer = parseFloat(document.getElementById('answerInput').value);
    const feedbackEl = document.getElementById('feedback');
    
    if (isNaN(userAnswer)) {
        feedbackEl.textContent = 'Please enter a valid number!';
        feedbackEl.className = 'incorrect';
        return;
    }
    
    let isCorrect = false;
    
    if (currentProblem.type === 'equation') {
        isCorrect = Math.abs(userAnswer - currentProblem.answer) < 0.01;
    } else {
        // Check inequality
        const leftSide = currentProblem.a * userAnswer + currentProblem.b;
        const rightSide = currentProblem.c;
        
        switch (currentProblem.operator) {
            case '<':
                isCorrect = leftSide < rightSide;
                break;
            case '>':
                isCorrect = leftSide > rightSide;
                break;
            case '≤':
                isCorrect = leftSide <= rightSide;
                break;
            case '≥':
                isCorrect = leftSide >= rightSide;
                break;
        }
    }
    
    if (isCorrect) {
        feedbackEl.textContent = 'Correct! ✓';
        feedbackEl.className = 'correct';
        problemsSolved++;
        updateUI();
        
        setTimeout(() => {
            document.getElementById('mathModal').classList.remove('show');
            currentProblem = null;
        }, 1000);
    } else {
        feedbackEl.textContent = `Incorrect! Try again. ${currentProblem.type === 'equation' ? `Answer: ${currentProblem.answer}` : ''}`;
        feedbackEl.className = 'incorrect';
    }
}

// Skip problem
function skipProblem() {
    document.getElementById('mathModal').classList.remove('show');
    currentProblem = null;
    // Player can continue but doesn't get credit
}

// D-pad direction to movement
const DPAD_MOVES = {
    up: { dx: 0, dy: -PLAYER_SPEED },
    down: { dx: 0, dy: PLAYER_SPEED },
    left: { dx: -PLAYER_SPEED, dy: 0 },
    right: { dx: PLAYER_SPEED, dy: 0 }
};

// Mobile: Setup D-pad touch controls
function setupDpad() {
    const dpad = document.getElementById('dpad');
    if (!dpad) return;
    
    const handleDir = (dir) => {
        if (document.getElementById('mathModal').classList.contains('show')) return;
        const move = DPAD_MOVES[dir];
        if (move) movePlayer(move.dx, move.dy);
    };
    
    dpad.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
        const dir = btn.dataset.dir;
        const trigger = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDir(dir);
        };
        btn.addEventListener('click', trigger);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDir(dir);
        }, { passive: false });
    });
}

// Handle keyboard input
function handleKeyPress(e) {
    if (document.getElementById('mathModal').classList.contains('show')) {
        return; // Don't move when modal is open
    }
    
    const key = e.key;
    const keys = {
        'ArrowUp': { dx: 0, dy: -PLAYER_SPEED },
        'ArrowDown': { dx: 0, dy: PLAYER_SPEED },
        'ArrowLeft': { dx: -PLAYER_SPEED, dy: 0 },
        'ArrowRight': { dx: PLAYER_SPEED, dy: 0 },
        'w': { dx: 0, dy: -PLAYER_SPEED },
        'W': { dx: 0, dy: -PLAYER_SPEED },
        's': { dx: 0, dy: PLAYER_SPEED },
        'S': { dx: 0, dy: PLAYER_SPEED },
        'a': { dx: -PLAYER_SPEED, dy: 0 },
        'A': { dx: -PLAYER_SPEED, dy: 0 },
        'd': { dx: PLAYER_SPEED, dy: 0 },
        'D': { dx: PLAYER_SPEED, dy: 0 }
    };
    
    const move = keys[key] || keys[key.toLowerCase()];
    if (move) {
        e.preventDefault();
        movePlayer(move.dx, move.dy);
    }
}

// Move player with collision detection
function movePlayer(dx, dy) {
    const newX = playerPixelX + dx;
    const newY = playerPixelY + dy;
    
    // Check boundaries
    if (newX < CELL_SIZE / 2 || newX >= canvas.width - CELL_SIZE / 2 ||
        newY < CELL_SIZE / 2 || newY >= canvas.height - CELL_SIZE / 2) {
        return;
    }
    
    // Check collision with walls
    const cellX = Math.floor(newX / CELL_SIZE);
    const cellY = Math.floor(newY / CELL_SIZE);
    
    if (maze[cellY] && maze[cellY][cellX] === 0) {
        playerPixelX = newX;
        playerPixelY = newY;
        
        // Check if reached goal
        if (cellX === goal.x && cellY === goal.y) {
            levelComplete();
        }
        
        // Check if at a problem point
        checkProblemPoint();
        
        draw();
    }
}

// Level complete
function levelComplete() {
    alert(`Congratulations! You completed Level ${currentLevel}!\nProblems Solved: ${problemsSolved}`);
    currentLevel++;
    newGame();
}

// New game - make it globally accessible
function newGame() {
    console.log('newGame() function called');
    
    // Close modal if open
    const modal = document.getElementById('mathModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('Modal closed');
    }
    
    // Reset game state
    problemsSolved = 0;
    currentLevel = 1;
    currentProblem = null;
    playerPixelX = CELL_SIZE + CELL_SIZE / 2;
    playerPixelY = CELL_SIZE + CELL_SIZE / 2;
    goal = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 };
    
    console.log('Game state reset. Player position:', playerPixelX, playerPixelY);
    
    // Regenerate maze and problems
    generateMaze();
    console.log('Maze regenerated');
    generateProblemPoints();
    console.log('Problem points regenerated:', problemPoints.length);
    
    // Update UI and redraw
    updateUI();
    console.log('UI updated');
    
    // Ensure canvas is ready
    if (canvas && ctx) {
        draw();
        console.log('New game started! Canvas redrawn.');
    } else {
        console.error('Canvas not initialized. Trying to reinitialize...');
        init();
    }
}

// Make it globally accessible
if (typeof window !== 'undefined') {
    window.newGame = newGame;
}

// Update UI
function updateUI() {
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('solved').textContent = problemsSolved;
}

// Draw everything
function draw() {
    if (!canvas || !ctx) {
        console.error('Cannot draw: canvas or context not initialized');
        return;
    }
    
    if (!maze || maze.length === 0) {
        console.error('Cannot draw: maze not generated');
        return;
    }
    
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (maze[y] && maze[y][x] === 1) {
                // Wall - medium gray
                ctx.fillStyle = '#666';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                // Path - dark gray (slightly lighter than background)
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    // Draw problem points
    ctx.fillStyle = '#ffa500';
    for (const point of problemPoints) {
        ctx.beginPath();
        ctx.arc(
            point.x * CELL_SIZE + CELL_SIZE / 2,
            point.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw goal
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(
        goal.x * CELL_SIZE + 5,
        goal.y * CELL_SIZE + 5,
        CELL_SIZE - 10,
        CELL_SIZE - 10
    );
    
    // Draw player - bright blue circle
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(playerPixelX, playerPixelY, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player outline - white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    console.log('Player drawn at:', playerPixelX, playerPixelY);
}

// Start game when page loads
(function() {
    function startGame() {
        console.log('Starting game initialization...');
        try {
            init();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to start game. Please check the browser console (F12) for errors.');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGame);
    } else {
        // DOM is already loaded
        startGame();
    }
    
    // Fallback to window.onload
    window.addEventListener('load', function() {
        if (!canvas || !ctx) {
            console.log('Fallback: Initializing on window load...');
            startGame();
        }
    });
})();

// =======================================================
// ========== EXTENSIONS (DO NOT TOUCH OLD CODE) =========
// =======================================================



// =====================
// LEVEL 5+ : QUADRATIC
// =====================
function generateQuadraticEquation() {
    const x = Math.floor(Math.random() * 11) - 5;
    const a = Math.floor(Math.random() * 4) + 1;
    const b = Math.floor(Math.random() * 10) - 5;
    const c = Math.floor(Math.random() * 10) - 5;

    const result = a * x * x + b * x + c;

    return {
        text: `${a}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = ${result}`,
        answer: x,
        type: 'equation'
    };
}
// ========================
// ===== NEW FEATURES =====
// ========================


// ---------- Quadratic Equations ----------
function generateQuadraticEquation() {
    const x = Math.floor(Math.random() * 11) - 5; // x nga -5 në 5
    const a = Math.floor(Math.random() * 4) + 1;  // a nga 1 në 4
    const b = Math.floor(Math.random() * 10) - 5; // b nga -5 në 4
    const c = Math.floor(Math.random() * 10) - 5; // c nga -5 në 4

    const result = a * x * x + b * x + c;

    return {
        text: `${a}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = ${result}`,
        answer: x,
        type: 'equation'
    };
}

// ---------- Boss Level ----------
function generateBossQuadratic() {
    const x = Math.floor(Math.random() * 7) - 3; // x nga -3 në 3
    const a = Math.floor(Math.random() * 5) + 2; // a nga 2 në 6
    const b = Math.floor(Math.random() * 14) - 7; // b nga -7 në 6
    const c = Math.floor(Math.random() * 20) - 10; // c nga -10 në 9

    return {
        text: `${a}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = ${a * x * x + b * x + c}`,
        answer: x,
        type: 'equation'
    };
}

// ---------- Override generateProblem ----------
const oldGenerateProblem = generateProblem;

generateProblem = function () {
    if (currentLevel >= 5) {
        if (currentLevel % 5 === 0) {
            return generateBossQuadratic();
        }
        return generateQuadraticEquation();
    }
    return oldGenerateProblem();
};

// ---------- Fix newGame so levels don’t reset ----------
const oldNewGame = newGame;

newGame = function(resetAll = true) {
    if (resetAll) {
        currentLevel = 1;
    }

    problemsSolved = 0;
    currentProblem = null;
    playerPixelX = CELL_SIZE + CELL_SIZE / 2;
    playerPixelY = CELL_SIZE + CELL_SIZE / 2;
    goal = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 };

    generateMaze();
    generateProblemPoints();
    updateUI();
    draw();
};

// ---------- Fix levelComplete to increment level correctly ----------
const oldLevelComplete = levelComplete;

levelComplete = function () {
    alert(`Congratulations! You completed Level ${currentLevel}!\nProblems Solved: ${problemsSolved}`);
    currentLevel++;
    newGame(false); // false = don’t reset level
};
