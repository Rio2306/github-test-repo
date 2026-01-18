// Get references to the DOM elements
const cardGrid = document.getElementById('card-grid');
const resultMessage = document.getElementById('result-message');
const restartButton = document.getElementById('restart-button');

// Array of icons to be used for the cards
const icons = ['🍎', '🍌', '🍇', '🍓'];

// Variables to track the selected card and shuffled cards
let selectedCard = null;
let shuffledCards = [];

// Function to shuffle an array randomly
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to initialize the game
function initializeGame() {
    // Clear the card grid and reset messages
    cardGrid.innerHTML = '';
    resultMessage.textContent = '';
    selectedCard = null;

    // Shuffle the icons and create cards dynamically
    shuffledCards = shuffle([...icons]);
    shuffledCards.forEach((icon, index) => {
        const card = document.createElement('div'); // Create a card element
        card.classList.add('card'); // Add the card class for styling
        card.dataset.icon = icon; // Store the icon as a data attribute
        card.innerHTML = `<span>${icon}</span>`; // Add the icon to the card
        card.addEventListener('click', () => handleCardClick(card, index)); // Add click event listener
        cardGrid.appendChild(card); // Add the card to the grid
    });
}

// Function to handle the card click event
function handleCardClick(card, index) {
    // If no card is selected, set the selected card
    if (!selectedCard) {
        selectedCard = { card, index };
        resultMessage.textContent = 'Card selected! Shuffling...';
        setTimeout(() => shuffleAndHideCards(), 1000); // Shuffle and hide cards after a delay
    } else {
        // Prevent selecting the same card twice
        if (card === selectedCard.card) {
            resultMessage.textContent = 'You cannot select the same card!';
            return;
        }

        // Check if the guessed card matches the initially selected card
        if (card.dataset.icon === selectedCard.card.dataset.icon) {
            resultMessage.textContent = 'You win! Correct guess!';
            card.classList.remove('hidden'); // Reveal the guessed card
            selectedCard.card.classList.remove('hidden'); // Reveal the initially selected card
        } else {
            resultMessage.textContent = 'Wrong guess! Try again.';
        }
    }
}

// Function to shuffle and hide the cards
function shuffleAndHideCards() {
    shuffledCards = shuffle(shuffledCards); // Shuffle the cards again
    const cards = document.querySelectorAll('.card'); // Get all card elements
    cards.forEach((card, index) => {
        card.classList.add('hidden'); // Hide the card
        card.dataset.icon = shuffledCards[index]; // Update the icon data attribute
    });
}

// Add event listener to the restart button to reset the game
restartButton.addEventListener('click', initializeGame);

// Start the game when the page loads
initializeGame();