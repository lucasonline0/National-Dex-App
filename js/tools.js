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

function openToolsModal(toolName) {
    const toolTitle = toolTitles[toolName] || 'Ferramentas';
    document.getElementById('tools-modal-title').textContent = toolTitle;
    toolsModal.classList.remove('hidden');
    loadTool(toolName);
}

function loadTool(toolName) {
    switch (toolName) {
        case 'team-builder':
            currentTeam = [];
            renderTeamBuilder();
            break;
        case 'comparator':
             comparatorPokemon = [null, null];
            renderComparator();
            break;
        case 'game':
            renderGame();
            break;
        case 'trainer-card':
            renderTrainerCard();
            break;
        case 'random-team':
            renderRandomTeamGenerator();
            break;
        case 'type-coverage':
            renderTypeCoverageAnalyzer();
            break;
        case 'abilities':
            renderAbilityExplorer();
            break;
        case 'timeline':
            renderGameTimeline();
            break;
    }
    feather.replace();
}

function renderTeamBuilder() {
    toolsContent.innerHTML = `
        <div id="tool-team-builder" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-4">Construtor de Times</h3>
             <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="team-builder-slots">
                    </div>
                    <div class="relative mt-4">
                         <input type="text" id="team-builder-search" placeholder="Adicionar Pokémon..." class="form-input w-full p-3 rounded-lg">
                    </div>
                </div>
                <div id="team-synergy-analysis" class="p-4 rounded-lg" style="background-color: var(--bg-main);">
                    <h4 class="font-bold mb-2">Análise da Equipe</h4>
                    <div id="synergy-content">
                        <p class="text-sm text-gray-400">Adicione Pokémon para ver a análise de sinergia.</p>
                    </div>
                </div>
             </div>
        </div>`;
    renderTeamSlots();
    createAutocomplete(document.getElementById('team-builder-search'), addPokemonToTeam);
}

function addPokemonToTeam(pokemon) {
    if (currentTeam.length < 6) {
        currentTeam.push(pokemon);
        renderTeamSlots();
        analyzeTeamSynergy();
    }
}

function removePokemonFromTeam(index) {
    currentTeam.splice(index, 1);
    renderTeamSlots();
    analyzeTeamSynergy();
}

function renderTeamSlots() {
    const slotsContainer = document.getElementById('team-builder-slots');
    slotsContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const pokemon = currentTeam[i];
        if (pokemon) {
            slotsContainer.innerHTML += `
                <div class="team-slot relative border-2 rounded-lg h-32 flex flex-col items-center justify-center p-2 cursor-pointer" style="border-color: var(--accent);" onclick="removePokemonFromTeam(${i})">
                    <img src="${pokemon.sprites.front_default}" class="h-16 w-16">
                    <p class="capitalize text-sm font-semibold">${pokemon.name}</p>
                    <div class="absolute top-1 right-1 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-white text-xs">&times;</div>
                </div>
            `;
        } else {
            slotsContainer.innerHTML += `
                 <div class="team-slot border-2 border-dashed rounded-lg h-32 flex items-center justify-center" style="border-color: var(--border);">
                    <p class="text-gray-500">Slot ${i + 1}</p>
                </div>
            `;
        }
    }
    window.removePokemonFromTeam = removePokemonFromTeam;
}

