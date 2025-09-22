function renderThemeSelector() {
    toolsContent.innerHTML = `
        <div id="tool-theme-selector" class="tool-content-wrapper">
             <h3 class="text-xl font-bold mb-6 text-center">Escolha seu tema preferido</h3>
             <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
                ${themes.map(theme => `
                    <button class="theme-select-btn p-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500" 
                            data-theme-id="${theme.id}"
                            style="background-color: ${theme.preview.bg};">
                        <div class="w-full h-24 rounded-md mb-3 flex items-center justify-center" style="border: 4px solid ${theme.preview.accent};">
                             <span class="text-4xl font-black" style="color: ${theme.preview.accent}; opacity: 0.5;">Aa</span>
                        </div>
                        <span class="font-bold text-lg">${theme.name}</span>
                    </button>
                `).join('')}
             </div>
        </div>
    `;

    document.querySelectorAll('.theme-select-btn').forEach(button => {
        button.addEventListener('click', () => {
            const themeId = button.dataset.themeId;
            applyTheme(themeId);
            
            const feedbackEl = document.getElementById('tools-modal-title');
            feedbackEl.textContent = `Tema ${button.textContent.trim()} aplicado!`;
            setTimeout(() => { feedbackEl.textContent = toolTitles['theme-selector']; }, 1500);
        });
    });
}