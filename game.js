// Game state
let gameState = {
    targetTowers: [[], [], []],
    currentTowers: [[], [], []],
    initialTowers: [[], [], []], // Store initial configuration for reset
    selectedTower: null,
    moveCount: 0,
    optimalMoves: 0,
    isGameComplete: false,
    solutionPath: [], // Store the sequence of moves for the optimal solution
    isAnimating: false, // Track if solution animation is playing
    animationTimeout: null // Store animation timeout ID
};

// Color palette for blocks
const COLORS = [
    { name: 'block-1', color: '#FF6B6B' },
    { name: 'block-2', color: '#4ECDC4' },
    { name: 'block-3', color: '#45B7D1' },
    { name: 'block-4', color: '#FFA07A' },
    { name: 'block-5', color: '#98D8C8' },
    { name: 'block-6', color: '#F7DC6F' },
    { name: 'block-7', color: '#BB8FCE' },
    { name: 'block-8', color: '#85C1E2' }
];

// Initialize game
function initGame() {
    // Stop any ongoing animation
    if (gameState.isAnimating) {
        stopAnimation();
    }
    generateTargetConfiguration();
    generateStartingConfiguration();
    // Store initial configuration for reset
    gameState.initialTowers = gameState.currentTowers.map(tower => [...tower]);
    gameState.moveCount = 0;
    gameState.selectedTower = null;
    gameState.isGameComplete = false;
    gameState.isAnimating = false;
    gameState.solutionPath = []; // Clear previous solution
    gameState.optimalMoves = 0;
    
    renderGame();
    updateMoveCount();
    hideMessage();
    updateButtons(); // Disable show answer button initially
    
    // Show loading message
    showMessage('Calculating optimal solution...', 'info');
    
    // Calculate optimal moves (this may take a moment for complex puzzles)
    // Run in setTimeout to allow UI to update first
    setTimeout(() => {
        calculateOptimalMoves();
        // The calculateOptimalMoves function will update buttons when done
        hideMessage();
    }, 50);
}

// Reset current game to initial state
function resetGame() {
    // Stop any ongoing animation
    if (gameState.isAnimating) {
        stopAnimation();
    }
    // Restore initial configuration
    gameState.currentTowers = gameState.initialTowers.map(tower => [...tower]);
    gameState.moveCount = 0;
    gameState.selectedTower = null;
    gameState.isGameComplete = false;
    gameState.isAnimating = false;
    renderGame();
    updateMoveCount();
    hideMessage();
    setTimeout(updateButtons, 100);
}

// Generate a random target configuration
function generateTargetConfiguration() {
    const numBlocks = Math.floor(Math.random() * 8) + 5; // 5-12 blocks
    const blocks = [];
    
    // Create blocks with variety
    for (let i = 0; i < numBlocks; i++) {
        blocks.push(i % COLORS.length);
    }
    
    // Shuffle blocks
    for (let i = blocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }
    
    // Distribute blocks across 3 towers (each tower can have 0-5 blocks)
    gameState.targetTowers = [[], [], []];
    
    for (const block of blocks) {
        // Find available towers
        const availableTowers = [];
        for (let i = 0; i < 3; i++) {
            if (gameState.targetTowers[i].length < 5) {
                availableTowers.push(i);
            }
        }
        
        // Place block in a random available tower
        if (availableTowers.length > 0) {
            const randomTower = availableTowers[Math.floor(Math.random() * availableTowers.length)];
            gameState.targetTowers[randomTower].push(block);
        }
    }
}

// Generate starting configuration (different from target, but same blocks)
function generateStartingConfiguration() {
    // Get all blocks from target
    const allBlocks = [];
    for (const tower of gameState.targetTowers) {
        for (const block of tower) {
            allBlocks.push(block);
        }
    }
    
    // Try multiple times to ensure different configuration
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
        // Shuffle blocks
        const shuffledBlocks = [...allBlocks];
        for (let i = shuffledBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledBlocks[i], shuffledBlocks[j]] = [shuffledBlocks[j], shuffledBlocks[i]];
        }
        
        // Distribute blocks across towers randomly
        gameState.currentTowers = [[], [], []];
        
        for (const block of shuffledBlocks) {
            // Find available towers
            const availableTowers = [];
            for (let i = 0; i < 3; i++) {
                if (gameState.currentTowers[i].length < 5) {
                    availableTowers.push(i);
                }
            }
            
            // Place block in a random available tower
            if (availableTowers.length > 0) {
                const randomTower = availableTowers[Math.floor(Math.random() * availableTowers.length)];
                gameState.currentTowers[randomTower].push(block);
            }
        }
        
        attempts++;
    } while (areConfigurationsEqual(gameState.currentTowers, gameState.targetTowers) && attempts < maxAttempts);
    
    // If still equal after attempts, force a different configuration
    if (areConfigurationsEqual(gameState.currentTowers, gameState.targetTowers) && allBlocks.length > 0) {
        // Reverse the first tower
        if (gameState.currentTowers[0].length > 0) {
            gameState.currentTowers[0].reverse();
        } else if (gameState.currentTowers[1].length > 0) {
            gameState.currentTowers[1].reverse();
        }
    }
}

