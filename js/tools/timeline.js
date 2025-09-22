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
        'the-crown-tundra': { year: '2020', 'title': 'DLC: The Crown Tundra' },
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