class FifteenPuzzle {
    constructor() {
        this.size = 4;
        this.board = [];
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;
        this.isDarkTheme = this.getThemePreference();
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPWA();
        this.applyTheme();
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
        this.themeToggle = document.getElementById('themeToggle');
    }

    setupEventListeners() {
        // Убираем старые event listeners и добавляем новые с проверкой
        if (this.shuffleBtn) {
            this.shuffleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shuffleBoard();
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetGame();
            });
        }
        
        if (this.hintBtn) {
            this.hintBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showHint();
            });
        }
        
        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                this.changeDifficulty(parseInt(e.target.value));
            });
        }
        
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideVictoryPopup();
            });
        }
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
        
        // Добавляем поддержку клавиатуры
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    getThemePreference() {
        const savedTheme = localStorage.getItem('fifteen-puzzle-theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        // Проверяем системную тему
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        localStorage.setItem('fifteen-puzzle-theme', this.isDarkTheme ? 'dark' : 'light');
    }

    applyTheme() {
        if (this.isDarkTheme) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (this.themeToggle) {
                this.themeToggle.textContent = '☀️';
                this.themeToggle.title = 'Переключить на светлую тему';
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (this.themeToggle) {
                this.themeToggle.textContent = '🌙';
                this.themeToggle.title = 'Переключить на темную тему';
            }
        }
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
            if (this.installBtn) {
                this.installBtn.style.display = 'block';
            }
        });

        if (this.installBtn) {
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
        if (!this.gameBoard) return;
        
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
                    
                    // Добавляем обработчики для desktop и mobile
                    tile.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.moveTile(i, j);
                    });
                    
                    // Touch события для мобильных устройств
                    tile.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        tile.classList.add('touching');
                    }, { passive: false });
                    
                    tile.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        tile.classList.remove('touching');
                        this.moveTile(i, j);
                    }, { passive: false });
                    
                    tile.addEventListener('touchcancel', (e) => {
                        tile.classList.remove('touching');
                    });
                }
                
                tile.dataset.row = i;
                tile.dataset.col = j;
                this.gameBoard.appendChild(tile);
            }
        }
        
        this.highlightMovableTiles();
    }

    highlightMovableTiles() {
        if (!this.gameBoard) return;
        
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
        
        const tile = this.gameBoard?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!tile) return;
        
        tile.classList.add('moving');
        
        // Воспроизводим звук клика (если поддерживается)
        this.playClickSound();
        
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

    playClickSound() {
        // Создаем простой звук клика через Web Audio API
        try {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const AudioCtx = AudioContext || webkitAudioContext;
                const audioContext = new AudioCtx();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        } catch (error) {
            // Если звук не поддерживается, просто игнорируем
        }
    }

    handleKeyPress(e) {
        if (!this.isGameActive) return;
        
        const { row, col } = this.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                targetRow = row + 1;
                break;
            case 'ArrowDown':
                e.preventDefault();
                targetRow = row - 1;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                targetCol = col + 1;
                break;
            case 'ArrowRight':
                e.preventDefault();
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
            const tile = this.gameBoard?.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
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
        if (this.movesDisplay) {
            this.movesDisplay.textContent = this.moves;
        }
        this.updateTimer();
    }

    updateTimer() {
        if (!this.timerDisplay) return;
        
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
        const finalMovesEl = document.getElementById('finalMoves');
        const finalTimeEl = document.getElementById('finalTime');
        
        if (finalMovesEl) finalMovesEl.textContent = this.moves;
        if (finalTimeEl && this.timerDisplay) finalTimeEl.textContent = this.timerDisplay.textContent;
        
        if (this.victoryPopup) {
            this.victoryPopup.classList.add('show');
        }
        
        // Добавляем конфетти эффект
        this.createConfetti();
    }

    hideVictoryPopup() {
        if (this.victoryPopup) {
            this.victoryPopup.classList.remove('show');
        }
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
            if (document.body.contains(confettiContainer)) {
                document.body.removeChild(confettiContainer);
            }
        }, 5000);
    }
}

// CSS анимации
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
    
    .touching {
        transform: scale(0.95) !important;
        opacity: 0.8 !important;
    }
    
    /* Убираем подсветку при тапе на iOS */
    .tile {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
`;
document.head.appendChild(style);

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    new FifteenPuzzle();
});

// Предотвращаем зум при двойном тапе
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });