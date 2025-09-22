async function renderAbilityExplorer() {
    toolsContent.innerHTML = `
        <div id="tool-abilities" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-2">Explorador de Habilidades</h3>
             <input type="text" id="ability-search" placeholder="Buscar habilidade..." class="form-input w-full p-3 rounded-lg mb-4">
             <div id="ability-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div id="ability-list-container" class="h-96 overflow-y-auto pr-2">
                    <p class="text-gray-400">Carregando habilidades...</p>
                </div>
                <div id="ability-details-container" class="p-4 rounded-lg h-96 overflow-y-auto" style="background-color: var(--bg-main);">
                     <p class="text-gray-400">Selecione uma habilidade para ver os detalhes.</p>
                </div>
             </div>
        </div>
    `;
    
    if (allAbilities.length === 0) {
        const data = await fetchWithCache('https://pokeapi.co/api/v2/ability?limit=367');
        if (data && data.results) {
            allAbilities = data.results;
        }
    }
    
    const listContainer = document.getElementById('ability-list-container');
    const searchInput = document.getElementById('ability-search');
    
    const displayAbilities = (abilities) => {
        listContainer.innerHTML = abilities.map(ability => `
            <div class="p-3 rounded-lg capitalize cursor-pointer hover:bg-purple-600" style="background-color: var(--bg-surface);" onclick="showAbilityDetails('${ability.url}')">
                ${ability.name.replace(/-/g, ' ')}
            </div>
        `).join('<div class="h-2"></div>');
    };

    displayAbilities(allAbilities);
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allAbilities.filter(a => a.name.includes(searchTerm));
        displayAbilities(filtered);
    });
    
    window.showAbilityDetails = showAbilityDetails;
}

async function showAbilityDetails(url) {
    const listContainer = document.getElementById('ability-list-container');
    const detailsContainer = document.getElementById('ability-details-container');
    const searchInput = document.getElementById('ability-search');
    const abilityGrid = document.getElementById('ability-grid');

    const goBackToList = () => {
        listContainer.classList.remove('hidden');
        searchInput.classList.remove('hidden');
        abilityGrid.classList.add('md:grid-cols-2');
        abilityGrid.classList.remove('grid-cols-1');
        detailsContainer.innerHTML = `<p class="text-gray-400">Selecione uma habilidade para ver os detalhes.</p>`;
    };

    listContainer.classList.add('hidden');
    searchInput.classList.add('hidden');
    abilityGrid.classList.remove('md:grid-cols-2');
    abilityGrid.classList.add('grid-cols-1');

    detailsContainer.innerHTML = `<p class="text-gray-400">Carregando...</p>`;
    const data = await fetchWithCache(url);

    if (!data) {
        detailsContainer.innerHTML = `
            <button id="back-to-ability-list" class="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
                <i data-feather="arrow-left"></i> Voltar para a lista
            </button>
            <p class="text-red-500">Erro ao carregar detalhes da habilidade.</p>
        `;
        feather.replace();
        document.getElementById('back-to-ability-list').addEventListener('click', goBackToList);
        return;
    }
    
    const description = data.effect_entries.find(e => e.language.name === 'en')?.effect || data.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text || 'Sem descrição.';
    const pokemonListHtml = data.pokemon.map(p => `
        <li class="capitalize p-2 rounded text-sm cursor-pointer hover:bg-purple-600/50" style="background-color: rgba(0,0,0,0.2);" data-pokemon-name="${p.pokemon.name}">${p.pokemon.name.replace(/-/g, ' ')}</li>
    `).join('');

    detailsContainer.innerHTML = `
        <button id="back-to-ability-list" class="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
            <i data-feather="arrow-left"></i> Voltar para a lista
        </button>
        <h4 class="text-lg font-bold capitalize mb-2">${data.name.replace(/-/g, ' ')}</h4>
        <p class="text-gray-300 mb-4">${description.replace(/[\n\f]/g, ' ')}</p>
        <h5 class="font-semibold mb-2">Pokémon com esta habilidade:</h5>
        <ul id="ability-pokemon-list" class="grid grid-cols-2 gap-2">${pokemonListHtml}</ul>
    `;
    feather.replace();

    document.getElementById('back-to-ability-list').addEventListener('click', goBackToList);

    document.getElementById('ability-pokemon-list').querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            openPokemonModal(item.dataset.pokemonName);
        });
    });
}