let game, renderer, inputManager, animationManager;

function init() {
    const canvas = document.getElementById('gameCanvas');
    const suitSelect = document.getElementById('suitMode');
    
    animationManager = new AnimationManager();
    game = new Game(parseInt(suitSelect.value), animationManager);
    renderer = new Renderer(canvas, game);
    inputManager = new InputManager(canvas, game, renderer);
    
    // Начальная отрисовка
    renderer.draw();
    
    // Смена режима мастей
    suitSelect.addEventListener('change', () => {
        if (confirm('Начать новую игру с выбранным режимом?')) {
            startNewGame();
        }
    });
    
    // Кнопки управления
    document.getElementById('newGame').addEventListener('click', () => {
        startNewGame();
    });
    
    document.getElementById('undo').addEventListener('click', () => {
        game.undo();
    });

    document.getElementById('redo').addEventListener('click', () => {
        game.redo();
    });

    document.getElementById('dealBtn').addEventListener('click', () => {
        game.dealCards();
    });

    // Игровой цикл для плавной анимации
    function gameLoop(timestamp) {
        animationManager.update(timestamp);
        renderer.draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

function startNewGame() {
    const suitSelect = document.getElementById('suitMode');
    
    if (game) {
        game.cleanup();
    }
    
    game = new Game(parseInt(suitSelect.value), animationManager);
    renderer.game = game;
    inputManager.game = game;
    inputManager.selectedPile = null;
    inputManager.selectedCardIndex = null;
    inputManager.keyboardSelectedPile = null;
    inputManager.keyboardSelectedCardIndex = null;
    inputManager.currentPileIndex = 0;
    inputManager.currentCardIndex = 0;
    renderer.setSelection(null, null);
    renderer.setKeyboardFocus(null, null);
}

// Запуск при загрузке страницы
window.addEventListener('load', init);

// Очистка при выгрузке
window.addEventListener('beforeunload', () => {
    if (game) {
        game.cleanup();
    }
});