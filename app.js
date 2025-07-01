class FifteenPuzzle {
    constructor() {
        this.size = 4;
        this.board = [];
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPWA();
        this.initializeGame();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.movesDisplay = document.getElementById('moves');
        this.timerDisplay = document.getElementById('timer');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.difficultySelect = document.getElementById('difficulty');
        this.victoryPopup = document.getElementById('victoryPopup');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.installBtn = document.getElementById('installBtn');
    }

    setupEventListeners() {
        this.shuffleBtn.addEventListener('click', () => this.shuffleBoard());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(parseInt(e.target.value)));
        this.playAgainBtn.addEventListener('click', () => this.hideVictoryPopup());
        
        // Добавляем поддержку клавиатуры
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    setupPWA() {
        // Регистрация Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
        }

        // Установка PWA
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.installBtn.style.display = 'block';
        });

        this.installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }

    initializeGame() {
        this.createBoard();
        this.updateDisplay();
    }

    createBoard() {
        // Создаем решенную доску
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = i * this.size + j + 1;
            }
        }
        this.board[this.size - 1][this.size - 1] = 0; // Пустая клетка
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
        
        this.renderBoard();
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                const value = this.board[i][j];
                
                if (value === 0) {
                    tile.className = 'tile empty-tile';
                } else {
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.addEventListener('click', () => this.moveTile(i, j));
                }
                
                tile.dataset.row = i;
                tile.dataset.col = j;
                this.gameBoard.appendChild(tile);
            }
        }
        
        this.highlightMovableTiles();
    }

    highlightMovableTiles() {
        const tiles = this.gameBoard.querySelectorAll('.tile:not(.empty-tile)');
        tiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            
            if (this.canMoveTile(row, col)) {
                tile.classList.add('movable');
            } else {
                tile.classList.remove('movable');
            }
        });
    }

    canMoveTile(row, col) {
        const emptyRow = this.emptyPos.row;
        const emptyCol = this.emptyPos.col;
        
        return (
            (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
            (col === emptyCol && Math.abs(row - emptyRow) === 1)
        );
    }

    moveTile(row, col) {
        if (!this.canMoveTile(row, col)) return;
        
        const tile = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        tile.classList.add('moving');
        
        // Анимация движения
        setTimeout(() => {
            // Меняем местами плитку и пустое место
            this.board[this.emptyPos.row][this.emptyPos.col] = this.board[row][col];
            this.board[row][col] = 0;
            this.emptyPos = { row, col };
            
            this.moves++;
            this.updateDisplay();
            
            if (!this.isGameActive) {
                this.startGame();
            }
            
            tile.classList.remove('moving');
            this.renderBoard();
            
            if (this.checkWin()) {
                this.endGame();
            }
        }, 150);
    }

    handleKeyPress(e) {
        if (!this.isGameActive) return;
        
        const { row, col } = this.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        switch (e.key) {
            case 'ArrowUp':
                targetRow = row + 1;
                break;
            case 'ArrowDown':
                targetRow = row - 1;
                break;
            case 'ArrowLeft':
                targetCol = col + 1;
                break;
            case 'ArrowRight':
                targetCol = col - 1;
                break;
            default:
                return;
        }
        
        if (targetRow >= 0 && targetRow < this.size && 
            targetCol >= 0 && targetCol < this.size) {
            this.moveTile(targetRow, targetCol);
        }
    }

    shuffleBoard() {
        // Генерируем решаемую позицию через случайные ходы
        for (let i = 0; i < 1000; i++) {
            const moves = this.getValidMoves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                this.board[this.emptyPos.row][this.emptyPos.col] = this.board[randomMove.row][randomMove.col];
                this.board[randomMove.row][randomMove.col] = 0;
                this.emptyPos = randomMove;
            }
        }
        
        this.resetStats();
        this.renderBoard();
    }

    getValidMoves() {
        const moves = [];
        const { row, col } = this.emptyPos;
        
        const directions = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ];
        
        directions.forEach(pos => {
            if (pos.row >= 0 && pos.row < this.size && 
                pos.col >= 0 && pos.col < this.size) {
                moves.push(pos);
            }
        });
        
        return moves;
    }

    showHint() {
        const moves = this.getValidMoves();
        if (moves.length === 0) return;
        
        // Подсвечиваем все возможные ходы
        moves.forEach(move => {
            const tile = this.gameBoard.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (tile) {
                tile.style.animation = 'glow 1s ease-in-out 3';
                setTimeout(() => {
                    tile.style.animation = '';
                }, 3000);
            }
        });
    }

    checkWin() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const expectedValue = i * this.size + j + 1;
                if (i === this.size - 1 && j === this.size - 1) {
                    if (this.board[i][j] !== 0) return false;
                } else {
                    if (this.board[i][j] !== expectedValue) return false;
                }
            }
        }
        return true;
    }

    startGame() {
        if (this.isGameActive) return;
        
        this.isGameActive = true;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    endGame() {
        this.isGameActive = false;
        clearInterval(this.timerInterval);
        this.showVictoryPopup();
    }

    resetGame() {
        this.resetStats();
        this.createBoard();
    }

    resetStats() {
        this.moves = 0;
        this.isGameActive = false;
        this.startTime = null;
        clearInterval(this.timerInterval);
        this.updateDisplay();
    }

    changeDifficulty(newSize) {
        this.size = newSize;
        this.resetGame();
    }

    updateDisplay() {
        this.movesDisplay.textContent = this.moves;
        this.updateTimer();
    }

    updateTimer() {
        if (!this.startTime) {
            this.timerDisplay.textContent = '00:00';
            return;
        }
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    showVictoryPopup() {
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalTime').textContent = this.timerDisplay.textContent;
        this.victoryPopup.classList.add('show');
        
        // Добавляем конфетти эффект
        this.createConfetti();
    }

    hideVictoryPopup() {
        this.victoryPopup.classList.remove('show');
        this.shuffleBoard();
    }

    createConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1001;
        `;
        document.body.appendChild(confettiContainer);
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
                border-radius: 50%;
            `;
            confettiContainer.appendChild(confetti);
        }
        
        // Удаляем конфетти через 5 секунд
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 5000);
    }
}

// CSS анимация для конфетти
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    new FifteenPuzzle();
}); 
