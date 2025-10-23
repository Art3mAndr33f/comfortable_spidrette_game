class Renderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;
        
        this.cardWidth = 100;
        this.cardHeight = 140;
        
        // Состояния для подсветки
        this.selectedPile = null;
        this.selectedCardIndex = null;
        this.hoveredCard = null;
        this.keyboardPile = null;
        this.keyboardCardIndex = null;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = 1100;
        this.canvas.height = 650;
    }

    setSelection(pile, cardIndex) {
        this.selectedPile = pile;
        this.selectedCardIndex = cardIndex;
    }

    setHovered(card) {
        this.hoveredCard = card;
    }

    setKeyboardFocus(pile, cardIndex) {
        this.keyboardPile = pile;
        this.keyboardCardIndex = cardIndex;
    }

    clearKeyboardFocus() {
        this.keyboardPile = null;
        this.keyboardCardIndex = null;
    }

    draw() {
        // Очищаем canvas
        this.ctx.fillStyle = '#1b5e20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем пилы
        for (let pile of this.game.piles) {
            this.drawPile(pile);
        }

        // Рисуем подсветку выбранных карт (мышь)
        if (this.selectedPile && this.selectedCardIndex !== null) {
            this.highlightSelectedCards(this.selectedPile, this.selectedCardIndex);
        }

        // Рисуем подсветку клавиатурного фокуса
        if (this.keyboardPile && this.keyboardCardIndex !== null) {
            this.highlightKeyboardFocus(this.keyboardPile, this.keyboardCardIndex);
        }
    }

    drawPile(pile) {
        // Рисуем контур пустого места
        if (pile.cards.length === 0) {
            this.ctx.strokeStyle = '#4caf50';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(pile.x, pile.y, this.cardWidth, this.cardHeight);
            this.ctx.setLineDash([]);
        }

        // Рисуем карты
        for (let i = 0; i < pile.cards.length; i++) {
            const card = pile.cards[i];
            const isLast = (i === pile.cards.length - 1);
            this.drawCard(card, isLast);
        }
    }

    drawCard(card, isFullyVisible = true) {
        const ctx = this.ctx;
        
        if (card.faceUp) {
            // Тень
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Фон карты
            ctx.fillStyle = 'white';
            ctx.fillRect(card.x, card.y, this.cardWidth, this.cardHeight);
            
            ctx.shadowColor = 'transparent';

            // Граница
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(card.x, card.y, this.cardWidth, this.cardHeight);

            // Ранг и масть в верхнем левом углу
            ctx.fillStyle = card.getSuitColor();
            ctx.font = 'bold 22px Arial';
            ctx.fillText(card.getRankName(), card.x + 8, card.y + 26);
            
            ctx.font = '28px Arial';
            ctx.fillText(card.getSuitSymbol(), card.x + 8, card.y + 56);

            // Если карта полностью видна, рисуем нижнюю часть
            if (isFullyVisible) {
                // Большой символ масти в центре
                ctx.font = '48px Arial';
                ctx.fillText(card.getSuitSymbol(), card.x + 26, card.y + 90);

                // В правом нижнем углу (перевернуто)
                ctx.save();
                ctx.translate(card.x + this.cardWidth, card.y + this.cardHeight);
                ctx.rotate(Math.PI);
                ctx.font = 'bold 22px Arial';
                ctx.fillText(card.getRankName(), 8, 26);
                ctx.font = '28px Arial';
                ctx.fillText(card.getSuitSymbol(), 8, 56);
                ctx.restore();
            }
        } else {
            // Тень
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Рубашка карты
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(card.x, card.y, this.cardWidth, this.cardHeight);
            
            ctx.shadowColor = 'transparent';
            
            ctx.strokeStyle = '#0d47a1';
            ctx.lineWidth = 2;
            ctx.strokeRect(card.x, card.y, this.cardWidth, this.cardHeight);

            // Узор на рубашке
            ctx.strokeStyle = '#2196f3';
            for (let i = 0; i < 5; i++) {
                ctx.strokeRect(
                    card.x + 10 + i * 4, 
                    card.y + 10 + i * 4, 
                    this.cardWidth - 20 - i * 8, 
                    this.cardHeight - 20 - i * 8
                );
            }
        }
    }

    highlightSelectedCards(pile, cardIndex) {
        const cards = pile.cards.slice(cardIndex);
        
        for (let card of cards) {
            this.ctx.strokeStyle = '#ff9800';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(card.x - 2, card.y - 2, this.cardWidth + 4, this.cardHeight + 4);
        }
    }

    highlightKeyboardFocus(pile, cardIndex) {
        if (cardIndex >= 0 && cardIndex < pile.cards.length) {
            const card = pile.cards[cardIndex];
            this.ctx.strokeStyle = '#2196f3';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeRect(card.x - 2, card.y - 2, this.cardWidth + 4, this.cardHeight + 4);
            this.ctx.setLineDash([]);
        }
    }
}