import { Card } from './card.js';
import { Pile } from './pile.js';

export class Game {
    constructor(animationManager) {
        this.animationManager = animationManager;
        this.piles = [];
        this.deck = [];
        this.completedSequences = [];
        this.suitCount = 2;
        this.moves = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.past = [];
        this.future = [];
        this.dealCount = 0; // Track number of deals
    }

    initGame() {
        this.cleanup();
        
        this.piles = [];
        this.deck = [];
        this.completedSequences = [];
        this.moves = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.past = [];
        this.future = [];
        this.dealCount = 0;

        // Create deck
        const suits = this.suitCount === 1 ? [0] : 
                     this.suitCount === 2 ? [0, 3] : 
                     [0, 1, 2, 3];
        
        const allCards = [];
        for (let rank = 1; rank <= 13; rank++) {
            for (let suit of suits) {
                allCards.push(new Card(rank, suit));
            }
        }

        // Shuffle
        for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }

        // Create piles with initial layout
        const canvas = document.getElementById('game-canvas');
        const cardWidth = 100;
        const spacing = 20;
        const totalWidth = 7 * cardWidth + 6 * spacing;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = 120;

        for (let i = 0; i < 7; i++) {
            const pile = new Pile(startX + i * (cardWidth + spacing), startY);
            this.piles.push(pile);
        }

