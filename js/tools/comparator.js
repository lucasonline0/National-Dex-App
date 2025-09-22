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