// Check if two configurations are equal (exact tower positions)
function areConfigurationsEqual(config1, config2) {
    // Check each tower position exactly
    for (let i = 0; i < 3; i++) {
        if (config1[i].length !== config2[i].length) {
            return false;
        }
        for (let j = 0; j < config1[i].length; j++) {
            if (config1[i][j] !== config2[i][j]) {
                return false;
            }
        }
    }
    return true;
}

// Calculate optimal moves using BFS and store solution path
// Since puzzles are always solvable (same blocks in start and target), 
// we guarantee finding a solution with high enough limits
function calculateOptimalMoves() {
    const start = JSON.stringify(gameState.currentTowers);
    const target = JSON.stringify(gameState.targetTowers);
    
    if (start === target) {
        gameState.optimalMoves = 0;
        gameState.solutionPath = [];
        if (typeof updateButtons === 'function') {
            setTimeout(updateButtons, 0);
        }
        return;
    }
    
    const parentMap = new Map();
    const queue = [{ 
        config: gameState.currentTowers.map(t => [...t]), 
        moves: 0,
        configStr: start
    }];
    const visited = new Set();
    visited.add(start);
    parentMap.set(start, null);
    
    // Very high limits - puzzles with max 12 blocks should be solvable well within these limits
    // For worst case, we might need up to ~30-40 moves, but set much higher to be safe
    const maxDepth = 200; // Very high depth limit
    const maxIterations = 5000000; // Very high iteration limit (5 million)
    let iterations = 0;
    let foundSolution = false;
    
    while (queue.length > 0 && iterations < maxIterations && !foundSolution) {
        iterations++;
        const current = queue.shift();
        
        // Skip if depth limit exceeded, but continue searching other paths
        if (current.moves > maxDepth) {
            continue;
        }
        
        // Try all possible moves from current state
        for (let from = 0; from < 3; from++) {
            if (current.config[from].length === 0) continue;
            
            for (let to = 0; to < 3; to++) {
                if (from === to) continue;
                if (current.config[to].length >= 5) continue;
                
                // Make the move
                const newConfig = current.config.map(tower => [...tower]);
                const block = newConfig[from].pop();
                newConfig[to].push(block);
                
                const configStr = JSON.stringify(newConfig);
                
                // Check if we found the target
                if (configStr === target) {
                    // Store the move that reaches the target
                    parentMap.set(configStr, {
                        parentConfigStr: current.configStr,
                        move: { from, to }
                    });
                    
                    // Reconstruct the path backwards from target to start
                    const path = [];
                    let currentStr = configStr;
                    
                    while (true) {
                        const parentInfo = parentMap.get(currentStr);
                        if (!parentInfo || !parentInfo.move) break;
                        path.unshift(parentInfo.move);
                        currentStr = parentInfo.parentConfigStr;
                    }
                    
                    gameState.optimalMoves = current.moves + 1;
                    gameState.solutionPath = path;
                    foundSolution = true;
                    
                    console.log(`Solution found: ${path.length} moves in ${iterations} iterations`);
                    
                    if (typeof updateButtons === 'function') {
                        updateButtons();
                    }
                    return; // Success!
                }
                
                // Add new state to queue if not visited
                if (!visited.has(configStr)) {
                    visited.add(configStr);
                    parentMap.set(configStr, {
                        parentConfigStr: current.configStr,
                        move: { from, to }
                    });
                    queue.push({
                        config: newConfig,
                        moves: current.moves + 1,
                        configStr: configStr
                    });
                }
            }
        }
    }
    
    // If we reach here, something went wrong - puzzle should always be solvable
    // This could happen if:
    // 1. Limits are still too low (unlikely with current settings)
    // 2. There's a bug in puzzle generation
    // 3. Memory/performance issues
    console.error('ERROR: Could not find solution!', {
        iterations,
        queueLength: queue.length,
        visitedSize: visited.size,
        start,
        target
    });
    
    // As a last resort, verify the puzzle is actually solvable by checking block counts
    const startBlocks = gameState.currentTowers.flat().sort().join(',');
    const targetBlocks = gameState.targetTowers.flat().sort().join(',');
    
    if (startBlocks !== targetBlocks) {
        console.error('CRITICAL: Puzzle is unsolvable - blocks do not match!', {
            startBlocks,
            targetBlocks
        });
        // Regenerate puzzle if blocks don't match
        generateStartingConfiguration();
        // Retry with new configuration
        calculateOptimalMoves();
        return;
    }
    
    // Blocks match, so puzzle is solvable - this is a search algorithm issue
    // Set empty solution path but log the error
    gameState.optimalMoves = 0;
    gameState.solutionPath = [];
    
    if (typeof updateButtons === 'function') {
        setTimeout(updateButtons, 0);
    }
}

