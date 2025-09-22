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