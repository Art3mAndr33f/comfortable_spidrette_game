export class Card {
    constructor(rank, suit) {
        this.rank = rank; // 1(Ace) to 13(King)
        this.suit = suit; // 0:hearts, 1:diamonds, 2:clubs, 3:spades
        this.faceUp = false;
        this.x = 0;
        this.y = 0;
    }

    getRankName() {
        const names = ['', 'Т', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К'];
        return names[this.rank];
    }

    getSuitSymbol() {
        const symbols = ['♥', '♦', '♣', '♠'];
        return symbols[this.suit];
    }

    getSuitColor() {
        return (this.suit === 0 || this.suit === 1) ? '#d32f2f' : '#212121';
    }

    canPlaceOn(otherCard) {
        if (!otherCard) return true; // Can place on empty
        return this.rank === otherCard.rank - 1;
    }

    isSequenceWith(otherCard) {
        if (!otherCard) return false;
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