async function analyzeTeamSynergy() {
    const synergyContent = document.getElementById('synergy-content');
    if (currentTeam.length === 0) {
        synergyContent.innerHTML = '<p class="text-sm text-gray-400">Adicione Pokémon para ver a análise.</p>';
        return;
    }

    const teamTypes = currentTeam.flatMap(p => p.types.map(t => t.type.url));
    const uniqueTypeUrls = [...new Set(teamTypes)];
    
    const typeDataPromises = uniqueTypeUrls.map(url => fetchWithCache(url));
    const teamTypeData = await Promise.all(typeDataPromises);

    const allTypesData = await fetchWithCache('https://pokeapi.co/api/v2/type');
    const allTypeNames = allTypesData.results.map(t => t.name).filter(n => n !== 'unknown' && n !== 'shadow');
    
    const teamDefenseChart = {};
     allTypeNames.forEach(attackingType => {
        let weaknesses = 0;
        let resistances = 0;
        currentTeam.forEach(pokemon => {
            let multiplier = 1;
            pokemon.types.forEach(defensiveTypeInfo => {
                 const defensiveTypeData = teamTypeData.find(td => td.name === defensiveTypeInfo.type.name);
                 if(defensiveTypeData.damage_relations.double_damage_from.some(t => t.name === attackingType)) multiplier *= 2;
                 if(defensiveTypeData.damage_relations.half_damage_from.some(t => t.name === attackingType)) multiplier *= 0.5;
                 if(defensiveTypeData.damage_relations.no_damage_from.some(t => t.name === attackingType)) multiplier *= 0;
            });
            if (multiplier > 1) weaknesses++;
            if (multiplier < 1) resistances++;
        });
        teamDefenseChart[attackingType] = { weaknesses, resistances };
    });

    const commonWeaknesses = Object.entries(teamDefenseChart).filter(([_, v]) => v.weaknesses >= 2).sort((a,b) => b[1].weaknesses - a[1].weaknesses);
    const goodResistances = Object.entries(teamDefenseChart).filter(([_, v]) => v.resistances >= 2).sort((a,b) => b[1].resistances - a[1].resistances);

    let html = '<div class="space-y-3 text-sm">';
    if (commonWeaknesses.length > 0) {
        html += `<div><h5 class="font-semibold text-orange-400 mb-1">Fraquezas Comuns:</h5><div class="flex flex-wrap gap-1">${commonWeaknesses.map(([type, val]) => `<span class="${typeColors[type]} px-2 py-0.5 rounded text-xs">${type} (${val.weaknesses})</span>`).join('')}</div></div>`;
    }
    if (goodResistances.length > 0) {
         html += `<div><h5 class="font-semibold text-green-400 mb-1">Boas Resistências:</h5><div class="flex flex-wrap gap-1">${goodResistances.map(([type, val]) => `<span class="${typeColors[type]} px-2 py-0.5 rounded text-xs">${type} (${val.resistances})</span>`).join('')}</div></div>`;
    }
    html += '</div>';

    synergyContent.innerHTML = html;
}

function renderComparator() {
    toolsContent.innerHTML = `
        <div id="tool-comparator" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-4">Comparador de Pokémon</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <div class="relative"><input type="text" id="comparator-search-1" placeholder="Pokémon 1" class="form-input w-full p-3 rounded-lg"></div>
                    <div id="comparator-pokemon-1" class="mt-4 p-4 rounded-lg" style="background-color: var(--bg-main);"></div>
                </div>
                 <div>
                    <div class="relative"><input type="text" id="comparator-search-2" placeholder="Pokémon 2" class="form-input w-full p-3 rounded-lg"></div>
                    <div id="comparator-pokemon-2" class="mt-4 p-4 rounded-lg" style="background-color: var(--bg-main);"></div>
                </div>
             </div>
             <div id="comparison-results" class="mt-6"></div>
        </div>`;
    createAutocomplete(document.getElementById('comparator-search-1'), (p) => selectComparatorPokemon(p, 0));
    createAutocomplete(document.getElementById('comparator-search-2'), (p) => selectComparatorPokemon(p, 1));
}

function selectComparatorPokemon(pokemon, slot) {
    comparatorPokemon[slot] = pokemon;
    const container = document.getElementById(`comparator-pokemon-${slot + 1}`);
    const types = pokemon.types.map(t => `<span class="${typeColors[t.type.name]} text-xs font-semibold px-2 py-1 rounded-full text-white">${t.type.name}</span>`).join(' ');
    container.innerHTML = `
        <div class="text-center">
            <img src="${pokemon.sprites.front_default}" class="mx-auto h-24 w-24">
            <h4 class="font-bold text-lg capitalize">${pokemon.name}</h4>
            <div class="flex justify-center gap-1 mt-1">${types}</div>
        </div>
    `;
    if (comparatorPokemon[0] && comparatorPokemon[1]) {
        renderComparisonResults();
    }
}

