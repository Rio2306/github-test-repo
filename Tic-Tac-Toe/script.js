const grid = document.getElementById('grid');
const resetButton = document.getElementById('reset');
const currentPlayerDisplay = document.getElementById('current-player');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');
const vsComputerCheckbox = document.getElementById('vs-computer');
const difficultySelect = document.getElementById('difficulty');
const player1ScoreDisplay = document.getElementById('player1-score');
const player2ScoreDisplay = document.getElementById('player2-score');
const winnerAnimation = document.getElementById('winner-animation');
const winnerAnnouncement = document.getElementById('winner-announcement');

let board = Array(9).fill(null);
let currentPlayer = 'X';
let scores = { X: 0, O: 0 };
let vsComputer = false;
let difficulty = 'easy';

vsComputerCheckbox.addEventListener('change', () => {
    vsComputer = vsComputerCheckbox.checked;
    difficultySelect.disabled = !vsComputer;
    player2NameInput.value = vsComputer ? 'Computer' : 'Player 2';
});

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

player1NameInput.addEventListener('input', updateScoreboard);
player2NameInput.addEventListener('input', updateScoreboard);

grid.addEventListener('click', (e) => {
    const cell = e.target;
    const index = cell.dataset.index;

    if (!cell.classList.contains('taken') && !checkWinner()) {
        makeMove(index, currentPlayer);
        if (vsComputer && currentPlayer === 'O' && !checkWinner()) {
            setTimeout(() => computerMove(), 500);
        }
    }
});

resetButton.addEventListener('click', resetScores);

function makeMove(index, player) {
    board[index] = player;
    const cell = grid.querySelector(`[data-index='${index}']`);
    cell.textContent = player;
    cell.classList.add('taken');

    if (checkWinner()) {
        highlightWinner();
        scores[player]++;
        updateScoreboard();
        const winnerName = player === 'X' ? player1NameInput.value : player2NameInput.value;
        showWinnerAnimation(winnerName);
    } else if (board.every(cell => cell)) {
        currentPlayerDisplay.textContent = 'It\'s a draw!';
        setTimeout(resetGame, 3000);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        currentPlayerDisplay.textContent = `Current Player: ${currentPlayer === 'X' ? player1NameInput.value : player2NameInput.value}`;
    }
}

function computerMove() {
    let move;
    if (difficulty === 'easy') {
        move = easyMove();
    } else if (difficulty === 'medium') {
        move = mediumMove();
    } else {
        move = hardMove();
    }
    makeMove(move, 'O');
}

function easyMove() {
    const available = board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
    return available[Math.floor(Math.random() * available.length)];
}

function mediumMove() {
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'X';
            if (checkWinner()) {
                board[i] = null;
                return i;
            }
            board[i] = null;
        }
    }
    return easyMove();
}

function hardMove() {
    return minimax(board, 'O').index;
}

function minimax(newBoard, player) {
    const available = newBoard.map((cell, index) => cell === null ? index : null).filter(index => index !== null);

    if (checkWinner(newBoard, 'X')) return { score: -10 };
    if (checkWinner(newBoard, 'O')) return { score: 10 };
    if (available.length === 0) return { score: 0 };

    const moves = [];
    for (const index of available) {
        const move = { index };
        newBoard[index] = player;
        move.score = minimax(newBoard, player === 'O' ? 'X' : 'O').score;
        newBoard[index] = null;
        moves.push(move);
    }

    return player === 'O' ? moves.reduce((best, move) => move.score > best.score ? move : best) : moves.reduce((best, move) => move.score < best.score ? move : best);
}

function checkWinner(boardState = board, player = currentPlayer) {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    const winner = winningCombos.find(combo => combo.every(index => boardState[index] === player));
    return !!winner;
}

function highlightWinner() {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    const winner = winningCombos.find(combo => combo.every(index => board[index] === currentPlayer));
    if (winner) {
        winner.forEach(index => {
            const cell = grid.querySelector(`[data-index='${index}']`);
            cell.classList.add('winning');
        });
    }
}

function showWinnerAnimation(winnerName) {
    winnerAnnouncement.textContent = `${winnerName} Wins!`;
    winnerAnimation.classList.remove('hidden');
    setTimeout(() => {
        winnerAnimation.classList.add('hidden');
        resetGame();
    }, 3000);
}

function resetGame() {
    board.fill(null);
    currentPlayer = 'X';
    currentPlayerDisplay.textContent = `Current Player: ${player1NameInput.value}`;
    grid.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winning');
    });
}

function resetScores() {
    scores = { X: 0, O: 0 };
    updateScoreboard();
}

function updateScoreboard() {
    player1ScoreDisplay.textContent = `${player1NameInput.value}: ${scores['X']}`;
    player2ScoreDisplay.textContent = `${player2NameInput.value}: ${scores['O']}`;
}