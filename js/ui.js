function displayPokemonCard(pokemon, index) {
    const types = pokemon.types.map(t => `<span class="${typeColors[t.type.name] || 'bg-gray-500'} text-xs font-semibold px-2 py-1 rounded-full text-white">${t.type.name}</span>`).join(' ');
    
    const card = document.createElement('div');
    card.className = 'pokemon-card bg-gray-800 p-4 rounded-lg text-center cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 opacity-0';
    card.style.backgroundColor = 'var(--bg-surface)';
    card.style.animationDelay = `${index * 25}ms`;
    card.classList.add('animate-card-enter');
    card.dataset.id = pokemon.id;
    
    card.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="mx-auto h-24 w-24">
        <h3 class="text-sm font-bold mt-2 capitalize text-gray-300">#${String(pokemon.id).padStart(3, '0')}</h3>
        <h2 class="text-lg font-bold capitalize">${pokemon.name}</h2>
        <div class="flex justify-center gap-2 mt-2">${types}</div>
    `;
    
    card.addEventListener('click', () => openPokemonModal(pokemon.id));
    grid.appendChild(card);
}

async function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;
    const selectedGeneration = generationFilter.value;

    if (!searchTerm) {
        let filteredPokemon = allPokemon;
        if (selectedType !== 'all') {
            filteredPokemon = filteredPokemon.filter(p => p.types.some(t => t.type.name === selectedType));
        }
        grid.innerHTML = '';
        if (filteredPokemon.length > 0) {
            filteredPokemon.forEach((pokemon, index) => displayPokemonCard(pokemon, index));
        } else if (allPokemon.length > 0) {
            grid.innerHTML = '<p class="text-center text-gray-400 col-span-full">Nenhum Pokémon corresponde ao filtro de tipo.</p>';
        }
        loadMoreBtn.classList.toggle('hidden', selectedGeneration !== 'all');
        return;
    }

    loadingIndicator.classList.remove('hidden');
    loadMoreBtn.classList.add('hidden');
    grid.innerHTML = '';

    let pokemonToDisplay = [];

    if (selectedGeneration === 'all') {
        const matches = allPokemonNames.filter(p => p.name.includes(searchTerm));
        if (matches.length > 0) {
            const promises = matches.map(p => fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${p.name}`));
            pokemonToDisplay = await Promise.all(promises);
            pokemonToDisplay = pokemonToDisplay.filter(p => p);
        }
    } else {
        pokemonToDisplay = allPokemon.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            String(p.id).includes(searchTerm)
        );
    }

    if (selectedType !== 'all') {
        pokemonToDisplay = pokemonToDisplay.filter(p => p.types.some(t => t.type.name === selectedType));
    }

    loadingIndicator.classList.add('hidden');

    if (pokemonToDisplay.length > 0) {
        pokemonToDisplay.sort((a, b) => a.id - b.id);
        pokemonToDisplay.forEach((pokemon, index) => displayPokemonCard(pokemon, index));
    } else {
        grid.innerHTML = `<p class="text-center text-gray-400 col-span-full">Nenhum Pokémon encontrado para "${searchTerm}" com os filtros atuais.</p>`;
    }
}

