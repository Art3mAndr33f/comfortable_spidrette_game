class Card {
    constructor(rank, suit) {
        this.rank = rank; // 1-13 (1=Туз, 13=Король)
        this.suit = suit; // 0-3 (черви, бубны, трефы, пики)
        this.faceUp = false;
        this.x = 0;
        this.y = 0;
    }

    getRankName() {
        const ranks = ['', 'Т', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К'];
        return ranks[this.rank];
    }

    getSuitSymbol() {
        const suits = ['♥', '♦', '♣', '♠'];
        return suits[this.suit];
    }

    getSuitColor() {
        return (this.suit === 0 || this.suit === 1) ? '#d32f2f' : '#000';
    }

    canPlaceOn(otherCard) {
        if (!otherCard) return true; // Любую карту можно положить на пустое место
        return this.rank === otherCard.rank - 1; // Нисходящая последовательность
    }

    isSequenceWith(otherCard) {
        return this.suit === otherCard.suit && this.rank === otherCard.rank - 1;
    }

    clone() {
        const card = new Card(this.rank, this.suit);
        card.faceUp = this.faceUp;
        card.x = this.x;
        card.y = this.y;
        return card;
    }
}
