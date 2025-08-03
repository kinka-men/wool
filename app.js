class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.gameOver = false;
        this.boardFlipped = false;
        this.startTime = Date.now();
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeBoard() {
        // Инициализация пустой доски
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Расстановка фигур
        this.setupPieces();
    }

    setupPieces() {
        // Белые фигуры
        this.board[7][0] = { type: 'rook', color: 'white', hasMoved: false };
        this.board[7][1] = { type: 'knight', color: 'white' };
        this.board[7][2] = { type: 'bishop', color: 'white' };
        this.board[7][3] = { type: 'queen', color: 'white' };
        this.board[7][4] = { type: 'king', color: 'white', hasMoved: false };
        this.board[7][5] = { type: 'bishop', color: 'white' };
        this.board[7][6] = { type: 'knight', color: 'white' };
        this.board[7][7] = { type: 'rook', color: 'white', hasMoved: false };
        
        // Белые пешки
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
        }
        
        // Черные фигуры
        this.board[0][0] = { type: 'rook', color: 'black', hasMoved: false };
        this.board[0][1] = { type: 'knight', color: 'black' };
        this.board[0][2] = { type: 'bishop', color: 'black' };
        this.board[0][3] = { type: 'queen', color: 'black' };
        this.board[0][4] = { type: 'king', color: 'black', hasMoved: false };
        this.board[0][5] = { type: 'bishop', color: 'black' };
        this.board[0][6] = { type: 'knight', color: 'black' };
        this.board[0][7] = { type: 'rook', color: 'black', hasMoved: false };
        
        // Черные пешки
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
        }
    }

    setupEventListeners() {
        const chessBoard = document.getElementById('chessBoard');
        const newGameBtn = document.getElementById('newGameBtn');
        const undoBtn = document.getElementById('undoBtn');
        const flipBoardBtn = document.getElementById('flipBoardBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');

        chessBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('chess-square')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleSquareClick(row, col);
            }
        });

        newGameBtn.addEventListener('click', () => this.newGame());
        undoBtn.addEventListener('click', () => this.undoMove());
        flipBoardBtn.addEventListener('click', () => this.flipBoard());
        playAgainBtn.addEventListener('click', () => this.newGame());
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;

        const piece = this.board[row][col];
        
        // Если выбрана фигура того же цвета
        if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        }
        // Если выбрана пустая клетка или фигура противника
        else if (this.selectedPiece) {
            const fromRow = this.selectedPiece.row;
            const fromCol = this.selectedPiece.col;
            
            if (this.isValidMove(fromRow, fromCol, row, col)) {
                this.makeMove(fromRow, fromCol, row, col);
            }
        }
    }

    selectPiece(row, col) {
        this.clearHighlights();
        this.selectedPiece = { row, col };
        
        const square = this.getSquareElement(row, col);
        square.classList.add('selected');
        
        // Показать возможные ходы
        this.showValidMoves(row, col);
    }

    clearHighlights() {
        const squares = document.querySelectorAll('.chess-square');
        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });
    }

    showValidMoves(row, col) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const square = this.getSquareElement(r, c);
                    square.classList.add('valid-move');
                }
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];
        
        if (!piece) return false;
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Проверка правил движения для каждой фигуры
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Обычный ход вперед
        if (fromCol === toCol && toRow === fromRow + direction && !this.board[toRow][toCol]) {
            return true;
        }
        
        // Первый ход пешки (может ходить на 2 клетки)
        if (fromRow === startRow && fromCol === toCol && toRow === fromRow + 2 * direction && 
            !this.board[fromRow + direction][fromCol] && !this.board[toRow][toCol]) {
            return true;
        }
        
        // Взятие по диагонали
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && 
            this.board[toRow][toCol] && this.board[toRow][toCol].color !== piece.color) {
            return true;
        }
        
        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
        
        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow && currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }

    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return rowDiff <= 1 && colDiff <= 1;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Сохраняем ход для истории
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        };
        
        // Выполняем ход
        this.board[toRow][toCol] = { ...piece };
        this.board[fromRow][fromCol] = null;
        
        // Отмечаем, что фигура ходила
        this.board[toRow][toCol].hasMoved = true;
        
        // Проверяем превращение пешки
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol].type = 'queen';
        }
        
        this.moveHistory.push(move);
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        this.clearHighlights();
        this.selectedPiece = null;
        this.updateDisplay();
        
        // Проверяем окончание игры
        if (this.isCheckmate()) {
            this.endGame('checkmate');
        } else if (this.isStalemate()) {
            this.endGame('stalemate');
        } else if (this.isCheck()) {
            this.showCheck();
        }
    }

    isCheck() {
        const kingColor = this.currentPlayer;
        let kingRow, kingCol;
        
        // Находим короля
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === kingColor) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }
        
        // Проверяем, атакует ли какая-либо фигура короля
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== kingColor) {
                    if (this.isValidMove(row, col, kingRow, kingCol)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    isCheckmate() {
        if (!this.isCheck()) return false;
        
        // Проверяем, есть ли ходы, которые спасают от шаха
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                // Пробуем сделать ход
                                const originalPiece = this.board[toRow][toCol];
                                this.board[toRow][toCol] = piece;
                                this.board[row][col] = null;
                                
                                const stillInCheck = this.isCheck();
                                
                                // Отменяем ход
                                this.board[row][col] = piece;
                                this.board[toRow][toCol] = originalPiece;
                                
                                if (!stillInCheck) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return true;
    }

    isStalemate() {
        if (this.isCheck()) return false;
        
        // Проверяем, есть ли возможные ходы
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        return true;
    }

    showCheck() {
        const kingColor = this.currentPlayer;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === kingColor) {
                    const square = this.getSquareElement(row, col);
                    square.classList.add('check');
                    break;
                }
            }
        }
    }

    endGame(reason) {
        this.gameOver = true;
        const winner = this.currentPlayer === 'white' ? 'Черные' : 'Белые';
        
        document.getElementById('gameOverTitle').textContent = 
            reason === 'checkmate' ? '🎉 Шах и мат!' : '🤝 Пат!';
        document.getElementById('gameOverMessage').textContent = 
            reason === 'checkmate' ? `Победитель: ${winner}` : 'Ничья!';
        document.getElementById('winner').textContent = winner;
        document.getElementById('totalMoves').textContent = this.moveHistory.length;
        document.getElementById('gameTime').textContent = this.getGameTime();
        
        document.getElementById('gameOverPopup').classList.add('show');
    }

    getGameTime() {
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Восстанавливаем фигуру
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        
        // Восстанавливаем или удаляем фигуру на конечной позиции
        if (lastMove.captured) {
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        } else {
            this.board[lastMove.to.row][lastMove.to.col] = null;
        }
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.gameOver = false;
        
        this.clearHighlights();
        this.selectedPiece = null;
        this.updateDisplay();
    }

    flipBoard() {
        this.boardFlipped = !this.boardFlipped;
        this.updateDisplay();
    }

    newGame() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.gameOver = false;
        this.boardFlipped = false;
        this.startTime = Date.now();
        
        this.initializeBoard();
        this.clearHighlights();
        this.updateDisplay();
        
        document.getElementById('gameOverPopup').classList.remove('show');
    }

    getSquareElement(row, col) {
        const displayRow = this.boardFlipped ? 7 - row : row;
        const displayCol = this.boardFlipped ? 7 - col : col;
        return document.querySelector(`[data-row="${displayRow}"][data-col="${displayCol}"]`);
    }

    getPieceSymbol(piece) {
        const symbols = {
            'white': {
                'king': '♔',
                'queen': '♕',
                'rook': '♖',
                'bishop': '♗',
                'knight': '♘',
                'pawn': '♙'
            },
            'black': {
                'king': '♚',
                'queen': '♛',
                'rook': '♜',
                'bishop': '♝',
                'knight': '♞',
                'pawn': '♟'
            }
        };
        
        return symbols[piece.color][piece.type];
    }

    updateDisplay() {
        const chessBoard = document.getElementById('chessBoard');
        chessBoard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'chess-square';
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Определяем цвет клетки
                const isWhite = (row + col) % 2 === 0;
                square.classList.add(isWhite ? 'white' : 'black');
                
                // Добавляем фигуру
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'chess-piece';
                    pieceElement.textContent = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }
                
                chessBoard.appendChild(square);
            }
        }
        
        // Обновляем информацию о текущем игроке
        document.getElementById('currentPlayer').textContent = 
            this.currentPlayer === 'white' ? 'Белые' : 'Черные';
        
        // Обновляем статус игры
        let status = 'Игра идет';
        if (this.gameOver) {
            status = 'Игра окончена';
        } else if (this.isCheck()) {
            status = 'Шах!';
        }
        document.getElementById('gameStatus').textContent = status;
        
        // Обновляем историю ходов
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const historyContainer = document.getElementById('moveHistory');
        historyContainer.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            let moveText = `${moveNumber}. ${this.getMoveNotation(whiteMove)}`;
            if (blackMove) {
                moveText += ` ${this.getMoveNotation(blackMove)}`;
            }
            
            historyItem.textContent = moveText;
            historyContainer.appendChild(historyItem);
        }
    }

    getMoveNotation(move) {
        const piece = move.piece;
        const fromSquare = this.getSquareName(move.from.row, move.from.col);
        const toSquare = this.getSquareName(move.to.row, move.to.col);
        
        let notation = '';
        
        if (piece.type !== 'pawn') {
            notation += piece.type.toUpperCase();
        }
        
        if (move.captured) {
            if (piece.type === 'pawn') {
                notation += fromSquare.charAt(0);
            }
            notation += 'x';
        }
        
        notation += toSquare;
        
        return notation;
    }

    getSquareName(row, col) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[col] + ranks[row];
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
}); 
