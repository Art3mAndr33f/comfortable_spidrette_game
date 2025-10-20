export class InputManager {
    constructor(canvas, game, renderer, animationManager) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.animationManager = animationManager;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragPile = null;
        this.dragIndex = null;
        
        this.clickTimeout = null;
        this.clickDelay = 300;
        this.longPressTimeout = null;
        this.longPressDelay = 300;
        this.isLongPress = false;
        
        this.selectedPile = null;
        this.selectedIndex = null;
        
        this.keyboardFocusPile = 0;
        this.keyboardFocusIndex = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleMouseDown(e) {
        if (this.animationManager.hasActiveAnimations()) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hit = this.renderer.getCardAt(x, y);
        if (!hit) return;

        this.dragStartX = x;
        this.dragStartY = y;
        this.dragPile = hit.pileIndex;
        this.dragIndex = hit.cardIndex;
        this.isLongPress = false;

        // Clear keyboard focus on mouse interaction
        this.renderer.clearKeyboardFocus();

        // Long press for dragging
        this.longPressTimeout = setTimeout(() => {
            this.isLongPress = true;
            this.isDragging = true;
            this.renderer.setSelection(this.dragPile, this.dragIndex);
            this.renderer.draw();
        }, this.longPressDelay);

        // Handle click vs double-click
        if (this.clickTimeout) {
            // Double click - manual selection
            clearTimeout(this.clickTimeout);
            clearTimeout(this.longPressTimeout);
            this.clickTimeout = null;
            
            if (this.selectedPile === this.dragPile && this.selectedIndex === this.dragIndex) {
                this.selectedPile = null;
                this.selectedIndex = null;
                this.renderer.clearSelection();
            } else {
                this.selectedPile = this.dragPile;
                this.selectedIndex = this.dragIndex;
                this.renderer.setSelection(this.selectedPile, this.selectedIndex);
            }
            this.renderer.draw();
        } else {
            // Wait for potential double-click
            this.clickTimeout = setTimeout(() => {
                this.clickTimeout = null;
                
                if (!this.isLongPress) {
                    // Single click - auto move
                    this.handleAutoMove(this.dragPile, this.dragIndex);
                    clearTimeout(this.longPressTimeout);
                }
            }, this.clickDelay);
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = Math.abs(x - this.dragStartX);
        const dy = Math.abs(y - this.dragStartY);

        if (dx > 5 || dy > 5) {
            // User is dragging
        }
    }

    handleMouseUp(e) {
        clearTimeout(this.longPressTimeout);

        if (this.isDragging && this.isLongPress) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hit = this.renderer.getCardAt(x, y);
            let targetPile = hit ? hit.pileIndex : null;

            // Check if dropped on empty pile area
            if (!hit) {
                for (let i = 0; i < this.game.piles.length; i++) {
                    const pile = this.game.piles[i];
                    if (pile.cards.length === 0 &&
                        x >= pile.x && x <= pile.x + this.renderer.cardWidth &&
                        y >= pile.y && y <= pile.y + this.renderer.cardHeight) {
                        targetPile = i;
                        break;
                    }
                }
            }

            if (targetPile !== null && targetPile !== this.dragPile) {
                this.game.moveCards(this.dragPile, this.dragIndex, targetPile, true);
            }

            this.renderer.clearSelection();
            this.renderer.draw();
        }

        this.isDragging = false;
        this.dragPile = null;
        this.dragIndex = null;
        this.isLongPress = false;
    }

    handleAutoMove(pileIndex, cardIndex) {
        const targetPile = this.game.findBestMoveForCards(pileIndex, cardIndex);
        
        if (targetPile !== null) {
            this.game.moveCards(pileIndex, cardIndex, targetPile, true);
        }
        
        this.renderer.clearSelection();
        this.renderer.draw();
    }

    handleKeyDown(e) {
        if (this.animationManager.hasActiveAnimations()) return;

        // Update focus display
        this.updateKeyboardFocus();

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.moveKeyboardFocusLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveKeyboardFocusRight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveKeyboardFocusUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveKeyboardFocusDown();
                break;
            case ' ':
                e.preventDefault();
                this.handleSpaceKey();
                break;
            case 'Enter':
                e.preventDefault();
                this.handleEnterKey();
                break;
            case 'Escape':
                e.preventDefault();
                this.selectedPile = null;
                this.selectedIndex = null;
                this.renderer.clearSelection();
                this.renderer.draw();
                break;
            case '/':
            case 'e':
            case 'E':
            case 'у':
            case 'У':
                e.preventDefault();
                this.game.dealCards();
                this.renderer.draw();
                break;
            case ',':
            case 'б':
            case 'Б':
                e.preventDefault();
                this.game.undo();
                this.renderer.draw();
                break;
            case '.':
            case 'ю':
            case 'Ю':
                e.preventDefault();
                this.game.redo();
                this.renderer.draw();
                break;
            case 'r':
            case 'R':
            case 'к':
            case 'К':
                e.preventDefault();
                this.game.initGame();
                this.renderer.clearKeyboardFocus();
                this.renderer.draw();
                break;
        }
    }

    updateKeyboardFocus() {
        if (this.keyboardFocusPile === null) {
            this.keyboardFocusPile = 0;
        }

        const pile = this.game.piles[this.keyboardFocusPile];
        
        if (this.keyboardFocusIndex === null) {
            if (pile.cards.length > 0) {
                this.keyboardFocusIndex = pile.getLastCardIndex();
            }
        }

        this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
    }

    moveKeyboardFocusLeft() {
        this.keyboardFocusPile = Math.max(0, this.keyboardFocusPile - 1);
        const pile = this.game.piles[this.keyboardFocusPile];
        this.keyboardFocusIndex = pile.cards.length > 0 ? pile.getLastCardIndex() : null;
        this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
        this.renderer.draw();
    }

    moveKeyboardFocusRight() {
        this.keyboardFocusPile = Math.min(this.game.piles.length - 1, this.keyboardFocusPile + 1);
        const pile = this.game.piles[this.keyboardFocusPile];
        this.keyboardFocusIndex = pile.cards.length > 0 ? pile.getLastCardIndex() : null;
        this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
        this.renderer.draw();
    }

    moveKeyboardFocusUp() {
        const pile = this.game.piles[this.keyboardFocusPile];
        if (this.keyboardFocusIndex === null) return;
        
        const faceUpStart = pile.getFaceUpStartIndex();
        if (faceUpStart !== -1 && this.keyboardFocusIndex > faceUpStart) {
            this.keyboardFocusIndex--;
            this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
            this.renderer.draw();
        }
    }

    moveKeyboardFocusDown() {
        const pile = this.game.piles[this.keyboardFocusPile];
        if (this.keyboardFocusIndex === null) return;
        
        if (this.keyboardFocusIndex < pile.getLastCardIndex()) {
            this.keyboardFocusIndex++;
            this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
            this.renderer.draw();
        }
    }

    handleSpaceKey() {
        if (this.keyboardFocusPile === null) return;

        if (this.selectedPile === null) {
            // Select cards
            this.selectedPile = this.keyboardFocusPile;
            this.selectedIndex = this.keyboardFocusIndex;
            this.renderer.setSelection(this.selectedPile, this.selectedIndex);
        } else {
            // Move cards
            if (this.keyboardFocusPile !== this.selectedPile) {
                this.game.moveCards(this.selectedPile, this.selectedIndex, this.keyboardFocusPile, true);
            }
            this.selectedPile = null;
            this.selectedIndex = null;
            this.renderer.clearSelection();
        }
        
        this.renderer.draw();
    }

    handleEnterKey() {
        if (this.keyboardFocusPile === null || this.keyboardFocusIndex === null) return;

        const sourcePile = this.keyboardFocusPile;
        const sourceIndex = this.keyboardFocusIndex;
        
        const targetPile = this.game.findBestMoveForCards(sourcePile, sourceIndex);
        
        if (targetPile !== null) {
            this.game.moveCards(sourcePile, sourceIndex, targetPile, true);
            
            // Keep focus on the same pile after move
            setTimeout(() => {
                this.keyboardFocusPile = sourcePile;
                const pile = this.game.piles[sourcePile];
                this.keyboardFocusIndex = pile.cards.length > 0 ? pile.getLastCardIndex() : null;
                this.renderer.setKeyboardFocus(this.keyboardFocusPile, this.keyboardFocusIndex);
                this.renderer.draw();
            }, 350);
        }
        
        this.renderer.draw();
    }
}
