import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { AnimationManager } from './animation.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
    const topPanel = document.getElementById('top-panel');
    const topPanelHeight = topPanel.offsetHeight;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - topPanelHeight;
    
    if (renderer) {
        renderer.draw();
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize game systems
const animationManager = new AnimationManager();
const game = new Game(animationManager);
const renderer = new Renderer(ctx, canvas, game, animationManager);
const inputManager = new InputManager(canvas, game, renderer, animationManager);

// UI Controls
document.getElementById('new-game').addEventListener('click', () => {
    game.initGame();
    renderer.clearKeyboardFocus();
    renderer.draw();
});

document.getElementById('undo').addEventListener('click', () => {
    game.undo();
    renderer.draw();
});

document.getElementById('redo').addEventListener('click', () => {
    game.redo();
    renderer.draw();
});

document.getElementById('deal').addEventListener('click', () => {
    game.dealCards();
    renderer.draw();
});

document.getElementById('suits').addEventListener('change', (e) => {
    game.suitCount = parseInt(e.target.value);
    game.initGame();
    renderer.clearKeyboardFocus();
    renderer.draw();
});

document.getElementById('toggle-help').addEventListener('click', () => {
    const content = document.getElementById('controls-content');
    content.classList.toggle('collapsed');
});

// Game loop
function gameLoop(timestamp) {
    animationManager.update(timestamp);
    renderer.draw();
    requestAnimationFrame(gameLoop);
}

// Start game
game.initGame();
requestAnimationFrame(gameLoop);