function renderComparisonResults() {
    const [p1, p2] = comparatorPokemon;
    const resultsContainer = document.getElementById('comparison-results');

    let statsHtml = '<h4 class="text-lg font-bold mb-4 text-center">Comparação de Atributos</h4>';
    statsHtml += `
        <div class="grid grid-cols-3 items-center gap-2 mb-4 text-center">
            <h5 class="font-bold text-lg capitalize">${p1.name}</h5>
            <div></div>
            <h5 class="font-bold text-lg capitalize">${p2.name}</h5>
        </div>
    `;

    p1.stats.forEach((stat, index) => {
        const stat1 = stat.base_stat;
        const stat2 = p2.stats[index].base_stat;
        const statName = stat.stat.name.replace('-', ' ');
        
        const p1Color = stat1 >= stat2 ? 'var(--accent)' : 'var(--bg-surface)';
        const p2Color = stat2 >= stat1 ? 'var(--accent)' : 'var(--bg-surface)';
        
        statsHtml += `
            <div class="grid grid-cols-3 items-center gap-2 mb-2 text-sm">
                <div class="text-right">
                    <span class="font-semibold">${stat1}</span>
                    <div class="w-full bg-gray-700 rounded-full h-2.5 mt-1"><div class="h-2.5 rounded-full" style="width: ${(stat1/255)*100}%; background-color: ${p1Color};"></div></div>
                </div>
                <div class="text-center capitalize font-bold">${statName}</div>
                 <div class="text-left">
                    <span class="font-semibold">${stat2}</span>
                    <div class="w-full bg-gray-700 rounded-full h-2.5 mt-1"><div class="h-2.5 rounded-full" style="width: ${(stat2/255)*100}%; background-color: ${p2Color};"></div></div>
                </div>
            </div>
        `;
    });
    resultsContainer.innerHTML = statsHtml;
}

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

let currentGamePokemon = null;
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

function renderTypeCoverageAnalyzer() {
    toolsContent.innerHTML = `
         <div id="tool-type-coverage" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-4">Análise de Cobertura de Tipos</h3>
             <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <p class="text-gray-400 mb-4">Monte uma equipe para ver quais tipos de Pokémon seus ataques seriam super efetivos contra.</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="coverage-builder-slots">
                    </div>
                    <div class="relative mt-4">
                         <input type="text" id="coverage-builder-search" placeholder="Adicionar Pokémon..." class="form-input w-full p-3 rounded-lg">
                    </div>
                </div>
                <div id="coverage-analysis" class="p-4 rounded-lg" style="background-color: var(--bg-main);">
                    <h4 class="font-bold mb-2">Cobertura Ofensiva</h4>
                    <div id="coverage-content">
                        <p class="text-sm text-gray-400">Adicione Pokémon para ver a análise.</p>
                    </div>
                </div>
             </div>
        </div>`;
    coverageTeam = [];
    renderCoverageSlots();
    createAutocomplete(document.getElementById('coverage-builder-search'), addPokemonToCoverage);
}

function addPokemonToCoverage(pokemon) {
    if (coverageTeam.length < 6) {
        coverageTeam.push(pokemon);
        renderCoverageSlots();
        analyzeTypeCoverage();
    }
}

function removePokemonFromCoverage(index) {
    coverageTeam.splice(index, 1);
    renderCoverageSlots();
    analyzeTypeCoverage();
}

function renderCoverageSlots() {
    const slotsContainer = document.getElementById('coverage-builder-slots');
    slotsContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const pokemon = coverageTeam[i];
        if (pokemon) {
            slotsContainer.innerHTML += `
                <div class="relative border-2 rounded-lg h-32 flex flex-col items-center justify-center p-2 cursor-pointer" style="border-color: var(--accent);" onclick="removePokemonFromCoverage(${i})">
                    <img src="${pokemon.sprites.front_default}" class="h-16 w-16">
                    <p class="capitalize text-sm font-semibold">${pokemon.name}</p>
                    <div class="absolute top-1 right-1 bg-red-600 rounded-full h-5 w-5 flex items-center justify-center text-white text-xs">&times;</div>
                </div>`;
        } else {
            slotsContainer.innerHTML += `
                 <div class="border-2 border-dashed rounded-lg h-32 flex items-center justify-center" style="border-color: var(--border);">
                    <p class="text-gray-500">Slot ${i + 1}</p>
                </div>`;
        }
    }
    window.removePokemonFromCoverage = removePokemonFromCoverage;
}

