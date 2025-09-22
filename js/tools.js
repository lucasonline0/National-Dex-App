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
        case 'theme-selector':
            renderThemeSelector();
            break;
    }
    feather.replace();
}