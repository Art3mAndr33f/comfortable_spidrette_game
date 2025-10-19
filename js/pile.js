class Pile {
    constructor(x, y) {
        this.cards = [];
        this.x = x;
        this.y = y;
        this.cardOffset = 35; // Увеличен для лучшей видимости мастей
    }

    addCard(card) {
        this.cards.push(card);
        this.updateCardPositions();
    }

    addCards(cards) {
        this.cards.push(...cards);
        this.updateCardPositions();
    }

    removeCard(card) {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
            this.updateCardPositions();
        }
    }

    removeCardsFrom(index) {
        const removed = this.cards.splice(index);
        this.updateCardPositions();
        return removed;
    }

    getTopCard() {
        return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
    }

    updateCardPositions() {
        this.cards.forEach((card, index) => {
            card.x = this.x;
            card.y = this.y + index * this.cardOffset;
        });

        // Открываем последнюю карту
        if (this.cards.length > 0) {
            this.cards[this.cards.length - 1].faceUp = true;
        }
    }

    canAcceptCards(cards) {
        if (cards.length === 0) return false;
        
        const topCard = this.getTopCard();
        const firstCard = cards[0];

        if (!topCard) {
            return true; // Любую карту можно положить на пустое место
        }

        return firstCard.canPlaceOn(topCard);
    }

    // Проверяем, что все карты одной масти и образуют последовательность
    getSameSuitSequenceFrom(index) {
        if (index < 0 || index >= this.cards.length) return null;
        if (!this.cards[index].faceUp) return null;

        const cards = this.cards.slice(index);
        if (cards.length === 0) return null;

        const suit = cards[0].suit;

        // Проверяем, что все карты одной масти и образуют нисходящую последовательность
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].suit !== suit) {
                // Возвращаем только первую карту, если дальше идут другие масти
                if (i === 0) return [cards[0]];
                return null;
            }
            if (i > 0 && !cards[i].canPlaceOn(cards[i - 1])) {
                return null;
            }
        }

        return cards;
    }

    getMovableCardsFrom(index) {
        return this.getSameSuitSequenceFrom(index);
    }

    checkForCompletedSequence() {
        if (this.cards.length < 13) return null;

        // Проверяем последние 13 карт
        const last13 = this.cards.slice(-13);
        
        // Проверяем одинаковую масть и нисходящую последовательность от короля до туза
        if (last13[0].rank !== 13 || !last13[0].faceUp) return null;
        
        const suit = last13[0].suit;
        for (let i = 0; i < 13; i++) {
            if (last13[i].rank !== 13 - i || last13[i].suit !== suit) {
                return null;
            }
        }

        // Найдена полная последовательность
        return this.cards.length - 13;
    }

    getFaceUpStartIndex() {
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].faceUp) return i;
        }
        return this.cards.length;
    }

    getLastCardIndex() {
        return Math.max(0, this.cards.length - 1);
    }
}
