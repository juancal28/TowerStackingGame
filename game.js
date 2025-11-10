// Game state
let gameState = {
    targetTowers: [[], [], []],
    currentTowers: [[], [], []],
    initialTowers: [[], [], []], // Store initial configuration for reset
    selectedTower: null,
    moveCount: 0,
    optimalMoves: 0,
    isGameComplete: false
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
    generateTargetConfiguration();
    generateStartingConfiguration();
    // Store initial configuration for reset
    gameState.initialTowers = gameState.currentTowers.map(tower => [...tower]);
    gameState.moveCount = 0;
    gameState.selectedTower = null;
    gameState.isGameComplete = false;
    calculateOptimalMoves();
    renderGame();
    updateMoveCount();
    hideMessage();
}

// Reset current game to initial state
function resetGame() {
    // Restore initial configuration
    gameState.currentTowers = gameState.initialTowers.map(tower => [...tower]);
    gameState.moveCount = 0;
    gameState.selectedTower = null;
    gameState.isGameComplete = false;
    renderGame();
    updateMoveCount();
    hideMessage();
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

// Calculate optimal moves using BFS
function calculateOptimalMoves() {
    const start = JSON.stringify(gameState.currentTowers);
    const target = JSON.stringify(gameState.targetTowers);
    
    if (start === target) {
        gameState.optimalMoves = 0;
        return;
    }
    
    const queue = [{ config: gameState.currentTowers, moves: 0 }];
    const visited = new Set();
    visited.add(start);
    
    // Limit search to prevent performance issues
    const maxDepth = 20;
    const maxIterations = 10000;
    let iterations = 0;
    
    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const { config, moves } = queue.shift();
        
        if (moves > maxDepth) {
            break;
        }
        
        // Try all possible moves
        for (let from = 0; from < 3; from++) {
            if (config[from].length === 0) continue;
            
            for (let to = 0; to < 3; to++) {
                if (from === to) continue;
                if (config[to].length >= 5) continue;
                
                // Make move
                const newConfig = config.map(tower => [...tower]);
                const block = newConfig[from].pop();
                newConfig[to].push(block);
                
                const configStr = JSON.stringify(newConfig);
                
                if (configStr === target) {
                    gameState.optimalMoves = moves + 1;
                    return;
                }
                
                if (!visited.has(configStr)) {
                    visited.add(configStr);
                    queue.push({ config: newConfig, moves: moves + 1 });
                }
            }
        }
    }
    
    // If BFS didn't find a solution within limits, use heuristic
    const totalBlocks = gameState.targetTowers.flat().length;
    gameState.optimalMoves = Math.max(1, Math.floor(totalBlocks * 0.8));
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
    if (gameState.isGameComplete) return;
    
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

// Event listeners
document.getElementById('new-game-btn').addEventListener('click', () => {
    initGame();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    resetGame();
});

// Initialize game on load
initGame();