async function handleGenerationChange() {
    const selectedValue = generationFilter.value;

    grid.innerHTML = '';
    allPokemon = [];

    if (selectedValue === 'all') {
        offset = 0;
        loadMoreBtn.classList.remove('hidden');
        await loadPokemon();
    } else {
        loadingIndicator.classList.remove('hidden');
        loadMoreBtn.classList.add('hidden');
        
        const genData = await fetchWithCache(selectedValue);
        if (genData && genData.pokemon_species) {
            const sortedSpecies = genData.pokemon_species
                .map(species => ({
                    name: species.name,
                    id: parseInt(species.url.split('/').slice(-2, -1)[0])
                }))
                .sort((a, b) => a.id - b.id);

            const pokemonPromises = sortedSpecies.map(species => fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${species.id}`));
            const newPokemonList = await Promise.all(pokemonPromises);
            allPokemon = newPokemonList.filter(p => p);
            
            applyFilters();
        }
        
        loadingIndicator.classList.add('hidden');
    }
}

async function openPokemonModal(pokemonIdOrName) {
    const pokemonData = await fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${pokemonIdOrName}`);
    if (!pokemonData) return;

    const speciesData = await fetchWithCache(pokemonData.species.url);
    
    const types = pokemonData.types.map(t => `<span class="${typeColors[t.type.name] || 'bg-gray-500'} text-sm font-bold px-3 py-1 rounded-full text-white">${t.type.name}</span>`).join(' ');
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
            <i data-feather="x" class="w-8 h-8"></i>
        </button>
        <div class="flex flex-col md:flex-row h-full w-full">
            <div class="md:w-1/3 flex flex-col justify-center items-center p-6 text-center" style="background-color: var(--bg-surface);">
                <img src="${pokemonData.sprites.other['official-artwork'].front_default}" alt="${pokemonData.name}" class="mx-auto h-48 w-48 drop-shadow-lg">
                <h2 class="text-3xl font-black capitalize text-white mt-4">${pokemonData.name}</h2>
                <h3 class="text-xl font-bold text-gray-400">#${String(pokemonData.id).padStart(3, '0')}</h3>
                <div class="flex justify-center gap-2 mt-4">${types}</div>
                <button id="play-cry-btn" class="mt-4 p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all">
                    <i data-feather="volume-2"></i>
                </button>
            </div>

            <div class="md:w-2/3 flex flex-col relative bg-gray-800">
                <div class="flex border-b shrink-0 flex-wrap" style="border-color: var(--border);">
                    <button class="modal-tab active-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="description">Descrição</button>
                    <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="defense">Defesa</button>
                    <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="levelup">Level Up</button>
                    <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="forms">Formas</button>
                    <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="locations">Localização</button>
                </div>

                <div class="tab-content-container p-6 overflow-y-auto flex-1">
                    <div id="tab-description" class="tab-content">
                    </div>
                    <div id="tab-defense" class="tab-content hidden">
                        <p class="text-center">Calculando...</p>
                    </div>
                    <div id="tab-levelup" class="tab-content hidden">
                        <p class="text-center">Carregando ataques...</p>
                    </div>
                    <div id="tab-forms" class="tab-content hidden">
                        <p class="text-center">Carregando formas...</p>
                    </div>
                    <div id="tab-locations" class="tab-content hidden">
                        <p class="text-center">Carregando locais...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    feather.replace();

    document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('.modal-backdrop').addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('play-cry-btn').addEventListener('click', () => {
        const cry = new Audio(pokemonData.cries.latest);
        cry.play();
    });
    
    setupModalTabs();
    updateActiveTab('description', modal, '.modal-tab', '.tab-content', 'tab-');
    
    generateDescriptionTab(pokemonData, speciesData);
    calculateAndDisplayDefenses(pokemonData.types);
    generateFormsTab(pokemonData, speciesData);
    generateLevelUpMovesTab(pokemonData);
    generateLocationTab(pokemonData);
}

async function generateDescriptionTab(pokemonData, speciesData) {
    const description = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.';
    
    const stats = pokemonData.stats.map(s => {
        const statName = s.stat.name.replace('-', ' ');
        const percentage = (s.base_stat / 255) * 100;
        return `
            <div class="grid grid-cols-3 items-center gap-2 mb-2">
                <span class="font-semibold capitalize text-right">${statName}</span>
                <div class="bg-gray-700 rounded-full h-4 col-span-2">
                    <div class="stat-bar-fill h-4 rounded-full text-xs text-white text-right pr-2 flex items-center justify-end" style="width: ${percentage}%; background-color: var(--accent);">
                        ${s.base_stat}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const evolutionChainHtml = await generateEvolutionChain(speciesData.evolution_chain.url);

    const descriptionTab = document.getElementById('tab-description');
    descriptionTab.innerHTML = `
        <h4 class="text-xl font-bold mb-2 text-white">Descrição da Pokédex</h4>
        <p class="text-gray-300 mb-6">${description}</p>
        <h4 class="text-xl font-bold mb-4 text-white">Atributos Base</h4>
        <div class="mb-6">${stats}</div>
        <h4 class="text-xl font-bold mb-4 text-white">Linha Evolutiva</h4>
        ${evolutionChainHtml}
    `;
}

async function generateEvolutionChain(chainUrl) {
    const chainData = await fetchWithCache(chainUrl);
    if (!chainData) return '<p>Não foi possível carregar a linha evolutiva.</p>';
    
    let chainHtml = '<div class="flex items-center justify-center flex-wrap gap-4">';
    let currentStage = chainData.chain;

    async function parseStage(stage) {
        const pokemonName = stage.species.name;
        const pokemonData = await fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        
        chainHtml += `
            <div class="text-center cursor-pointer evolution-stage" data-name="${pokemonName}">
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonName}" class="h-24 w-24 mx-auto drop-shadow-md transition-transform hover:scale-110">
                <p class="font-semibold capitalize">${pokemonName}</p>
            </div>
        `;

        if (stage.evolves_to.length > 0) {
             chainHtml += `<i data-feather="arrow-right" class="text-gray-500 mx-4 hidden md:block"></i>`;
             await Promise.all(stage.evolves_to.map(nextStage => parseStage(nextStage)));
        }
    }
    await parseStage(currentStage);

    chainHtml += '</div>';
    
    setTimeout(() => {
        document.querySelectorAll('.evolution-stage').forEach(el => {
            el.addEventListener('click', () => {
                const pokemonName = el.dataset.name;
                openPokemonModal(pokemonName);
            });
        });
        feather.replace();
    }, 0);

    return chainHtml;
}

async function generateLevelUpMovesTab(pokemonData) {
    const movesTab = document.getElementById('tab-levelup');
    if (!movesTab) return;

    const levelUpMoves = {};

    pokemonData.moves.forEach(moveData => {
        moveData.version_group_details.forEach(detail => {
            if (detail.move_learn_method.name === 'level-up' && detail.level_learned_at > 0) {
                const moveName = moveData.move.name;
                const level = detail.level_learned_at;

                if (!levelUpMoves[moveName] || level < levelUpMoves[moveName].level) {
                    levelUpMoves[moveName] = {
                        level: level,
                        name: moveName,
                        url: moveData.move.url
                    };
                }
            }
        });
    });

    const sortedMoves = Object.values(levelUpMoves).sort((a, b) => a.level - b.level);

    if (sortedMoves.length === 0) {
        movesTab.innerHTML = '<p class="text-gray-400 text-center">Este Pokémon não aprende ataques por nível nos jogos principais.</p>';
        return;
    }

    const movePromises = sortedMoves.map(move => fetchWithCache(move.url));
    const moveApiData = await Promise.all(movePromises);

    const getCategoryHtml = (damageClass) => {
        switch (damageClass) {
            case 'physical':
                return `<span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color: #C03028;" title="Físico">Físico</span>`;
            case 'special':
                return `<span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color: #6890F0;" title="Especial">Especial</span>`;
            case 'status':
                return `<span class="text-xs font-semibold px-2 py-1 rounded-full text-white" style="background-color: #888888;" title="Status">Status</span>`;
            default:
                return '—';
        }
    };

    let html = `
        <div class="text-sm overflow-x-auto">
            <div class="grid grid-cols-12 gap-x-2 gap-y-1 font-bold text-center p-2 rounded-t-lg min-w-[600px]" style="background-color: var(--bg-main);">
                <div class="col-span-1 text-left">Lvl</div>
                <div class="col-span-4 text-left">Ataque</div>
                <div class="col-span-2">Tipo</div>
                <div class="col-span-2">Cat.</div>
                <div class="col-span-1">Poder</div>
                <div class="col-span-2">Prec.</div>
            </div>
            <div class="space-y-1 mt-1 min-w-[600px]">
    `;

    sortedMoves.forEach((move, index) => {
        const moveData = moveApiData[index];
        if (!moveData) return;

        const type = moveData.type.name;
        const damageClass = moveData.damage_class.name;
        const power = moveData.power ?? '—';
        const accuracy = moveData.accuracy ?? '—';

        html += `
            <div class="grid grid-cols-12 gap-x-2 gap-y-1 items-center text-center p-2 rounded-lg" style="background-color: var(--bg-surface);">
                <div class="col-span-1 font-bold text-left">${move.level}</div>
                <div class="col-span-4 text-left capitalize font-semibold">${move.name.replace(/-/g, ' ')}</div>
                <div class="col-span-2">
                    <span class="${typeColors[type] || 'bg-gray-500'} text-xs font-semibold px-2 py-1 rounded-full text-white capitalize">${type}</span>
                </div>
                <div class="col-span-2 flex justify-center">${getCategoryHtml(damageClass)}</div>
                <div class="col-span-1">${power}</div>
                <div class="col-span-2">${accuracy}</div>
            </div>
        `;
    });

    html += `</div></div>`;
    movesTab.innerHTML = html;
}

async function generateFormsTab(pokemonData, speciesData) {
    const formsTab = document.getElementById('tab-forms');
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
    let hasOtherForms = false;

    html += `
        <div class="text-center p-2 rounded-lg flex flex-col items-center justify-center" style="background-color: var(--bg-main);">
            <img src="${pokemonData.sprites.front_shiny}" alt="${pokemonData.name} Shiny" class="mx-auto h-20 w-20">
            <p class="font-semibold capitalize mt-2">Shiny</p>
        </div>
    `;

    const varietyPromises = speciesData.varieties
        .filter(v => !v.is_default)
        .map(v => fetchWithCache(v.pokemon.url));

    if (varietyPromises.length > 0) {
        hasOtherForms = true;
        const varietiesData = await Promise.all(varietyPromises);
        
        varietiesData.forEach(variety => {
            if (variety) {
                const formName = variety.name
                    .replace(speciesData.name + '-', '')
                    .replace(/-/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                const types = variety.types.map(t => `<span class="${typeColors[t.type.name] || 'bg-gray-500'} text-xs font-semibold px-2 py-0.5 rounded-full text-white">${t.type.name}</span>`).join(' ');

                html += `
                    <div class="text-center p-2 rounded-lg" style="background-color: var(--bg-main);">
                        <div class="flex justify-center">
                           <img src="${variety.sprites.front_default || 'https://placehold.co/96x96/1E1E1E/E0E0E0?text=N/A'}" alt="${formName}" class="mx-auto h-20 w-20" title="Normal">
                           <img src="${variety.sprites.front_shiny || 'https://placehold.co/96x96/1E1E1E/E0E0E0?text=N/A'}" alt="${formName} Shiny" class="mx-auto h-20 w-20" title="Shiny">
                        </div>
                        <p class="font-semibold capitalize mt-2">${formName}</p>
                         <div class="flex justify-center gap-1 mt-1">${types}</div>
                    </div>
                `;
            }
        });
    }

    html += '</div>';

    if (!hasOtherForms) {
        html += '<p class="text-center col-span-full mt-4 text-gray-400">Este Pokémon não possui outras formas.</p>';
    }

    formsTab.innerHTML = html;
}

async function calculateAndDisplayDefenses(types) {
    const defenseTab = document.getElementById('tab-defense');
    const typePromises = types.map(t => fetchWithCache(t.type.url));
    const typeData = await Promise.all(typePromises);

    const allTypesData = await fetchWithCache('https://pokeapi.co/api/v2/type');
    if (!allTypesData) {
        defenseTab.innerHTML = '<p>Erro ao carregar dados de tipos.</p>';
        return;
    }
    const allTypeNames = allTypesData.results
        .map(t => t.name)
        .filter(name => name !== 'unknown' && name !== 'shadow');

    const defenseChart = {};
    allTypeNames.forEach(attackingType => {
        let multiplier = 1;
        typeData.forEach(defensiveType => {
            if (defensiveType.damage_relations.double_damage_from.some(t => t.name === attackingType)) multiplier *= 2;
            if (defensiveType.damage_relations.half_damage_from.some(t => t.name === attackingType)) multiplier *= 0.5;
            if (defensiveType.damage_relations.no_damage_from.some(t => t.name === attackingType)) multiplier *= 0;
        });
        defenseChart[attackingType] = multiplier;
    });

    const superEffective = []; const weakAgainst = []; const effective = [];
    
    Object.entries(defenseChart).forEach(([type, multiplier]) => {
        if (multiplier === 4) superEffective.push({ type, multiplier });
        else if (multiplier === 2) weakAgainst.push({ type, multiplier });
        else if (multiplier < 1 && multiplier > 0) effective.push({ type, multiplier });
    });

    let html = '<div class="space-y-6">';
    if (superEffective.length > 0) {
        html += `
            <div>
                <h5 class="font-bold text-lg mb-2 text-red-500">Super Efetivo</h5>
                <div class="flex flex-wrap gap-2">
                    ${superEffective.map(w => `<span class="${typeColors[w.type]} text-xs font-semibold px-2 py-1 rounded-full text-white capitalize">${w.type} (x${w.multiplier})</span>`).join('')}
                </div>
            </div>`;
    }
    if (weakAgainst.length > 0) {
        html += `
            <div>
                <h5 class="font-bold text-lg mb-2 text-orange-400">Fraco Contra</h5>
                <div class="flex flex-wrap gap-2">
                    ${weakAgainst.map(w => `<span class="${typeColors[w.type]} text-xs font-semibold px-2 py-1 rounded-full text-white capitalize">${w.type} (x${w.multiplier})</span>`).join('')}
                </div>
            </div>`;
    }
    if (effective.length > 0) {
        html += `
            <div>
                <h5 class="font-bold text-lg mb-2 text-green-400">Efetivo</h5>
                <div class="flex flex-wrap gap-2">
                    ${effective.map(r => `<span class="${typeColors[r.type]} text-xs font-semibold px-2 py-1 rounded-full text-white capitalize">${r.type} (x${r.multiplier})</span>`).join('')}
                </div>
            </div>`;
    }
    if (html === '<div class="space-y-6">') {
        html += '<p>Este Pokémon não possui fraquezas ou resistências notáveis.</p>';
    }
    html += '</div>';
    defenseTab.innerHTML = html;
}

function setupModalTabs() {
    modal.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => updateActiveTab(tab.dataset.tab, modal, '.modal-tab', '.tab-content', 'tab-'));
    });
}