// Render towers
function renderTowers(containerId, towers, isInteractive) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const towerDiv = document.createElement('div');
        towerDiv.className = 'tower';
        if (isInteractive) {
            towerDiv.addEventListener('click', () => handleTowerClick(i));
        }
        
        const poleDiv = document.createElement('div');
        poleDiv.className = 'tower-pole';
        
        // Create 5 slots from bottom (0) to top (4)
        // Blocks are stored in array from bottom to top
        let topBlockSlot = null;
        for (let slotIndex = 0; slotIndex < 5; slotIndex++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'tower-slot';
            slotDiv.setAttribute('data-slot', slotIndex);
            
            // Check if there's a block at this slot position
            // slotIndex 0 = bottom, slotIndex 4 = top
            if (slotIndex < towers[i].length) {
                const blockColor = towers[i][slotIndex];
                slotDiv.classList.add('filled', `block-${(blockColor % COLORS.length) + 1}`);
                slotDiv.style.setProperty('--block-color', COLORS[blockColor % COLORS.length].color);
                slotDiv.style.setProperty('--block-border', darkenColor(COLORS[blockColor % COLORS.length].color));
                slotDiv.textContent = blockColor + 1;
                topBlockSlot = slotDiv; // Last filled slot is the top block
            } else {
                slotDiv.classList.add('placeholder');
            }
            
            poleDiv.appendChild(slotDiv);
        }
        
        // Mark the top block for visual indication
        if (topBlockSlot && isInteractive) {
            topBlockSlot.classList.add('top-block');
        }
        
        const baseDiv = document.createElement('div');
        baseDiv.className = 'tower-base';
        
        towerDiv.appendChild(poleDiv);
        towerDiv.appendChild(baseDiv);
        container.appendChild(towerDiv);
    }
    
    // Update selected state
    if (isInteractive && gameState.selectedTower !== null) {
        const towerElements = container.querySelectorAll('.tower');
        towerElements[gameState.selectedTower].classList.add('selected');
    }
}

// Darken a color
function darkenColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
}

// Render the entire game
function renderGame() {
    renderTowers('target-towers', gameState.targetTowers, false);
    renderTowers('game-towers', gameState.currentTowers, true);
}

// Handle tower click
function handleTowerClick(towerIndex) {
    if (gameState.isGameComplete || gameState.isAnimating) return;
    
    if (gameState.selectedTower === null) {
        // Select source tower
        if (gameState.currentTowers[towerIndex].length > 0) {
            gameState.selectedTower = towerIndex;
            renderGame();
            showMessage('Select destination tower', 'info');
        } else {
            showMessage('This tower is empty!', 'error');
        }
    } else {
        // Select destination tower
        if (gameState.selectedTower === towerIndex) {
            // Deselect
            gameState.selectedTower = null;
            renderGame();
            hideMessage();
        } else {
            // Try to move
            if (makeMove(gameState.selectedTower, towerIndex)) {
                gameState.selectedTower = null;
                gameState.moveCount++;
                updateMoveCount();
                renderGame();
                hideMessage();
                
                if (checkWin()) {
                    showWinMessage();
                }
            } else {
                showMessage('Invalid move! You can only move the top block to a different tower.', 'error');
            }
        }
    }
}

// Make a move
function makeMove(fromTower, toTower) {
    // Check if source tower has blocks
    if (gameState.currentTowers[fromTower].length === 0) {
        return false;
    }
    
    // Check if destination tower has space (max 5 blocks)
    if (gameState.currentTowers[toTower].length >= 5) {
        return false;
    }
    
    // Move the top block
    const block = gameState.currentTowers[fromTower].pop();
    gameState.currentTowers[toTower].push(block);
    
    return true;
}

// Check if game is won
function checkWin() {
    return areConfigurationsEqual(gameState.currentTowers, gameState.targetTowers);
}

