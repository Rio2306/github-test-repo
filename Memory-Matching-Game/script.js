const cardGrid = document.getElementById('card-grid');
const moveCounter = document.getElementById('move-counter');
const timer = document.getElementById('timer');
const winMessage = document.getElementById('win-message');
const restartButton = document.getElementById('restart-button');
const difficultySelector = document.getElementById('difficulty');

const icons = [
    '🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉',
    '🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉'
];

const difficultySettings = {
    easy: 8,
    medium: 12,
    hard: 16,
    difficult: 20,
    'extra-difficult': 24
};

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timerInterval;
let secondsElapsed = 0;
let isCheckingCards = false; // Prevent rapid clicks

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startGame() {
    const selectedDifficulty = difficultySelector.value;
    const totalCards = difficultySettings[selectedDifficulty];

    cardGrid.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    secondsElapsed = 0;
    moveCounter.textContent = moves;
    timer.textContent = '0:00';
    winMessage.classList.remove('show');

    const availableIcons = icons.slice(0, totalCards / 2);
    const shuffledIcons = shuffle([...availableIcons, ...availableIcons]);
    shuffledIcons.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        card.innerHTML = `<span>${icon}</span>`;
        card.addEventListener('click', handleCardClick);
        cardGrid.appendChild(card);
    });

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function handleCardClick(e) {
    if (isCheckingCards) return; // Prevent clicks during check

    const card = e.currentTarget;
    if (card.classList.contains('flipped') || flippedCards.length === 2) {
        return;
    }

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        moveCounter.textContent = moves;
        checkForMatch();
    }
}

function checkForMatch() {
    isCheckingCards = true;
    const [card1, card2] = flippedCards;
    if (card1.dataset.icon === card2.dataset.icon) {
        matchedPairs++;
        flippedCards = [];
        isCheckingCards = false;

        const selectedDifficulty = difficultySelector.value;
        const totalPairs = difficultySettings[selectedDifficulty] / 2;
        if (matchedPairs === totalPairs) {
            clearInterval(timerInterval);
            winMessage.classList.add('show');
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isCheckingCards = false;
        }, 1000);
    }
}

function updateTimer() {
    secondsElapsed++;
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

restartButton.addEventListener('click', startGame);
difficultySelector.addEventListener('change', startGame);

startGame();