async function analyzeTypeCoverage() {
    const coverageContent = document.getElementById('coverage-content');
    if (coverageTeam.length === 0) {
        coverageContent.innerHTML = '<p class="text-sm text-gray-400">Adicione Pokémon para ver a análise.</p>';
        return;
    }
    
    const teamTypes = coverageTeam.flatMap(p => p.types.map(t => t.type.url));
    const uniqueTypeUrls = [...new Set(teamTypes)];
    
    const typeDataPromises = uniqueTypeUrls.map(url => fetchWithCache(url));
    const teamTypeData = await Promise.all(typeDataPromises);
    
    const superEffectiveTo = new Set();
    teamTypeData.forEach(type => {
        type.damage_relations.double_damage_to.forEach(t => superEffectiveTo.add(t.name));
    });
    
    const allTypesData = await fetchWithCache('https://pokeapi.co/api/v2/type');
    const allTypeNames = allTypesData.results.map(t => t.name).filter(n => n !== 'unknown' && n !== 'shadow');
    const notCovered = allTypeNames.filter(t => !superEffectiveTo.has(t));

    let html = '<div class="space-y-3 text-sm">';
    if (superEffectiveTo.size > 0) {
        html += `<div><h5 class="font-semibold text-green-400 mb-1">Super Efetivo Contra:</h5><div class="flex flex-wrap gap-1">${[...superEffectiveTo].map(type => `<span class="${typeColors[type]} px-2 py-0.5 rounded text-xs">${type}</span>`).join('')}</div></div>`;
    }
    if (notCovered.length > 0) {
         html += `<div><h5 class="font-semibold text-orange-400 mb-1">Não coberto (dano neutro/fraco):</h5><div class="flex flex-wrap gap-1">${notCovered.map(type => `<span class="${typeColors[type]} px-2 py-0.5 rounded text-xs">${type}</span>`).join('')}</div></div>`;
    }
    html += '</div>';

    coverageContent.innerHTML = html;
}

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

