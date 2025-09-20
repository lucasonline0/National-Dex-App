async function fetchWithCache(url) {
    if (apiCache.has(url)) {
        return apiCache.get(url);
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        apiCache.set(url, data);
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

async function loadAllPokemonNames() {
    const data = await fetchWithCache('https://pokeapi.co/api/v2/pokemon?limit=1302');
    if (data && data.results) {
        allPokemonNames = data.results;
    }
}

async function loadPokemon() {
    loadingIndicator.classList.remove('hidden');
    loadMoreBtn.classList.add('hidden');
    
    const data = await fetchWithCache(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (data && data.results) {
        const pokemonPromises = data.results.map(p => fetchWithCache(p.url));
        const newPokemon = await Promise.all(pokemonPromises);
        allPokemon = [...allPokemon, ...newPokemon.filter(p => p)];
        offset += limit;
        applyFilters();
    }
    
    loadingIndicator.classList.add('hidden');
    loadMoreBtn.classList.remove('hidden');
}

async function populateFilters() {
    const typesData = await fetchWithCache('https://pokeapi.co/api/v2/type');
    if (typesData) {
        typesData.results.forEach(type => {
            if (type.name !== 'unknown' && type.name !== 'shadow') {
               const option = document.createElement('option');
               option.value = type.name;
               option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
               typeFilter.appendChild(option);
            }
        });
    }
}

async function populateGenerationFilter() {
    const generationsData = await fetchWithCache('https://pokeapi.co/api/v2/generation');
    if (generationsData && generationsData.results) {
        generationsData.results.forEach((gen) => {
            const option = document.createElement('option');
            option.value = gen.url;
            const romanNumeral = gen.name.split('-')[1].toUpperCase();
            option.textContent = `Geração ${romanNumeral}`;
            generationFilter.appendChild(option);
        });
    }
}