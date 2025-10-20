export class Pile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.cards = [];
        this.cardOffset = 35;
        this.minCardOffset = 15; // Minimum offset when compressed
    }

    addCard(card) {
        card.x = this.x;
        card.y = this.y + this.cards.length * this.getCardOffset();
        this.cards.push(card);
        this.updateCardPositions();
    }

    addCards(cards) {
        cards.forEach(card => this.addCard(card));
    }

    removeCardsFrom(index) {
        const removed = this.cards.splice(index);
        this.updateCardPositions();
        return removed;
    }

    getTopCard() {
        return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
    }

    getSameSuitSequenceFrom(index) {
        if (index >= this.cards.length || !this.cards[index].faceUp) return null;

        const sequence = [this.cards[index]];
        for (let i = index + 1; i < this.cards.length; i++) {
            const prevCard = this.cards[i - 1];
            const currCard = this.cards[i];
            
            if (currCard.faceUp && currCard.isSequenceWith(prevCard)) {
                sequence.push(currCard);
            } else {
                break;
            }
        }
        
        return sequence.length > 0 ? sequence : null;
    }

    checkForCompletedSequence() {
        if (this.cards.length < 13) return null;

        const topCard = this.getTopCard();
        if (!topCard || !topCard.faceUp || topCard.rank !== 1) return null;

        const sequence = [];
        for (let i = this.cards.length - 1; i >= 0 && sequence.length < 13; i--) {
            const card = this.cards[i];
            if (!card.faceUp) break;
            
            if (sequence.length === 0) {
                if (card.rank === 1) sequence.push(card);
                else break;
            } else {
                const lastCard = sequence[sequence.length - 1];
                if (card.suit === lastCard.suit && card.rank === lastCard.rank + 1) {
                    sequence.push(card);
                } else {
                    break;
                }
            }
        }

        if (sequence.length === 13 && sequence[sequence.length - 1].rank === 13) {
            return sequence;
        }
        
        return null;
    }

    getFaceUpStartIndex() {
        return this.cards.findIndex(card => card.faceUp);
    }

    getLastCardIndex() {
        return this.cards.length - 1;
    }

    // Calculate card offset based on available space
    getCardOffset() {
        const canvasHeight = window.innerHeight - document.getElementById('top-panel').offsetHeight;
        const cardHeight = 140;
        const bottomMargin = 20;
        const availableHeight = canvasHeight - this.y - cardHeight - bottomMargin;
        
        if (this.cards.length <= 1) return this.cardOffset;
        
        const requiredHeight = (this.cards.length - 1) * this.cardOffset;
        
        if (requiredHeight > availableHeight) {
            const compressed = availableHeight / (this.cards.length - 1);
            return Math.max(this.minCardOffset, compressed);
        }
        
        return this.cardOffset;
    }

    updateCardPositions() {
        const offset = this.getCardOffset();
        this.cards.forEach((card, index) => {
            card.x = this.x;
            card.y = this.y + index * offset;
        });
    }

    clone() {
        const pile = new Pile(this.x, this.y);
        pile.cards = this.cards.map(card => card.clone());
        pile.cardOffset = this.cardOffset;
        return pile;
    }
}