async function renderGameTimeline() {
     toolsContent.innerHTML = `
         <div id="tool-timeline" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-4 text-center">Linha do Tempo dos Jogos</h3>
             <div id="timeline-container" class="relative border-l-2 pl-6" style="border-color: var(--accent);">
             </div>
        </div>`;

    const container = document.getElementById('timeline-container');
    container.innerHTML = `<p class="text-gray-400">Carregando linha do tempo...</p>`;

    const versionGroups = await fetchWithCache('https://pokeapi.co/api/v2/version-group?limit=30');
    if (!versionGroups || !versionGroups.results) {
        container.innerHTML = `<p class="text-red-500">Não foi possível carregar a linha do tempo.</p>`;
        return;
    }

    const timelineData = {
        'red-blue': { year: '1996', title: 'Geração I: Red & Blue' },
        'yellow': { year: '1998', title: 'Yellow' },
        'gold-silver': { year: '1999', title: 'Geração II: Gold & Silver' },
        'crystal': { year: '2000', title: 'Crystal' },
        'ruby-sapphire': { year: '2002', title: 'Geração III: Ruby & Sapphire' },
        'firered-leafgreen': { year: '2004', title: 'FireRed & LeafGreen' },
        'emerald': { year: '2004', title: 'Emerald' },
        'diamond-pearl': { year: '2006', title: 'Geração IV: Diamond & Pearl' },
        'platinum': { year: '2008', title: 'Platinum' },
        'heartgold-soulsilver': { year: '2009', title: 'HeartGold & SoulSilver' },
        'black-white': { year: '2010', title: 'Geração V: Black & White' },
        'black-2-white-2': { year: '2012', title: 'Black 2 & White 2' },
        'x-y': { year: '2013', title: 'Geração VI: X & Y' },
        'omega-ruby-alpha-sapphire': { year: '2014', title: 'Omega Ruby & Alpha Sapphire' },
        'sun-moon': { year: '2016', title: 'Geração VII: Sun & Moon' },
        'ultra-sun-ultra-moon': { year: '2017', title: 'Ultra Sun & Ultra Moon' },
        'lets-go-pikachu-lets-go-eevee': { year: '2018', title: "Let's Go Pikachu & Eevee" },
        'sword-shield': { year: '2019', title: 'Geração VIII: Sword & Shield' },
        'the-isle-of-armor': { year: '2020', title: 'DLC: The Isle of Armor' },
        'the-crown-tundra': { year: '2020', title: 'DLC: The Crown Tundra' },
        'brilliant-diamond-and-shining-pearl': { year: '2021', title: 'Brilliant Diamond & Shining Pearl' },
        'legends-arceus': { year: '2022', title: 'Legends: Arceus' },
        'scarlet-violet': { year: '2022', title: 'Geração IX: Scarlet & Violet' },
    };

    container.innerHTML = versionGroups.results.map(group => {
        const data = timelineData[group.name];
        if (!data) return '';
        return `
            <div class="mb-8 relative">
                <div class="absolute -left-8 -top-1.5 h-4 w-4 rounded-full" style="background-color: var(--accent);"></div>
                <p class="text-sm font-semibold text-gray-400">${data.year}</p>
                <h4 class="text-lg font-bold text-white">${data.title}</h4>
                <p class="capitalize text-gray-300">${group.name.replace(/-/g, ' ')}</p>
            </div>
        `;
    }).join('');
}

function renderTrainerCard() {
    const savedData = JSON.parse(localStorage.getItem('trainerCardData')) || {};
    toolsContent.innerHTML = `
        <div id="tool-trainer-card" class="tool-content-wrapper">
            <h3 class="text-xl font-bold mb-4 text-center">Cartão de Treinador</h3>
            <div class="space-y-6 max-w-sm mx-auto">
                <div>
                    <label for="trainer-name" class="block mb-2 font-semibold text-center">Seu Nome</label>
                    <input type="text" id="trainer-name" class="form-input w-full p-3 rounded text-center" value="${savedData.name || ''}">
                </div>
                <div class="text-center">
                    <p class="mb-2 font-semibold">Avatar Padrão</p>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png" class="h-24 w-24 mx-auto rounded-full border-2" style="border-color: var(--accent);">
                    <p class="text-sm text-gray-400 mt-2">Greninja</p>
                </div>
                 <button id="save-trainer-card-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-all">Salvar Nome</button>
            </div>
        </div>
    `;
    
    document.getElementById('save-trainer-card-btn').addEventListener('click', saveTrainerCard);
}

function saveTrainerCard() {
    const data = {
        name: document.getElementById('trainer-name').value,
    };
    localStorage.setItem('trainerCardData', JSON.stringify(data));
    
    const btn = document.getElementById('save-trainer-card-btn');
    btn.textContent = 'Salvo!';
    btn.style.backgroundColor = '#22c55e';
    setTimeout(() => {
        btn.textContent = 'Salvar Nome';
        btn.style.backgroundColor = '';
    }, 2000);
    
    updateTrainerInfoDisplay();
}

function updateTrainerInfoDisplay() {
    const displayContainer = document.getElementById('trainer-info-display');
    const savedData = JSON.parse(localStorage.getItem('trainerCardData')) || {};

    const trainerName = savedData.name || 'Anônimo';
    const avatarUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png';

    displayContainer.innerHTML = `
        <span class="font-semibold text-white hidden md:block">${trainerName}</span>
        <img src="${avatarUrl}" class="h-10 w-10 rounded-full border-2 object-cover" style="border-color: var(--accent);">
    `;
}