        // Deal initial cards: 1, 2, 3, 4, 5, 6, 7 cards per pile
        let cardIndex = 0;
        for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
            const numCards = pileIndex + 1;
            for (let j = 0; j < numCards; j++) {
                const card = allCards[cardIndex++];
                // Only bottom card is face up
                card.faceUp = (j === numCards - 1);
                this.piles[pileIndex].addCard(card);
            }
        }

        // Remaining cards go to deck
        this.deck = allCards.slice(cardIndex);

        this.startTimer();
        this.updateStats();
        this.updateDeckDisplay();
        this.updateCompletedDisplay();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateStats();
        }, 1000);
    }

    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = this.elapsedTime % 60;
        document.getElementById('time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('undo').disabled = this.past.length === 0 || 
            this.animationManager.hasActiveAnimations();
        document.getElementById('redo').disabled = this.future.length === 0 || 
            this.animationManager.hasActiveAnimations();
        document.getElementById('deal').disabled = this.deck.length === 0 || 
            this.animationManager.hasActiveAnimations();
        document.getElementById('suits').disabled = 
            this.animationManager.hasActiveAnimations();
    }

    updateDeckDisplay() {
        const deckArea = document.getElementById('deck-area');
        deckArea.innerHTML = '';
        
        // 4 piles: 7, 7, 7, 3 cards
        const pilesSizes = [7, 7, 7, 3];
        let remainingCards = this.deck.length;
        
        for (let i = 0; i < 4; i++) {
            const pile = document.createElement('div');
            pile.className = 'deck-pile';
            
            if (remainingCards > 0) {
                remainingCards -= pilesSizes[i];
            } else {
                pile.classList.add('empty');
            }
            
            deckArea.appendChild(pile);
        }
    }

    updateCompletedDisplay() {
        const container = document.getElementById('completed-sequences');
        container.innerHTML = '';
        
        this.completedSequences.forEach((sequence, index) => {
            const kingCard = sequence.find(card => card.rank === 13);
            if (kingCard) {
                const kingDiv = document.createElement('div');
                kingDiv.className = 'completed-king';
                kingDiv.style.color = kingCard.getSuitColor();
                kingDiv.textContent = kingCard.getSuitSymbol();
                
                // Animate new kings
                if (index === this.completedSequences.length - 1) {
                    setTimeout(() => kingDiv.classList.add('animate-in'), 10);
                } else {
                    kingDiv.classList.add('animate-in');
                }
                
                container.appendChild(kingDiv);
            }
        });
    }

    dealCards() {
        if (this.deck.length === 0 || this.animationManager.hasActiveAnimations()) {
            return;
        }

        // Save state
        this.saveState('deal');

        // Deal cards with animation
        const cardsToDeal = Math.min(this.deck.length, 7);
        const cardsDealt = [];
        
        for (let i = 0; i < cardsToDeal; i++) {
            const card = this.deck.pop();
            card.faceUp = true;
            
            const targetPile = this.piles[i];
            const targetY = targetPile.y + targetPile.cards.length * targetPile.getCardOffset();
            
            // Start position (deck area)
            card.x = window.innerWidth - 150;
            card.y = 50;
            
            cardsDealt.push({ card, pile: targetPile, targetY });
        }

        // Animate dealing with stagger
        cardsDealt.forEach((item, index) => {
            setTimeout(() => {
                this.animationManager.animateCardMove(
                    item.card,
                    item.pile.x,
                    item.targetY,
                    400,
                    () => {
                        item.pile.addCard(item.card);
                        if (index === cardsDealt.length - 1) {
                            this.checkForCompletedSequences();
                            this.updateStats();
                        }
                    }
                );
            }, index * 80);
        });

        this.moves++;
        this.dealCount++;
        this.updateDeckDisplay();
        this.updateStats();
    }

    moveCards(fromPileIndex, cardIndex, toPileIndex, withAnimation = true) {
        if (this.animationManager.hasActiveAnimations()) return false;

        const fromPile = this.piles[fromPileIndex];
        const toPile = this.piles[toPileIndex];

        const sequence = fromPile.getSameSuitSequenceFrom(cardIndex);
        if (!sequence || sequence.length === 0) return false;

        const topCard = sequence[0];
        const targetCard = toPile.getTopCard();

        if (targetCard && !topCard.canPlaceOn(targetCard)) {
            return false;
        }

        // Valid move
        this.saveState('move');

        const movedCards = fromPile.removeCardsFrom(cardIndex);
        
        // Flip next card in source pile
        const newTopCard = fromPile.getTopCard();
        if (newTopCard && !newTopCard.faceUp) {
            newTopCard.faceUp = true;
        }

        if (withAnimation) {
            movedCards.forEach((card, i) => {
                const targetY = toPile.y + (toPile.cards.length + i) * toPile.getCardOffset();
                
                this.animationManager.animateCardMove(card, toPile.x, targetY, 300, () => {
                    if (i === movedCards.length - 1) {
                        toPile.addCards(movedCards);
                        this.checkForCompletedSequences();
                        this.updateStats();
                    }
                });
            });
        } else {
            toPile.addCards(movedCards);
            this.checkForCompletedSequences();
        }

        this.moves++;
        this.updateStats();
        return true;
    }

    findBestMoveForCards(pileIndex, cardIndex) {
        const pile = this.piles[pileIndex];
        const sequence = pile.getSameSuitSequenceFrom(cardIndex);
        if (!sequence || sequence.length === 0) return null;

        const topCard = sequence[0];
        
        // Priority 1: Find card with rank + 1
        for (let i = 0; i < this.piles.length; i++) {
            if (i === pileIndex) continue;
            
            const targetCard = this.piles[i].getTopCard();
            if (targetCard && topCard.canPlaceOn(targetCard)) {
                return i;
            }
        }

        // Priority 2: Empty pile (only if not already from empty pile)
        if (pile.cards.length > sequence.length) {
            for (let i = 0; i < this.piles.length; i++) {
                if (i === pileIndex) continue;
                if (this.piles[i].cards.length === 0) {
                    return i;
                }
            }
        }

        return null;
    }

    checkForCompletedSequences() {
        for (let pile of this.piles) {
            const completed = pile.checkForCompletedSequence();
            if (completed) {
                pile.removeCardsFrom(pile.cards.length - 13);
                this.completedSequences.push(completed);
                
                // Flip next card
                const newTop = pile.getTopCard();
                if (newTop && !newTop.faceUp) {
                    newTop.faceUp = true;
                }
                
                this.updateCompletedDisplay();
                
                // Check win condition
                if (this.completedSequences.length === 4) {
                    setTimeout(() => {
                        alert(`Поздравляем! Пасьянс сошёлся!\nХоды: ${this.moves}\nВремя: ${document.getElementById('time').textContent}`);
                    }, 500);
                }
                
                return true;
            }
        }
        return false;
    }

    saveState(action) {
        const state = {
            action,
            piles: this.piles.map(p => p.clone()),
            deck: this.deck.map(c => c.clone()),
            completedSequences: this.completedSequences.length,
            moves: this.moves,
            dealCount: this.dealCount
        };
        this.past.push(state);
        this.future = [];
    }

    undo() {
        if (this.past.length === 0 || this.animationManager.hasActiveAnimations()) return;

        const currentState = {
            piles: this.piles.map(p => p.clone()),
            deck: this.deck.map(c => c.clone()),
            completedSequences: this.completedSequences.length,
            moves: this.moves,
            dealCount: this.dealCount
        };
        this.future.push(currentState);

        const prevState = this.past.pop();
        this.restoreState(prevState);
    }

    redo() {
        if (this.future.length === 0 || this.animationManager.hasActiveAnimations()) return;

        const currentState = {
            piles: this.piles.map(p => p.clone()),
            deck: this.deck.map(c => c.clone()),
            completedSequences: this.completedSequences.length,
            moves: this.moves,
            dealCount: this.dealCount
        };
        this.past.push(currentState);

        const nextState = this.future.pop();
        this.restoreState(nextState);
    }

    restoreState(state) {
        this.piles = state.piles.map(p => p.clone());
        this.deck = state.deck.map(c => c.clone());
        this.moves = state.moves;
        this.dealCount = state.dealCount;
        
        // Restore completed sequences
        while (this.completedSequences.length > state.completedSequences) {
            this.completedSequences.pop();
        }
        
        this.updateStats();
        this.updateDeckDisplay();
        this.updateCompletedDisplay();
    }
}
