function createAutocomplete(inputElement, onSelect) {
    let suggestionsContainer = inputElement.parentElement.querySelector('.autocomplete-suggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'autocomplete-suggestions w-full';
        inputElement.parentElement.appendChild(suggestionsContainer);
    }

    inputElement.addEventListener('input', () => {
        const value = inputElement.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (value.length < 2) return;

        const filtered = allPokemonNames
            .filter(p => p.name.includes(value))
            .slice(0, 5);

        filtered.forEach(pokemon => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'autocomplete-suggestion';
            
            const cachedPokemon = allPokemon.find(p => p.name === pokemon.name);
            const spriteUrl = cachedPokemon ? cachedPokemon.sprites.front_default : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url.split('/')[6]}.png`;

            suggestionItem.innerHTML = `
                <img src="${spriteUrl}" class="h-6 w-6">
                <span class="capitalize">${pokemon.name}</span>
            `;
            suggestionItem.addEventListener('click', async () => {
                const pokemonData = await fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
                onSelect(pokemonData);
                inputElement.value = '';
                suggestionsContainer.innerHTML = '';
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== inputElement) {
            suggestionsContainer.innerHTML = '';
        }
    });
}