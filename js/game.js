class Game {
    constructor(suitMode = 4, animationManager = null) {
        this.suitMode = suitMode; // 1, 2, или 4 масти
        this.piles = [];
        this.deck = [];
        this.completedSequences = 0;
        this.moves = 0;
        
        // Двустековая система для undo/redo
        this.past = [];
        this.future = [];
        
        this.startTime = Date.now();
        this.timerInterval = null;
        this.animationManager = animationManager;
        
        this.initGame();
    }

    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    initGame() {
        this.cleanup();

        // Создаем колоду в зависимости от сложности
        this.deck = [];
        let suitsToUse;
        
        if (this.suitMode === 1) {
            suitsToUse = [0]; // Только черви
        } else if (this.suitMode === 2) {
            suitsToUse = [0, 3]; // Черви (красная) и пики (черная) для контраста
        } else {
            suitsToUse = [0, 1, 2, 3]; // Все масти
        }
        
        // Для каждой масти создаем нужное количество колод
        const decksNeeded = Math.ceil(52 / (13 * suitsToUse.length));
        
        for (let d = 0; d < decksNeeded; d++) {
            for (let suit of suitsToUse) {
                for (let rank = 1; rank <= 13; rank++) {
                    this.deck.push(new Card(rank, suit));
                }
            }
        }
        
        // Тасуем
        this.shuffle(this.deck);

        // Создаем 7 пилов
        this.piles = [];
        for (let i = 0; i < 7; i++) {
            this.piles.push(new Pile(50 + i * 140, 80));
        }

        // Раздаем карты: 1, 2, 3, 4, 5, 6, 7 (всего 28 карт)
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = this.deck.pop();
                card.faceUp = (j === i);
                this.piles[i].addCard(card);
            }
        }

        this.moves = 0;
        this.completedSequences = 0;
        this.past = [];
        this.future = [];
        
        this.startTimer();
        this.updateStats();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startTimer() {
        this.startTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    dealCards() {
        // Проверяем, что все места заполнены
        for (let pile of this.piles) {
            if (pile.cards.length === 0) {
                alert('Заполните все пустые места перед раздачей!');
                return false;
            }
        }

        if (this.deck.length < 7) {
            alert('Недостаточно карт в колоде!');
            return false;
        }

        // Сохраняем состояние для отмены
        const dealtCards = [];
        for (let i = 0; i < 7; i++) {
            dealtCards.push(this.deck.length - 7 + i);
        }

        this.past.push({
            type: 'deal',
            pileIndices: [0, 1, 2, 3, 4, 5, 6]
        });
        this.future = []; // Очищаем future при новом действии

        // Раздаем по одной карте на каждый пил
        for (let i = 0; i < 7; i++) {
            const card = this.deck.pop();
            card.faceUp = true;
            this.piles[i].addCard(card);
        }

        this.moves++;
        this.updateStats();
        return true;
    }

    moveCards(fromPile, cardIndex, toPile, animate = false) {
        const cards = fromPile.getMovableCardsFrom(cardIndex);
        if (!cards || !toPile.canAcceptCards(cards)) {
            return false;
        }

        // Сохраняем состояние для отмены
        const prevFromTopCard = fromPile.cards[cardIndex - 1];
        this.past.push({
            type: 'move',
            from: this.piles.indexOf(fromPile),
            to: this.piles.indexOf(toPile),
            cards: cards.length,
            fromTopWasFaceDown: prevFromTopCard && !prevFromTopCard.faceUp
        });
        this.future = []; // Очищаем future при новом действии

        // Вычисляем целевые позиции
        const targetY = toPile.y + toPile.cards.length * toPile.cardOffset;

        if (animate && this.animationManager) {
            // Анимируем перемещение
            const cardsToMove = [...cards];
            fromPile.removeCardsFrom(cardIndex);
            
            cardsToMove.forEach((card, index) => {
                this.animationManager.animateCardMove(
                    card,
                    toPile.x,
                    targetY + index * toPile.cardOffset,
                    300,
                    index === cardsToMove.length - 1 ? () => {
                        this.checkForCompletedSequences();
                    } : null
                );
            });
            
            toPile.addCards(cardsToMove);
        } else {
            fromPile.removeCardsFrom(cardIndex);
            toPile.addCards(cards);
            this.checkForCompletedSequences();
        }

        this.moves++;
        this.updateStats();
        
        return true;
    }

    findBestMoveForCards(pile, cardIndex) {
        const cards = pile.getMovableCardsFrom(cardIndex);
        if (!cards) return null;

        const firstCard = cards[0];
        
        // Приоритет 1: карта с нужным рангом (например, 6 на 7)
        for (let targetPile of this.piles) {
            if (targetPile === pile) continue;
            
            const topCard = targetPile.getTopCard();
            if (topCard && topCard.rank === firstCard.rank + 1) {
                return targetPile;
            }
        }

        // Приоритет 2: пустое место (если нет подходящей карты)
        for (let targetPile of this.piles) {
            if (targetPile === pile) continue;
            if (targetPile.cards.length === 0) {
                return targetPile;
            }
        }

        return null;
    }

    checkForCompletedSequences() {
        for (let pile of this.piles) {
            const index = pile.checkForCompletedSequence();
            if (index !== null) {
                pile.removeCardsFrom(index);
                this.completedSequences++;
                
                if (this.completedSequences === 4) {
                    setTimeout(() => {
                        this.cleanup();
                        alert('Поздравляем! Пасьянс сошелся!');
                    }, 500);
                }
                
                this.updateStats();
            }
        }
    }

    undo() {
        if (this.past.length === 0) return false;

        const action = this.past.pop();
        this.future.unshift(action); // Добавляем в future для redo

        if (action.type === 'move') {
            const fromPile = this.piles[action.from];
            const toPile = this.piles[action.to];

            const cards = toPile.removeCardsFrom(toPile.cards.length - action.cards);
            fromPile.addCards(cards);

            if (action.fromTopWasFaceDown && fromPile.cards.length > cards.length) {
                fromPile.cards[fromPile.cards.length - cards.length - 1].faceUp = false;
            }

            this.moves = Math.max(0, this.moves - 1);
        } else if (action.type === 'deal') {
            // Отменяем раздачу
            for (let i = action.pileIndices.length - 1; i >= 0; i--) {
                const pileIndex = action.pileIndices[i];
                const pile = this.piles[pileIndex];
                const card = pile.cards.pop();
                card.faceUp = false;
                this.deck.push(card);
                pile.updateCardPositions();
            }

            this.moves = Math.max(0, this.moves - 1);
        }

        this.updateStats();
        return true;
    }

    redo() {
        if (this.future.length === 0) return false;

        const action = this.future.shift();
        this.past.push(action);

        if (action.type === 'move') {
            const fromPile = this.piles[action.from];
            const toPile = this.piles[action.to];
            const cardIndex = fromPile.cards.length - action.cards;

            const cards = fromPile.removeCardsFrom(cardIndex);
            toPile.addCards(cards);

            this.moves++;
        } else if (action.type === 'deal') {
            // Повторяем раздачу
            for (let i = 0; i < action.pileIndices.length; i++) {
                const pileIndex = action.pileIndices[i];
                const pile = this.piles[pileIndex];
                const card = this.deck.pop();
                card.faceUp = true;
                pile.addCard(card);
            }

            this.moves++;
        }

        this.updateStats();
        return true;
    }

    canUndo() {
        return this.past.length > 0;
    }

    canRedo() {
        return this.future.length > 0;
    }

    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('deckCount').textContent = this.deck.length;
        document.getElementById('completed').textContent = this.completedSequences;
        
        // Обновляем состояние кнопок
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');
        const dealBtn = document.getElementById('dealBtn');
        
        if (undoBtn) undoBtn.disabled = !this.canUndo();
        if (redoBtn) redoBtn.disabled = !this.canRedo();
        if (dealBtn) dealBtn.disabled = this.deck.length < 7;
    }

    getPileAt(x, y) {
        for (let pile of this.piles) {
            if (x >= pile.x && x <= pile.x + 100) {
                return pile;
            }
        }
        return null;
    }

    getCardAt(x, y) {
        for (let pile of this.piles) {
            for (let i = pile.cards.length - 1; i >= 0; i--) {
                const card = pile.cards[i];
                if (card.faceUp) {
                    const cardHeight = (i === pile.cards.length - 1) ? 140 : pile.cardOffset;
                    if (x >= card.x && x <= card.x + 100 &&
                        y >= card.y && y <= card.y + cardHeight) {
                        return { pile, card, index: i };
                    }
                }
            }
        }
        return null;
    }
}