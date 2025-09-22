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