function updateActiveTab(activeTabName, container, tabSelector, contentSelector, contentIdPrefix) {
    container.querySelectorAll(tabSelector).forEach(t => t.classList.remove('active-tab'));
    const activeTabElement = container.querySelector(`[data-tab="${activeTabName}"], [data-tool="${activeTabName}"]`);
    if (activeTabElement) activeTabElement.classList.add('active-tab');
    
    container.querySelectorAll(contentSelector).forEach(c => c.classList.add('hidden'));
    const activeContentElement = container.querySelector(`#${contentIdPrefix}${activeTabName}`);
    if (activeContentElement) activeContentElement.classList.remove('hidden');

    container.querySelectorAll(tabSelector).forEach(tab => {
        const tabName = tab.dataset.tab || tab.dataset.tool;
        if (tabName === activeTabName) {
            tab.style.color = 'var(--accent)';
            tab.style.borderBottom = `2px solid var(--accent)`;
        } else {
            tab.style.color = 'var(--text-secondary)';
            tab.style.borderBottom = `2px solid transparent`;
        }
    });
}

async function generateLocationTab(pokemonData) {
    const locationsTab = document.getElementById('tab-locations');
    const encounters = await fetchWithCache(pokemonData.location_area_encounters);

    if (!encounters || encounters.length === 0) {
        locationsTab.innerHTML = '<p class="text-gray-400 text-center">Este Pokémon não pode ser encontrado na natureza nos jogos principais.</p>';
        return;
    }

    const locationsByGame = encounters.reduce((acc, location) => {
        location.version_details.forEach(versionDetail => {
            const gameName = versionDetail.version.name.replace(/-/g, ' ');
            if (!acc[gameName]) {
                acc[gameName] = [];
            }
            acc[gameName].push(location.location_area.name.replace(/-/g, ' '));
        });
        return acc;
    }, {});

    let html = '<div class="space-y-4">';
    for (const game in locationsByGame) {
        html += `
            <div>
                <h5 class="font-bold capitalize text-lg mb-2 text-white">${game}</h5>
                <ul class="list-disc list-inside text-gray-300 grid grid-cols-2 gap-1">
                    ${[...new Set(locationsByGame[game])].map(loc => `<li class="capitalize">${loc}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    html += '</div>';

    locationsTab.innerHTML = html;
}

function setupMouseGlow() {
    const glow = document.getElementById('mouse-glow');
    document.addEventListener('mousemove', (e) => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
    });
}