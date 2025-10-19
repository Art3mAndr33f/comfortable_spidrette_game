class InputManager {
    constructor(canvas, game, renderer) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        
        // Состояние выбора мышью
        this.selectedPile = null;
        this.selectedCardIndex = null;
        this.lastClickTime = 0;
        this.lastClickCard = null;
        
        // Клавиатурная навигация
        this.currentPileIndex = 0;
        this.currentCardIndex = 0;
        this.keyboardSelectedPile = null;
        this.keyboardSelectedCardIndex = null;
        
        this.initMouseEvents();
        this.initKeyboardEvents();
    }

    initMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    initKeyboardEvents() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onMouseDown(e) {
        if (this.game.animationManager && this.game.animationManager.hasActiveAnimations()) {
            return;
        }

        // Убираем клавиатурную подсветку при работе мышью
        this.renderer.clearKeyboardFocus();

        const pos = this.getMousePos(e);
        const result = this.game.getCardAt(pos.x, pos.y);
        
        if (result) {
            const currentTime = Date.now();
            const doubleClickDelay = 300;

            // Проверяем двойной клик на ту же карту
            if (this.lastClickCard === result.card && 
                currentTime - this.lastClickTime < doubleClickDelay) {
                // Двойной клик - выбор для перетаскивания
                this.selectedPile = result.pile;
                this.selectedCardIndex = result.index;
                this.renderer.setSelection(result.pile, result.index);
                this.lastClickCard = null;
            } else {
                // Одиночный клик - автоматическое перемещение
                const targetPile = this.game.findBestMoveForCards(result.pile, result.index);
                if (targetPile) {
                    this.game.moveCards(result.pile, result.index, targetPile, true);
                }
                this.lastClickCard = result.card;
                this.lastClickTime = currentTime;
            }
        }
    }

    onMouseMove(e) {
        // Убираем клавиатурную подсветку при движении мыши
        if (this.renderer.keyboardPile !== null) {
            this.renderer.clearKeyboardFocus();
        }
    }

    onMouseUp(e) {
        if (!this.selectedPile || this.selectedCardIndex === null) return;

        const pos = this.getMousePos(e);
        const targetPile = this.game.getPileAt(pos.x, pos.y);

        if (targetPile && targetPile !== this.selectedPile) {
            this.game.moveCards(this.selectedPile, this.selectedCardIndex, targetPile, true);
        }

        this.selectedPile = null;
        this.selectedCardIndex = null;
        this.renderer.setSelection(null, null);
    }

    onKeyDown(e) {
        if (this.game.animationManager && this.game.animationManager.hasActiveAnimations()) {
            return;
        }

        const piles = this.game.piles;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.currentPileIndex = Math.max(0, this.currentPileIndex - 1);
                // Перемещаемся на последнюю карту
                this.currentCardIndex = piles[this.currentPileIndex].getLastCardIndex();
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                this.currentPileIndex = Math.min(piles.length - 1, this.currentPileIndex + 1);
                // Перемещаемся на последнюю карту
                this.currentCardIndex = piles[this.currentPileIndex].getLastCardIndex();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const currentPile = piles[this.currentPileIndex];
                const faceUpStart = currentPile.getFaceUpStartIndex();
                this.currentCardIndex = Math.max(faceUpStart, this.currentCardIndex - 1);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                const pile = piles[this.currentPileIndex];
                const maxIndex = pile.cards.length - 1;
                this.currentCardIndex = Math.min(maxIndex, this.currentCardIndex + 1);
                break;
                
            case ' ': // Пробел - выбор/перемещение
                e.preventDefault();
                if (this.keyboardSelectedPile === null) {
                    // Выбираем карты
                    this.keyboardSelectedPile = piles[this.currentPileIndex];
                    this.keyboardSelectedCardIndex = this.currentCardIndex;
                    this.renderer.setSelection(this.keyboardSelectedPile, this.keyboardSelectedCardIndex);
                } else {
                    // Перемещаем на текущий пил
                    const targetPile = piles[this.currentPileIndex];
                    const success = this.game.moveCards(
                        this.keyboardSelectedPile, 
                        this.keyboardSelectedCardIndex, 
                        targetPile,
                        true
                    );
                    
                    if (success) {
                        this.keyboardSelectedPile = null;
                        this.keyboardSelectedCardIndex = null;
                        this.renderer.setSelection(null, null);
                    }
                }
                break;
                
            case 'Enter': // Автоматическое перемещение
                e.preventDefault();
                const sourcePile = piles[this.currentPileIndex];
                const targetPile = this.game.findBestMoveForCards(sourcePile, this.currentCardIndex);
                if (targetPile) {
                    this.game.moveCards(sourcePile, this.currentCardIndex, targetPile, true);
                }
                break;
                
            case 'Escape': // Отмена выбора
                e.preventDefault();
                this.keyboardSelectedPile = null;
                this.keyboardSelectedCardIndex = null;
                this.renderer.setSelection(null, null);
                break;
                
            case 'd':
            case 'D':
            case 'в':
            case 'В':
                e.preventDefault();
                this.game.dealCards();
                break;
                
            case ',':
            case 'б': // Русская раскладка
                e.preventDefault();
                this.game.undo();
                break;
                
            case '.':
            case 'ю': // Русская раскладка
                e.preventDefault();
                this.game.redo();
                break;
        }

        // Обновляем подсветку клавиатурного фокуса
        this.renderer.setKeyboardFocus(piles[this.currentPileIndex], this.currentCardIndex);
    }
}
