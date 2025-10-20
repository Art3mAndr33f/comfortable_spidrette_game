export class Renderer {
    constructor(ctx, canvas, game, animationManager) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.game = game;
        this.animationManager = animationManager;
        this.cardWidth = 100;
        this.cardHeight = 140;
        this.cardRadius = 8;
        this.selectedPile = null;
        this.selectedIndex = null;
        this.keyboardFocusPile = null;
        this.keyboardFocusIndex = null;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw empty pile indicators
        this.game.piles.forEach((pile, pileIndex) => {
            if (pile.cards.length === 0) {
                this.drawEmptyPile(pile.x, pile.y, pileIndex);
            }
        });

        // Draw all cards
        this.game.piles.forEach((pile, pileIndex) => {
            pile.cards.forEach((card, cardIndex) => {
                const isSelected = this.selectedPile === pileIndex && 
                                 cardIndex >= this.selectedIndex;
                const isFocused = this.keyboardFocusPile === pileIndex && 
                                cardIndex === this.keyboardFocusIndex;
                
                const nextCard = pile.cards[cardIndex + 1];
                const isFullyVisible = !nextCard || 
                    (card.y + this.cardHeight <= nextCard.y + 20);

                this.drawCard(card, isFullyVisible, isSelected, isFocused);
            });
        });

        // Draw animated cards on top
        this.animationManager.animations.forEach(anim => {
            this.drawCard(anim.card, true, false, false);
        });
    }

    drawEmptyPile(x, y, pileIndex) {
        const isFocused = this.keyboardFocusPile === pileIndex && 
                         this.keyboardFocusIndex === null;
        
        this.ctx.strokeStyle = isFocused ? '#2196f3' : 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = isFocused ? 3 : 2;
        
        if (isFocused) {
            this.ctx.setLineDash([8, 4]);
        } else {
            this.ctx.setLineDash([5, 5]);
        }
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, this.cardWidth, this.cardHeight, this.cardRadius);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawCard(card, isFullyVisible, isSelected, isFocused) {
        const ctx = this.ctx;
        
        // Shadow
        if (!this.animationManager.hasActiveAnimations() || isFullyVisible) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
        }

        // Card background
        ctx.fillStyle = card.faceUp ? '#ffffff' : '#1565c0';
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, this.cardWidth, this.cardHeight, this.cardRadius);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (card.faceUp) {
            this.drawCardFace(card, isFullyVisible);
        } else {
            this.drawCardBack(card);
        }

        // Selection highlight
        if (isSelected) {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(card.x, card.y, this.cardWidth, this.cardHeight, this.cardRadius);
            ctx.stroke();
        }

        // Keyboard focus
        if (isFocused) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.roundRect(card.x - 2, card.y - 2, this.cardWidth + 4, this.cardHeight + 4, this.cardRadius + 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawCardFace(card, isFullyVisible) {
        const ctx = this.ctx;
        const color = card.getSuitColor();
        const rank = card.getRankName();
        const suit = card.getSuitSymbol();

        // Top-left corner
        ctx.fillStyle = color;
        ctx.font = 'bold 20px Quicksand, Nunito, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(rank, card.x + 8, card.y + 8);
        
        ctx.font = '22px Quicksand, Nunito, sans-serif';
        ctx.fillText(suit, card.x + 8, card.y + 30);

        if (isFullyVisible) {
            // Center suit symbol
            ctx.font = '56px Quicksand, Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suit, card.x + this.cardWidth / 2, card.y + this.cardHeight / 2);

            // Bottom-right corner (rotated)
            ctx.save();
            ctx.translate(card.x + this.cardWidth, card.y + this.cardHeight);
            ctx.rotate(Math.PI);
            
            ctx.font = 'bold 20px Quicksand, Nunito, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, 8, 8);
            
            ctx.font = '22px Quicksand, Nunito, sans-serif';
            ctx.fillText(suit, 8, 30);
            
            ctx.restore();
        }
    }

    drawCardBack(card) {
        const ctx = this.ctx;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(
            card.x, card.y, 
            card.x + this.cardWidth, card.y + this.cardHeight
        );
        gradient.addColorStop(0, '#1976d2');
        gradient.addColorStop(1, '#0d47a1');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, this.cardWidth, this.cardHeight, this.cardRadius);
        ctx.fill();

        // Pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            const inset = 8 + i * 6;
            ctx.beginPath();
            ctx.roundRect(
                card.x + inset, 
                card.y + inset,
                this.cardWidth - 2 * inset,
                this.cardHeight - 2 * inset,
                Math.max(2, this.cardRadius - inset / 2)
            );
            ctx.stroke();
        }
    }

    setSelection(pileIndex, cardIndex) {
        this.selectedPile = pileIndex;
        this.selectedIndex = cardIndex;
    }

    clearSelection() {
        this.selectedPile = null;
        this.selectedIndex = null;
    }

    setKeyboardFocus(pileIndex, cardIndex) {
        this.keyboardFocusPile = pileIndex;
        this.keyboardFocusIndex = cardIndex;
    }

    clearKeyboardFocus() {
        this.keyboardFocusPile = null;
        this.keyboardFocusIndex = null;
    }

    getCardAt(x, y) {
        for (let pileIndex = this.game.piles.length - 1; pileIndex >= 0; pileIndex--) {
            const pile = this.game.piles[pileIndex];
            
            for (let cardIndex = pile.cards.length - 1; cardIndex >= 0; cardIndex--) {
                const card = pile.cards[cardIndex];
                
                if (!card.faceUp) continue;
                
                const nextCard = pile.cards[cardIndex + 1];
                const visibleHeight = nextCard ? 
                    Math.min(pile.getCardOffset(), this.cardHeight) : 
                    this.cardHeight;
                
                if (x >= card.x && x <= card.x + this.cardWidth &&
                    y >= card.y && y <= card.y + visibleHeight) {
                    return { pileIndex, cardIndex };
                }
            }
        }
        return null;
    }
}
