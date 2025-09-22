function getSavedTeams() {
    return JSON.parse(localStorage.getItem('savedPokemonTeams')) || {};
}

function saveTeamToStorage(teamName, teamPokemon) {
    const savedTeams = getSavedTeams();
    savedTeams[teamName] = teamPokemon.map(p => p.name);
    localStorage.setItem('savedPokemonTeams', JSON.stringify(savedTeams));
}

function handleSaveTeam() {
    if (currentTeam.length === 0) {
        alert('Adicione pelo menos um Pokémon ao time para salvar.');
        return;
    }
    const teamName = prompt('Digite um nome para o seu time:');
    if (teamName && teamName.trim() !== '') {
        saveTeamToStorage(teamName.trim(), currentTeam);
        renderSavedTeamsList();
        alert(`Time "${teamName.trim()}" salvo com sucesso!`);
    }
}

async function handleLoadTeam(teamName) {
    const savedTeams = getSavedTeams();
    const pokemonNames = savedTeams[teamName];
    if (!pokemonNames) return;

    const slotsContainer = document.getElementById('team-builder-slots');
    slotsContainer.innerHTML = `<p class="col-span-full text-center text-gray-400">Carregando time "${teamName}"...</p>`;
    document.getElementById('synergy-content').innerHTML = '<p class="text-sm text-gray-400">Calculando sinergia...</p>';

    const pokemonPromises = pokemonNames.map(name => fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${name}`));
    const loadedPokemon = await Promise.all(pokemonPromises);
    
    currentTeam = loadedPokemon.filter(p => p);
    renderTeamSlots();
    analyzeTeamSynergy();
}

function handleDeleteTeam(teamName) {
    if (!confirm(`Tem certeza que deseja deletar o time "${teamName}"?`)) {
        return;
    }
    const savedTeams = getSavedTeams();
    delete savedTeams[teamName];
    localStorage.setItem('savedPokemonTeams', JSON.stringify(savedTeams));
    renderSavedTeamsList();
}

function renderSavedTeamsList() {
    const container = document.getElementById('saved-teams-list');
    if (!container) return;
    const savedTeams = getSavedTeams();
    const teamNames = Object.keys(savedTeams);

    if (teamNames.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">Nenhum time salvo.</p>';
        return;
    }

    container.innerHTML = teamNames.map(name => `
        <div class="flex justify-between items-center p-2 rounded" style="background-color: rgba(255,255,255,0.05);">
            <span class="font-semibold capitalize truncate pr-2">${name}</span>
            <div class="flex gap-2 shrink-0">
                <button class="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded" onclick="handleLoadTeam('${name}')">Carregar</button>
                <button class="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onclick="handleDeleteTeam('${name}')">Deletar</button>
            </div>
        </div>
    `).join('');
    
    window.handleLoadTeam = handleLoadTeam;
    window.handleDeleteTeam = handleDeleteTeam;
}

function renderTeamBuilder() {
    toolsContent.innerHTML = `
        <div id="tool-team-builder" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-4">Construtor de Times</h3>
             <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="team-builder-slots">
                    </div>
                    <div class="flex gap-4 mt-4">
                        <div class="relative flex-grow">
                             <input type="text" id="team-builder-search" placeholder="Adicionar Pokémon..." class="form-input w-full p-3 rounded-lg">
                        </div>
                        <button id="save-team-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all shrink-0">Salvar Time</button>
                    </div>
                </div>
                <div class="space-y-6">
                    <div id="team-synergy-analysis" class="p-4 rounded-lg" style="background-color: var(--bg-main);">
                        <h4 class="font-bold mb-2">Análise da Equipe</h4>
                        <div id="synergy-content">
                            <p class="text-sm text-gray-400">Adicione Pokémon para ver a análise de sinergia.</p>
                        </div>
                    </div>
                    <div id="saved-teams-container" class="p-4 rounded-lg" style="background-color: var(--bg-main);">
                        <h4 class="font-bold mb-4">Meus Times</h4>
                        <div id="saved-teams-list" class="space-y-2 max-h-48 overflow-y-auto">
                        </div>
                    </div>
                </div>
             </div>
        </div>`;
    renderTeamSlots();
    createAutocomplete(document.getElementById('team-builder-search'), addPokemonToTeam);
    document.getElementById('save-team-btn').addEventListener('click', handleSaveTeam);
    renderSavedTeamsList();
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