// Show win message
function showWinMessage() {
    gameState.isGameComplete = true;
    const message = `🎉 Congratulations! You completed the puzzle in ${gameState.moveCount} moves!`;
    if (gameState.optimalMoves > 0) {
        const efficiency = gameState.moveCount <= gameState.optimalMoves ? 'Perfect!' : 
                          gameState.moveCount <= gameState.optimalMoves * 1.5 ? 'Great!' : 'Good!';
        showMessage(message + ` ${efficiency}`, 'success');
    } else {
        showMessage(message, 'success');
    }
}

// Update move count display
function updateMoveCount() {
    document.getElementById('move-count').textContent = gameState.moveCount;
    document.getElementById('optimal-moves').textContent = gameState.optimalMoves > 0 ? gameState.optimalMoves : '-';
}

// Show message
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    } else if (type === 'info') {
        setTimeout(() => {
            hideMessage();
        }, 3000);
    }
}

// Hide message
function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.style.display = 'none';
}

// Show answer animation
function showAnswer() {
    if (gameState.isAnimating) {
        return;
    }
    
    if (gameState.solutionPath.length === 0) {
        showMessage('Solution not available. Optimal moves may not have been calculated.', 'error');
        return;
    }
    
    // Reset to initial state before animating
    gameState.currentTowers = gameState.initialTowers.map(tower => [...tower]);
    gameState.moveCount = 0;
    gameState.selectedTower = null;
    gameState.isGameComplete = false;
    gameState.isAnimating = true;
    
    updateButtons();
    renderGame();
    updateMoveCount();
    hideMessage();
    showMessage('Showing optimal solution...', 'info');
    
    // Animate each move
    let moveIndex = 0;
    const animateMove = () => {
        if (!gameState.isAnimating || moveIndex >= gameState.solutionPath.length) {
            // Animation complete
            gameState.isAnimating = false;
            updateButtons();
            hideMessage();
            if (checkWin()) {
                showWinMessage();
            }
            return;
        }
        
        const move = gameState.solutionPath[moveIndex];
        
        // Highlight the source and destination towers
        setTimeout(() => {
            const sourceTower = document.querySelectorAll('#game-towers .tower')[move.from];
            const destTower = document.querySelectorAll('#game-towers .tower')[move.to];
            
            if (sourceTower) sourceTower.classList.add('animating-source');
            if (destTower) destTower.classList.add('animating-dest');
            
            // Wait a bit, then make the move
            gameState.animationTimeout = setTimeout(() => {
                // Remove highlights
                if (sourceTower) sourceTower.classList.remove('animating-source');
                if (destTower) destTower.classList.remove('animating-dest');
                
                // Make the move
                if (makeMove(move.from, move.to)) {
                    gameState.moveCount++;
                    renderGame();
                    updateMoveCount();
                }
                
                moveIndex++;
                
                // Continue with next move after a delay
                if (moveIndex < gameState.solutionPath.length) {
                    gameState.animationTimeout = setTimeout(animateMove, 600);
                } else {
                    // All moves complete
                    gameState.isAnimating = false;
                    updateButtons();
                    hideMessage();
                    if (checkWin()) {
                        showWinMessage();
                    }
                }
            }, 400);
        }, 50);
    };
    
    // Start animation after a short delay
    gameState.animationTimeout = setTimeout(animateMove, 300);
}

// Stop animation
function stopAnimation() {
    if (gameState.animationTimeout) {
        clearTimeout(gameState.animationTimeout);
        gameState.animationTimeout = null;
    }
    gameState.isAnimating = false;
    
    // Remove animation classes
    document.querySelectorAll('.animating-source, .animating-dest').forEach(el => {
        el.classList.remove('animating-source', 'animating-dest');
    });
    
    updateButtons();
}

// Update button states
function updateButtons() {
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const resetBtn = document.getElementById('reset-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    
    // Check if buttons exist (DOM might not be ready yet)
    if (!showAnswerBtn || !resetBtn || !newGameBtn) {
        return;
    }
    
    if (gameState.isAnimating) {
        showAnswerBtn.textContent = 'Animating...';
        showAnswerBtn.disabled = true;
        resetBtn.disabled = true;
        newGameBtn.disabled = true;
    } else {
        if (gameState.solutionPath.length === 0) {
            showAnswerBtn.textContent = 'Show Answer';
            showAnswerBtn.disabled = true;
        } else {
            showAnswerBtn.textContent = 'Show Answer';
            showAnswerBtn.disabled = false;
        }
        resetBtn.disabled = false;
        newGameBtn.disabled = false;
    }
}

// Event listeners
document.getElementById('new-game-btn').addEventListener('click', () => {
    initGame();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    resetGame();
});

document.getElementById('show-answer-btn').addEventListener('click', () => {
    showAnswer();
});

// Initialize game on load
initGame();

