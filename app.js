class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.moveCount = 0;
        this.gameActive = true;
        this.startTime = Date.now();
        this.gameTime = 0;
        this.soundEnabled = true;
        this.pieces = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };

        this.init();
    }

    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateDisplay();
        this.startTimer();
    }

    createBoard() {
        // प्रारंभिक शतरंज बोर्ड सेटअप
        this.board = Array(8).fill().map(() => Array(8).fill(null));

        // काले मोहरे
        this.board[0][0] = { type: 'rook', color: 'black' };
        this.board[0][1] = { type: 'knight', color: 'black' };
        this.board[0][2] = { type: 'bishop', color: 'black' };
        this.board[0][3] = { type: 'queen', color: 'black' };
        this.board[0][4] = { type: 'king', color: 'black' };
        this.board[0][5] = { type: 'bishop', color: 'black' };
        this.board[0][6] = { type: 'knight', color: 'black' };
        this.board[0][7] = { type: 'rook', color: 'black' };
        
        // काले प्यादे
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black' };
        }

        // सफेद मोहरे
        this.board[7][0] = { type: 'rook', color: 'white' };
        this.board[7][1] = { type: 'knight', color: 'white' };
        this.board[7][2] = { type: 'bishop', color: 'white' };
        this.board[7][3] = { type: 'queen', color: 'white' };
        this.board[7][4] = { type: 'king', color: 'white' };
        this.board[7][5] = { type: 'bishop', color: 'white' };
        this.board[7][6] = { type: 'knight', color: 'white' };
        this.board[7][7] = { type: 'rook', color: 'white' };
        
        // सफेद प्यादे
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { type: 'pawn', color: 'white' };
        }
    }

    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('toggle-sound').addEventListener('click', () => this.toggleSound());
        document.getElementById('offline-test').addEventListener('click', () => this.testOffline());
        
        this.renderBoard();
    }

    renderBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[row][col].color}-piece`;
                    piece.textContent = this.getPieceSymbol(this.board[row][col]);
                    square.appendChild(piece);
                }
                
                // चयनित वर्ग को हाइलाइट करें
                if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                    square.classList.add('selected');
                }
                
                // संभावित चालों को हाइलाइट करें
                if (this.possibleMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('possible-move');
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }
    }

    getPieceSymbol(piece) {
        return this.pieces[piece.color][piece.type];
    }

    handleSquareClick(row, col) {
        if (!this.gameActive) return;
        
        // ध्वनि चलाएं
        if (this.soundEnabled) {
            this.playSound('click');
        }
        
        const clickedPiece = this.board[row][col];
        
        // यदि कोई मोहरा चुना गया है
        if (this.selectedPiece) {
            // चाल चलने का प्रयास करें
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.selectedPiece = null;
                this.possibleMoves = [];
                this.switchPlayer();
                this.updateDisplay();
            } 
            // या फिर किसी दूसरे मोहरे को चुनें
            else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectedPiece = { row, col, piece: clickedPiece };
                this.possibleMoves = this.getPossibleMoves(row, col);
                this.renderBoard();
            } else {
                this.selectedPiece = null;
                this.possibleMoves = [];
                this.renderBoard();
            }
        } 
        // यदि कोई मोहरा नहीं चुना गया है
        else {
            if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectedPiece = { row, col, piece: clickedPiece };
                this.possibleMoves = this.getPossibleMoves(row, col);
                this.renderBoard();
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // अपने ही मोहरे पर नहीं चल सकते
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // सरलीकृत चाल नियम
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
            case 'rook':
                return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'bishop':
                return (rowDiff === colDiff) && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return ((rowDiff === 0 || colDiff === 0) || (rowDiff === colDiff)) && 
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'king':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol, piece) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const targetPiece = this.board[toRow][toCol];
        
        // सीधा चलना
        if (fromCol === toCol) {
            if (toRow === fromRow + direction && !targetPiece) {
                return true;
            }
            if (fromRow === startRow && toRow === fromRow + 2 * direction && 
                !this.board[fromRow + direction][fromCol] && !targetPiece) {
                return true;
            }
        }
        // कब्जा करना
        else if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
            return targetPiece && targetPiece.color !== piece.color;
        }
        
        return false;
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = Math.sign(toRow - fromRow);
        const colStep = Math.sign(toCol - fromCol);
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        return true;
    }

    getPossibleMoves(row, col) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    moves.push({ row: r, col: c });
                }
            }
        }
        return moves;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // कब्जा किए गए मोहरे को संग्रहित करें
        if (capturedPiece) {
            this.capturedPieces[piece.color === 'white' ? 'white' : 'black'].push(capturedPiece);
            if (this.soundEnabled) this.playSound('capture');
        } else {
            if (this.soundEnabled) this.playSound('move');
        }
        
        // चाल इतिहास में संग्रहित करें
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        });
        
        // मोहरा चलाएं
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        this.moveCount++;
        
        // राजा के कब्जे की जांच
        if (capturedPiece && capturedPiece.type === 'king') {
            this.gameActive = false;
            const winner = piece.color === 'white' ? 'श्वेत' : 'काले';
            document.getElementById('game-status').textContent = `${winner} जीते! राजा कब्जा`;
            if (this.soundEnabled) this.playSound('win');
        }
        
        // प्यादे के प्रोमोशन की जांच
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.promotePawn(toRow, toCol, piece.color);
        }
    }

    promotePawn(row, col, color) {
        // स्वचालित रूप से रानी में बदलें
        this.board[row][col] = { type: 'queen', color: color };
        if (this.soundEnabled) this.playSound('promote');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        const { from, to, piece, captured } = lastMove;
        
        // चाल वापस लें
        this.board[from.row][from.col] = piece;
        this.board[to.row][to.col] = captured;
        
        // कब्जे से हटाएं
        if (captured) {
            const captureArray = this.capturedPieces[piece.color === 'white' ? 'white' : 'black'];
            const index = captureArray.findIndex(p => 
                p.type === captured.type && p.color === captured.color
            );
            if (index > -1) captureArray.splice(index, 1);
        }
        
        this.moveCount--;
        this.gameActive = true;
        this.switchPlayer();
        this.updateDisplay();
        if (this.soundEnabled) this.playSound('undo');
    }

    newGame() {
        this.createBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.moveCount = 0;
        this.gameActive = true;
        this.startTime = Date.now();
        this.updateDisplay();
        if (this.soundEnabled) this.playSound('new');
    }

    resetGame() {
        if (confirm('क्या आप वाकई गेम रीसेट करना चाहते हैं?')) {
            this.newGame();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('toggle-sound');
        btn.innerHTML = this.soundEnabled ? '🔊 ध्वनि' : '🔇 ध्वनि';
    }

    playSound(type) {
        // सरल ध्वनि प्रभाव
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let frequency = 440;
            switch(type) {
                case 'move': frequency = 523; break; // C5
                case 'capture': frequency = 392; break; // G4
                case 'win': frequency = 659; break; // E5
                case 'promote': frequency = 587; break; // D5
                case 'undo': frequency = 349; break; // F4
                case 'new': frequency = 784; break; // G5
                default: frequency = 440; // A4
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('ध्वनि त्रुटि:', e);
        }
    }

    updateDisplay() {
        this.renderBoard();
        
        // बारी दिखाएं
        const turnText = this.currentPlayer === 'white' ? 'श्वेत की बारी' : 'काले की बारी';
        document.getElementById('turn-text').textContent = turnText;
        
        const turnIndicator = document.getElementById('turn-indicator');
        turnIndicator.className = `turn ${this.currentPlayer}-turn`;
        
        // गेम स्टेटस
        if (this.gameActive) {
            document.getElementById('game-status').textContent = 'खेल जारी है';
            document.getElementById('game-status').style.color = '#4ade80';
        }
        
        // आंकड़े अपडेट करें
        document.getElementById('move-count').textContent = this.moveCount;
        document.getElementById('white-captures').textContent = this.capturedPieces.white.length;
        document.getElementById('black-captures').textContent = this.capturedPieces.black.length;
    }

    startTimer() {
        setInterval(() => {
            if (this.gameActive) {
                this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
                const seconds = (this.gameTime % 60).toString().padStart(2, '0');
                document.getElementById('game-time').textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }

    testOffline() {
        const status = navigator.onLine ? 'ऑनलाइन' : 'ऑफलाइन';
        alert(`आप वर्तमान में ${status} हैं। यह ऐप दोनों स्थितियों में काम करेगा!`);
    }
}

// पेज लोड होने पर गेम शुरू करें
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
    
    // ऑफलाइन कैशिंग
    if ('caches' in window) {
        caches.open('chess-pwa-v1').then(cache => {
            cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/app.js',
                '/manifest.json',
                'https://fonts.googleapis.com/css2?family=Segoe+UI&display=swap'
            ]).then(() => {
                console.log('फाइलें कैश की गईं');
            });
        });
    }
});
