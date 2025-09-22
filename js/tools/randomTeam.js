function renderRandomTeamGenerator() {
    toolsContent.innerHTML = `
        <div id="tool-random-team" class="tool-content-wrapper text-center">
             <h3 class="text-xl font-bold mb-4">Gerador de Time Aleatório</h3>
             <p class="text-gray-400 mb-6">Clique no botão para gerar uma equipe aleatória de 6 Pokémon!</p>
             <button id="generate-random-team-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105">
                Gerar Time
             </button>
             <div id="random-team-display" class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
             </div>
        </div>`;
    document.getElementById('generate-random-team-btn').addEventListener('click', generateRandomTeam);
}

async function generateRandomTeam() {
    const display = document.getElementById('random-team-display');
    const button = document.getElementById('generate-random-team-btn');
    display.innerHTML = '<p class="col-span-full text-gray-400">Sorteando Pokémon...</p>';
    button.disabled = true;

    let randomTeam = [];
    const promises = [];

    if (allPokemonNames.length === 0) {
        await loadAllPokemonNames();
    }

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * allPokemonNames.length);
        const randomPokemonInfo = allPokemonNames[randomIndex];
        promises.push(fetchWithCache(randomPokemonInfo.url));
    }

    randomTeam = await Promise.all(promises);

    display.innerHTML = randomTeam.map(pokemon => {
        if (!pokemon) return '';
         const types = pokemon.types.map(t => `<span class="${typeColors[t.type.name] || 'bg-gray-500'} text-xs font-semibold px-2 py-0.5 rounded-full text-white">${t.type.name}</span>`).join(' ');
        return `
            <div class="p-2 rounded-lg flex flex-col items-center justify-center animate-card-enter" style="background-color: var(--bg-main);">
                <img src="${pokemon.sprites.front_default}" class="h-20 w-20">
                <p class="capitalize font-semibold">${pokemon.name}</p>
                <div class="flex justify-center gap-1 mt-1">${types}</div>
            </div>
        `;
    }).join('');
    button.disabled = false;
}