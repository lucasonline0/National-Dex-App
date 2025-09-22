let currentGamePokemon = null;

function renderGame() {
    toolsContent.innerHTML = `
        <div id="tool-game" class="tool-content-wrapper text-center">
             <h3 class="text-xl font-bold mb-4">Quem é este Pokémon?</h3>
             <div id="game-sprite-container" class="flex justify-center items-center h-48 mb-4">
             </div>
             <div class="relative max-w-sm mx-auto">
                <input type="text" id="game-guess-input" placeholder="Digite sua resposta..." class="form-input w-full p-3 rounded-lg text-center">
             </div>
             <p id="game-feedback" class="mt-4 h-6"></p>
             <button id="new-game-btn" class="bg-purple-600 hover-bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 mt-2">Novo Pokémon</button>
        </div>`;
    startNewGameRound();
}

async function startNewGameRound() {
    if(allPokemon.length === 0) await loadPokemon();
    if(allPokemon.length === 0) return;

    const feedbackEl = document.getElementById('game-feedback');
    if(feedbackEl) feedbackEl.textContent = '';
    const guessInput = document.getElementById('game-guess-input');
    if(guessInput) guessInput.value = '';

    const randomIndex = Math.floor(Math.random() * allPokemon.length);
    currentGamePokemon = allPokemon[randomIndex];
    
    const spriteContainer = document.getElementById('game-sprite-container');
    if (spriteContainer) {
        spriteContainer.innerHTML = `<img src="${currentGamePokemon.sprites.front_default}" class="h-40 pokemon-silhouette">`;
    }
    
    const inputEl = document.getElementById('game-guess-input');
    inputEl?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkGameAnswer();
    });
    createAutocomplete(inputEl, (pokemon) => {
        inputEl.value = pokemon.name;
        checkGameAnswer();
    });

    document.getElementById('new-game-btn')?.addEventListener('click', startNewGameRound);
}

function checkGameAnswer() {
     const guess = document.getElementById('game-guess-input').value.toLowerCase().trim();
     const feedbackEl = document.getElementById('game-feedback');
     const spriteContainer = document.getElementById('game-sprite-container');
     if (guess === currentGamePokemon.name) {
        feedbackEl.textContent = 'Correto!';
        feedbackEl.style.color = 'var(--accent)';
        spriteContainer.querySelector('img').classList.remove('pokemon-silhouette');
     } else {
        feedbackEl.textContent = 'Incorreto, tente novamente.';
        feedbackEl.style.color = '#ef4444';
     }
}