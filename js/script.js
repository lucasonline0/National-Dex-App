document.addEventListener('DOMContentLoaded', () => {
    
    const typeColors = {
        normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500',
        electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-cyan-300',
        fighting: 'bg-orange-700', poison: 'bg-purple-600', ground: 'bg-yellow-600',
        flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-lime-500',
        rock: 'bg-yellow-700', ghost: 'bg-indigo-800', dragon: 'bg-indigo-600',
        dark: 'bg-gray-700', steel: 'bg-gray-500', fairy: 'bg-pink-300'
    };

    const grid = document.getElementById('pokedex-grid');
    const searchInput = document.getElementById('search-input');
    const generationFilter = document.getElementById('generation-filter');
    const typeFilter = document.getElementById('type-filter');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const modal = document.getElementById('pokemon-modal');
    const toolsModal = document.getElementById('tools-modal');
    const toolsMenuBtn = document.getElementById('tools-menu-btn');

    const toolTitles = {
        'team-builder': 'Construtor de Times',
        'comparator': 'Comparador de Pokémon',
        'game': 'Quem é este Pokémon?',
        'trainer-card': 'Cartão de Treinador',
        'random-team': 'Gerador de Time Aleatório',
        'type-coverage': 'Análise de Cobertura de Tipos',
        'abilities': 'Explorador de Habilidades',
        'timeline': 'Linha do Tempo dos Jogos'
    };

    let allPokemon = [];
    let allPokemonNames = [];
    let offset = 0;
    const limit = 50;
    const apiCache = new Map();
    
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
                        <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="moves">Ataques</button>
                        <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="forms">Formas</button>
                        <button class="modal-tab flex-1 py-3 font-semibold transition-colors duration-300" data-tab="locations">Localização</button>
                    </div>

                    <div class="tab-content-container p-6 overflow-y-auto flex-1">
                        <div id="tab-description" class="tab-content">
                        </div>
                        <div id="tab-defense" class="tab-content hidden">
                            <p class="text-center">Calculando...</p>
                        </div>
                        <div id="tab-moves" class="tab-content hidden">
                            ${generateMovesTab(pokemonData)}
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

    function generateMovesTab(pokemonData) {
        const moves = pokemonData.moves.slice(0, 20).map(move => `
            <li class="capitalize p-2 rounded" style="background-color: rgba(0,0,0,0.2);">${move.move.name.replace(/-/g, ' ')}</li>
        `).join('');
        return `<ul class="grid grid-cols-2 gap-2">${moves}</ul>`;
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
    
    const toolsContent = document.getElementById('tools-content');
    let currentTeam = [];
    let comparatorPokemon = [null, null];
    
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
        
        let statsHtml = '<h4 class="text-lg font-bold mb-2 text-center">Comparação de Atributos</h4>';
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
    
    let coverageTeam = [];
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

    let allAbilities = [];
    async function renderAbilityExplorer() {
        toolsContent.innerHTML = `
            <div id="tool-abilities" class="tool-content-wrapper">
                 <h3 class="text-xl font-bold mb-2">Explorador de Habilidades</h3>
                 <input type="text" id="ability-search" placeholder="Buscar habilidade..." class="form-input w-full p-3 rounded-lg mb-4">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        const detailsContainer = document.getElementById('ability-details-container');
        detailsContainer.innerHTML = '<p class="text-gray-400">Carregando...</p>';
        const data = await fetchWithCache(url);
        if (!data) {
            detailsContainer.innerHTML = '<p class="text-red-500">Erro ao carregar detalhes.</p>';
            return;
        }
        
        const description = data.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text || 'Sem descrição.';
        const pokemonList = data.pokemon.map(p => `
            <li class="capitalize p-2 rounded text-sm" style="background-color: rgba(0,0,0,0.2);">${p.pokemon.name.replace(/-/g, ' ')}</li>
        `).join('');

        detailsContainer.innerHTML = `
            <h4 class="text-lg font-bold capitalize mb-2">${data.name.replace(/-/g, ' ')}</h4>
            <p class="text-gray-300 mb-4">${description}</p>
            <h5 class="font-semibold mb-2">Pokémon com esta habilidade:</h5>
            <ul class="grid grid-cols-2 gap-2">${pokemonList}</ul>
        `;
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

    function setupMouseGlow() {
        const glow = document.getElementById('mouse-glow');
        document.addEventListener('mousemove', (e) => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        });
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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async function init() {
        searchInput.addEventListener('input', debounce(applyFilters, 400));
        typeFilter.addEventListener('change', applyFilters);
        generationFilter.addEventListener('change', handleGenerationChange);
        loadMoreBtn.addEventListener('click', loadPokemon);

        const toolsDropdown = document.getElementById('tools-dropdown');
        toolsMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toolsDropdown.classList.toggle('hidden');
            if (!toolsDropdown.classList.contains('hidden')) {
                feather.replace();
            }
        });

        document.querySelectorAll('.tool-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const toolName = item.dataset.tool;
                toolsDropdown.classList.add('hidden');
                openToolsModal(toolName);
            });
        });

        document.addEventListener('click', (event) => {
            if (toolsDropdown && !toolsDropdown.classList.contains('hidden') && !toolsDropdown.contains(event.target) && !toolsMenuBtn.contains(event.target)) {
                toolsDropdown.classList.add('hidden');
            }
        });
        
        toolsModal.querySelector('.modal-backdrop').addEventListener('click', () => toolsModal.classList.add('hidden'));
        document.getElementById('close-tools-modal-btn').addEventListener('click', () => toolsModal.classList.add('hidden'));

        
        feather.replace();
        setupMouseGlow();
        await populateFilters();
        await populateGenerationFilter();
        await loadAllPokemonNames();
        await loadPokemon();
        updateTrainerInfoDisplay();
    }

    init();
});
